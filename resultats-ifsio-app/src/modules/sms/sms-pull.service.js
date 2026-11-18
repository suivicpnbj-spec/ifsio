const bcrypt = require("bcrypt");
const { query } = require("../../db/pool");
const notesService = require("../notes/notes.service");
const smsService = require("./sms.service");

/**
 * Traite une requête SMS entrante de la forme : "MATRICULE PIN"
 * ex: "IFSIO24-014 1234"
 *
 * Ce handler est appelé par le webhook exposé à l'agrégateur SMS
 * (voir sms.routes.js — POST /api/sms/entrant).
 *
 * Répond toujours par un SMS, y compris en cas d'erreur (format, PIN invalide,
 * résultats non publiés) — jamais de requête silencieusement ignorée,
 * conformément à l'exigence d'un canal fiable pour les étudiants sans internet.
 */
async function traiterSmsEntrant(numeroExpediteur, contenuBrut) {
  const enregistrement = await query(
    `INSERT INTO sms_requete_entrante (numero_expediteur, contenu_brut) VALUES ($1, $2) RETURNING id`,
    [numeroExpediteur, contenuBrut]
  );
  const requeteId = enregistrement.rows[0].id;

  const reponse = await construireReponse(numeroExpediteur, contenuBrut);

  await query(
    `UPDATE sms_requete_entrante SET traitee = true, reponse_envoyee = $1 WHERE id = $2`,
    [reponse, requeteId]
  );

  await smsService.envoyerSms(numeroExpediteur, reponse);
  return reponse;
}

async function construireReponse(numeroExpediteur, contenuBrut) {
  const parties = contenuBrut.trim().split(/\s+/);
  if (parties.length < 2) {
    return "IFSIO : format attendu MATRICULE PIN (ex: IFSIO24-014 1234). Réessayez.";
  }
  const [matricule, pin] = parties;

  const { rows } = await query(
    `SELECT id, nom, prenoms, code_pin_sms, telephone FROM etudiant WHERE matricule = $1`,
    [matricule.toUpperCase()]
  );
  const etudiant = rows[0];

  if (!etudiant) {
    return "IFSIO : matricule inconnu. Vérifiez et réessayez.";
  }
  if (!etudiant.code_pin_sms) {
    return "IFSIO : code PIN non configuré pour ce compte. Contactez la scolarité.";
  }

  const pinValide = await bcrypt.compare(pin, etudiant.code_pin_sms);
  if (!pinValide) {
    return "IFSIO : code PIN incorrect.";
  }

  // Sécurité : on ne répond qu'au numéro enregistré pour cet étudiant, quand il est connu,
  // pour limiter les risques d'interception si le PIN a fuité.
  if (etudiant.telephone && smsService.normaliserNumero(etudiant.telephone) !== smsService.normaliserNumero(numeroExpediteur)) {
    return "IFSIO : ce numéro n'est pas celui enregistré pour ce compte. Contactez la scolarité.";
  }

  const { rows: semestreActif } = await query(
    `SELECT sa.id FROM semestre sa
     JOIN annee_academique aa ON aa.id = sa.annee_academique_id
     WHERE aa.active = true
     ORDER BY sa.numero DESC LIMIT 1`
  );

  if (!semestreActif[0]) {
    return "IFSIO : aucun semestre actif configuré. Contactez la scolarité.";
  }

  const resultats = await notesService.obtenirResultatsEtudiant(etudiant.id, semestreActif[0].id, {
    seulementPublies: true,
  });

  if (!resultats.publie) {
    return `IFSIO — ${etudiant.nom} ${etudiant.prenoms}. Résultats non encore publiés pour ce semestre.`;
  }

  const decisionLisible = { admis: "Admis(e)", ajourne: "Ajourné(e)", rattrapage: "Rattrapage" }[resultats.resultat.decision] || "—";
  return `IFSIO — ${etudiant.nom} ${etudiant.prenoms}. Moyenne : ${resultats.resultat.moyenne_generale}/20. Décision : ${decisionLisible}.`;
}

module.exports = { traiterSmsEntrant };
