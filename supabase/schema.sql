-- PartStock Database Schema
-- Supabase (PostgreSQL)

-- ============================================
-- 1. テナント（マルチテナント対応）
-- ============================================
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  plan VARCHAR(20) DEFAULT 'starter', -- starter, standard, enterprise
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. ユーザー
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  role VARCHAR(20) DEFAULT 'member', -- admin, manager, member, viewer
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. カテゴリ（階層対応）
-- ============================================
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(100) NOT NULL,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. 倉庫・ロケーション
-- ============================================
CREATE TABLE warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20),
  address VARCHAR(500),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. 部品マスタ
-- ============================================
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  item_code VARCHAR(50) NOT NULL,
  name VARCHAR(200) NOT NULL,
  model_number VARCHAR(100),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  unit VARCHAR(20) NOT NULL DEFAULT '個',
  safety_stock DECIMAL(15,3) DEFAULT 0,
  reorder_point DECIMAL(15,3) DEFAULT 0,
  lead_time_days INTEGER DEFAULT 0,
  default_location VARCHAR(100),
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, item_code)
);

-- ============================================
-- 6. 在庫（ロット別）
-- ============================================
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE NOT NULL,
  warehouse_id UUID REFERENCES warehouses(id) ON DELETE CASCADE NOT NULL,
  lot_number VARCHAR(50),
  quantity DECIMAL(15,3) NOT NULL DEFAULT 0,
  unit_cost DECIMAL(15,2),
  received_date DATE,
  expiry_date DATE,
  location VARCHAR(100), -- 棚番
  status VARCHAR(20) DEFAULT 'available', -- available, reserved, quarantine
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. 取引履歴
-- ============================================
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  inventory_id UUID REFERENCES inventory(id) ON DELETE SET NULL,
  item_id UUID REFERENCES items(id) ON DELETE SET NULL NOT NULL,
  type VARCHAR(20) NOT NULL, -- IN, OUT, MOVE, ADJUST
  sub_type VARCHAR(30), -- purchase, production, sales, scrap, etc.
  quantity DECIMAL(15,3) NOT NULL,
  before_quantity DECIMAL(15,3),
  after_quantity DECIMAL(15,3),
  lot_number VARCHAR(50),
  from_warehouse_id UUID REFERENCES warehouses(id),
  to_warehouse_id UUID REFERENCES warehouses(id),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL NOT NULL,
  note TEXT,
  reference_number VARCHAR(50), -- 発注番号等
  transacted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. BOM（部品表）
-- ============================================
CREATE TABLE bom (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  parent_item_id UUID REFERENCES items(id) ON DELETE CASCADE NOT NULL,
  child_item_id UUID REFERENCES items(id) ON DELETE CASCADE NOT NULL,
  quantity DECIMAL(15,3) NOT NULL,
  unit VARCHAR(20),
  version VARCHAR(20) DEFAULT '1.0',
  effective_from DATE,
  effective_to DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, parent_item_id, child_item_id, version)
);

-- ============================================
-- 9. 仕入先マスタ
-- ============================================
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(200) NOT NULL,
  code VARCHAR(50),
  contact_name VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 10. 部品-仕入先関連
-- ============================================
CREATE TABLE item_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE NOT NULL,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE NOT NULL,
  supplier_part_number VARCHAR(100),
  unit_price DECIMAL(15,2),
  lead_time_days INTEGER,
  min_order_quantity DECIMAL(15,3),
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, item_id, supplier_id)
);

-- ============================================
-- インデックス
-- ============================================
CREATE INDEX idx_items_tenant ON items(tenant_id);
CREATE INDEX idx_items_code ON items(tenant_id, item_code);
CREATE INDEX idx_items_category ON items(category_id);

CREATE INDEX idx_inventory_tenant ON inventory(tenant_id);
CREATE INDEX idx_inventory_item ON inventory(item_id);
CREATE INDEX idx_inventory_warehouse ON inventory(warehouse_id);
CREATE INDEX idx_inventory_lot ON inventory(tenant_id, lot_number);

CREATE INDEX idx_transactions_tenant ON transactions(tenant_id);
CREATE INDEX idx_transactions_item ON transactions(item_id);
CREATE INDEX idx_transactions_date ON transactions(transacted_at);
CREATE INDEX idx_transactions_user ON transactions(user_id);

CREATE INDEX idx_bom_parent ON bom(parent_item_id);
CREATE INDEX idx_bom_child ON bom(child_item_id);

