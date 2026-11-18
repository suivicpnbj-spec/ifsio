/**
 * Ajoute le référentiel ESSFE L3 S5/S6 2025-2026 depuis Classeur_SFE (1).xlsx.
 * N'ajoute aucun étudiant ni aucune note.
 * Usage : NODE_ENV=development npm run seed:beta:essfe-l3-referentiel
 */
const fs = require("fs");
const path = require("path");
const ExcelJS = require("exceljs");
const { Pool } = require("pg");

const envPath = process.env.DOTENV_CONFIG_PATH || (fs.existsSync(".env.local") ? ".env.local" : ".env");
require("dotenv").config({ path: envPath });
if (process.env.NODE_ENV === "production") {
  console.error("[seed-beta-l3] Refus d'ajouter un référentiel de bêta en production.");
  process.exit(1);
}

const source = path.resolve(process.argv[2] || path.join(__dirname, "../../../Classeur_SFE (1).xlsx"));
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
});

function lireCurriculum(feuille) {
  const parSemestre = new Map();
  let semestre = null;
  let ues = new Map();
  const terminerSemestre = () => {
    if (semestre !== null) parSemestre.set(semestre, [...ues.values()]);
    ues = new Map();
  };

  for (let rowNum = 1; rowNum <= feuille.rowCount; rowNum += 1) {
    const row = feuille.getRow(rowNum);
    const titre = String(row.getCell(1).value || "").trim();
    const match = titre.match(/Licence 3.*Semestre\s+([56])/i);
    if (match) {
      terminerSemestre();
      semestre = Number(match[1]);
      continue;
    }
    if (semestre === null || rowNum === 4 || rowNum === 33) continue;

    const type = String(row.getCell(1).value || "").trim();
    const codeUE = String(row.getCell(2).value || "").trim();
    const libelleUE = String(row.getCell(3).value || "").trim();
    const creditsRaw = row.getCell(4).value;
    const codeEC = String(row.getCell(5).value || "").trim();
    const libelleEC = String(row.getCell(6).value || "").trim();
    if (!codeUE && !codeEC && /total/i.test(type)) continue;
    if (!codeUE || !libelleUE || !codeEC || !libelleEC) {
      if (codeUE || codeEC || libelleUE || libelleEC) {
        throw new Error(`Ligne ${rowNum} incomplète dans le semestre ${semestre}.`);
      }
      continue;
    }

    let ue = ues.get(codeUE);
    if (!ue) {
      const credits = creditsRaw === null || creditsRaw === undefined || creditsRaw === "" ? null : Number(creditsRaw);
      if (credits !== null && (!Number.isInteger(credits) || credits < 0 || credits > 60)) {
        throw new Error(`Crédits UE invalides ligne ${rowNum} (${codeUE}).`);
      }
      ue = { code: codeUE, label: libelleUE, credits, ecs: [] };
      ues.set(codeUE, ue);
    } else if (creditsRaw !== null && creditsRaw !== undefined && creditsRaw !== "" && Number(creditsRaw) !== ue.credits) {
      throw new Error(`Crédits contradictoires pour l'UE ${codeUE}.`);
    }
    if (ue.ecs.some((ec) => ec.code === codeEC)) throw new Error(`Code EC répété : ${codeEC}.`);
    ue.ecs.push({ code: codeEC, label: libelleEC });
  }
  terminerSemestre();

  for (const numero of [5, 6]) {
    const list = parSemestre.get(numero) || [];
    if (!list.length || list.some((ue) => ue.credits === null || !ue.ecs.length)) {
      throw new Error(`Référentiel incomplet pour le semestre ${numero}.`);
    }
    const somme = list.reduce((total, ue) => total + ue.credits, 0);
    if (somme !== 30) throw new Error(`Le total des crédits du semestre ${numero} vaut ${somme}, au lieu des 30 crédits indiqués dans la maquette.`);
  }
  return parSemestre;
}

async function run() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL est obligatoire.");
  if (!fs.existsSync(source)) throw new Error(`Classeur de référence introuvable : ${source}`);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(source);
  const feuille = workbook.getWorksheet("Licence 3");
  if (!feuille) throw new Error("Feuille « Licence 3 » absente du classeur.");
  const curriculum = lireCurriculum(feuille);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows: [filiere] } = await client.query("SELECT id FROM filiere WHERE code='ESSFE'");
    if (!filiere) throw new Error("La filière ESSFE doit être créée avant ce référentiel.");
    const { rows: [annee] } = await client.query(
      `INSERT INTO annee_academique (libelle, date_debut, date_fin, active)
       VALUES ('2025-2026', '2025-10-01', '2026-07-31', false)
       ON CONFLICT (libelle) DO UPDATE SET date_debut=EXCLUDED.date_debut, date_fin=EXCLUDED.date_fin
       RETURNING id`,
    );
    const { rows: [promotion] } = await client.query(
      `INSERT INTO promotion (filiere_id, annee_entree, niveau)
       VALUES ($1, 2023, 'L3')
       ON CONFLICT (filiere_id, annee_entree, niveau) DO UPDATE SET niveau=EXCLUDED.niveau
       RETURNING id`, [filiere.id]
    );

    let totalUE = 0;
    let totalEC = 0;
    for (const numero of [5, 6]) {
      const { rows: [semestre] } = await client.query(
        `INSERT INTO semestre (annee_academique_id, promotion_id, numero)
         VALUES ($1, $2, $3)
         ON CONFLICT (promotion_id, annee_academique_id, numero) DO UPDATE SET numero=EXCLUDED.numero
         RETURNING id`, [annee.id, promotion.id, numero]
      );
      for (const ue of curriculum.get(numero)) {
        const { rows: [ueDb] } = await client.query(
          `INSERT INTO ue (semestre_id, code, libelle, credits)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (semestre_id, code) DO UPDATE SET libelle=EXCLUDED.libelle, credits=EXCLUDED.credits
           RETURNING id`, [semestre.id, ue.code, ue.label, ue.credits]
        );
        totalUE += 1;
        for (const ec of ue.ecs) {
          const { rows: existing } = await client.query(`SELECT id, ue_id FROM matiere WHERE code=$1`, [ec.code]);
          if (existing.length && existing[0].ue_id !== ueDb.id) {
            throw new Error(`Le code EC ${ec.code} existe déjà dans un autre référentiel.`);
          }
          if (existing.length) {
            await client.query(`UPDATE matiere SET libelle=$1 WHERE id=$2`, [ec.label, existing[0].id]);
          } else {
            await client.query(
              `INSERT INTO matiere (ue_id, code, libelle, coefficient) VALUES ($1, $2, $3, 1)`,
              [ueDb.id, ec.code, ec.label]
            );
          }
          totalEC += 1;
        }
      }
    }
    await client.query("COMMIT");
    console.log(`[seed-beta-l3] Référentiel ESSFE L3 2025-2026 ajouté : S5/S6, ${totalUE} UE, ${totalEC} EC. Aucun étudiant ni aucune note créés.`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((error) => {
  console.error("[seed-beta-l3] Échec :", error.message);
  process.exit(1);
});
