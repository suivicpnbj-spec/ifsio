/**
 * Ajoute au bêta les étudiants et les notes du classeur Licence 1 IDE.
 * Usage : DOTENV_CONFIG_PATH=.env.local node db/seeds/seed-beta-essfe-l1-ide.js [classeur.xlsx]
 * Les notes restent en brouillon jusqu'à leur vérification et publication par la scolarité.
 */
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");
const ExcelJS = require("exceljs");
const bcrypt = require("bcrypt");

const dotenvPath = process.env.DOTENV_CONFIG_PATH || (fs.existsSync(".env.local") ? ".env.local" : ".env");
require("dotenv").config({ path: dotenvPath });
if (process.env.NODE_ENV === "production") {
  console.error("[seed-beta-l1] Refus d'importer des données de bêta en production.");
  process.exit(1);
}

const fichier = path.resolve(process.argv[2] || "/home/i45/1/Licence1_IDE_grille-1.xlsx");
const annee = process.env.BETA_L1_YEAR || "2022-2023";
const anneeEntree = Number(annee.slice(0, 4));
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
});

function lireClasseur(feuille) {
  const curriculum = [];
  let debut = 4;
  for (let col = 4; col <= 80; col += 1) {
    const titre = String(feuille.getCell(2, col).value || "").trim().toLocaleLowerCase("fr");
    if (titre.startsWith("total crédits")) {
      debut = col + 1;
      continue;
    }
    if (titre !== "crédits") continue;

    const semestre = debut <= 39 ? 1 : 2;
    const ueIndex = curriculum.filter((ue) => ue.semester === semestre).length + 1;
    const libelle = String(feuille.getCell(2, debut).value || "").trim();
    if (libelle) {
      const ecs = [];
      for (let noteCol = debut; noteCol < col; noteCol += 2) {
        const ec = String(feuille.getCell(3, noteCol).value || feuille.getCell(2, noteCol).value || "").trim();
        if (!ec) continue;
        ecs.push({
          code: `S${semestre}-UE${String(ueIndex).padStart(2, "0")}-EC${String(ecs.length + 1).padStart(2, "0")}`,
          libelle: ec,
          ccCol: noteCol,
          etCol: noteCol + 1,
        });
      }
      curriculum.push({
        semester: semestre,
        code: `S${semestre}-UE${String(ueIndex).padStart(2, "0")}`,
        libelle,
        ecs,
      });
    }
    debut = col + 1;
  }

  const students = [];
  for (let row = 5; row <= feuille.rowCount; row += 1) {
    const matricule = feuille.getCell(row, 2).value;
    const nomComplet = String(feuille.getCell(row, 3).value || "").trim();
    if (matricule === null || matricule === undefined || !nomComplet) continue;
    const [nom, ...prenoms] = nomComplet.split(/\s+/);
    const notes = [];
    for (const ue of curriculum) {
      for (const ec of ue.ecs) {
        const cc = Number(feuille.getCell(row, ec.ccCol).value);
        const et = Number(feuille.getCell(row, ec.etCol).value);
        if (!Number.isFinite(cc) || !Number.isFinite(et) || cc < 0 || cc > 20 || et < 0 || et > 20) {
          throw new Error(`Note CC/ET absente ou hors barème, ligne ${row}, ${ec.libelle}.`);
        }
        notes.push({ code: ec.code, valeur: Math.round(((cc + et) / 2) * 100) / 100 });
      }
    }
    students.push({ matricule: String(matricule).trim(), nom, prenoms: prenoms.join(" "), notes });
  }

  if (curriculum.filter((ue) => ue.semester === 1).length !== 8 || curriculum.filter((ue) => ue.semester === 2).length !== 8) {
    throw new Error("Structure inattendue : le classeur doit contenir 8 UE en S1 et 8 UE en S2.");
  }
  if (students.length !== 20 || students.some((student) => student.notes.length !== 30)) {
    throw new Error("Structure inattendue : 20 étudiants et 30 notes finales par étudiant sont attendus.");
  }
  return { curriculum, students };
}

