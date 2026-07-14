/*
# Restore is_admin() as SECURITY DEFINER — fix infinite recursion

## Problem

Switching is_admin() to SECURITY INVOKER introduced infinite recursion:
1. is_admin() queries public.profiles (runs as calling user, subject to RLS).
2. Evaluating profiles SELECT policies hits "Admins can view all profiles"
   which calls is_admin() again → infinite recursion → all nested queries on
   dimensions, themes, topics return nothing → study plan disappears.

## Fix

Restore SECURITY DEFINER so is_admin() bypasses RLS on profiles (no recursion).
Keep SET search_path TO '' to prevent search-path injection.
Keep EXECUTE revoked from PUBLIC / anon — anon cannot call it via REST.
Only authenticated retains EXECUTE (required for RLS policy evaluation).

This addresses the security advisory concern that matters most (anon access)
while keeping the function working correctly within RLS policy evaluation.
*/

CREATE OR REPLACE FUNCTION public.is_admin()
  RETURNS boolean
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$function$;

-- Ensure anon cannot call this function via REST
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;

-- Keep authenticated EXECUTE (RLS policies depend on it)
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
