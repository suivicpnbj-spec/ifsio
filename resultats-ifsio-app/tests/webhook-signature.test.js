const test = require("node:test");
const assert = require("node:assert/strict");
const { calculerSignature, verifierSignature } = require("../src/modules/sms/webhook-signature");

const SECRET = "mon-secret-partage";
const CORPS = '{"from":"+22997000014","text":"IFSIO24-014 1234"}';

test("verifierSignature : accepte une signature valide", () => {
  const signature = calculerSignature(CORPS, SECRET);
  assert.equal(verifierSignature(signature, CORPS, SECRET), true);
});

test("verifierSignature : accepte le préfixe sha256= du fournisseur", () => {
  const signature = `sha256=${calculerSignature(CORPS, SECRET)}`;
  assert.equal(verifierSignature(signature, CORPS, SECRET), true);
});

test("verifierSignature : rejette un corps modifié", () => {
  const signature = calculerSignature(CORPS, SECRET);
  assert.equal(verifierSignature(signature, CORPS + "x", SECRET), false);
});

test("verifierSignature : rejette un mauvais secret", () => {
  const signature = calculerSignature(CORPS, SECRET);
  assert.equal(verifierSignature(signature, CORPS, "autre-secret"), false);
});

test("verifierSignature : rejette une signature au format invalide", () => {
  assert.equal(verifierSignature("pas-une-signature", CORPS, SECRET), false);
});

test("verifierSignature : rejette sans signature ou sans secret", () => {
  assert.equal(verifierSignature("", CORPS, SECRET), false);
  const signature = calculerSignature(CORPS, SECRET);
  assert.equal(verifierSignature(signature, CORPS, ""), false);
});
