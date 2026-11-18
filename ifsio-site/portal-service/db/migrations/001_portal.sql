CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS portal_user (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(254) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'admin')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended')),
  full_name VARCHAR(180) NOT NULL,
  matricule VARCHAR(50) UNIQUE,
  filiere VARCHAR(120),
  niveau VARCHAR(40),
  annee_academique VARCHAR(9),
  approved_by UUID REFERENCES portal_user(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((role = 'admin' AND matricule IS NULL) OR role = 'student')
);
CREATE INDEX IF NOT EXISTS portal_user_role_status_idx ON portal_user(role,status);

CREATE TABLE IF NOT EXISTS portal_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind VARCHAR(20) NOT NULL CHECK (kind IN ('page','news')),
  slug VARCHAR(180) NOT NULL UNIQUE,
  title VARCHAR(240) NOT NULL,
  summary VARCHAR(500) NOT NULL DEFAULT '',
  body TEXT NOT NULL,
  category VARCHAR(100) NOT NULL DEFAULT '',
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  audience VARCHAR(20) NOT NULL DEFAULT 'public' CHECK (audience IN ('public','students')),
  created_by UUID NOT NULL REFERENCES portal_user(id),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS portal_content_published_idx ON portal_content(status,audience,kind,published_at DESC);

CREATE TABLE IF NOT EXISTS portal_resource (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(240) NOT NULL,
  description VARCHAR(1000) NOT NULL DEFAULT '',
  category VARCHAR(100) NOT NULL DEFAULT '',
  audience VARCHAR(20) NOT NULL DEFAULT 'students' CHECK (audience IN ('public','students')),
  status VARCHAR(20) NOT NULL DEFAULT 'published' CHECK (status IN ('draft','published')),
  original_name VARCHAR(255) NOT NULL,
  stored_name VARCHAR(100) NOT NULL UNIQUE,
  mime_type VARCHAR(100) NOT NULL,
  size_bytes BIGINT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES portal_user(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS portal_resource_audience_idx ON portal_resource(audience,created_at DESC);

CREATE TABLE IF NOT EXISTS portal_session (
  token_hash CHAR(64) PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES portal_user(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS portal_session_expiry_idx ON portal_session(expires_at);
