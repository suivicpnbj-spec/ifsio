-- Certains classeurs de notes ne renseignent pas le barème de crédits des UE.
-- NULL signifie « non fourni », tandis que 0 reste un barème explicite de zéro.
ALTER TABLE ue ALTER COLUMN credits DROP NOT NULL;
