/*
# Tighten grants on organizations and profiles

## Purpose
Revoke UPDATE and DELETE privileges from both anon and authenticated roles
on organizations and profiles tables. Hour 1 only requires SELECT and INSERT
(signup flow: create org, create profile; dashboard: read org + profile).

## Changes
- REVOKE UPDATE, DELETE on organizations FROM anon, authenticated
- REVOKE UPDATE, DELETE on profiles FROM anon, authenticated

## Notes
1. RLS is still enabled on both tables — policies remain unchanged.
2. If future phases need update/delete operations, grants can be added then.
*/

REVOKE UPDATE, DELETE ON organizations FROM anon, authenticated;
REVOKE UPDATE, DELETE ON profiles FROM anon, authenticated;
