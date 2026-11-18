-- =====================================================================
-- Migration 003 : code des matières (format bulletin ESIIE/ESSFE)
-- Permet d'importer les résultats CSV en matchant les codes (ex : APG1101).
-- La colonne est NULLABLE : les matières existantes sans code restent valides
-- (PostgreSQL autorise plusieurs NULL dans une contrainte UNIQUE).
-- =====================================================================

ALTER TABLE matiere ADD COLUMN code VARCHAR(20);

ALTER TABLE matiere ADD CONSTRAINT uq_matiere_code UNIQUE (code);
