/**
 * Utilitaire de test du canal email.
 * Usage : node test-email.js destinataire@exemple.com
 *
 * - Si SMTP_HOST est vide : l'envoi se fait en mode simulation (journalisé en console).
 * - Sinon : envoi réel via le SMTP configuré dans .env (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM).
 */
// override: true — ce script teste la configuration LOCALE (.env) même si
// l'environnement du shell contient d'anciennes valeurs de variables SMTP_*.
require("dotenv").config({ override: true });
const emailService = require("./src/modules/email/email.service");

async function main() {
  const destinataire = process.argv[2];
  if (!destinataire) {
    console.error("Usage : node test-email.js destinataire@exemple.com");
    process.exit(1);
  }

  if (!process.env.SMTP_HOST) {
    console.log("⚠️  SMTP non configuré : envoi en mode SIMULATION (aucun email réel n'a été envoyé).");
    console.log("   Renseignez SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS / EMAIL_FROM dans .env puis relancez.");
    return;
  }
  if (!process.env.SMTP_PASS) {
    console.log("⚠️  SMTP renseigné mais SMTP_PASS est vide : la clé API (ou mot de passe) est manquante.");
    console.log("   Renseignez SMTP_PASS dans .env puis relancez ce test.");
    return;
  }

  const sujet = "Test — Plateforme de résultats IFSIO";
  const texte =
    `Bonjour,\n\n` +
    `Ceci est un email de test envoyé par la plateforme de résultats IFSIO ` +
    `(Université de Parakou). Si vous recevez ce message, le canal email est opérationnel.\n\n` +
    `— Plateforme IFSIO`;

  console.log(`Envoi vers ${destinataire}…`);
  const reference = await emailService.envoyerEmail(destinataire, sujet, texte);

  if (reference === "simulation") {
    console.log("⚠️  SMTP non configuré : envoi en mode SIMULATION (aucun email réel n'a été envoyé).");
    console.log("   Renseignez SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS / EMAIL_FROM dans .env puis relancez.");
  } else {
    console.log(`✅  Email réel envoyé (référence : ${reference}).`);
  }
}

main().catch((err) => {
  console.error("❌  Échec de l'envoi :", err.message);
  process.exit(1);
});
