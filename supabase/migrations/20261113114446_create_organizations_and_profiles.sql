/*
# Create organizations and profiles tables for StockFlow

## Purpose
Sets up the core data model for StockFlow's multi-tenant inventory management system.
Organizations are the top-level tenant entity, and profiles link authenticated users
to their organization.

## New Tables

### organizations
- `id` (uuid, primary key, auto-generated)
- `name` (text, not null) — the organization's display name
- `created_at` (timestamptz, defaults to now())

### profiles
- `id` (uuid, primary key) — references `auth.users.id`, one-to-one with the auth user
- `organization_id` (uuid, foreign key → organizations.id, not null)
- `created_at` (timestamptz, defaults to now())

## Security

### Row Level Security
Both tables have RLS enabled.

**organizations** — users can only read and insert organizations. The profile
table's `organization_id` links a user to an org, so we verify ownership through
the profiles table:
- SELECT: organization must have a profile row matching the authenticated user
- INSERT: any authenticated user can create a new organization (needed at signup)

**profiles** — users can only read their own profile (id = auth.uid()):
- SELECT: profile id must match the authenticated user's id
- INSERT: profile id must match the authenticated user's id (so users can only
  create their own profile during signup)

### Grants
- organizations: SELECT, INSERT to authenticated
- profiles: SELECT, INSERT to authenticated

## Notes
1. The profile INSERT policy uses `WITH CHECK (auth.uid() = id)` so a user can
   only insert a profile row with their own auth user id — they cannot create
   profiles for other users.
2. The organizations SELECT policy checks that a profile row exists linking
   the authenticated user to that organization, enforcing tenant isolation.
3. A unique constraint on profiles.organization_id is NOT added because future
   phases may allow multiple users per organization.
*/

CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- organizations: only members can read their org
DROP POLICY IF EXISTS "Members can read own organization" ON organizations;
CREATE POLICY "Members can read own organization"
ON organizations FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.organization_id = organizations.id
    AND profiles.id = auth.uid()
  )
);

-- organizations: any authenticated user can create an org (needed at signup)
DROP POLICY IF EXISTS "Authenticated can create organization" ON organizations;
CREATE POLICY "Authenticated can create organization"
ON organizations FOR INSERT
TO authenticated
WITH CHECK (true);

-- profiles: users can read only their own profile
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- profiles: users can insert only their own profile
DROP POLICY IF EXISTS "Users can create own profile" ON profiles;
CREATE POLICY "Users can create own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Grants
GRANT SELECT, INSERT ON organizations TO authenticated;
GRANT SELECT, INSERT ON profiles TO authenticated;
