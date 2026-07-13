-- Fix 1: is_admin() — lock search_path, switch to SECURITY INVOKER
-- (SECURITY DEFINER was unnecessary; the function only reads the calling
--  user's own row, which the existing RLS SELECT policy already allows.)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- Revoke direct RPC execution from the anonymous role
-- (authenticated keeps EXECUTE because RLS policies call this function)
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;

-- Fix 2: update_updated_at_column() — lock search_path
-- (trigger functions are not callable via RPC, but a mutable search_path
--  is still a security risk if the search_path is hijacked)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;
