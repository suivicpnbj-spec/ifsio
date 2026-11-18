-- Un même semestre/calendrier peut contenir plusieurs niveaux et référentiels.
-- Le semestre doit donc appartenir à une promotion, et non être partagé entre elles.
ALTER TABLE semestre
  ADD COLUMN promotion_id UUID REFERENCES promotion(id) ON DELETE RESTRICT;

-- Relie les semestres existants à leur promotion lorsque leurs notes identifient
-- un seul groupe. Les semestres vides restent migrables et peuvent être rattachés
-- lors du prochain chargement du référentiel.
UPDATE semestre s
SET promotion_id = source.promotion_id
FROM (
  SELECT ue.semestre_id, MIN(e.promotion_id::text)::uuid AS promotion_id
  FROM ue
  JOIN matiere m ON m.ue_id = ue.id
  JOIN note n ON n.matiere_id = m.id
  JOIN etudiant e ON e.id = n.etudiant_id
  GROUP BY ue.semestre_id
  HAVING COUNT(DISTINCT e.promotion_id) = 1
) source
WHERE source.semestre_id = s.id;

ALTER TABLE semestre DROP CONSTRAINT IF EXISTS semestre_annee_academique_id_numero_key;
ALTER TABLE semestre
  ADD CONSTRAINT semestre_promotion_annee_numero_key
  UNIQUE (promotion_id, annee_academique_id, numero);
CREATE INDEX idx_semestre_promotion ON semestre(promotion_id);
