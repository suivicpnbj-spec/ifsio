const env = require("../../config/env");
const { AppError } = require("../../middleware/errorHandler");

/**
 * Abstraction sur l'agrégateur SMS — Africa's Talking (le fournisseur retenu).
 *
 * API : POST https://api.africastalking.com/version1/messaging
 *   Headers : apiKey: <clé API>, Content-Type: application/x-www-form-urlencoded, Accept: application/json
 *   Body    : username (obligatoire), to (+229XXXXXXXX), message, from (SenderID, optionnel)
 *   Réponse : { SMSMessageData: { Message, Recipients: [{ messageId, number, statusCode, status, cost }] } }
 *
 * Cette fonction isole tout le reste de l'application du fournisseur concret :
 * changer d'agrégateur ne touche que ce fichier (et les variables .env).
 *
 * Sans configuration complète (apiUrl, apiKey, username), les envois sont journalisés
 * en console (mode simulation) pour ne jamais bloquer le développement local.
 */
async function envoyerSms(numeroDestinataire, message) {
  if (!env.sms.apiUrl || !env.sms.apiKey || !env.sms.username) {
    if (env.nodeEnv === "production") {
      throw new AppError("Envoi SMS indisponible : le fournisseur n'est pas configuré.", 503, "SMS_NON_CONFIGURE");
    }
    if (env.sms.apiUrl && env.sms.apiKey && !env.sms.username) {
      console.warn("[sms] SMS_PROVIDER_USERNAME manquant — envoi en mode simulation.");
    }
    console.log(`[sms:simulation] à ${numeroDestinataire} : ${message}`);
    return `simulation-${Date.now()}`;
  }

  if (env.nodeEnv === "production" && env.sms.apiUrl.includes("sandbox")) {
    throw new AppError("Envoi SMS refusé : l'API configurée est un bac à sable.", 503, "SMS_SANDBOX_INTERDIT");
  }

  const corps = new URLSearchParams();
  corps.append("username", env.sms.username);
  corps.append("to", normaliserNumero(numeroDestinataire));
  corps.append("message", message);
  if (env.sms.senderId) corps.append("from", env.sms.senderId);

  const reponse = await fetch(env.sms.apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      apiKey: env.sms.apiKey,
    },
    body: corps.toString(),
    signal: AbortSignal.timeout(15000),
  });

  if (!reponse.ok) {
    const detail = await reponse.text().catch(() => "");
    throw new AppError(`Échec de l'envoi SMS (statut ${reponse.status}). ${detail}`, 502, "SMS_ECHEC");
  }

  const data = await reponse.json();
  const messageAT = data?.SMSMessageData?.Message || "";
  const destinataires = data?.SMSMessageData?.Recipients || [];
  const premier = destinataires[0];

  // Africa's Talking renvoie parfois HTTP 200 avec une erreur uniquement dans
  // SMSMessageData.Message (ex: "Username does not exist", "Insufficient Balance")
  // et sans tableau Recipients → il faut traiter ce cas comme un échec.
  if (destinataires.length === 0) {
    throw new AppError(
      `Échec de l'envoi SMS : ${messageAT || "aucun destinataire retourné par l'API"}.`,
      502,
      "SMS_ECHEC"
    );
  }

  // statut 101 = succès côté Africa's Talking ; tout autre code = rejet côté opérateur
  // (statusCode peut arriver en nombre ou en chaîne selon l'API)
  if (premier && Number(premier.statusCode) !== 101) {
    throw new AppError(
      `Échec de l'envoi SMS : ${premier.status || "inconnu"} (code ${premier.statusCode}).`,
      502,
      "SMS_ECHEC"
    );
  }

  return premier?.messageId || `sans-reference-${Date.now()}`;
}

/** Normalise un numéro béninois vers le format E.164 (+229XXXXXXXXXX) */
function normaliserNumero(numero) {
  const chiffres = numero.replace(/\D/g, "");
  if (chiffres.startsWith("229")) return `+${chiffres}`;
  if (chiffres.length === 8 || chiffres.length === 10) return `+229${chiffres.slice(-8)}`;
  return `+${chiffres}`;
}

module.exports = { envoyerSms, normaliserNumero };
