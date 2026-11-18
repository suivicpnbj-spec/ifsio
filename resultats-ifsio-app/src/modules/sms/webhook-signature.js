const crypto = require("crypto");

/**
 * Authentification du webhook SMS entrant.
 *
 * L'agrégateur SMS signe chaque requête avec un secret partagé :
 *   signature = HMAC-SHA256(body, secret) encodée en hexadécimal,
 *   transmise dans l'en-tête `X-IFSIO-Signature`.
 *
 * Toute la logique est isolée ici (aucune dépendance) pour être testable unitairement.
 */

function calculerSignature(corps, secret) {
  return crypto.createHmac("sha256", secret).update(corps).digest("hex");
}

/**
 * Compare deux signatures en temps constant pour prévenir les attaques temporelles.
 * Accepte les préfixes éventuels du fournisseur (ex: "sha256=abc...").
 */
function verifierSignature(signatureRecue, corps, secret) {
  if (!signatureRecue || !secret) return false;
  const recue = String(signatureRecue).replace(/^sha256=/, "").trim();
  if (!/^[a-f0-9]{64}$/i.test(recue)) return false;

  const attendue = calculerSignature(corps, secret);
  const a = Buffer.from(recue, "utf8");
  const b = Buffer.from(attendue, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

module.exports = { calculerSignature, verifierSignature };
