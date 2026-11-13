# StockFlow Inventory Management

StockFlow is a React and Vite inventory MVP backed by Supabase authentication
and organization-scoped PostgreSQL data.

## Local development

1. Copy `.env.example` to `.env`.
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` using the public URL and
   anon/publishable key from your Supabase project's API settings.
3. Install dependencies with `npm install`.
4. Start the app with `npm run dev`.

Never put a Supabase service-role key in the browser app or a `VITE_` variable.

## Database setup

Apply the SQL migration files in `supabase/migrations` in filename order using
the Supabase SQL Editor if the Supabase CLI is not linked:

1. `20261113114446_create_organizations_and_profiles.sql`
2. `20261113114512_tighten_grants_orgs_profiles.sql`
3. `20261113120000_create_products.sql`
4. `20261113130000_create_organization_settings.sql`
5. `20261113140000_harden_organization_membership.sql`

Paste and run each file's complete contents before moving to the next file.
Do not expose the application to users until all migrations have completed.
The final migration restricts new profile links to organizations created by the
authenticated user. It attributes organizations with one existing profile to
that profile and stops if an organization has zero or multiple profiles; review
those memberships before retrying instead of guessing an owner.

## Production deployment (Netlify)

`netlify.toml` configures `npm run build`, publishes `dist`, selects Node 22,
and rewrites SPA routes to `index.html`.

When deploying from GitHub, add these environment variables in the Netlify site
settings using the public values from Supabase:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Set the Supabase Auth **Site URL** to the deployed HTTPS URL and add that URL
(and any required preview URLs) to the Auth redirect URL allowlist.

## Checks

- `npm run build`
- `npm run lint`
