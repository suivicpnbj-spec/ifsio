const test = require("node:test");
const assert = require("node:assert/strict");
const { calculerMoyennePonderee, determinerDecision } = require("../src/modules/notes/calculs");

test("calculerMoyennePonderee : moyenne pondérée par les coefficients", () => {
  // (10*3 + 14*1) / 4 = 11
  const moy = calculerMoyennePonderee([
    { valeur: 10, coefficient: 3 },
    { valeur: 14, coefficient: 1 },
  ]);
  assert.equal(moy, 11);
});

test("calculerMoyennePonderee : arrondi à deux décimales", () => {
  const moy = calculerMoyennePonderee([
    { valeur: 13.33, coefficient: 3 },
    { valeur: 12, coefficient: 1 },
  ]);
  assert.equal(moy, 13);
});

test("calculerMoyennePonderee : null sans aucune note exploitable", () => {
  assert.equal(calculerMoyennePonderee([]), null);
  assert.equal(calculerMoyennePonderee([{ valeur: 10, coefficient: 0 }]), null);
});

test("calculerMoyennePonderee : ignore les notes invalides", () => {
  const moy = calculerMoyennePonderee([
    { valeur: "abc", coefficient: 2 },
    { valeur: 12, coefficient: 2 },
  ]);
  assert.equal(moy, 12);
});

test("determinerDecision : admis à partir de 12", () => {
  assert.equal(determinerDecision(12), "admis");
  assert.equal(determinerDecision(15.5), "admis");
  assert.equal(determinerDecision(20), "admis");
});

test("determinerDecision : rattrapage entre 10 (inclus) et 12 (exclu)", () => {
  assert.equal(determinerDecision(10), "rattrapage");
  assert.equal(determinerDecision(11.99), "rattrapage");
});

test("determinerDecision : ajourné en dessous de 10", () => {
  assert.equal(determinerDecision(9.99), "ajourne");
  assert.equal(determinerDecision(0), "ajourne");
});

test("determinerDecision : null si aucune moyenne", () => {
  assert.equal(determinerDecision(null), null);
  assert.equal(determinerDecision(undefined), null);
});
