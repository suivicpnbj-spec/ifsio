const test = require("node:test");
const assert = require("node:assert/strict");
const { analyserCSV, normaliserNombre, detecterDelimiteur } = require("../src/modules/notes/import.service");

/* Échantillon : en-tête aplati (codes répétés sur les sous-colonnes), « ; » et décimales à virgule. */
const BULLETIN = [
  "N°;Matricule;NOM PRENOMS;APG1101;APG1101;APG1101;APG1101;Moy;APO1102;APO1102;APO1102;APO1102;Moy;DECISION DU JURY",
  ";;;CC;EF;EC;coef;;CC;EF;EC;coef;;",
  "1;17739824;ABDOULAYE Azizou;16,00;16,00;16,00;0;8,00;10,80;10,80;10,80;4;13,90;ADMIS",
  "2;20670423;LABIODOU Djéré Ichè Bonaventure;19,30;19,30;19,30;0;9,65;14,60;14,60;14,60;4;15,80;ADMIS",
].join("\n");

test("normaliserNombre : décimale à virgule et à point", () => {
  assert.equal(normaliserNombre("14,5"), 14.5);
  assert.equal(normaliserNombre("14.5"), 14.5);
  assert.equal(normaliserNombre(" 12 "), 12);
  assert.equal(normaliserNombre("0,00"), 0);
  assert.equal(normaliserNombre(""), null);
  assert.equal(normaliserNombre("abc"), null);
  assert.equal(normaliserNombre(null), null);
  assert.equal(normaliserNombre(undefined), null);
});

test("detecterDelimiteur : « ; » prioritaire malgré les virgules décimales des données", () => {
  assert.equal(detecterDelimiteur(BULLETIN), ";");
  assert.equal(detecterDelimiteur("Matricule,NOM,APG1101\n17739824,X,16,00\n"), ",");
  assert.equal(detecterDelimiteur("Matricule\tNOM\tAPG1101\n"), "\t");
});

test("analyserCSV : blocs de matières, colonne Moy, matricule et nom (en-tête aplati)", () => {
  const r = analyserCSV(BULLETIN);
  assert.equal(r.delimiteur, ";");
  assert.deepEqual(r.matieres.map((m) => m.code), ["APG1101", "APO1102"]);
  assert.equal(r.matieres[0].debut, 3);
  assert.equal(r.matieres[0].indexMoy, 7); // colonne « Moy » du bloc APG1101
  assert.equal(r.matieres[1].indexMoy, 12);
  assert.equal(r.colonneMatricule, 1);
  assert.equal(r.colonneNom, 2);
  assert.equal(r.lignesDonnees.length, 2);

  const [l1, l2] = r.lignesDonnees;
  assert.equal(l1.matricule, "17739824");
  assert.equal(l1.nom, "ABDOULAYE Azizou");
  assert.equal(l1.notesParCode["APG1101"], 8); // valeur de la colonne Moy
  assert.equal(l1.notesParCode["APO1102"], 13.9);
  assert.equal(l2.notesParCode["APG1101"], 9.65);
  assert.equal(l2.notesParCode["APO1102"], 15.8);
});

test("analyserCSV : code unique par matière avec sous-en-têtes sous la ligne des codes", () => {
  const csv = [
    "N°;Matricule;NOM PRENOMS;APG1101;;;;APO1102;;;;",
    ";;;CC;EF;EC;Moy;CC;EF;EC;Moy",
    "1;17739824;ABDOULAYE Azizou;16;16;16;8;10,80;10,80;10,80;13,90",
  ].join("\n");
  const r = analyserCSV(csv);
  assert.deepEqual(r.matieres.map((m) => m.code), ["APG1101", "APO1102"]);
  assert.equal(r.matieres[0].indexMoy, 6);
  assert.equal(r.matieres[1].indexMoy, 10);
  assert.equal(r.lignesDonnees[0].notesParCode["APG1101"], 8);
  assert.equal(r.lignesDonnees[0].notesParCode["APO1102"], 13.9);
});

test("analyserCSV : sans colonne Moy → moyenne des valeurs du bloc", () => {
  const csv = ["Matricule;NOM;APG1101;APO1102", "17739824;ABDOULAYE Azizou;16;10,80"].join("\n");
  const r = analyserCSV(csv);
  assert.equal(r.colonneMatricule, 0);
  assert.equal(r.lignesDonnees[0].notesParCode["APG1101"], 16);
  assert.equal(r.lignesDonnees[0].notesParCode["APO1102"], 10.8);
});

test("analyserCSV : case vide → note absente (null)", () => {
  const csv = ["Matricule;NOM;APG1101;APO1102", "17739824;ABDOULAYE Azizou;;10,80"].join("\n");
  const r = analyserCSV(csv);
  assert.equal(r.lignesDonnees[0].notesParCode["APG1101"], null);
  assert.equal(r.lignesDonnees[0].notesParCode["APO1102"], 10.8);
});

test("analyserCSV : format non bulletin → erreur FORMAT_INVALIDE", () => {
  const csv = ["matricule;nom;note", "17739824;ABDOULAYE Azizou;12"].join("\n");
  assert.throws(() => analyserCSV(csv), (err) => err.code === "FORMAT_INVALIDE");
});
