-- ============================================================
-- THE BOSS — Boutique Manager
-- Migration 001: Initial Schema
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE batch_status AS ENUM ('active', 'closed');
CREATE TYPE claim_status AS ENUM ('open', 'resolved', 'rejected');
CREATE TYPE order_status AS ENUM ('future_order', 'in_studio', 'out_for_delivery', 'delivered');
CREATE TYPE payment_method AS ENUM ('cash', 'credit', 'transfer', 'check');
CREATE TYPE invoice_payment_status AS ENUM ('unpaid', 'partial', 'paid', 'credit_pending');
CREATE TYPE expense_category AS ENUM ('delivery_rider', 'staff_food', 'packaging', 'fixed_rent', 'fixed_utilities', 'fixed_insurance', 'fixed_phone', 'other');

-- ============================================================
-- TABLE: owners (one row per business)
-- ============================================================

CREATE TABLE owners (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_name TEXT NOT NULL,
  logo_url      TEXT,
  language      TEXT NOT NULL DEFAULT 'he',
  bonus_rate_pct DECIMAL(5,2) NOT NULL DEFAULT 3.00,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: suppliers
-- ============================================================

CREATE TABLE suppliers (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id      UUID NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  image_url     TEXT,
  contact_phone TEXT,
  payment_terms TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_suppliers_owner ON suppliers(owner_id);

-- ============================================================
-- TABLE: inventory_batches
-- ============================================================

CREATE TABLE inventory_batches (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id             UUID NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  supplier_id          UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  arrival_date         DATE NOT NULL DEFAULT CURRENT_DATE,
  total_invoice_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  net_cost             DECIMAL(10,2) NOT NULL DEFAULT 0,
  allocated_pct        DECIMAL(5,2) NOT NULL DEFAULT 0,
  status               batch_status NOT NULL DEFAULT 'active',
  notes                TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_batches_owner     ON inventory_batches(owner_id);
CREATE INDEX idx_batches_supplier  ON inventory_batches(supplier_id);
CREATE INDEX idx_batches_status    ON inventory_batches(status);
CREATE INDEX idx_batches_arrival   ON inventory_batches(arrival_date);

-- ============================================================
-- TABLE: supplier_claims (discrepancies / credits)
-- ============================================================

CREATE TABLE supplier_claims (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id             UUID NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  batch_id             UUID NOT NULL REFERENCES inventory_batches(id) ON DELETE CASCADE,
  proof_image_url      TEXT,
  claimed_credit_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  description          TEXT,
  status               claim_status NOT NULL DEFAULT 'open',
  resolved_at          TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_claims_batch     ON supplier_claims(batch_id);
CREATE INDEX idx_claims_open      ON supplier_claims(status) WHERE status = 'open';
CREATE INDEX idx_claims_owner     ON supplier_claims(owner_id);

-- ============================================================
-- TABLE: week_cycles
-- ============================================================

CREATE TABLE week_cycles (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id     UUID NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  week_number  INT NOT NULL,
  year         INT NOT NULL,
  start_date   DATE NOT NULL,
  end_date     DATE NOT NULL,
  is_closed    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(owner_id, week_number, year)
);

CREATE INDEX idx_weeks_owner ON week_cycles(owner_id);
CREATE INDEX idx_weeks_dates ON week_cycles(start_date, end_date);

-- ============================================================
-- TABLE: orders
-- ============================================================

CREATE TABLE orders (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id              UUID NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  week_cycle_id         UUID REFERENCES week_cycles(id) ON DELETE SET NULL,
  customer_name         TEXT,
  order_type            TEXT,
  payment_date          DATE,
  execution_date        DATE,
  revenue               DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_method        payment_method,
  is_outside_register   BOOLEAN NOT NULL DEFAULT FALSE,
  status                order_status NOT NULL DEFAULT 'future_order',
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_owner          ON orders(owner_id);
CREATE INDEX idx_orders_execution_date ON orders(execution_date);
CREATE INDEX idx_orders_week           ON orders(week_cycle_id);
CREATE INDEX idx_orders_payment_date   ON orders(payment_date);

-- ============================================================
-- TABLE: order_batch_links (heart of the system)
-- ============================================================

CREATE TABLE order_batch_links (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id       UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  batch_id       UUID NOT NULL REFERENCES inventory_batches(id) ON DELETE CASCADE,
  cost_allocated DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(order_id, batch_id)
);

CREATE INDEX idx_obl_order ON order_batch_links(order_id);
CREATE INDEX idx_obl_batch ON order_batch_links(batch_id);

-- ============================================================
-- TABLE: operational_expenses
-- ============================================================

CREATE TABLE operational_expenses (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id        UUID NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  week_cycle_id   UUID REFERENCES week_cycles(id) ON DELETE SET NULL,
  order_id        UUID REFERENCES orders(id) ON DELETE SET NULL,
  category        expense_category NOT NULL,
  amount          DECIMAL(10,2) NOT NULL DEFAULT 0,
  description     TEXT,
  payment_method  payment_method,
  expense_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_opex_owner ON operational_expenses(owner_id);
CREATE INDEX idx_opex_week  ON operational_expenses(week_cycle_id);
CREATE INDEX idx_opex_date  ON operational_expenses(expense_date);

-- ============================================================
-- TABLE: fixed_expenses
-- ============================================================

CREATE TABLE fixed_expenses (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id       UUID NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  category       expense_category NOT NULL DEFAULT 'fixed_rent',
  monthly_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  due_day        INT NOT NULL DEFAULT 1 CHECK (due_day BETWEEN 1 AND 28),
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fixed_owner ON fixed_expenses(owner_id);

-- ============================================================
-- TABLE: employees
-- ============================================================

CREATE TABLE employees (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id      UUID NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  photo_url     TEXT,
  hourly_rate   DECIMAL(8,2) NOT NULL DEFAULT 40.00,
  bonus_rate_pct DECIMAL(5,2) NOT NULL DEFAULT 3.00,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_employees_owner ON employees(owner_id);

-- ============================================================
-- TABLE: staff_attendance
-- ============================================================

CREATE TABLE staff_attendance (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id              UUID NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  employee_id           UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  week_cycle_id         UUID REFERENCES week_cycles(id) ON DELETE SET NULL,
  clock_in              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  clock_out             TIMESTAMPTZ,
  hours_worked          DECIMAL(5,2),
  daily_sales_snapshot  DECIMAL(10,2) NOT NULL DEFAULT 0,
  calculated_bonus      DECIMAL(8,2) NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_attendance_employee ON staff_attendance(employee_id);
CREATE INDEX idx_attendance_week     ON staff_attendance(week_cycle_id);
CREATE INDEX idx_attendance_date     ON staff_attendance(clock_in);

-- ============================================================
-- TRIGGER: auto-update batch allocated_pct
-- ============================================================

CREATE OR REPLACE FUNCTION recalculate_batch_allocation()
RETURNS TRIGGER AS $$
DECLARE
  v_batch_cost DECIMAL(10,2);
  v_total_allocated DECIMAL(10,2);
  v_pct DECIMAL(5,2);
BEGIN
  SELECT net_cost INTO v_batch_cost
  FROM inventory_batches
  WHERE id = COALESCE(NEW.batch_id, OLD.batch_id);

  SELECT COALESCE(SUM(cost_allocated), 0) INTO v_total_allocated
  FROM order_batch_links
  WHERE batch_id = COALESCE(NEW.batch_id, OLD.batch_id);

  IF v_batch_cost > 0 THEN
    v_pct := LEAST((v_total_allocated / v_batch_cost) * 100, 100);
  ELSE
    v_pct := 0;
  END IF;

  UPDATE inventory_batches
  SET allocated_pct = v_pct,
      status = CASE WHEN v_pct >= 100 THEN 'closed' ELSE 'active' END
  WHERE id = COALESCE(NEW.batch_id, OLD.batch_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_batch_allocation
  AFTER INSERT OR UPDATE OR DELETE ON order_batch_links
  FOR EACH ROW EXECUTE FUNCTION recalculate_batch_allocation();

-- ============================================================
-- TRIGGER: auto-calculate attendance hours + bonus
-- ============================================================

CREATE OR REPLACE FUNCTION calculate_attendance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.clock_out IS NOT NULL THEN
    NEW.hours_worked := EXTRACT(EPOCH FROM (NEW.clock_out - NEW.clock_in)) / 3600;
    NEW.calculated_bonus :=
      NEW.daily_sales_snapshot
      * (SELECT bonus_rate_pct FROM employees WHERE id = NEW.employee_id) / 100
      * LEAST(NEW.hours_worked / 8, 1);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_attendance_calc
  BEFORE INSERT OR UPDATE ON staff_attendance
  FOR EACH ROW EXECUTE FUNCTION calculate_attendance();

-- ============================================================
-- VIEW: weekly_profitability
-- ============================================================

CREATE OR REPLACE VIEW weekly_profitability AS
SELECT
  wc.id                                            AS week_cycle_id,
  wc.owner_id,
  wc.week_number,
  wc.year,
  wc.start_date,
  wc.end_date,
  COALESCE(SUM(o.revenue), 0)                      AS gross_revenue,
  COALESCE(SUM(obl.cost_allocated), 0)             AS cogs,
  COALESCE(SUM(o.revenue), 0)
    - COALESCE(SUM(obl.cost_allocated), 0)         AS gross_profit,
  COALESCE(opex.total_opex, 0)                     AS total_opex,
  COALESCE(SUM(o.revenue), 0)
    - COALESCE(SUM(obl.cost_allocated), 0)
    - COALESCE(opex.total_opex, 0)                 AS operating_profit,
  COALESCE(fixed.weekly_fixed, 0)                  AS weekly_fixed_costs,
  COALESCE(SUM(o.revenue), 0)
    - COALESCE(SUM(obl.cost_allocated), 0)
    - COALESCE(opex.total_opex, 0)
    - COALESCE(fixed.weekly_fixed, 0)              AS net_profit,
  CASE
    WHEN COALESCE(SUM(o.revenue), 0) > 0
    THEN ROUND(
      (COALESCE(SUM(o.revenue), 0)
       - COALESCE(SUM(obl.cost_allocated), 0)
       - COALESCE(opex.total_opex, 0)
       - COALESCE(fixed.weekly_fixed, 0))
      / COALESCE(SUM(o.revenue), 0) * 100, 1)
    ELSE 0
  END                                               AS net_margin_pct
FROM week_cycles wc
LEFT JOIN orders o
  ON o.week_cycle_id = wc.id
LEFT JOIN order_batch_links obl
  ON obl.order_id = o.id
LEFT JOIN (
  SELECT week_cycle_id, SUM(amount) AS total_opex
  FROM operational_expenses
  GROUP BY week_cycle_id
) opex ON opex.week_cycle_id = wc.id
LEFT JOIN (
  SELECT
    owner_id,
    SUM(monthly_amount) / 4.33 AS weekly_fixed
  FROM fixed_expenses
  WHERE is_active = TRUE
  GROUP BY owner_id
) fixed ON fixed.owner_id = wc.owner_id
GROUP BY
  wc.id, wc.owner_id, wc.week_number, wc.year,
  wc.start_date, wc.end_date,
  opex.total_opex, fixed.weekly_fixed;

-- ============================================================
-- VIEW: open_supplier_credits
-- ============================================================

CREATE OR REPLACE VIEW open_supplier_credits AS
SELECT
  sc.id,
  sc.owner_id,
  sc.batch_id,
  ib.supplier_id,
  s.name                       AS supplier_name,
  s.image_url                  AS supplier_image,
  ib.arrival_date,
  sc.claimed_credit_amount,
  sc.proof_image_url,
  sc.description,
  sc.created_at
FROM supplier_claims sc
JOIN inventory_batches ib ON ib.id = sc.batch_id
JOIN suppliers s          ON s.id = ib.supplier_id
WHERE sc.status = 'open';

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE owners               ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers            ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_batches    ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_claims      ENABLE ROW LEVEL SECURITY;
ALTER TABLE week_cycles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders               ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_batch_links    ENABLE ROW LEVEL SECURITY;
ALTER TABLE operational_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_expenses       ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees            ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_attendance     ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_access" ON owners
  USING (auth.uid()::TEXT = id::TEXT);

CREATE POLICY "owner_access" ON suppliers
  USING (owner_id IN (SELECT id FROM owners WHERE auth.uid()::TEXT = id::TEXT));

CREATE POLICY "owner_access" ON inventory_batches
  USING (owner_id IN (SELECT id FROM owners WHERE auth.uid()::TEXT = id::TEXT));

CREATE POLICY "owner_access" ON supplier_claims
  USING (owner_id IN (SELECT id FROM owners WHERE auth.uid()::TEXT = id::TEXT));

CREATE POLICY "owner_access" ON week_cycles
  USING (owner_id IN (SELECT id FROM owners WHERE auth.uid()::TEXT = id::TEXT));

CREATE POLICY "owner_access" ON orders
  USING (owner_id IN (SELECT id FROM owners WHERE auth.uid()::TEXT = id::TEXT));

CREATE POLICY "owner_access" ON order_batch_links
  USING (order_id IN (SELECT id FROM orders WHERE owner_id IN
    (SELECT id FROM owners WHERE auth.uid()::TEXT = id::TEXT)));

CREATE POLICY "owner_access" ON operational_expenses
  USING (owner_id IN (SELECT id FROM owners WHERE auth.uid()::TEXT = id::TEXT));

CREATE POLICY "owner_access" ON fixed_expenses
  USING (owner_id IN (SELECT id FROM owners WHERE auth.uid()::TEXT = id::TEXT));

CREATE POLICY "owner_access" ON employees
  USING (owner_id IN (SELECT id FROM owners WHERE auth.uid()::TEXT = id::TEXT));

CREATE POLICY "owner_access" ON staff_attendance
  USING (owner_id IN (SELECT id FROM owners WHERE auth.uid()::TEXT = id::TEXT));
