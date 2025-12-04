-- PartStock Database Functions
-- Supabase (PostgreSQL)

-- ============================================
-- 1. handle_new_user - 新規ユーザー作成時の処理
-- ============================================
-- OAuth認証でユーザーが作成された際に、public.usersテーブルにレコードを自動作成
-- 注意: テナントIDがない場合はオンボーディングが必要

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_name TEXT;
  user_email TEXT;
BEGIN
  -- メタデータから名前を取得（Google OAuth等）
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );
  user_email := NEW.email;

  -- usersテーブルに既に存在するかチェック
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
    -- 注意: tenant_idはNULLで作成（オンボーディングで設定）
    -- ただし、招待経由の場合はinvitationsテーブルからtenant_idを取得
    INSERT INTO public.users (id, email, name, role, tenant_id)
    SELECT
      NEW.id,
      user_email,
      user_name,
      COALESCE(inv.role, 'member'),
      inv.tenant_id
    FROM (SELECT 1) AS dummy
    LEFT JOIN public.invitations inv ON inv.email = user_email AND inv.status = 'pending'
    ON CONFLICT (id) DO NOTHING;

    -- 招待があった場合はステータスを更新
    UPDATE public.invitations
    SET status = 'accepted', accepted_at = NOW()
    WHERE email = user_email AND status = 'pending';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- auth.usersへの挿入時にトリガーを発火
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


-- ============================================
-- 2. get_dashboard_kpi - ダッシュボードKPI取得
-- ============================================
-- 効率的に全KPIを一度に取得

CREATE OR REPLACE FUNCTION public.get_dashboard_kpi(p_tenant_id UUID)
RETURNS TABLE (
  total_items BIGINT,
  total_stock NUMERIC,
  low_stock_count BIGINT,
  today_transactions BIGINT
) AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
BEGIN
  RETURN QUERY
  SELECT
    -- 総部品数
    (SELECT COUNT(*) FROM public.items WHERE tenant_id = p_tenant_id AND is_active = TRUE)::BIGINT,

    -- 在庫総数
    (SELECT COALESCE(SUM(quantity), 0) FROM public.inventory WHERE tenant_id = p_tenant_id)::NUMERIC,

    -- 発注点以下の部品数
    (
      SELECT COUNT(*)
      FROM (
        SELECT i.id
        FROM public.items i
        LEFT JOIN public.inventory inv ON i.id = inv.item_id
        WHERE i.tenant_id = p_tenant_id
          AND i.is_active = TRUE
          AND i.reorder_point IS NOT NULL
          AND i.reorder_point > 0
        GROUP BY i.id, i.reorder_point
        HAVING COALESCE(SUM(inv.quantity), 0) <= i.reorder_point
      ) low_stock_items
    )::BIGINT,

    -- 今日の取引数
    (
      SELECT COUNT(*)
      FROM public.transactions
      WHERE tenant_id = p_tenant_id
        AND transacted_at >= v_today
        AND transacted_at < v_today + INTERVAL '1 day'
    )::BIGINT;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;


-- ============================================
-- 3. get_stock_alerts - 在庫アラート取得
-- ============================================
-- 発注点以下または安全在庫以下の部品を取得

