-- =====================================================================
-- Migration 001 : schéma initial
-- Plateforme de consultation des résultats académiques — IFSIO
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- pour gen_random_uuid()

-- ---------------------------------------------------------------------
-- Structure académique
-- ---------------------------------------------------------------------

CREATE TABLE filiere (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code          VARCHAR(20) NOT NULL UNIQUE,
  libelle       VARCHAR(120) NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE annee_academique (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  libelle       VARCHAR(20) NOT NULL UNIQUE, -- ex: "2025-2026"
  date_debut    DATE NOT NULL,
  date_fin      DATE NOT NULL,
  active        BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (date_fin > date_debut)
);

-- Une seule année académique active à la fois
CREATE UNIQUE INDEX idx_annee_academique_active ON annee_academique (active) WHERE active = true;

CREATE TABLE promotion (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filiere_id      UUID NOT NULL REFERENCES filiere(id) ON DELETE RESTRICT,
  annee_entree    INT NOT NULL,
  niveau          VARCHAR(10) NOT NULL, -- ex: "L1", "L2", "L3"
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (filiere_id, annee_entree, niveau)
);

CREATE TABLE semestre (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  annee_academique_id   UUID NOT NULL REFERENCES annee_academique(id) ON DELETE RESTRICT,
  numero                SMALLINT NOT NULL CHECK (numero IN (1, 2)),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (annee_academique_id, numero)
);

CREATE TABLE ue (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  semestre_id   UUID NOT NULL REFERENCES semestre(id) ON DELETE RESTRICT,
  code          VARCHAR(20) NOT NULL,
  libelle       VARCHAR(150) NOT NULL,
  credits       SMALLINT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (semestre_id, code)
);

CREATE TABLE matiere (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ue_id         UUID NOT NULL REFERENCES ue(id) ON DELETE RESTRICT,
  libelle       VARCHAR(150) NOT NULL,
  coefficient   NUMERIC(4,2) NOT NULL DEFAULT 1,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (coefficient > 0)
);

-- ---------------------------------------------------------------------
-- Étudiants
-- ---------------------------------------------------------------------

CREATE TABLE etudiant (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matricule         VARCHAR(30) NOT NULL UNIQUE,
  nom               VARCHAR(80) NOT NULL,
  prenoms           VARCHAR(120) NOT NULL,
  telephone         VARCHAR(20),         -- format E.164 recommandé, ex: +229XXXXXXXX
  email             VARCHAR(150),
  mot_de_passe_hash VARCHAR(255) NOT NULL,
  doit_changer_mdp  BOOLEAN NOT NULL DEFAULT true,
  code_pin_sms      VARCHAR(255),        -- hash du PIN 4 chiffres pour le canal SMS
  filiere_id        UUID NOT NULL REFERENCES filiere(id) ON DELETE RESTRICT,
  promotion_id      UUID NOT NULL REFERENCES promotion(id) ON DELETE RESTRICT,
  statut            VARCHAR(20) NOT NULL DEFAULT 'actif' CHECK (statut IN ('actif', 'suspendu', 'diplome', 'radie')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_etudiant_promotion ON etudiant(promotion_id);
CREATE INDEX idx_etudiant_telephone ON etudiant(telephone);

-- ---------------------------------------------------------------------
-- Comptes du personnel de scolarité
-- ---------------------------------------------------------------------

CREATE TABLE utilisateur_scolarite (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom               VARCHAR(120) NOT NULL,
  email             VARCHAR(150) NOT NULL UNIQUE,
  mot_de_passe_hash VARCHAR(255) NOT NULL,
  role              VARCHAR(30) NOT NULL CHECK (role IN ('agent', 'responsable', 'admin')),
  actif             BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- Notes et résultats
-- ---------------------------------------------------------------------

CREATE TABLE note (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  etudiant_id           UUID NOT NULL REFERENCES etudiant(id) ON DELETE CASCADE,
  matiere_id            UUID NOT NULL REFERENCES matiere(id) ON DELETE RESTRICT,
  valeur                NUMERIC(4,2) NOT NULL CHECK (valeur >= 0 AND valeur <= 20),
  session               VARCHAR(15) NOT NULL DEFAULT 'normale' CHECK (session IN ('normale', 'rattrapage')),
  statut_publication    VARCHAR(15) NOT NULL DEFAULT 'brouillon' CHECK (statut_publication IN ('brouillon', 'verifie', 'publie')),
  saisi_par             UUID REFERENCES utilisateur_scolarite(id),
  valide_par            UUID REFERENCES utilisateur_scolarite(id),
  date_saisie           TIMESTAMPTZ NOT NULL DEFAULT now(),
  date_publication       TIMESTAMPTZ,
  UNIQUE (etudiant_id, matiere_id, session)
);

CREATE INDEX idx_note_etudiant ON note(etudiant_id);
CREATE INDEX idx_note_matiere ON note(matiere_id);
CREATE INDEX idx_note_statut ON note(statut_publication);

CREATE TABLE resultat_semestre (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  etudiant_id         UUID NOT NULL REFERENCES etudiant(id) ON DELETE CASCADE,
  semestre_id         UUID NOT NULL REFERENCES semestre(id) ON DELETE RESTRICT,
  moyenne_generale    NUMERIC(4,2),
  decision            VARCHAR(20) CHECK (decision IN ('admis', 'ajourne', 'rattrapage')),
  statut_publication  VARCHAR(15) NOT NULL DEFAULT 'brouillon' CHECK (statut_publication IN ('brouillon', 'verifie', 'publie')),
  calcule_le          TIMESTAMPTZ,
  publie_le           TIMESTAMPTZ,
  UNIQUE (etudiant_id, semestre_id)
);

CREATE INDEX idx_resultat_semestre_etudiant ON resultat_semestre(etudiant_id);

-- ---------------------------------------------------------------------
-- Traçabilité
-- ---------------------------------------------------------------------

CREATE TABLE journal_modification (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_cible     VARCHAR(50) NOT NULL,
  ligne_id        UUID NOT NULL,
  action          VARCHAR(20) NOT NULL CHECK (action IN ('creation', 'modification', 'suppression', 'publication')),
  ancienne_valeur JSONB,
  nouvelle_valeur JSONB,
  auteur_id       UUID REFERENCES utilisateur_scolarite(id),
  date            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_journal_table_ligne ON journal_modification(table_cible, ligne_id);
CREATE INDEX idx_journal_date ON journal_modification(date);

-- ---------------------------------------------------------------------
-- Notifications (SMS / email)
-- ---------------------------------------------------------------------

CREATE TABLE notification (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  etudiant_id   UUID NOT NULL REFERENCES etudiant(id) ON DELETE CASCADE,
  canal         VARCHAR(10) NOT NULL CHECK (canal IN ('sms', 'email')),
  contenu       TEXT NOT NULL,
  statut_envoi  VARCHAR(15) NOT NULL DEFAULT 'en_attente' CHECK (statut_envoi IN ('en_attente', 'envoye', 'echec')),
  reference_externe VARCHAR(100), -- id renvoyé par l'agrégateur SMS
  date          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notification_etudiant ON notification(etudiant_id);
CREATE INDEX idx_notification_statut ON notification(statut_envoi);

-- ---------------------------------------------------------------------
-- Requêtes SMS entrantes (pull) — journal brut des requêtes reçues
-- ---------------------------------------------------------------------

CREATE TABLE sms_requete_entrante (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_expediteur VARCHAR(20) NOT NULL,
  contenu_brut      VARCHAR(160) NOT NULL,
  etudiant_id       UUID REFERENCES etudiant(id),
  traitee           BOOLEAN NOT NULL DEFAULT false,
  reponse_envoyee   TEXT,
  date              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sms_entrante_numero ON sms_requete_entrante(numero_expediteur);
