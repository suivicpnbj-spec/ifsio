-- La numérotation des semestres suit le cursus de Licence (S1 à S6).
-- Les données déjà présentes en S1 et S2 restent valides.
ALTER TABLE semestre DROP CONSTRAINT semestre_numero_check;
ALTER TABLE semestre
  ADD CONSTRAINT semestre_numero_check CHECK (numero BETWEEN 1 AND 6);
