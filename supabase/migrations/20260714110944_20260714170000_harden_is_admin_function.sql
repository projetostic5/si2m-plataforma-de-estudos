/*
# Harden is_admin() function — switch to SECURITY INVOKER and block anon

## Summary

The `public.is_admin()` function was defined as `SECURITY DEFINER`, meaning it
executes with the privileges of the `postgres` role (the function owner), which
bypasses Row Level Security on the `profiles` table. Because EXECUTE was granted
to PUBLIC, both the `anon` and `authenticated` roles could invoke it directly via
the REST API at `/rest/v1/rpc/is_admin`, producing a privilege-escalation vector
flagged by Supabase security advisor.

## Changes

1. Recreate `is_admin()` as `SECURITY INVOKER` so it runs with the caller's
   privileges (subject to RLS on `profiles`) instead of the elevated `postgres`
   role. The `SET search_path TO ''` is preserved to prevent search-path
   injection.
   - The function remains correct under SECURITY INVOKER because the SELECT
     inside it queries `WHERE id = auth.uid()` — each authenticated user can
     already read their own `profiles` row via the existing "Users can view own
     profile" RLS policy, so the role check works without elevated privileges.
   - For the `anon` role, `auth.uid()` returns NULL so the query yields nothing
     and the function returns `false` — correct behaviour.

2. Revoke EXECUTE from PUBLIC (removes `anon` access via REST).

3. Re-grant EXECUTE only to `authenticated` (required by the RLS policy
   "Admins can view all profiles" on `public.profiles`, which calls `is_admin()`
   in its USING clause).

## Security

- Eliminates SECURITY DEFINER privilege-escalation vector on `is_admin()`.
- Blocks `anon` role from calling the function via REST API.
- `authenticated` can still call it (needed for RLS policy evaluation) but with
  no privilege escalation since it now runs as SECURITY INVOKER.

## Notes

- The frontend does NOT call `is_admin()` via RPC; it reads `profile.role`
  directly from the `profiles` table. No application code changes required.
- The RLS policy "Admins can view all profiles" continues to work: when an
  admin user triggers a SELECT on profiles, the policy calls `is_admin()`,
  which queries the admin's own profile row (visible via their own SELECT
  policy) and returns `true`.
*/
-- Switch is_admin() to SECURITY INVOKER (drops the SECURITY DEFINER privilege escalation)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO ''
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$function$;

-- Remove EXECUTE from every role, then grant only to authenticated
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM service_role;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
