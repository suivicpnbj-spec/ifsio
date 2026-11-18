const { query, withTransaction } = require("../../db/pool");

async function listerFilieres() {
  const { rows } = await query(`SELECT id, code, libelle FROM filiere ORDER BY libelle`);
  return rows;
}

async function listerAnnees() {
  const { rows } = await query(`SELECT id, libelle, date_debut, date_fin, active FROM annee_academique ORDER BY date_debut DESC`);
  return rows;
}

async function listerPromotions(filiereId) {
  const params = [];
  const filtre = filiereId ? (params.push(filiereId), "WHERE p.filiere_id = $1") : "";
  const { rows } = await query(
    `SELECT p.id, p.filiere_id, p.annee_entree, p.niveau, f.libelle AS filiere, f.code AS filiere_code
     FROM promotion p JOIN filiere f ON f.id = p.filiere_id ${filtre} ORDER BY f.libelle, p.annee_entree DESC, p.niveau`, params
  );
  return rows;
}

async function listerSemestres(promotionId) {
  const params = [];
  const filtre = promotionId ? (params.push(promotionId), "WHERE s.promotion_id = $1") : "";
  const { rows } = await query(
    `SELECT s.id, s.numero, s.promotion_id, s.annee_academique_id,
            aa.libelle AS annee_academique, aa.active
     FROM semestre s JOIN annee_academique aa ON aa.id = s.annee_academique_id
     ${filtre} ORDER BY aa.libelle DESC, s.numero`, params
  );
  return rows;
}

async function listerMatieres(semestreId) {
  const { rows } = await query(
    `SELECT m.id, m.libelle, m.code, m.coefficient, ue.id AS ue_id,
            ue.libelle AS ue, ue.code AS ue_code, ue.credits
     FROM matiere m JOIN ue ON ue.id = m.ue_id
     WHERE ue.semestre_id = $1 ORDER BY ue.libelle, m.libelle`, [semestreId]
  );
  return rows;
}

async function listerUEs(semestreId) {
  const { rows } = await query(
    `SELECT id, semestre_id, code, libelle, credits FROM ue WHERE semestre_id = $1 ORDER BY libelle`, [semestreId]
  );
  return rows;
}

async function creerAnnee({ libelle, date_debut, date_fin, active }) {
  return withTransaction(async (client) => {
    if (active) await client.query("UPDATE annee_academique SET active = false WHERE active = true");
    const { rows } = await client.query(
      `INSERT INTO annee_academique (libelle, date_debut, date_fin, active)
       VALUES ($1,$2,$3,$4) RETURNING id,libelle,date_debut,date_fin,active`,
      [libelle, date_debut, date_fin, Boolean(active)]
    );
    return rows[0];
  });
}

async function creerPromotion({ filiere_id, annee_entree, niveau }) {
  const { rows } = await query(
    `INSERT INTO promotion (filiere_id, annee_entree, niveau) VALUES ($1,$2,$3)
     RETURNING id,filiere_id,annee_entree,niveau`, [filiere_id, annee_entree, niveau]
  );
  return rows[0];
}

async function creerSemestres({ promotion_id, annee_academique_id, numeros }) {
  return withTransaction(async (client) => {
    const cree = [];
    for (const numero of numeros) {
      const { rows } = await client.query(
        `INSERT INTO semestre (promotion_id,annee_academique_id,numero)
         VALUES ($1,$2,$3) RETURNING id, promotion_id, annee_academique_id, numero`,
        [promotion_id, annee_academique_id, numero]
      );
      cree.push(rows[0]);
    }
    return cree;
  });
}

async function creerUE({ semestre_id, code, libelle, credits }) {
  const { rows } = await query(
    `INSERT INTO ue (semestre_id,code,libelle,credits) VALUES ($1,$2,$3,$4)
     RETURNING id,semestre_id,code,libelle,credits`, [semestre_id, code, libelle, credits ?? 0]
  );
  return rows[0];
}

async function creerEC({ ue_id, code, libelle, coefficient }) {
  const { rows } = await query(
    `INSERT INTO matiere (ue_id,code,libelle,coefficient) VALUES ($1,$2,$3,$4)
     RETURNING id,ue_id,code,libelle,coefficient`, [ue_id, code || null, libelle, coefficient ?? 1]
  );
  return rows[0];
}

module.exports = { listerFilieres, listerAnnees, listerPromotions, listerSemestres, listerMatieres, listerUEs, creerAnnee, creerPromotion, creerSemestres, creerUE, creerEC };
