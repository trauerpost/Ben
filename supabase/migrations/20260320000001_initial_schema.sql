-- Trauerpost Initial Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/iqltlhfqhzcyqgryrkky/sql

-- Customers table (regular customers with accounts)
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  company_name TEXT,
  phone TEXT,
  customer_type TEXT NOT NULL CHECK (customer_type IN ('regular', 'one_time')) DEFAULT 'one_time',
  role TEXT NOT NULL CHECK (role IN ('customer', 'admin')) DEFAULT 'customer',
  credits_remaining INTEGER DEFAULT 0,
  auth_user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Credit packages (pre-paid bundles)
CREATE TABLE credit_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  credits INTEGER NOT NULL,
  price_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'EUR',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Credit transactions (purchase/usage log)
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) NOT NULL,
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  description TEXT,
  order_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Card templates (design templates with tags)
CREATE TABLE card_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('sterbebild', 'trauerkarte', 'dankkarte')),
  preview_url TEXT,
  template_data JSONB NOT NULL,
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Asset library (images, borders, backgrounds, symbols)
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('background', 'border', 'symbol', 'icon', 'ornament', 'photo_frame')),
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id),
  guest_email TEXT,
  guest_name TEXT,
  status TEXT NOT NULL CHECK (status IN ('draft', 'pending_payment', 'paid', 'in_production', 'shipped', 'completed', 'cancelled')) DEFAULT 'draft',
  card_type TEXT NOT NULL CHECK (card_type IN ('sterbebild', 'trauerkarte', 'dankkarte')),
  card_data JSONB DEFAULT '{}'::jsonb,
  pdf_url TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  price_cents INTEGER,
  currency TEXT DEFAULT 'EUR',
  payment_method TEXT CHECK (payment_method IN ('stripe', 'credit', 'invoice')),
  payment_id TEXT,
  invoice_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Pricing table
CREATE TABLE pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_type TEXT NOT NULL CHECK (card_type IN ('sterbebild', 'trauerkarte', 'dankkarte')),
  quantity_min INTEGER DEFAULT 1,
  quantity_max INTEGER,
  price_per_unit_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'EUR',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add FK for credit_transactions.order_id (orders must exist first)
ALTER TABLE credit_transactions
  ADD CONSTRAINT fk_credit_transactions_order
  FOREIGN KEY (order_id) REFERENCES orders(id);

-- Helper function: check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM customers
    WHERE auth_user_id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Credit deduction function (atomic — prevents race conditions)
CREATE OR REPLACE FUNCTION deduct_credit(
  p_customer_id UUID,
  p_order_id UUID,
  p_description TEXT DEFAULT 'Order credit usage'
)
RETURNS INTEGER AS $$
DECLARE
  v_balance INTEGER;
BEGIN
  SELECT credits_remaining INTO v_balance
  FROM customers
  WHERE id = p_customer_id
  FOR UPDATE;

  IF v_balance IS NULL THEN
    RAISE EXCEPTION 'Customer not found';
  END IF;

  IF v_balance < 1 THEN
    RAISE EXCEPTION 'Insufficient credits (balance: %)', v_balance;
  END IF;

  UPDATE customers SET credits_remaining = credits_remaining - 1, updated_at = now()
  WHERE id = p_customer_id;

  INSERT INTO credit_transactions (customer_id, amount, balance_after, description, order_id)
  VALUES (p_customer_id, -1, v_balance - 1, p_description, p_order_id);

  RETURN v_balance - 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on all tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Templates are viewable by everyone"
  ON card_templates FOR SELECT USING (is_active = true);

CREATE POLICY "Assets are viewable by everyone"
  ON assets FOR SELECT USING (is_active = true);

CREATE POLICY "Credit packages are viewable by everyone"
  ON credit_packages FOR SELECT USING (is_active = true);

CREATE POLICY "Pricing is viewable by everyone"
  ON pricing FOR SELECT USING (is_active = true);

-- Customer self-access
CREATE POLICY "Customers can view own data"
  ON customers FOR SELECT USING (auth_user_id = auth.uid());

CREATE POLICY "Customers can update own data"
  ON customers FOR UPDATE USING (auth_user_id = auth.uid());

CREATE POLICY "Customers can view own orders"
  ON orders FOR SELECT USING (customer_id IN (
    SELECT id FROM customers WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Customers can create orders"
  ON orders FOR INSERT WITH CHECK (true);

CREATE POLICY "Customers can view own credit transactions"
  ON credit_transactions FOR SELECT USING (customer_id IN (
    SELECT id FROM customers WHERE auth_user_id = auth.uid()
  ));

-- Admin: full access to all tables
CREATE POLICY "Admins have full access to customers"
  ON customers FOR ALL USING (is_admin());
CREATE POLICY "Admins have full access to orders"
  ON orders FOR ALL USING (is_admin());
CREATE POLICY "Admins have full access to templates"
  ON card_templates FOR ALL USING (is_admin());
CREATE POLICY "Admins have full access to assets"
  ON assets FOR ALL USING (is_admin());
CREATE POLICY "Admins have full access to credit_transactions"
  ON credit_transactions FOR ALL USING (is_admin());
CREATE POLICY "Admins have full access to pricing"
  ON pricing FOR ALL USING (is_admin());
CREATE POLICY "Admins have full access to credit_packages"
  ON credit_packages FOR ALL USING (is_admin());
