const app = require("./app");
const env = require("./config/env");
const { pool } = require("./db/pool");

// Diagnostics de configuration au démarrage — en production, un oubli ici
// se traduit par un comportement silencieux (notifications simulées, webhook désactivé).
if (env.nodeEnv === "production") {
  if (env.sms.apiUrl.includes("sandbox")) {
    console.warn("[prod] ⚠️ SMS_PROVIDER_API_URL pointe encore vers le bac à sable (api.sandbox.africastalking.com).");
  }
  if (!env.sms.webhookSecret) {
    console.warn("[prod] ⚠️ SMS_WEBHOOK_SECRET absent — le webhook SMS entrant rejettera toutes les requêtes (503).");
  }
  if (!env.email.smtpHost) {
    console.warn("[prod] ⚠️ SMTP non configuré — les emails de notification partent en mode simulation.");
  }
  if (!env.jwt.secret || env.jwt.secret.length < 32) {
    console.warn("[prod] ⚠️ JWT_SECRET trop court (< 32 caractères) — générez une valeur aléatoire longue.");
  }
}

const server = app.listen(env.port, () => {
  console.log(`[serveur] API Résultats IFSIO démarrée sur le port ${env.port} (${env.nodeEnv})`);
});

async function arreterProprement(signal) {
  console.log(`[serveur] signal ${signal} reçu, arrêt en cours...`);
  server.close(async () => {
    await pool.end();
    console.log("[serveur] arrêt terminé.");
    process.exit(0);
  });
}

process.on("SIGTERM", () => arreterProprement("SIGTERM"));
process.on("SIGINT", () => arreterProprement("SIGINT"));
