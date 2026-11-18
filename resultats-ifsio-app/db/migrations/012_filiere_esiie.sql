-- Rend ESIIE disponible dans les sélecteurs scolarité et consultation.
-- Les promotions et leurs référentiels seront ajoutés séparément lorsqu'ils seront prêts.
INSERT INTO filiere (code, libelle)
VALUES ('ESIIE', 'ESIIE')
ON CONFLICT (code) DO NOTHING;
