/*
# Create organization-scoped products

Products are isolated by their organization and accessible only to authenticated
members linked to that organization through their profile.
*/

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (btrim(name) <> ''),
  sku text NOT NULL CHECK (sku = btrim(sku) AND sku <> ''),
  description text,
  quantity_on_hand integer NOT NULL DEFAULT 0 CHECK (quantity_on_hand >= 0),
  cost_price numeric(12, 2) CHECK (cost_price IS NULL OR cost_price >= 0),
  selling_price numeric(12, 2) CHECK (selling_price IS NULL OR selling_price >= 0),
  low_stock_threshold integer CHECK (low_stock_threshold IS NULL OR low_stock_threshold >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX products_organization_sku_unique
ON products (organization_id, lower(sku));

CREATE INDEX products_organization_created_at_idx
ON products (organization_id, created_at DESC);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read own organization products"
ON products FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.organization_id = products.organization_id
  )
);

CREATE POLICY "Members can create own organization products"
ON products FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.organization_id = products.organization_id
  )
);

CREATE POLICY "Members can update own organization products"
ON products FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.organization_id = products.organization_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.organization_id = products.organization_id
  )
);

CREATE POLICY "Members can delete own organization products"
ON products FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.organization_id = products.organization_id
  )
);

REVOKE ALL ON products FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON products TO authenticated;

CREATE OR REPLACE FUNCTION public.set_products_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER products_set_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION public.set_products_updated_at();