-- ============================================
-- Row Level Security (RLS)
-- ============================================
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bom ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_suppliers ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のテナントのデータのみアクセス可能
CREATE POLICY "Users can access own tenant data" ON users
  FOR ALL USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Tenant members can access categories" ON categories
  FOR ALL USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Tenant members can access warehouses" ON warehouses
  FOR ALL USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Tenant members can access items" ON items
  FOR ALL USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Tenant members can access inventory" ON inventory
  FOR ALL USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Tenant members can access transactions" ON transactions
  FOR ALL USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Tenant members can access bom" ON bom
  FOR ALL USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Tenant members can access suppliers" ON suppliers
  FOR ALL USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Tenant members can access item_suppliers" ON item_suppliers
  FOR ALL USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

-- ============================================
-- 関数：在庫数量更新
-- ============================================
CREATE OR REPLACE FUNCTION update_inventory_quantity()
RETURNS TRIGGER AS $$
BEGIN
  -- 取引後の在庫数量を記録
  IF NEW.inventory_id IS NOT NULL THEN
    UPDATE inventory 
    SET 
      quantity = CASE 
        WHEN NEW.type = 'IN' THEN quantity + NEW.quantity
        WHEN NEW.type = 'OUT' THEN quantity - NEW.quantity
        WHEN NEW.type = 'ADJUST' THEN NEW.after_quantity
        ELSE quantity
      END,
      updated_at = NOW()
    WHERE id = NEW.inventory_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_inventory
  AFTER INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_quantity();

-- ============================================
-- 関数：updated_at 自動更新
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_items_updated_at
  BEFORE UPDATE ON items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_inventory_updated_at
  BEFORE UPDATE ON inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ビュー：在庫サマリー
-- ============================================
CREATE VIEW inventory_summary AS
SELECT 
  i.id AS item_id,
  i.tenant_id,
  i.item_code,
  i.name AS item_name,
  i.unit,
  i.safety_stock,
  i.reorder_point,
  COALESCE(SUM(inv.quantity), 0) AS total_quantity,
  COUNT(DISTINCT inv.lot_number) AS lot_count,
  CASE 
    WHEN COALESCE(SUM(inv.quantity), 0) <= i.reorder_point THEN 'low'
    WHEN COALESCE(SUM(inv.quantity), 0) <= i.safety_stock THEN 'warning'
    ELSE 'ok'
  END AS stock_status
FROM items i
LEFT JOIN inventory inv ON i.id = inv.item_id AND inv.quantity > 0
GROUP BY i.id, i.tenant_id, i.item_code, i.name, i.unit, i.safety_stock, i.reorder_point;

-- ============================================
-- 関数：新規ユーザー処理
-- auth.usersに新規ユーザー作成時に自動実行
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_tenant_id UUID;
  user_name TEXT;
  invited_tenant_id UUID;
