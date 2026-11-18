-- Totaux de crédits retranscrits depuis le classeur officiel.
-- Ils sont indépendants du barème de crédits configuré par UE.
ALTER TABLE resultat_semestre
  ADD COLUMN IF NOT EXISTS credits_semestre_officiels SMALLINT,
  ADD COLUMN IF NOT EXISTS credits_annee_officiels SMALLINT;

ALTER TABLE resultat_semestre
  ADD CONSTRAINT resultat_semestre_credits_semestre_non_negatifs
    CHECK (credits_semestre_officiels IS NULL OR credits_semestre_officiels >= 0),
  ADD CONSTRAINT resultat_semestre_credits_annee_non_negatifs
    CHECK (credits_annee_officiels IS NULL OR credits_annee_officiels >= 0);
