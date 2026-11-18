#!/usr/bin/env node
/**
 * Script de migration et d'export de la base SQLite de MES ACTES vers PostgreSQL.
 * Génère le schéma PostgreSQL équivalent et exporte toutes les données relationnelles
 * pour unifier la persistance avec ifsio-portal et resultats-ifsio-app.
 */
import { DatabaseSync } from 'node:sqlite'
import { writeFileSync, existsSync } from 'node:fs'
import path from 'node:path'

const dbPath = process.env.DATABASE_FILE || path.join(process.cwd(), 'data', 'mes-actes.db')

if (!existsSync(dbPath)) {
  console.log(`[migration] Aucune base SQLite trouvée à ${dbPath}. Rien à migrer.`)
  process.exit(0)
}

const db = new DatabaseSync(dbPath)

console.log(`[migration] Lecture des données SQLite depuis ${dbPath}...`)

const tables = [
  'establishment',
  'acts',
  'users',
  'sessions',
  'requests',
  'timeline_events',
  'messages',
  'attachments',
  'notifications',
  'payments',
  'audit_log',
  'counters'
]

const pgSchema = `
-- =====================================================================
-- Schéma Relationnel PostgreSQL — MES ACTES IFSIO
-- Unification de la persistance avec le Campus Numérique
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS mesactes_users (
  id                TEXT PRIMARY KEY,
  role              VARCHAR(20) NOT NULL CHECK (role IN ('student', 'admin')),
  email             VARCHAR(255) NOT NULL UNIQUE,
  password_hash     VARCHAR(255) NOT NULL,
  first_name        VARCHAR(100) NOT NULL,
  last_name         VARCHAR(100) NOT NULL,
  matricule         VARCHAR(50),
  ine               VARCHAR(50),
  phone             VARCHAR(30),
  filiere           VARCHAR(150),
  promotion         VARCHAR(50),
  title             VARCHAR(100),
  birth_date        VARCHAR(50),
  birth_place       VARCHAR(150),
  nationality       VARCHAR(50),
  address           TEXT,
  emergency_contact VARCHAR(100),
  department        VARCHAR(100),
  office            VARCHAR(50),
  sms_alerts        BOOLEAN NOT NULL DEFAULT true,
  email_alerts      BOOLEAN NOT NULL DEFAULT true,
  status            VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mesactes_sessions (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES mesactes_users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_mesactes_sessions_user ON mesactes_sessions(user_id);

CREATE TABLE IF NOT EXISTS mesactes_establishment (
  id         INT PRIMARY KEY CHECK (id = 1),
  payload    JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mesactes_acts (
  id         TEXT PRIMARY KEY,
  payload    JSONB NOT NULL,
  position   INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mesactes_requests (
  id             TEXT PRIMARY KEY,
  student_id     TEXT NOT NULL REFERENCES mesactes_users(id) ON DELETE CASCADE,
  act_id         TEXT NOT NULL,
  act_title      VARCHAR(255) NOT NULL,
  service_type   VARCHAR(50) NOT NULL,
  status         VARCHAR(50) NOT NULL,
  applicant      JSONB NOT NULL,
  reclamation    JSONB,
  admin_note     TEXT,
  payment        JSONB,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_label  VARCHAR(100) NOT NULL,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_label  VARCHAR(100) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_mesactes_requests_student ON mesactes_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_mesactes_requests_status ON mesactes_requests(status);

CREATE TABLE IF NOT EXISTS mesactes_timeline_events (
  id          TEXT PRIMARY KEY,
  request_id  TEXT NOT NULL REFERENCES mesactes_requests(id) ON DELETE CASCADE,
  title       VARCHAR(255) NOT NULL,
  label       VARCHAR(100) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  completed   BOOLEAN NOT NULL DEFAULT false,
  current     BOOLEAN NOT NULL DEFAULT false,
  author      VARCHAR(150),
  position    INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mesactes_timeline_request ON mesactes_timeline_events(request_id);

CREATE TABLE IF NOT EXISTS mesactes_messages (
  id              TEXT PRIMARY KEY,
  request_id      TEXT NOT NULL REFERENCES mesactes_requests(id) ON DELETE CASCADE,
  role            VARCHAR(20) NOT NULL CHECK (role IN ('student', 'admin')),
  author          VARCHAR(150) NOT NULL,
  text            TEXT NOT NULL,
  label           VARCHAR(100) NOT NULL,
  attachment_name VARCHAR(255),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mesactes_messages_request ON mesactes_messages(request_id);

CREATE TABLE IF NOT EXISTS mesactes_attachments (
  id            TEXT PRIMARY KEY,
  request_id    TEXT REFERENCES mesactes_requests(id) ON DELETE CASCADE,
  owner_id      TEXT NOT NULL REFERENCES mesactes_users(id) ON DELETE CASCADE,
  name          VARCHAR(255) NOT NULL,
  stored_name   VARCHAR(255) NOT NULL,
  document_name VARCHAR(255),
  size          INT NOT NULL DEFAULT 0,
  mime          VARCHAR(100),
  verified      BOOLEAN NOT NULL DEFAULT false,
  uploaded_at   VARCHAR(100) NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mesactes_attachments_request ON mesactes_attachments(request_id);

CREATE TABLE IF NOT EXISTS mesactes_notifications (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES mesactes_users(id) ON DELETE CASCADE,
  title      VARCHAR(255) NOT NULL,
  message    TEXT NOT NULL,
  label      VARCHAR(100) NOT NULL,
  read       BOOLEAN NOT NULL DEFAULT false,
  request_id TEXT,
  type       VARCHAR(30) NOT NULL DEFAULT 'info',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mesactes_notifications_user ON mesactes_notifications(user_id);

CREATE TABLE IF NOT EXISTS mesactes_payments (
  id             TEXT PRIMARY KEY,
  request_id     TEXT NOT NULL REFERENCES mesactes_requests(id) ON DELETE CASCADE,
  provider       VARCHAR(50) NOT NULL,
  provider_ref   VARCHAR(100),
  amount         INT NOT NULL,
  currency       VARCHAR(10) NOT NULL DEFAULT 'FCFA',
  status         VARCHAR(50) NOT NULL,
  method         VARCHAR(50),
  receipt_number VARCHAR(100),
  instructions   TEXT,
  checkout_url   TEXT,
  raw            JSONB,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at   TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_mesactes_payments_request ON mesactes_payments(request_id);

CREATE TABLE IF NOT EXISTS mesactes_audit_log (
  id         SERIAL PRIMARY KEY,
  actor_id   TEXT,
  actor_role VARCHAR(50),
  action     VARCHAR(100) NOT NULL,
  entity     VARCHAR(100),
  entity_id  TEXT,
  details    JSONB,
  at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mesactes_counters (
  name  VARCHAR(100) PRIMARY KEY,
  value BIGINT NOT NULL
);
`

