/*
# Tie profile creation to the organization creator

The original profile INSERT policy checked only auth.uid() = id. That allowed
an authenticated user to link their own profile to an organization they did not
create. New organizations record their creator, and new profiles can only link
to an organization created by the authenticated user.

Existing organizations with one profile are attributed to that profile, which
matches the MVP signup flow. The migration stops if an organization has multiple
profiles or no profile so those memberships can be reviewed rather than guessed.
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.profiles
    GROUP BY organization_id
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Organization membership review required: multiple profiles reference the same organization.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.organizations AS organizations
    LEFT JOIN public.profiles AS profiles
      ON profiles.organization_id = organizations.id
    WHERE profiles.id IS NULL
  ) THEN
    RAISE EXCEPTION
      'Organization membership review required: an organization has no linked profile.';
  END IF;
END;
$$;

ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

UPDATE public.organizations AS organizations
SET created_by = profiles.id
FROM public.profiles AS profiles
WHERE profiles.organization_id = organizations.id
AND organizations.created_by IS NULL;

CREATE INDEX IF NOT EXISTS organizations_created_by_idx
ON public.organizations (created_by);

CREATE OR REPLACE FUNCTION public.set_organization_creator()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.created_by := auth.uid();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS organizations_set_creator ON public.organizations;
CREATE TRIGGER organizations_set_creator
BEFORE INSERT ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.set_organization_creator();

CREATE OR REPLACE FUNCTION public.current_user_created_organization(target_organization_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organizations
    WHERE organizations.id = target_organization_id
    AND organizations.created_by = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.current_user_created_organization(uuid)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_created_organization(uuid)
TO authenticated;

DROP POLICY IF EXISTS "Members can read own organization" ON public.organizations;
CREATE POLICY "Members can read own organization"
ON public.organizations FOR SELECT
TO authenticated
USING (
  organizations.created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.organization_id = organizations.id
    AND profiles.id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Authenticated can create organization" ON public.organizations;
CREATE POLICY "Authenticated can create organization"
ON public.organizations FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can create own profile" ON public.profiles;
CREATE POLICY "Users can create own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = id
  AND public.current_user_created_organization(organization_id)
);
