/**
 * Peuple la base avec des données de démarrage réalistes pour le développement
 * et la démonstration : une filière, une promotion, une année académique active,
 * un semestre, des matières, un compte scolarité et quelques étudiants.
 *
 * Usage : node db/seeds/run.js
 */
require("dotenv").config({ path: process.env.DOTENV_CONFIG_PATH || ".env" });
if (process.env.NODE_ENV === "production") {
  console.error("[seed] Refus d'insérer les comptes et étudiants de démonstration en production.");
  process.exit(1);
}
const bcrypt = require("bcrypt");
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Bases managées (Render/Neon/Supabase) : SSL obligatoire en connexion externe.
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
});
const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || "12", 10);

async function run() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows: [filiere] } = await client.query(
      `INSERT INTO filiere (code, libelle) VALUES ('INF', 'Infirmier') RETURNING id`
    );

    const { rows: [annee] } = await client.query(
      `INSERT INTO annee_academique (libelle, date_debut, date_fin, active)
       VALUES ('2025-2026', '2025-10-01', '2026-07-31', true) RETURNING id`
    );

    const { rows: [promotion] } = await client.query(
      `INSERT INTO promotion (filiere_id, annee_entree, niveau) VALUES ($1, 2024, 'L2') RETURNING id`,
      [filiere.id]
    );

    const { rows: [semestre] } = await client.query(
      `INSERT INTO semestre (annee_academique_id, numero) VALUES ($1, 1) RETURNING id`,
      [annee.id]
    );

    const { rows: [ue] } = await client.query(
      `INSERT INTO ue (semestre_id, code, libelle, credits) VALUES ($1, 'UE1', 'Sciences fondamentales', 15) RETURNING id`,
      [semestre.id]
    );

    const matieresData = [
      ["Anatomie", 3],
      ["Soins infirmiers", 4],
      ["Pharmacologie", 2],
      ["Déontologie", 1],
      ["Anglais médical", 1],
    ];
    const matieres = [];
    for (const [libelle, coef] of matieresData) {
      const { rows } = await client.query(
        `INSERT INTO matiere (ue_id, libelle, coefficient) VALUES ($1, $2, $3) RETURNING id, libelle`,
        [ue.id, libelle, coef]
      );
      matieres.push(rows[0]);
    }

    const hashResponsable = await bcrypt.hash("scolarite123", SALT_ROUNDS);
    await client.query(
      `INSERT INTO utilisateur_scolarite (nom, email, mot_de_passe_hash, role)
       VALUES ('Responsable Scolarité IFSIO', 'scolarite@ifsio.up.bj', $1, 'responsable')`,
      [hashResponsable]
    );

    const etudiantsData = [
      ["IFSIO24-014", "AGBOSSOU", "Rachidatou", "+22997000014"],
      ["IFSIO24-027", "DOSSOU", "Kokou Elom", "+22997000027"],
      ["IFSIO24-033", "SALAMI", "Fatouma", "+22997000033"],
    ];
    const hashEtudiant = await bcrypt.hash("etudiant123", SALT_ROUNDS);
    for (const [matricule, nom, prenoms, telephone] of etudiantsData) {
      await client.query(
        `INSERT INTO etudiant (matricule, nom, prenoms, telephone, mot_de_passe_hash, doit_changer_mdp, filiere_id, promotion_id)
         VALUES ($1, $2, $3, $4, $5, false, $6, $7)`,
        [matricule, nom, prenoms, telephone, hashEtudiant, filiere.id, promotion.id]
      );
    }

    await client.query("COMMIT");

    console.log("[seed] terminé avec succès.");
    console.log("[seed] compte scolarité  : scolarite@ifsio.up.bj / scolarite123");
    console.log("[seed] compte étudiant   : IFSIO24-014 / etudiant123");
    console.log(`[seed] semestre_id       : ${semestre.id}`);
    console.log(`[seed] promotion_id      : ${promotion.id}`);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error("[seed] échec :", err);
  process.exit(1);
});
