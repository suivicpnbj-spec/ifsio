/**
 * Configure le référentiel bêta ESSFE L2 pour l'année 2023-2024 (S3 et S4).
 * Les UE/EC proviennent de Classeur_SFE (1).xlsx, les 20 étudiants et les
 * notes fictives de Classeur2_complet.ods.
 * Usage : NODE_ENV=development node db/seeds/seed-beta-essfe-l2.js
 */
require("dotenv").config({ path: process.env.DOTENV_CONFIG_PATH || ".env" });
if (process.env.NODE_ENV === "production") {
  console.error("[seed-beta] Refus d'appliquer le référentiel de simulation en production.");
  process.exit(1);
}
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const curriculum = require("./essfe-l2-curriculum.json");
const eleves = require("./essfe-l2-beta-students.json");
const DEMO_PASSWORD = "BetaTest2024!";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
});

async function upsertUE(client, semestreId, ue) {
  const { rows } = await client.query(
    `INSERT INTO ue (semestre_id, code, libelle, credits)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (semestre_id, code)
     DO UPDATE SET libelle = EXCLUDED.libelle, credits = EXCLUDED.credits
     RETURNING id`,
    [semestreId, ue.code, ue.label, ue.credits]
  );
  for (const ec of ue.ecs) {
    const existante = await client.query(
      `SELECT id FROM matiere WHERE ue_id = $1 AND code = $2`,
      [rows[0].id, ec.code]
    );
    if (existante.rows[0]) {
      await client.query(`UPDATE matiere SET libelle = $1 WHERE id = $2`, [ec.label, existante.rows[0].id]);
    } else {
      await client.query(
        `INSERT INTO matiere (ue_id, code, libelle, coefficient) VALUES ($1, $2, $3, 1)`,
        [rows[0].id, ec.code, ec.label]
      );
    }
  }
}

