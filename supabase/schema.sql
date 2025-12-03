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
