CREATE TABLE IF NOT EXISTS publication_classeur (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filiere_code VARCHAR(20) NOT NULL,
  niveau VARCHAR(2) NOT NULL CHECK (niveau IN ('L1','L2','L3')),
  annee_academique VARCHAR(20) NOT NULL,
  session VARCHAR(15) NOT NULL CHECK (session IN ('normale','rattrapage')),
  nom_fichier TEXT NOT NULL,
  contenu JSONB NOT NULL,
  publie_par UUID REFERENCES utilisateur_scolarite(id),
  publie_le TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_publication_classeur_recherche
  ON publication_classeur (filiere_code, niveau, session, publie_le DESC);
