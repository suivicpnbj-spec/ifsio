const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { query } = require("../../db/pool");
const env = require("../../config/env");
const { AppError } = require("../../middleware/errorHandler");

/** Génère un mot de passe temporaire lisible (ex: "ifsio-7fk2m9") pour la première connexion */
function genererMotDePasseTemporaire() {
  return `ifsio-${crypto.randomBytes(4).toString("hex")}`;
}

async function creerEtudiant(donnees, auteurId) {
  const motDePasseTemporaire = genererMotDePasseTemporaire();
  const hash = await bcrypt.hash(motDePasseTemporaire, env.bcryptSaltRounds);

  const { rows } = await query(
    `INSERT INTO etudiant (matricule, nom, prenoms, telephone, email, mot_de_passe_hash, filiere_id, promotion_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, matricule, nom, prenoms, telephone, email, filiere_id, promotion_id, statut`,
    [donnees.matricule, donnees.nom, donnees.prenoms, donnees.telephone, donnees.email, hash, donnees.filiere_id, donnees.promotion_id]
  ).catch((err) => {
    if (err.code === "23505") {
      throw new AppError(`Le matricule "${donnees.matricule}" existe déjà.`, 409, "MATRICULE_EXISTANT");
    }
    throw err;
  });

  await query(
    `INSERT INTO journal_modification (table_cible, ligne_id, action, nouvelle_valeur, auteur_id)
     VALUES ('etudiant', $1, 'creation', $2, $3)`,
    [rows[0].id, JSON.stringify({ matricule: donnees.matricule }), auteurId]
  );

  // Le mot de passe temporaire n'est retourné qu'une seule fois, à la création,
  // pour être communiqué à l'étudiant (SMS, affichage sécurisé) — jamais stocké en clair.
  return { ...rows[0], mot_de_passe_temporaire: motDePasseTemporaire };
}

async function listerEtudiantsParPromotion(promotionId) {
  const { rows } = await query(
    `SELECT id, matricule, nom, prenoms, telephone, email, statut FROM etudiant WHERE promotion_id = $1 ORDER BY nom, prenoms`,
    [promotionId]
  );
  return rows;
}

async function definirCodePinSms(etudiantId, pin, auteurId) {
  if (!/^\d{4}$/.test(pin)) {
    throw new AppError("Le code PIN doit contenir exactement 4 chiffres.", 422, "PIN_INVALIDE");
  }
  const hash = await bcrypt.hash(pin, env.bcryptSaltRounds);
  await query(`UPDATE etudiant SET code_pin_sms = $1 WHERE id = $2`, [hash, etudiantId]);
  await query(
    `INSERT INTO journal_modification (table_cible, ligne_id, action, nouvelle_valeur, auteur_id)
     VALUES ('etudiant', $1, 'modification', $2, $3)`,
    [etudiantId, JSON.stringify({ code_pin_sms: "défini" }), auteurId]
  );
}

module.exports = { creerEtudiant, listerEtudiantsParPromotion, definirCodePinSms, genererMotDePasseTemporaire };
