const express = require("express");
const env = require("../../config/env");
const { AppError } = require("../../middleware/errorHandler");
const smsPullService = require("./sms-pull.service");
const { verifierSignature } = require("./webhook-signature");

const router = express.Router();

/**
 * POST /api/sms/entrant
 * Webhook appelé par l'agrégateur SMS à chaque message reçu sur le numéro dédié.
 *
 * Authentification : chaque requête doit porter l'en-tête `X-IFSIO-Signature`
 * contenant HMAC-SHA256(body, SMS_WEBHOOK_SECRET). En production le secret est
 * obligatoire : toute requête non signée est rejetée avec un 401.
 *
 * Le format exact du payload dépend du fournisseur retenu — ce endpoint suppose
 * un payload générique { from, text } ; adapter le mapping selon la doc du fournisseur.
 */
router.post("/entrant", (req, res, next) => {
  const secret = env.sms.webhookSecret;
  const signature = req.headers["x-ifsio-signature"] || req.headers["x-webhook-signature"] || "";

  if (!secret) {
    // Secret absent : config incomplète. Toléré en développement (avertissement),
    // strictement refusé en production.
    if (env.nodeEnv === "production") {
      return next(new AppError("Webhook SMS non configuré (secret manquant).", 503, "CONFIG_INCOMPLETE"));
    }
    console.warn("[sms][webhook] SMS_WEBHOOK_SECRET absent — requête entrante acceptée en mode développement sans vérification de signature.");
  } else if (!verifierSignature(signature, req.rawBody || Buffer.from(JSON.stringify(req.body)), secret)) {
    return next(new AppError("Signature du webhook invalide.", 401, "SIGNATURE_INVALIDE"));
  }

  next();
}, async (req, res, next) => {
  try {
    // Mapping tolérant du payload : Africa's Talking envoie { phoneNumber, text },
    // d'autres agrégateurs { from, text } ou { msisdn, message }.
    const numero = req.body.from || req.body.phoneNumber || req.body.msisdn;
    const contenu = req.body.text || req.body.message;
    if (!numero || !contenu) {
      throw new AppError(
        "Payload SMS entrant invalide (champs 'from'/'phoneNumber' et 'text' requis).",
        422,
        "PAYLOAD_INVALIDE"
      );
    }
    const reponse = await smsPullService.traiterSmsEntrant(numero, contenu);
    res.json({ traite: true, reponse });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
