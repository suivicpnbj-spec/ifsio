-- Fixe le search_path du trigger pour éviter une résolution d'objets mutable.
ALTER FUNCTION public.set_updated_at() SET search_path = pg_catalog;
