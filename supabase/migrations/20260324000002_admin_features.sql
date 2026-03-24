-- Migration 002: Admin dashboard features
-- Adds promo_codes, invoices tables + new order columns + ready_for_pickup status

-- Promo codes
CREATE TABLE promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  discount_value INTEGER NOT NULL,
  currency TEXT DEFAULT 'EUR',
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  customer_id UUID REFERENCES customers(id),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Invoices (with sequence for thread-safe numbering)
CREATE SEQUENCE invoice_number_seq;

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) NOT NULL,
  customer_id UUID REFERENCES customers(id),
  invoice_number TEXT UNIQUE NOT NULL DEFAULT (
    'INV-' || to_char(now(), 'YYYY') || '-' || LPAD(nextval('invoice_number_seq')::TEXT, 5, '0')
  ),
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'EUR',
  status TEXT NOT NULL CHECK (status IN ('draft', 'issued', 'paid', 'cancelled')) DEFAULT 'draft',
  pdf_url TEXT,
  issued_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add new status: ready_for_pickup
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('draft', 'pending_payment', 'paid', 'in_production', 'ready_for_pickup', 'shipped', 'completed', 'cancelled'));

-- Add columns to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS promo_code_id UUID REFERENCES promo_codes(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES invoices(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipment_notes TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_ready_at TIMESTAMPTZ;

-- RLS
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins have full access to promo_codes"
  ON promo_codes FOR ALL USING (is_admin());
CREATE POLICY "Admins have full access to invoices"
  ON invoices FOR ALL USING (is_admin());
CREATE POLICY "Customers can view own invoices"
  ON invoices FOR SELECT USING (customer_id IN (
    SELECT id FROM customers WHERE auth_user_id = auth.uid()
  ));