async function run() {
  if (!fs.existsSync(fichier)) throw new Error(`Classeur introuvable : ${fichier}`);
  if (!/^\d{4}-\d{4}$/.test(annee) || !Number.isInteger(anneeEntree)) throw new Error("BETA_L1_YEAR doit être au format AAAA-AAAA.");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(fichier);
  const feuille = workbook.worksheets[0];
  if (!feuille) throw new Error("Le classeur ne contient aucune feuille.");
  const { curriculum, students } = lireClasseur(feuille);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const hash = await bcrypt.hash(process.env.BETA_DEMO_PASSWORD || "BetaTest2024!", Number(process.env.BCRYPT_SALT_ROUNDS) || 12);
    const { rows: [filiere] } = await client.query(
      `INSERT INTO filiere (code, libelle) VALUES ('ESSFE', 'ESSFE')
       ON CONFLICT (code) DO UPDATE SET libelle = EXCLUDED.libelle RETURNING id`
    );
    const dateDebut = `${anneeEntree}-10-01`;
    const dateFin = `${anneeEntree + 1}-07-31`;
    const { rows: [anneeAcademique] } = await client.query(
      `INSERT INTO annee_academique (libelle, date_debut, date_fin, active)
       VALUES ($1, $2, $3, false)
       ON CONFLICT (libelle) DO UPDATE SET date_debut=EXCLUDED.date_debut, date_fin=EXCLUDED.date_fin
       RETURNING id`, [annee, dateDebut, dateFin]
    );
    const { rows: [promotion] } = await client.query(
      `INSERT INTO promotion (filiere_id, annee_entree, niveau) VALUES ($1, $2, 'L1')
       ON CONFLICT (filiere_id, annee_entree, niveau) DO UPDATE SET niveau=EXCLUDED.niveau RETURNING id`,
      [filiere.id, anneeEntree]
    );
    const etudiants = new Map();
    for (const student of students) {
      const { rows: [etudiant] } = await client.query(
        `INSERT INTO etudiant (matricule, nom, prenoms, mot_de_passe_hash, doit_changer_mdp, filiere_id, promotion_id)
         VALUES ($1, $2, $3, $4, true, $5, $6)
         ON CONFLICT (matricule) DO UPDATE SET nom=EXCLUDED.nom, prenoms=EXCLUDED.prenoms,
           filiere_id=EXCLUDED.filiere_id, promotion_id=EXCLUDED.promotion_id, statut='actif'
         RETURNING id`, [student.matricule, student.nom, student.prenoms, hash, filiere.id, promotion.id]
      );
      etudiants.set(student.matricule, { ...student, id: etudiant.id });
    }

    for (const numero of [1, 2]) {
      const { rows: [semestre] } = await client.query(
        `INSERT INTO semestre (annee_academique_id, promotion_id, numero) VALUES ($1, $2, $3)
         ON CONFLICT (promotion_id, annee_academique_id, numero) DO UPDATE SET numero=EXCLUDED.numero RETURNING id`,
        [anneeAcademique.id, promotion.id, numero]
      );
      for (const ue of curriculum.filter((item) => item.semester === numero)) {
        const { rows: [unite] } = await client.query(
          `INSERT INTO ue (semestre_id, code, libelle, credits) VALUES ($1, $2, $3, NULL)
           ON CONFLICT (semestre_id, code) DO UPDATE SET libelle=EXCLUDED.libelle, credits=NULL RETURNING id`,
          [semestre.id, ue.code, ue.libelle]
        );
        for (const ec of ue.ecs) {
          const { rows: [matiere] } = await client.query(
            `INSERT INTO matiere (ue_id, code, libelle, coefficient) VALUES ($1, $2, $3, 1)
             ON CONFLICT (code) DO UPDATE SET ue_id=EXCLUDED.ue_id, libelle=EXCLUDED.libelle RETURNING id`,
            [unite.id, ec.code, ec.libelle]
          );
          for (const student of students) {
            const valeur = etudiants.get(student.matricule).notes.find((note) => note.code === ec.code).valeur;
            await client.query(
              `INSERT INTO note (etudiant_id, matiere_id, valeur, session, statut_publication)
               VALUES ($1, $2, $3, 'normale', 'brouillon')
               ON CONFLICT (etudiant_id, matiere_id, session) DO UPDATE SET valeur=EXCLUDED.valeur,
                 statut_publication='brouillon', valide_par=NULL, date_publication=NULL`,
              [etudiants.get(student.matricule).id, matiere.id, valeur]
            );
          }
        }
      }
    }
    await client.query("COMMIT");
    console.log(`[seed-beta-l1] ${students.length} étudiants, ${curriculum.length} UE et ${students.length * 30} notes importés dans ESSFE L1, ${annee}.`);
    console.log("[seed-beta-l1] Notes en brouillon; crédits UE laissés non renseignés, conformément au classeur.");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((error) => {
  console.error("[seed-beta-l1] échec :", error.message);
  process.exit(1);
});
