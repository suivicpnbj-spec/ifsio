-- =============================================================================
-- Initialisation des bases de données PostgreSQL unifiées du Campus IFSIO
-- =============================================================================

CREATE DATABASE ifsio_portal;
CREATE DATABASE resultats_ifsio;
CREATE DATABASE mes_actes;

GRANT ALL PRIVILEGES ON DATABASE ifsio_portal TO ifsio;
GRANT ALL PRIVILEGES ON DATABASE resultats_ifsio TO ifsio;
GRANT ALL PRIVILEGES ON DATABASE mes_actes TO ifsio;
