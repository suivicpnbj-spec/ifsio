-- =====================================================================
-- Migration 002 : trigger de mise à jour automatique de updated_at
-- =====================================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_etudiant_updated_at
  BEFORE UPDATE ON etudiant
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();