BEGIN
  -- メタデータから名前を取得（Google OAuth等）
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  -- 招待経由の場合、メタデータからtenant_idを取得
  invited_tenant_id := (NEW.raw_user_meta_data->>'tenant_id')::UUID;

  IF invited_tenant_id IS NOT NULL THEN
    -- 招待されたテナントに参加
    INSERT INTO public.users (id, tenant_id, email, name, role)
    VALUES (
      NEW.id,
      invited_tenant_id,
      NEW.email,
      user_name,
      COALESCE(NEW.raw_user_meta_data->>'role', 'member')
    );
  ELSE
    -- 新規テナント作成
    INSERT INTO public.tenants (name)
    VALUES (user_name || 'の組織')
    RETURNING id INTO new_tenant_id;

    -- ユーザーをadminとして登録
    INSERT INTO public.users (id, tenant_id, email, name, role)
    VALUES (
      NEW.id,
      new_tenant_id,
      NEW.email,
      user_name,
      'admin'
    );

    -- デフォルト倉庫を作成
    INSERT INTO public.warehouses (tenant_id, name, code, is_default)
    VALUES (new_tenant_id, 'メイン倉庫', 'MAIN', TRUE);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- auth.usersへのトリガー設定
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================
-- 関数：ダッシュボードKPI取得
-- ============================================
CREATE OR REPLACE FUNCTION get_dashboard_kpi(p_tenant_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    -- 総部品数
    'total_items', (
      SELECT COUNT(*) FROM items
      WHERE tenant_id = p_tenant_id AND is_active = TRUE
    ),
    -- 総在庫金額（概算）
    'total_inventory_value', (
      SELECT COALESCE(SUM(inv.quantity * inv.unit_cost), 0)
      FROM inventory inv
      JOIN items i ON inv.item_id = i.id
      WHERE inv.tenant_id = p_tenant_id AND inv.quantity > 0
    ),
    -- 発注点以下のアイテム数
    'low_stock_count', (
      SELECT COUNT(DISTINCT i.id)
      FROM items i
      LEFT JOIN inventory inv ON i.id = inv.item_id
      WHERE i.tenant_id = p_tenant_id
        AND i.is_active = TRUE
        AND i.reorder_point > 0
      GROUP BY i.id, i.reorder_point
      HAVING COALESCE(SUM(inv.quantity), 0) <= i.reorder_point
    ),
    -- 在庫切れアイテム数
    'out_of_stock_count', (
      SELECT COUNT(*)
      FROM items i
      WHERE i.tenant_id = p_tenant_id
        AND i.is_active = TRUE
        AND NOT EXISTS (
          SELECT 1 FROM inventory inv
          WHERE inv.item_id = i.id AND inv.quantity > 0
        )
    ),
    -- 今日の入庫数
    'today_in_count', (
      SELECT COUNT(*) FROM transactions
      WHERE tenant_id = p_tenant_id
        AND type = 'IN'
        AND DATE(transacted_at) = CURRENT_DATE
    ),
    -- 今日の出庫数
    'today_out_count', (
      SELECT COUNT(*) FROM transactions
      WHERE tenant_id = p_tenant_id
        AND type = 'OUT'
        AND DATE(transacted_at) = CURRENT_DATE
    ),
    -- 今月の入庫数
    'month_in_count', (
      SELECT COUNT(*) FROM transactions
      WHERE tenant_id = p_tenant_id
        AND type = 'IN'
        AND DATE_TRUNC('month', transacted_at) = DATE_TRUNC('month', CURRENT_DATE)
    ),
    -- 今月の出庫数
    'month_out_count', (
      SELECT COUNT(*) FROM transactions
      WHERE tenant_id = p_tenant_id
        AND type = 'OUT'
        AND DATE_TRUNC('month', transacted_at) = DATE_TRUNC('month', CURRENT_DATE)
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 関数：発注点アラート取得
-- ============================================
CREATE OR REPLACE FUNCTION get_reorder_alerts(p_tenant_id UUID)
RETURNS TABLE (
  item_id UUID,
  item_code VARCHAR,
  item_name VARCHAR,
  unit VARCHAR,
  current_quantity DECIMAL,
  reorder_point DECIMAL,
  safety_stock DECIMAL,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.id AS item_id,
    i.item_code,
    i.name AS item_name,
    i.unit,
    COALESCE(SUM(inv.quantity), 0) AS current_quantity,
    i.reorder_point,
    i.safety_stock,
    CASE
      WHEN COALESCE(SUM(inv.quantity), 0) = 0 THEN 'out_of_stock'
      WHEN COALESCE(SUM(inv.quantity), 0) <= i.reorder_point THEN 'reorder'
      WHEN COALESCE(SUM(inv.quantity), 0) <= i.safety_stock THEN 'warning'
      ELSE 'ok'
    END AS status
  FROM items i
  LEFT JOIN inventory inv ON i.id = inv.item_id AND inv.quantity > 0
  WHERE i.tenant_id = p_tenant_id
    AND i.is_active = TRUE
    AND i.reorder_point > 0
  GROUP BY i.id, i.item_code, i.name, i.unit, i.reorder_point, i.safety_stock
  HAVING COALESCE(SUM(inv.quantity), 0) <= i.safety_stock
  ORDER BY
    CASE
      WHEN COALESCE(SUM(inv.quantity), 0) = 0 THEN 1
      WHEN COALESCE(SUM(inv.quantity), 0) <= i.reorder_point THEN 2
      ELSE 3
    END,
    i.item_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- RLSポリシー追加：新規ユーザー登録用
-- ============================================

-- tenantsテーブル：認証済みユーザーは自分のテナントにアクセス可能
CREATE POLICY "Users can view own tenant" ON tenants
  FOR SELECT USING (
    id = (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

-- usersテーブル：新規ユーザーが自分自身を参照できるようにする
DROP POLICY IF EXISTS "Users can access own tenant data" ON users;

CREATE POLICY "Users can view own tenant members" ON users
  FOR SELECT USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (id = auth.uid());

-- Service role用：handle_new_user関数がユーザーを作成できるようにする
-- (SECURITY DEFINER関数なので追加ポリシー不要)
