const nodemailer = require("nodemailer");
const env = require("../../config/env");
const { AppError } = require("../../middleware/errorHandler");

/**
 * Canal email de la plateforme.
 *
 * Fonctionne avec n'importe quel fournisseur SMTP (SMTP institutionnel,
 * Gmail/Workspace, Resend — smtp.resend.com, etc.) configuré dans .env.
 * Sans SMTP configuré (développement), les envois sont journalisés en console :
 * le mode simulation ne bloque jamais le développement local.
 */

let transporteur = null;
let enModeSimulation = false;

function obtenirTransporteur() {
  if (transporteur) return transporteur;

  if (!env.email.smtpHost) {
    enModeSimulation = true;
    return null;
  }

  transporteur = nodemailer.createTransport({
    host: env.email.smtpHost,
    port: env.email.smtpPort,
    secure: env.email.smtpSecure, // true pour le port 465
    auth: env.email.smtpUser
      ? { user: env.email.smtpUser, pass: env.email.smtpPass }
      : undefined,
  });
  return transporteur;
}

/**
 * Envoie un email. En mode simulation, journalise et renvoie "simulation".
 * Retourne le messageId renvoyé par le SMTP en mode réel.
 */
async function envoyerEmail(destinataire, sujet, texte) {
  const transport = obtenirTransporteur();

  if (enModeSimulation) {
    if (env.nodeEnv === "production") {
      throw new AppError("Envoi email indisponible : SMTP n'est pas configuré.", 503, "EMAIL_NON_CONFIGURE");
    }
    console.log(`[email][simulation] À: ${destinataire} | Sujet: ${sujet}\n${texte}`);
    return "simulation";
  }

  const info = await transport.sendMail({
    from: env.email.from,
    to: destinataire,
    subject: sujet,
    text: texte,
  });
  return info.messageId;
}

module.exports = { envoyerEmail };