async function run() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const hash = await bcrypt.hash(DEMO_PASSWORD, Number(process.env.BCRYPT_SALT_ROUNDS) || 12);
    const { rows: [filiere] } = await client.query(
      `INSERT INTO filiere (code, libelle) VALUES ('ESSFE', 'ESSFE')
       ON CONFLICT (code) DO UPDATE SET libelle = EXCLUDED.libelle RETURNING id`
    );
    await client.query(`UPDATE annee_academique SET active = false WHERE active = true`);
    const { rows: [annee] } = await client.query(
      `INSERT INTO annee_academique (libelle, date_debut, date_fin, active)
       VALUES ('2023-2024', '2023-10-01', '2024-07-31', true)
       ON CONFLICT (libelle) DO UPDATE
         SET date_debut = EXCLUDED.date_debut, date_fin = EXCLUDED.date_fin, active = true
       RETURNING id`
    );
    const { rows: [promotion] } = await client.query(
      `INSERT INTO promotion (filiere_id, annee_entree, niveau) VALUES ($1, 2022, 'L2')
       ON CONFLICT (filiere_id, annee_entree, niveau) DO UPDATE SET niveau = EXCLUDED.niveau
       RETURNING id`,
      [filiere.id]
    );
    const { rows: [agent] } = await client.query(
      `INSERT INTO utilisateur_scolarite (nom, email, mot_de_passe_hash, role)
       VALUES ('Compte de test bêta', 'beta-scolarite@ifsio.test', $1, 'responsable')
       ON CONFLICT (email) DO UPDATE
         SET nom = EXCLUDED.nom, mot_de_passe_hash = EXCLUDED.mot_de_passe_hash, actif = true
       RETURNING id`,
      [hash]
    );
    const etudiants = [];
    for (const fixture of eleves.students) {
      const { rows: [etudiant] } = await client.query(
        `INSERT INTO etudiant
           (matricule, nom, prenoms, mot_de_passe_hash, doit_changer_mdp, filiere_id, promotion_id)
         VALUES ($1, $2, $3, $4, true, $5, $6)
         ON CONFLICT (matricule) DO UPDATE SET
           nom = EXCLUDED.nom, prenoms = EXCLUDED.prenoms,
           mot_de_passe_hash = EXCLUDED.mot_de_passe_hash, doit_changer_mdp = true,
           filiere_id = EXCLUDED.filiere_id, promotion_id = EXCLUDED.promotion_id, statut = 'actif'
         RETURNING id`,
        [fixture.matricule, fixture.nom, fixture.prenoms, hash, filiere.id, promotion.id]
      );
      etudiants.push({ ...fixture, id: etudiant.id });
    }
    for (const numero of [3, 4]) {
      const { rows: [semestre] } = await client.query(
        `INSERT INTO semestre (annee_academique_id, promotion_id, numero) VALUES ($1, $2, $3)
         ON CONFLICT (promotion_id, annee_academique_id, numero) DO UPDATE SET numero = EXCLUDED.numero
         RETURNING id`,
        [annee.id, promotion.id, numero]
      );
      const ues = curriculum.filter((item) => item.semester === numero);
      for (const ue of ues) {
        await upsertUE(client, semestre.id, ue);
        const { rows: matieres } = await client.query(
          `SELECT id, code FROM matiere WHERE ue_id IN (SELECT id FROM ue WHERE semestre_id = $1 AND code = $2)`,
          [semestre.id, ue.code]
        );
        for (const etudiant of etudiants) {
          for (const matiere of matieres) {
            const valeur = etudiant.grades[matiere.code];
            if (!Number.isFinite(valeur)) {
              throw new Error(`Note absente pour ${etudiant.matricule} / ${matiere.code}`);
            }
            await client.query(
              `INSERT INTO note (etudiant_id, matiere_id, valeur, session, statut_publication, saisi_par)
               VALUES ($1, $2, $3, 'normale', 'brouillon', $4)
               ON CONFLICT (etudiant_id, matiere_id, session) DO UPDATE SET
                 valeur = EXCLUDED.valeur, statut_publication = 'brouillon',
                 saisi_par = EXCLUDED.saisi_par, valide_par = NULL, date_publication = NULL`,
              [etudiant.id, matiere.id, valeur, agent.id]
            );
          }
        }
      }
      await client.query(
        `WITH moyennes_ue AS (
           SELECT n.etudiant_id, ue.semestre_id, ue.id AS ue_id, AVG(n.valeur) AS moyenne_ue
           FROM note n
           JOIN matiere m ON m.id = n.matiere_id
           JOIN ue ON ue.id = m.ue_id
           WHERE n.session = 'normale' AND ue.semestre_id = $1
             AND n.etudiant_id = ANY($2::uuid[])
           GROUP BY n.etudiant_id, ue.semestre_id, ue.id
         ), moyennes_semestre AS (
           SELECT etudiant_id, semestre_id, ROUND(AVG(moyenne_ue), 2) AS moyenne
           FROM moyennes_ue GROUP BY etudiant_id, semestre_id
         )
         INSERT INTO resultat_semestre
           (etudiant_id, semestre_id, moyenne_generale, decision, statut_publication, calcule_le)
         SELECT etudiant_id, semestre_id, moyenne,
           CASE WHEN moyenne >= 12 THEN 'admis' WHEN moyenne >= 10 THEN 'rattrapage' ELSE 'ajourne' END,
           'brouillon', now()
         FROM moyennes_semestre
         ON CONFLICT (etudiant_id, semestre_id) DO UPDATE SET
           moyenne_generale = EXCLUDED.moyenne_generale, decision = EXCLUDED.decision,
           statut_publication = 'brouillon', calcule_le = now(), publie_le = NULL`,
        [semestre.id, etudiants.map((e) => e.id)]
      );
    }
    await client.query("COMMIT");
    console.log(`[seed-beta] Bêta ESSFE L2 2023-2024 configurée : S3/S4, ${eleves.students.length} étudiants fictifs, notes issues de Classeur2_complet.ods.`);
    console.log(`[seed-beta] Scolarité : beta-scolarite@ifsio.test / ${DEMO_PASSWORD}`);
    console.log(`[seed-beta] Étudiants : ${eleves.students.map((e) => e.matricule).join(", ")} / ${DEMO_PASSWORD}`);
    console.log(`[seed-beta] Promotion ID : ${promotion.id}`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((error) => {
  console.error("[seed-beta] Échec :", error.message);
  process.exit(1);
});