let sqlInserts = '\n-- ───────────────────────────── DONNÉES EXTRAITES ─────────────────────────────\n'

for (const tableName of tables) {
  try {
    const rows = db.prepare(`SELECT * FROM ${tableName}`).all()
    if (rows.length === 0) continue

    const pgTableName = `mesactes_${tableName}`
    console.log(`[migration] Table ${tableName} : ${rows.length} enregistrement(s) trouvé(s).`)

    for (const row of rows) {
      const keys = Object.keys(row)
      const values = keys.map((key) => {
        const val = row[key]
        if (val === null || val === undefined) return 'NULL'
        if (typeof val === 'number') return val
        // Si la colonne stocke du JSON ou un booléen
        if (key === 'sms_alerts' || key === 'email_alerts' || key === 'completed' || key === 'current' || key === 'verified' || key === 'read') {
          return val === 1 ? 'true' : 'false'
        }
        const str = String(val).replace(/'/g, "''")
        return `'${str}'`
      })

      sqlInserts += `INSERT INTO ${pgTableName} (${keys.join(', ')}) VALUES (${values.join(', ')}) ON CONFLICT DO NOTHING;\n`
    }
  } catch (_e) {
    // Table vide ou non initialisée
  }
}

const dumpPath = path.join(process.cwd(), 'data', 'mes-actes-postgres-dump.sql')
writeFileSync(dumpPath, pgSchema + sqlInserts, 'utf8')

console.log(`[migration] ✅ Schéma et données exportés avec succès dans : ${dumpPath}`)
