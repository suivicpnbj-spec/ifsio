/**
 * Schéma de la base SQLite du backend MES ACTES.
 * Le SQL est stocké en TypeScript pour éviter une étape de copie de fichier
 * lors de la compilation vers `server-dist/`.
 */
export const SCHEMA_SQL = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id                TEXT PRIMARY KEY,
  role              TEXT NOT NULL CHECK (role IN ('student', 'admin')),
  email             TEXT NOT NULL UNIQUE,
  password_hash     TEXT NOT NULL,
  first_name        TEXT NOT NULL,
  last_name         TEXT NOT NULL,
  matricule         TEXT,
  ine               TEXT,
  phone             TEXT,
  filiere           TEXT,
  promotion         TEXT,
  title             TEXT,
  birth_date        TEXT,
  birth_place       TEXT,
  nationality       TEXT,
  address           TEXT,
  emergency_contact TEXT,
  department        TEXT,
  office            TEXT,
  sms_alerts        INTEGER NOT NULL DEFAULT 1,
  email_alerts      INTEGER NOT NULL DEFAULT 1,
  status            TEXT NOT NULL DEFAULT 'active',
  created_at        TEXT NOT NULL,
  updated_at        TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  revoked_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS establishment (
  id         INTEGER PRIMARY KEY CHECK (id = 1),
  payload    TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS acts (
  id         TEXT PRIMARY KEY,
  payload    TEXT NOT NULL,
  position   INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS requests (
  id             TEXT PRIMARY KEY,
  student_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  act_id         TEXT NOT NULL,
  act_title      TEXT NOT NULL,
  service_type   TEXT NOT NULL,
  status         TEXT NOT NULL,
  applicant      TEXT NOT NULL,
  reclamation    TEXT,
  admin_note     TEXT,
  payment        TEXT,
  created_at     TEXT NOT NULL,
  created_label  TEXT NOT NULL,
  updated_at     TEXT NOT NULL,
  updated_label  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_requests_student ON requests(student_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);

CREATE TABLE IF NOT EXISTS timeline_events (
  id          TEXT PRIMARY KEY,
  request_id  TEXT NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  label       TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  completed   INTEGER NOT NULL DEFAULT 0,
  current     INTEGER NOT NULL DEFAULT 0,
  author      TEXT,
  position    INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_timeline_request ON timeline_events(request_id);

CREATE TABLE IF NOT EXISTS messages (
  id              TEXT PRIMARY KEY,
  request_id      TEXT NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  role            TEXT NOT NULL CHECK (role IN ('student', 'admin')),
  author          TEXT NOT NULL,
  text            TEXT NOT NULL,
  label           TEXT NOT NULL,
  attachment_name TEXT,
  created_at      TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_messages_request ON messages(request_id);

CREATE TABLE IF NOT EXISTS attachments (
  id            TEXT PRIMARY KEY,
  request_id    TEXT REFERENCES requests(id) ON DELETE CASCADE,
  owner_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  stored_name   TEXT NOT NULL,
  document_name TEXT,
  size          INTEGER NOT NULL DEFAULT 0,
  mime          TEXT,
  verified      INTEGER NOT NULL DEFAULT 0,
  uploaded_at   TEXT NOT NULL,
  created_at    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_attachments_request ON attachments(request_id);

CREATE TABLE IF NOT EXISTS notifications (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  message    TEXT NOT NULL,
  label      TEXT NOT NULL,
  read       INTEGER NOT NULL DEFAULT 0,
  request_id TEXT,
  type       TEXT NOT NULL DEFAULT 'info',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

CREATE TABLE IF NOT EXISTS payments (
  id            TEXT PRIMARY KEY,
  request_id    TEXT NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  provider      TEXT NOT NULL,
  provider_ref  TEXT,
  amount        INTEGER NOT NULL,
  currency      TEXT NOT NULL DEFAULT 'FCFA',
  status        TEXT NOT NULL,
  method        TEXT,
  receipt_number TEXT,
  instructions  TEXT,
  checkout_url  TEXT,
  raw           TEXT,
  created_at    TEXT NOT NULL,
  confirmed_at  TEXT
);
CREATE INDEX IF NOT EXISTS idx_payments_request ON payments(request_id);

CREATE TABLE IF NOT EXISTS audit_log (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_id   TEXT,
  actor_role TEXT,
  action     TEXT NOT NULL,
  entity     TEXT,
  entity_id  TEXT,
  details    TEXT,
  at         TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS counters (
  name  TEXT PRIMARY KEY,
  value INTEGER NOT NULL
);
`
