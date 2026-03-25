-- Simple products that don't need the card wizard
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('cross_photo', 'card_pack', 'accessory', 'print_service')),
  price_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'EUR',
  requires_photo BOOLEAN DEFAULT false,
  size_options JSONB DEFAULT '[]',
  material_options JSONB DEFAULT '[]',
  preview_image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: anon + authenticated can read active products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active products"
  ON products FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Admins have full access to products"
  ON products FOR ALL
  TO authenticated
  USING (is_admin());

-- Add product_id to orders for simple product orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);

-- Make card_type nullable for product orders (products are NOT cards)
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_card_type_check;
ALTER TABLE orders ALTER COLUMN card_type DROP NOT NULL;
ALTER TABLE orders ADD CONSTRAINT orders_card_type_check
  CHECK (card_type IS NULL OR card_type IN ('sterbebild', 'trauerkarte', 'dankkarte'));

-- Seed: Grabkreuzfoto
INSERT INTO products (name, slug, description, category, price_cents, requires_photo, size_options, material_options)
VALUES (
  'Grabkreuzfoto',
  'grabkreuzfoto',
  'Hochwertiges Foto für das Grabkreuz — wetterfest und UV-beständig. Bleibt bis zur Fertigstellung der Grabstätte.',
  'cross_photo',
  2500,
  true,
  '[{"id": "small", "label": "8x10 cm", "price_cents": 2500}, {"id": "medium", "label": "10x13 cm", "price_cents": 3500}, {"id": "large", "label": "13x18 cm", "price_cents": 4500}]'::jsonb,
  '[{"id": "plastic", "label": "Kunststoff (wetterfest)", "price_cents": 0}, {"id": "ceramic", "label": "Keramik (premium)", "price_cents": 1500}]'::jsonb
);
