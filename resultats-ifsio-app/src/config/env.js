const fs = require("fs");
const fichierEnv = process.env.DOTENV_CONFIG_PATH || (fs.existsSync(".env.local") ? ".env.local" : ".env");
require("dotenv").config({ path: fichierEnv });

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Variable d'environnement manquante : ${name}`);
  }
  return value;
}

module.exports = {
  port: parseInt(process.env.PORT || "3000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: required("DATABASE_URL"),
  // PostgreSQL managé (Render, Neon, Supabase…) : les connexions externes exigent SSL.
  // Mettre DATABASE_SSL=true en production ; false (défaut) en local.
  databaseSsl: process.env.DATABASE_SSL === "true",
  jwt: {
    secret: required("JWT_SECRET"),
    expiresIn: process.env.JWT_EXPIRES_IN || "8h",
  },
  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || "12", 10),
  sms: {
    apiUrl: process.env.SMS_PROVIDER_API_URL || "",
    apiKey: process.env.SMS_PROVIDER_API_KEY || "",
    // Nom d'utilisateur du compte agrégateur (obligatoire chez Africa's Talking)
    username: process.env.SMS_PROVIDER_USERNAME || "",
    // SenderID alphanumérique ; vide = code court par défaut du compte
    senderId: process.env.SMS_SENDER_ID || "",
    // Secret partagé pour authentifier le webhook SMS entrant (signature HMAC-SHA256).
    // Obligatoire en production : sans lui, les requêtes entrantes sont rejetées.
    webhookSecret: process.env.SMS_WEBHOOK_SECRET || "",
  },
  email: {
    // Laissez SMTP_HOST vide en développement : le canal email fonctionne en mode simulation.
    smtpHost: process.env.SMTP_HOST || "",
    smtpPort: parseInt(process.env.SMTP_PORT || "587", 10),
    smtpSecure: process.env.SMTP_SECURE === "true",
    smtpUser: process.env.SMTP_USER || "",
    smtpPass: process.env.SMTP_PASS || "",
    from: process.env.EMAIL_FROM || "IFSIO <no-reply@ifsio.up.bj>",
  },
  corsOrigin: process.env.CORS_ORIGIN || "*",
  // Secret partagé pour la communication sécurisée inter-services (eRésultats <-> Mes Actes)
  campusInternalSecret: process.env.CAMPUS_INTERNAL_SECRET || "ifsio-campus-secret-key-parakou-2026",
  // Entrée imposée par le service de déploiement : "etudiant" | "scolarite" | "" (libre).
  // Permet de déployer un service dédié par espace (eresultat-etudiant / eresultat-ifsioscol).
  entreeDefaut: process.env.ENTREE_DEFAUT || "",
};