CREATE OR REPLACE FUNCTION public.get_stock_alerts(
  p_tenant_id UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  item_id UUID,
  item_code VARCHAR,
  item_name VARCHAR,
  unit VARCHAR,
  current_stock NUMERIC,
  reorder_point NUMERIC,
  safety_stock NUMERIC,
  severity TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.id AS item_id,
    i.item_code,
    i.name AS item_name,
    i.unit,
    COALESCE(SUM(inv.quantity), 0) AS current_stock,
    i.reorder_point,
    i.safety_stock,
    CASE
      WHEN COALESCE(SUM(inv.quantity), 0) <= i.safety_stock THEN 'critical'
      WHEN COALESCE(SUM(inv.quantity), 0) <= i.reorder_point THEN 'warning'
      ELSE 'ok'
    END AS severity
  FROM public.items i
  LEFT JOIN public.inventory inv ON i.id = inv.item_id
  WHERE i.tenant_id = p_tenant_id
    AND i.is_active = TRUE
    AND (i.reorder_point IS NOT NULL AND i.reorder_point > 0)
  GROUP BY i.id, i.item_code, i.name, i.unit, i.reorder_point, i.safety_stock
  HAVING COALESCE(SUM(inv.quantity), 0) <= i.reorder_point
  ORDER BY
    CASE WHEN COALESCE(SUM(inv.quantity), 0) <= i.safety_stock THEN 0 ELSE 1 END,
    COALESCE(SUM(inv.quantity), 0) ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;


-- ============================================
-- 4. create_tenant_with_admin - テナントと管理者作成
-- ============================================
-- オンボーディング時にテナントを作成し、ユーザーを管理者として設定

CREATE OR REPLACE FUNCTION public.create_tenant_with_admin(
  p_user_id UUID,
  p_tenant_name VARCHAR,
  p_user_name VARCHAR DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- テナント作成
  INSERT INTO public.tenants (name)
  VALUES (p_tenant_name)
  RETURNING id INTO v_tenant_id;

  -- ユーザーをテナントに紐付け、管理者に設定
  UPDATE public.users
  SET
    tenant_id = v_tenant_id,
    role = 'admin',
    name = COALESCE(p_user_name, name)
  WHERE id = p_user_id;

  -- デフォルト倉庫を作成
  INSERT INTO public.warehouses (tenant_id, name, code, is_default)
  VALUES (v_tenant_id, 'メイン倉庫', 'MAIN', TRUE);

  RETURN v_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================
-- 5. invitations テーブル（招待機能用）
-- ============================================
-- 既にない場合のみ作成

CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'member',
  invited_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, expired
  token VARCHAR(100) UNIQUE,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, email)
);

-- RLS有効化
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- 招待テーブルのRLSポリシー
CREATE POLICY "Admins can manage invitations" ON public.invitations
  FOR ALL USING (
    tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('admin', 'manager')
    )
  );

-- 招待されたユーザーは自分の招待を閲覧可能
CREATE POLICY "Invited users can view own invitation" ON public.invitations
  FOR SELECT USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- インデックス
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_tenant ON public.invitations(tenant_id);


-- ============================================
-- 6. RLSポリシー追加（新規ユーザー用）
-- ============================================
-- 新規ユーザー（tenant_idがNULL）がテナント作成できるようにする

-- tenantsテーブル: 認証済みユーザーは新規テナント作成可能
DROP POLICY IF EXISTS "Authenticated users can create tenants" ON public.tenants;
CREATE POLICY "Authenticated users can create tenants" ON public.tenants
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- tenantsテーブル: 自分のテナント情報を参照可能
DROP POLICY IF EXISTS "Users can view own tenant" ON public.tenants;
CREATE POLICY "Users can view own tenant" ON public.tenants
  FOR SELECT USING (
    id = (SELECT tenant_id FROM public.users WHERE id = auth.uid())
  );

-- usersテーブル: 自分自身のレコードは更新可能（オンボーディング用）
DROP POLICY IF EXISTS "Users can update own record" ON public.users;
CREATE POLICY "Users can update own record" ON public.users
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- usersテーブル: 自分自身のレコードは参照可能
DROP POLICY IF EXISTS "Users can view own record" ON public.users;
CREATE POLICY "Users can view own record" ON public.users
  FOR SELECT USING (id = auth.uid());

-- warehousesテーブル: 認証済みユーザーは作成可能（テナント作成時）
DROP POLICY IF EXISTS "Authenticated users can create warehouses" ON public.warehouses;
CREATE POLICY "Authenticated users can create warehouses" ON public.warehouses
  FOR INSERT WITH CHECK (
    tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid())
  );
