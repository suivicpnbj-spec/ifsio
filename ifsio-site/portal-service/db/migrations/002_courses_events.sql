CREATE TABLE IF NOT EXISTS portal_course (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL,
  title VARCHAR(240) NOT NULL,
  description VARCHAR(1000) NOT NULL DEFAULT '',
  filiere VARCHAR(120) NOT NULL,
  niveau VARCHAR(40) NOT NULL,
  annee_academique VARCHAR(9) NOT NULL,
  created_by UUID NOT NULL REFERENCES portal_user(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(code,filiere,niveau,annee_academique)
);
CREATE INDEX IF NOT EXISTS portal_course_target_idx ON portal_course(filiere,niveau,annee_academique);

ALTER TABLE portal_resource ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES portal_course(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS portal_event (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(240) NOT NULL,
  description VARCHAR(2000) NOT NULL DEFAULT '',
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  location VARCHAR(240) NOT NULL DEFAULT '',
  audience VARCHAR(20) NOT NULL DEFAULT 'public' CHECK (audience IN ('public','students')),
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  created_by UUID NOT NULL REFERENCES portal_user(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (ends_at IS NULL OR ends_at >= starts_at)
);
CREATE INDEX IF NOT EXISTS portal_event_date_idx ON portal_event(status,audience,starts_at);
