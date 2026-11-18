const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const fs = require("fs");
const path = require("path");

const env = require("./config/env");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

const authRoutes = require("./modules/auth/auth.routes");
const etudiantsRoutes = require("./modules/etudiants/etudiants.routes");
const notesRoutes = require("./modules/notes/notes.routes");
const importRoutes = require("./modules/notes/import.routes");
const referentielRoutes = require("./modules/scolarite/referentiel.routes");
const resultatsRoutes = require("./modules/resultats/resultats.routes");
const smsRoutes = require("./modules/sms/sms.routes");
const interneRoutes = require("./modules/interne/interne.routes");

const app = express();

// En production, l'application est derrière le proxy du PaaS (Render/Railway/Fly) :
// nécessaire pour que la limitation de débit et les logs voient la vraie IP client.
app.set("trust proxy", env.nodeEnv === "production" ? 1 : false);

app.use(helmet());
app.use(cors({ origin: env.corsOrigin }));
// `verify` conserve le corps brut (req.rawBody) pour la vérification HMAC du webhook SMS entrant
app.use(express.json({ limit: "1mb", verify: (req, _res, buf) => { req.rawBody = buf; } }));
app.use(morgan(env.nodeEnv === "development" ? "dev" : "combined"));

// Limite le débit sur l'authentification pour freiner les attaques par force brute
const limiteurAuth = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });
const limiteurConsultation = rateLimit({ windowMs: 15 * 60 * 1000, max: 12, standardHeaders: true, legacyHeaders: false });

app.get("/api/sante", (req, res) => res.json({ statut: "ok", environnement: env.nodeEnv }));

// Configuration publique du service : ENTREE_DEFAUT impose l'entrée (étudiant/scolarité)
// au frontend. Sert aussi de point de contrôle de bon fonctionnement en production.
app.get("/api/config", (req, res) => res.json({ entree: env.entreeDefaut }));

app.use("/api/auth", limiteurAuth, authRoutes);
app.use("/api/notes/consultation", limiteurConsultation);
app.use("/api/resultats/releve-public", limiteurConsultation);
app.use("/api/resultats/releve-annuel-public", limiteurConsultation);
app.use("/api/etudiants", etudiantsRoutes);
app.use("/api/notes/import", importRoutes);
app.use("/api/notes", notesRoutes);
app.use("/api/referentiel", referentielRoutes);
app.use("/api/resultats", resultatsRoutes);
app.use("/api/sms", smsRoutes);
app.use("/api/interne", interneRoutes);

// En production, le backend sert aussi le frontend compilé (frontend/dist) :
// un seul service à déployer — le même port répond pour l'API ET l'application.
// (En développement, le serveur Vite sur :5173 fait office de frontend.)
const frontendDist = path.join(__dirname, "..", "frontend", "dist");
const frontendPret = env.nodeEnv === "production" && fs.existsSync(path.join(frontendDist, "index.html"));
if (frontendPret) {
  app.use(express.static(frontendDist));
  // Fallback SPA : toute requête GET hors /api renvoie index.html (le routage React prend le relais).
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api")) return next();
    res.sendFile(path.join(frontendDist, "index.html"));
  });
} else if (env.nodeEnv === "production") {
  console.warn("[prod] ⚠️ frontend/dist/index.html absent — le frontend ne sera pas servi (API seule). Lancez d'abord : npm run build:frontend");
}

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
