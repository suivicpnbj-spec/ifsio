const { query } = require("../../db/pool");
const smsService = require("../sms/sms.service");
const emailService = require("../email/email.service");

/**
 * Envoie une notification à chaque étudiant dont les résultats viennent d'être publiés,
 * sur tous les canaux disponibles :
 *   - SMS   si un numéro de téléphone est enregistré
 *   - email si une adresse email est enregistrée
 *
 * Chaque envoi est journalisé dans la table `notification` (canal, contenu, statut).
 * Un échec sur un canal ne fait jamais échouer les autres.
 */
async function notifierPublication(etudiantIds, semestreId) {
  if (!etudiantIds || etudiantIds.length === 0) return;

  const { rows: etudiants } = await query(
    `SELECT id, nom, prenoms, telephone, email FROM etudiant WHERE id = ANY($1::uuid[])`,
    [etudiantIds]
  );

  const { rows: semestreRows } = await query(
    `SELECT sa.numero, aa.libelle AS annee
     FROM semestre sa JOIN annee_academique aa ON aa.id = sa.annee_academique_id
     WHERE sa.id = $1`,
    [semestreId]
  );
  const semestreLibelle = semestreRows[0]
    ? `Semestre ${semestreRows[0].numero} (${semestreRows[0].annee})`
    : "votre semestre";

  for (const e of etudiants) {
    const contenu = `IFSIO — Vos résultats du ${semestreLibelle} sont disponibles. Connectez-vous sur le portail pour les consulter.`;

    // Canal SMS
    if (e.telephone) {
      await envoyerSurCanal({
        etudiantId: e.id,
        canal: "sms",
        contenu,
        envoyeur: () => smsService.envoyerSms(e.telephone, contenu),
      });
    }

    // Canal email
    if (e.email) {
      await envoyerSurCanal({
        etudiantId: e.id,
        canal: "email",
        contenu,
        envoyeur: () => emailService.envoyerEmail(e.email, "Vos résultats sont disponibles", contenu),
      });
    }

    // Aucun canal disponible : laisser une trace d'échec (traçabilité des notifications)
    if (!e.telephone && !e.email) {
      await query(
        `INSERT INTO notification (etudiant_id, canal, contenu, statut_envoi)
         VALUES ($1, 'sms', $2, 'echec')`,
        [e.id, contenu]
      );
    }
  }
}

/** Journalise puis envoie sur un canal ; passe le statut à 'echec' en cas d'erreur. */
async function envoyerSurCanal({ etudiantId, canal, contenu, envoyeur }) {
  const { rows: notifRows } = await query(
    `INSERT INTO notification (etudiant_id, canal, contenu, statut_envoi)
     VALUES ($1, $2, $3, 'en_attente') RETURNING id`,
    [etudiantId, canal, contenu]
  );
  const notificationId = notifRows[0].id;

  try {
    const reference = await envoyeur();
    await query(
      `UPDATE notification SET statut_envoi = 'envoye', reference_externe = $1 WHERE id = $2`,
      [String(reference), notificationId]
    );
  } catch (err) {
    console.error(`[notifications] échec ${canal} pour l'étudiant ${etudiantId}`, err.message);
    await query(`UPDATE notification SET statut_envoi = 'echec' WHERE id = $1`, [notificationId]);
  }
}

module.exports = { notifierPublication };
