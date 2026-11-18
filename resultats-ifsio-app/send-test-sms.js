/**
 * Utilitaire de test du canal SMS (Africa's Talking).
 * Usage : node test-sms.js +229XXXXXXXX
 *
 * - Configuration complète (URL, clé API, username) : envoi réel via l'API.
 * - Configuration incomplète : message explicite (aucun SMS envoyé).
 */
// override: true — ce script teste la configuration LOCALE (.env) même si
// l'environnement du shell contient d'anciennes valeurs de variables SMS_*.
require("dotenv").config({ override: true });
const smsService = require("./src/modules/sms/sms.service");

async function main() {
  const numero = process.argv[2];
  if (!numero) {
    console.error("Usage : node test-sms.js +229XXXXXXXX");
    process.exit(1);
  }

  const apiUrl = process.env.SMS_PROVIDER_API_URL;
  const apiKey = process.env.SMS_PROVIDER_API_KEY;
  const username = process.env.SMS_PROVIDER_USERNAME;

  if (!apiUrl || !apiKey) {
    console.log("⚠️  SMS non configuré : aucun envoi (mode simulation).");
    console.log("   Renseignez SMS_PROVIDER_API_URL et SMS_PROVIDER_API_KEY dans .env puis relancez.");
    return;
  }
  if (!username) {
    console.log("⚠️  SMS_PROVIDER_USERNAME manquant : Africa's Talking exige le nom d'utilisateur du compte.");
    console.log("   Renseignez-le dans .env puis relancez ce test.");
    return;
  }

  console.log(`Envoi d'un SMS de test vers ${numero}…`);
  const reference = await smsService.envoyerSms(numero, "Test plateforme IFSIO — bonjour ! Ceci est un SMS de vérification.");
  console.log(`✅  SMS envoyé (référence : ${reference}).`);
}

main().catch((err) => {
  console.error("❌  Échec de l'envoi :", err.message);
  process.exit(1);
});
