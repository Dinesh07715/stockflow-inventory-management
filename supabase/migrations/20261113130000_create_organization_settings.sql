/*
# Create organization-level inventory settings

Each organization has one saved default low-stock threshold. Access is limited
to authenticated users whose profile belongs to that organization.
*/

CREATE TABLE IF NOT EXISTS organization_settings (
  organization_id uuid PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  default_low_stock_threshold integer NOT NULL DEFAULT 5
    CHECK (default_low_stock_threshold >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read own organization settings"
ON organization_settings FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.organization_id = organization_settings.organization_id
  )
);

CREATE POLICY "Members can create own organization settings"
ON organization_settings FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.organization_id = organization_settings.organization_id
  )
);

CREATE POLICY "Members can update own organization settings"
ON organization_settings FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.organization_id = organization_settings.organization_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.organization_id = organization_settings.organization_id
  )
);

REVOKE ALL ON organization_settings FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON organization_settings TO authenticated;

CREATE OR REPLACE FUNCTION public.set_organization_settings_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER organization_settings_set_updated_at
BEFORE UPDATE ON organization_settings
FOR EACH ROW
EXECUTE FUNCTION public.set_organization_settings_updated_at();
