const ExcelJS = require("exceljs");
const JSZip = require("jszip");
const { SaxesParser } = require("saxes");
const { query } = require("../../db/pool");
const { AppError } = require("../../middleware/errorHandler");

/* =====================================================================
   Parsing CSV « format bulletin » (fonctions pures, testables sans base)
   Le CSV reprend la présentation des bulletins ESIIE/ESSFE :
   en-têtes avec les codes de matières (APG1101…), chaque matière occupant
   un bloc de colonnes (sous-colonnes CC/EF/EC…, puis « Moy », puis coef),
   et une ligne par étudiant : N° | Matricule | NOM PRENOMS | notes…
   ===================================================================== */

const RE_CODE_MATIERE = /^[A-Z]{2,4}\d{4}$/; // ex : APG1101, SPS1207, PNB1201

/** Normalise « 14,5 » ou « 14.5 » ou « 0,00 » en nombre (ou null). */
function normaliserNombre(texte) {
  if (texte === undefined || texte === null) return null;
  let s = String(texte).trim().replace(/\s+/g, "");
  if (!s) return null;
  if (!/^[+-]?(?:\d+(?:[.,]\d+)?|[.,]\d+)$/.test(s)) return null;
  return Number(s.replace(",", ".")); // décimale à virgule (Excel FR)
}

/** Détecte le séparateur de colonnes sur la PREMIÈRE ligne (les en-têtes ne
    contiennent pas de virgules décimales, contrairement aux lignes de notes).
    « ; » (CSV français) prioritaire en cas d'égalité. */
function detecterDelimiteur(contenu) {
  const premiere = contenu.split(/\r?\n/).find((l) => l.trim() !== "") || "";
  const scores = { ";": 0, ",": 0, "\t": 0 };
  for (const d of Object.keys(scores)) {
    scores[d] = d === "\t" ? (premiere.match(/\t/g) || []).length : (premiere.match(new RegExp("\\" + d, "g")) || []).length;
  }
  const meilleur = Object.entries(scores).sort((a, b) => b[1] - a[1] || (a[0] === ";" ? -1 : 1))[0];
  return meilleur[1] > 0 ? meilleur[0] : ";";
}

function decouperCellules(ligne, delim) {
  return delim === "\t" ? ligne.split("\t") : ligne.split(delim);
}

function estCodeMatiere(cellule) {
  return RE_CODE_MATIERE.test(String(cellule ?? "").trim().toUpperCase());
}

/**
 * Analyse un CSV « format bulletin » et retourne sa structure brute :
 * { delimiteur, matieres: [{code, debut, fin, indexMoy}], colonneMatricule,
 *   colonneNom, lignesDonnees: [{numeroLigne, matricule, nom, notesParCode}] }
 * Les valeurs de notes sont déjà normalisées en nombres (null si case vide).
 */
function analyserCSV(contenu) {
  const delimiteur = detecterDelimiteur(contenu);
  const lignes = contenu
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((l) => decouperCellules(l, delimiteur));
  while (lignes.length && lignes[lignes.length - 1].every((c) => !String(c ?? "").trim())) lignes.pop();
  if (lignes.length === 0) throw new AppError("Le fichier CSV est vide.", 422, "FICHIER_INVALIDE");

  // Ligne de référence : la première qui porte des codes de matières.
  let ligneCodes = -1;
  for (let i = 0; i < lignes.length && ligneCodes === -1; i++) {
    if (lignes[i].filter(estCodeMatiere).length >= 1) ligneCodes = i;
  }
  if (ligneCodes === -1) {
    throw new AppError(
      "Aucun code de matière (ex. APG1101) dans l'en-tête : le format « bulletin » est attendu.",
      422,
      "FORMAT_INVALIDE"
    );
  }

  // Blocs de colonnes par matière : un code démarre un bloc ; les codes répétés
  // (même matière sur plusieurs sous-colonnes) fusionnent avec le bloc en cours.
  const ref = lignes[ligneCodes];
  const matieres = [];
  let enCours = null;
  for (let c = 0; c < ref.length; c++) {
    const brut = String(ref[c] ?? "").trim().toUpperCase();
    if (estCodeMatiere(brut)) {
      if (enCours && enCours.code === brut) {
        enCours.fin = c; // en-tête aplati : même code répété sur les sous-colonnes
      } else {
        enCours = { code: brut, debut: c, fin: c, indexMoy: null, indexCoef: null };
        matieres.push(enCours);
      }
    } else if (enCours) {
      enCours.fin = c;
    }
  }
  if (matieres.length === 0) {
    throw new AppError("Aucune matière reconnue dans l'en-tête.", 422, "FORMAT_INVALIDE");
  }

  const c0 = matieres[0].debut;

  // Première ligne de données : la première ligne après l'en-tête qui porte un
  // matricule long (≥ 6 chiffres) dans les colonnes précédant les codes.
  let ligneDonneesDebut = -1;
  for (let i = ligneCodes + 1; i < lignes.length && ligneDonneesDebut === -1; i++) {
    for (let c = 0; c < c0; c++) {
      const v = normaliserNombre(lignes[i]?.[c]);
      if (v !== null && v >= 100000) { ligneDonneesDebut = i; break; }
    }
  }
  if (ligneDonneesDebut === -1) {
    throw new AppError("Aucune ligne d'étudiant détectée (matricule introuvable).", 422, "FICHIER_INVALIDE");
  }

  // Colonnes « Moyenne » et « coefficient » par matière : recherche dans les
  // cellules d'en-tête (lignes 0 → ligneDonneesDebut-1) sur l'étendue du bloc.
  matieres.forEach((m) => {
    for (let i = 0; i < ligneDonneesDebut && (m.indexMoy === null || m.indexCoef === null); i++) {
      for (let c = m.debut; c <= m.fin; c++) {
        const h = String(lignes[i]?.[c] ?? "").toLowerCase();
        if (m.indexMoy === null && h.includes("moy")) m.indexMoy = c;
        if (m.indexCoef === null && (h.includes("coef") || h.includes("coeff"))) m.indexCoef = c;
      }
    }
  });

  // Colonne matricule : la colonne (avant les codes) la plus riche en grands
  // nombres (≥ 100000, ex. 17739824) ; la colonne suivante porte le nom.
  let colonneMatricule = Math.max(1, c0 - 2);
  let meilleur = 0;
  for (let c = 0; c < c0; c++) {
    let n = 0;
    for (let i = ligneDonneesDebut; i < lignes.length; i++) {
      const v = normaliserNombre(lignes[i]?.[c]);
      if (v !== null && v >= 100000) n += 1;
    }
    if (n > meilleur) { meilleur = n; colonneMatricule = c; }
  }
  const colonneNom = Math.max(colonneMatricule + 1, c0 - 1);

  // Lignes de données
  const lignesDonnees = [];
  for (let i = ligneDonneesDebut; i < lignes.length; i++) {
    const cells = lignes[i];
    const matricule = String(cells[colonneMatricule] ?? "").trim().toUpperCase();
    if (!matricule) continue;
    const nom = String(cells[colonneNom] ?? "").trim();
    const notesParCode = {};
    for (const m of matieres) {
      let valeur = null;
      if (m.indexMoy !== null) {
        valeur = normaliserNombre(cells[m.indexMoy]);
      } else {
        // moyenne des valeurs numériques du bloc (hors coefficient)
        const nums = [];
        for (let c = m.debut; c <= m.fin; c++) {
          if (c === m.indexCoef) continue;
          const v = normaliserNombre(cells[c]);
          if (v !== null) nums.push(v);
        }
        if (nums.length) valeur = Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 100) / 100;
      }
      notesParCode[m.code] = valeur;
    }
    lignesDonnees.push({ numeroLigne: i + 1, matricule, nom, notesParCode });
  }

  return { delimiteur, matieres, colonneMatricule, colonneNom, lignesDonnees };
}

/* =====================================================================
   Analyse complète (avec référentiel) — format bulletin CSV ou Excel classique
   Retourne un rapport sans rien écrire : l'écriture se fait via /api/notes/lot.
   ===================================================================== */

async function analyserFichierNotes(buffer, semestreId, promotionId, session = "normale", { nomFichier = "" } = {}) {
  if (/\.csv$/i.test(nomFichier)) {
    return analyserCSVNotes(buffer.toString("utf8"), semestreId, promotionId, session);
  }
  if (/\.ods$/i.test(nomFichier)) {
    return analyserODSNotes(buffer, semestreId, promotionId, session);
  }
  return analyserExcelNotes(buffer, semestreId, promotionId, session);
}

function valeurCelluleImport(value) {
  if (value && typeof value === "object") {
    if (value.result !== undefined) return valeurCelluleImport(value.result);
    if (value.text !== undefined) return String(value.text);
    if (value.richText) return value.richText.map((part) => part.text || "").join("");
  }
  return value == null ? "" : value;
}

function parserCSVConfigure(contenu) {
  const delimiteur = detecterDelimiteur(contenu);
  const lignes = [];
  let ligne = [];
  let cellule = "";
  let cite = false;
  const texte = contenu.replace(/^\uFEFF/, "");
  for (let i = 0; i < texte.length; i += 1) {
    const c = texte[i];
    if (c === '"' && cite && texte[i + 1] === '"') { cellule += '"'; i += 1; }
    else if (c === '"') cite = !cite;
    else if (!cite && c === delimiteur) { ligne.push(cellule); cellule = ""; }
    else if (!cite && (c === "\n" || c === "\r")) {
      if (c === "\r" && texte[i + 1] === "\n") i += 1;
      ligne.push(cellule); lignes.push(ligne); ligne = []; cellule = "";
    } else cellule += c;
  }
  if (cellule || ligne.length) { ligne.push(cellule); lignes.push(ligne); }
  return lignes;
}

async function lireMatriceImport(buffer, nomFichier) {
  if (/\.csv$/i.test(nomFichier)) return parserCSVConfigure(buffer.toString("utf8"));
  const workbook = new ExcelJS.Workbook();
  try { await workbook.xlsx.load(buffer); }
  catch { throw new AppError("Fichier .xlsx illisible ou corrompu.", 422, "FICHIER_INVALIDE"); }
  const feuille = workbook.worksheets[0];
  if (!feuille) throw new AppError("Le fichier ne contient aucune feuille exploitable.", 422, "FICHIER_INVALIDE");
  return Array.from({ length: feuille.rowCount }, (_, index) => {
    const row = feuille.getRow(index + 1);
    return Array.from({ length: Math.min(feuille.columnCount, 80) }, (_, col) => valeurCelluleImport(row.getCell(col + 1).value));
  });
}

async function obtenirStructureImport(buffer, nomFichier, semestreId) {
  if (!/\.(xlsx|csv)$/i.test(nomFichier)) {
    throw new AppError("La configuration manuelle prend en charge les fichiers .xlsx et .csv. Les modèles ODS reconnus restent disponibles en import automatique.", 422, "CONFIGURATION_FORMAT_NON_PRIS_EN_CHARGE");
  }
  const [matrice, matieresResult] = await Promise.all([
    lireMatriceImport(buffer, nomFichier),
    query(`SELECT m.id, m.code, m.libelle, ue.code AS ue_code, ue.libelle AS ue
           FROM matiere m JOIN ue ON ue.id=m.ue_id WHERE ue.semestre_id=$1 ORDER BY ue.code,m.libelle`, [semestreId]),
  ]);
  return {
    lignes: matrice.slice(0, 12),
    nb_lignes: matrice.length,
    nb_colonnes: matrice.reduce((maximum, row) => Math.max(maximum, row.length), 0),
    matieres: matieresResult.rows,
  };
}

async function analyserImportConfigure(buffer, { nomFichier, promotionId, semestreId, session, ligneEntete, colonneMatricule, colonneCreditsSemestre, colonneCreditsAnnee, mappings }) {
  const [matrice, matieresResult, etudiantsResult, semestreResult] = await Promise.all([
    lireMatriceImport(buffer, nomFichier),
    query(`SELECT m.id, m.libelle FROM matiere m JOIN ue ON ue.id=m.ue_id WHERE ue.semestre_id=$1`, [semestreId]),
    query(`SELECT id, matricule FROM etudiant WHERE promotion_id=$1 AND statut='actif'`, [promotionId]),
    query(`SELECT 1 FROM semestre WHERE id=$1 AND promotion_id=$2`, [semestreId, promotionId]),
  ]);
  if (!semestreResult.rowCount) throw new AppError("Le semestre ne correspond pas à la promotion sélectionnée.", 422, "SEMESTRE_INVALIDE");
  const idsMatieres = new Set(matieresResult.rows.map((m) => m.id));
  const mappingParColonne = new Map();
  const matieresMappees = new Set();
  for (const mapping of mappings) {
    if (mapping.colonne === colonneMatricule || mapping.colonne >= 80) throw new AppError("La colonne matricule ne peut pas servir de colonne de note.", 422, "MAPPING_INVALIDE");
    if (!Number.isInteger(mapping.colonne) || !idsMatieres.has(mapping.matiere_id)) throw new AppError("Une colonne est associée à une matière hors du semestre.", 422, "MAPPING_INVALIDE");
    if (mappingParColonne.has(mapping.colonne)) throw new AppError("Une colonne ne peut être associée qu’à un seul EC.", 422, "MAPPING_INVALIDE");
    if (matieresMappees.has(mapping.matiere_id)) throw new AppError("Un EC ne peut être associé qu’à une seule colonne de note.", 422, "MAPPING_INVALIDE");
    mappingParColonne.set(mapping.colonne, mapping.matiere_id);
    matieresMappees.add(mapping.matiere_id);
  }
  if (!Number.isInteger(ligneEntete) || ligneEntete < 1 || ligneEntete > matrice.length || !Number.isInteger(colonneMatricule) || colonneMatricule < 0 || colonneMatricule >= 80 || colonneMatricule >= (matrice[ligneEntete - 1]?.length || 0)) {
    throw new AppError("La ligne d’en-tête ou la colonne matricule est invalide.", 422, "MAPPING_INVALIDE");
  }
  for (const colonne of [colonneCreditsSemestre, colonneCreditsAnnee].filter((v) => v !== undefined)) {
    if (!Number.isInteger(colonne) || colonne < 0 || colonne >= 80 || colonne === colonneMatricule || mappingParColonne.has(colonne)) {
      throw new AppError("Une colonne de crédits ne peut pas être confondue avec le matricule ou une note d’EC.", 422, "MAPPING_INVALIDE");
    }
  }
  if (colonneCreditsSemestre !== undefined && colonneCreditsSemestre === colonneCreditsAnnee) throw new AppError("Les totaux de crédits semestriel et annuel doivent avoir des colonnes différentes.", 422, "MAPPING_INVALIDE");
  const etudiantParMatricule = new Map(etudiantsResult.rows.map((e) => [String(e.matricule).trim().toUpperCase(), e.id]));
  const notes = [];
  const creditsOfficiels = [];
  const erreurs = [];
  const avertissements = [];
  const nbColonnesEntete = matrice.slice(0, ligneEntete).reduce((maximum, row) => Math.max(maximum, row.length), 0);
  for (let colonne = 0; colonne < nbColonnesEntete; colonne += 1) {
    const titre = matrice.slice(0, ligneEntete).map((row) => String(row[colonne] ?? "").trim()).filter(Boolean).join(" / ");
    const champOfficiel = /jury|décision|decision|crédit|credit|admis|ajourn/i.test(titre);
    const estMappe = colonne === colonneCreditsSemestre || colonne === colonneCreditsAnnee || mappingParColonne.has(colonne);
    if (champOfficiel && !estMappe) avertissements.push({ ligne: ligneEntete, probleme: `La colonne « ${titre} » n’est pas associée. Vérifiez qu’elle ne contient pas une décision ou un total officiel à conserver.` });
  }
  const lignesDonnees = matrice.slice(ligneEntete);
  lignesDonnees.forEach((row, index) => {
    const matricule = String(row[colonneMatricule] ?? "").trim().toUpperCase();
    if (!matricule) return;
    const numeroLigne = ligneEntete + index + 1;
    const etudiantId = etudiantParMatricule.get(matricule);
    if (!etudiantId) { erreurs.push({ ligne: numeroLigne, matricule, probleme: "Matricule inconnu dans la promotion sélectionnée." }); return; }
    const credits = { etudiant_id: etudiantId, matricule, credits_semestre: null, credits_annee: null };
    for (const [colonne, cle, maximum, libelle] of [
      [colonneCreditsSemestre, "credits_semestre", 300, "total de crédits semestriel"],
      [colonneCreditsAnnee, "credits_annee", 600, "total de crédits annuel"],
    ]) {
      if (colonne === undefined) continue;
      const brut = row[colonne];
      if (brut === "" || brut == null) continue;
      const valeur = normaliserNombre(brut);
      if (valeur === null || !Number.isInteger(valeur) || valeur < 0 || valeur > maximum) {
        erreurs.push({ ligne: numeroLigne, matricule, probleme: `${libelle} invalide : « ${brut} ».` });
      } else credits[cle] = valeur;
    }
    if (credits.credits_semestre !== null || credits.credits_annee !== null) creditsOfficiels.push(credits);
    for (const [colonne, matiereId] of mappingParColonne) {
      const brut = row[colonne];
      if (brut === "" || brut == null) continue;
      const valeur = normaliserNombre(brut);
      if (valeur === null || valeur < 0 || valeur > 20) {
        erreurs.push({ ligne: numeroLigne, matricule, probleme: `Note invalide (barème 0–20) à la colonne ${colonne + 1}.` });
        continue;
      }
      notes.push({ etudiant_id: etudiantId, matiere_id: matiereId, valeur, session });
    }
  });
  return { format: "configuration-manuelle", nb_lignes_lues: lignesDonnees.length, nb_notes_valides: notes.length, notes, credits_officiels: creditsOfficiels, erreurs, avertissements, bloquant: erreurs.length > 0 || avertissements.length > 0 };
}

/** CSV « format bulletin » : matching par code de matière et par matricule. */
async function analyserCSVNotes(contenu, semestreId, promotionId, session) {
  const brut = analyserCSV(contenu); // lève AppError FORMAT_INVALIDE si le format n'est pas reconnu

  const { rows: matieres } = await query(
    `SELECT m.id, m.code FROM matiere m JOIN ue ON ue.id = m.ue_id
     WHERE ue.semestre_id = $1 AND m.code IS NOT NULL`,
    [semestreId]
  );
  const matiereParCode = new Map(matieres.map((m) => [m.code.toUpperCase(), m.id]));

  const { rows: etudiants } = await query(
    `SELECT id, matricule FROM etudiant WHERE promotion_id = $1 AND statut = 'actif'`,
    [promotionId]
  );
  const etudiantParMatricule = new Map(etudiants.map((e) => [e.matricule.toUpperCase(), e.id]));

  const notesValides = [];
  const erreurs = [];
  const avertissements = [];

  for (const ligne of brut.lignesDonnees) {
    const etudiantId = etudiantParMatricule.get(ligne.matricule);
    if (!etudiantId) {
      erreurs.push({ ligne: ligne.numeroLigne, matricule: ligne.matricule, probleme: "Matricule inconnu dans la base." });
      continue;
    }
    for (const m of brut.matieres) {
      const valeur = ligne.notesParCode[m.code];
      if (valeur === null || valeur === undefined) continue; // case vide
      const matiereId = matiereParCode.get(m.code);
      if (!matiereId) {
        avertissements.push({
          ligne: ligne.numeroLigne,
          matricule: ligne.matricule,
          probleme: `Matière "${m.code}" non reconnue pour ce semestre — ignorée.`,
        });
        continue;
      }
      if (valeur < 0 || valeur > 20) {
        erreurs.push({
          ligne: ligne.numeroLigne,
          matricule: ligne.matricule,
          probleme: `Note hors barème (0-20) pour "${m.code}" : ${valeur}.`,
        });
        continue;
      }
      notesValides.push({ etudiant_id: etudiantId, matiere_id: matiereId, valeur, session });
    }
  }

  return {
    format: "bulletin-csv",
    matieres_trouvees: brut.matieres.map((m) => m.code),
    nb_lignes_lues: brut.lignesDonnees.length,
    nb_notes_valides: notesValides.length,
    notes: notesValides,
    erreurs,
    avertissements,
  };
}

/**
 * Format Excel classique (1re feuille) : colonne A = matricule, colonne B = nom
 * (informatif), colonnes C.. = une colonne par matière avec le libellé exact en
 * en-tête. Matching par matricule et par libellé de matière.
 */
async function analyserExcelNotes(buffer, semestreId, promotionId, session) {
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(buffer);
  } catch {
    throw new AppError("Fichier .xlsx illisible ou corrompu.", 422, "FICHIER_INVALIDE");
  }
  const feuille = workbook.worksheets[0];

  if (!feuille) {
    throw new AppError("Le fichier ne contient aucune feuille exploitable.", 422, "FICHIER_INVALIDE");
  }

  // Grille IDE multi-en-têtes : colonnes CC/ET regroupées par UE, une ligne par étudiant.
  const entetesEvaluation = feuille.getRow(4).values.slice(1).map((v) => String(v || "").trim().toUpperCase());
  const semestreEntete = feuille.getRow(1).values.slice(1).map((v) => String(v || "").trim());
  if (entetesEvaluation.includes("CC") && entetesEvaluation.includes("ET") && semestreEntete.some((v) => /^Semestre\s+[1-6]$/i.test(v))) {
    return analyserGrilleIdeXlsx(feuille, semestreId, promotionId, session);
  }

  const enTete = feuille.getRow(1).values.slice(1); // index 0 vide dans exceljs
  const colMatricule = 0;

  const { rows: matieres } = await query(
    `SELECT m.id, m.libelle FROM matiere m JOIN ue ON ue.id = m.ue_id WHERE ue.semestre_id = $1`,
    [semestreId]
  );
  const matiereParLibelle = new Map(matieres.map((m) => [normaliser(m.libelle), m.id]));

  const { rows: etudiants } = await query(
    `SELECT id, matricule FROM etudiant WHERE promotion_id = $1 AND statut = 'actif'`,
    [promotionId]
  );
  const etudiantParMatricule = new Map(etudiants.map((e) => [e.matricule.toUpperCase(), e.id]));

  const notesValides = [];
  const erreurs = [];
  const avertissements = [];

  feuille.eachRow((row, numeroLigne) => {
    if (numeroLigne === 1) return; // en-tête

    const valeurs = row.values.slice(1);
    const matricule = String(valeurs[colMatricule] || "").trim().toUpperCase();
    if (!matricule) return; // ligne vide

    const etudiantId = etudiantParMatricule.get(matricule);
    if (!etudiantId) {
      erreurs.push({ ligne: numeroLigne, matricule, probleme: "Matricule inconnu dans la base." });
      return;
    }

    for (let i = 2; i < valeurs.length; i++) {
      const libelleMatiere = enTete[i];
      if (!libelleMatiere) continue;
      const matiereId = matiereParLibelle.get(normaliser(String(libelleMatiere)));
      const brut = valeurs[i];

      if (brut === undefined || brut === null || brut === "") continue; // case vide

      const valeur = normaliserNombre(brut);
      if (!matiereId) {
        avertissements.push({ ligne: numeroLigne, matricule, probleme: `Matière "${libelleMatiere}" non reconnue pour ce semestre — ignorée.` });
        continue;
      }
      if (Number.isNaN(valeur) || valeur < 0 || valeur > 20) {
        erreurs.push({ ligne: numeroLigne, matricule, probleme: `Note hors barème (0-20) pour "${libelleMatiere}" : "${brut}".` });
        continue;
      }

      notesValides.push({ etudiant_id: etudiantId, matiere_id: matiereId, valeur, session });
    }
  });

  return {
    format: "excel-classique",
    nb_lignes_lues: feuille.rowCount - 1,
    nb_notes_valides: notesValides.length,
    notes: notesValides,
    erreurs,
    avertissements,
  };
}

/** Grille IDE : moyenne CC/ET par EC, sans modifier les champs officiels du jury. */
async function analyserGrilleIdeXlsx(feuille, semestreId, promotionId, session) {
  if (session !== "normale") {
    throw new AppError("Cette grille CC/ET ne distingue pas les notes de rattrapage; choisissez la session normale.", 422, "SESSION_INVALIDE");
  }
  const { rows: [semestre] } = await query(
    `SELECT numero FROM semestre WHERE id = $1 AND promotion_id = $2`, [semestreId, promotionId]
  );
  if (!semestre) throw new AppError("Le semestre choisi n'appartient pas à la promotion sélectionnée.", 422, "SEMESTRE_INVALIDE");
  const numero = Number(semestre.numero);
  const { rows: matieres } = await query(
    `SELECT m.id, m.libelle AS ec, ue.id AS ue_id, ue.libelle AS ue
     FROM matiere m JOIN ue ON ue.id = m.ue_id WHERE ue.semestre_id = $1`, [semestreId]
  );
  const matiereParCle = new Map(matieres.map((m) => [`${normaliser(m.ue)}|${normaliser(m.ec)}`, m]));
  const { rows: etudiants } = await query(
    `SELECT id, matricule FROM etudiant WHERE promotion_id = $1 AND statut = 'actif'`, [promotionId]
  );
  const etudiantParMatricule = new Map(etudiants.map((e) => [String(e.matricule).trim().toUpperCase(), e.id]));
  const colonnes = [];
  const avertissements = [];
  const erreurs = [];
  const notes = [];
  const numCol = (index) => index + 1;
  const titreColonne = (c) => [1, 2, 3]
    .map((r) => String(feuille.getCell(r, c).value || "").trim())
    .find(Boolean) || "";
  const colonneCreditsSemestre = new Map();
  let colonneCreditsAnnee = null;
  const colonnesCreditsUE = new Set();
  const colonnesDecision = new Set();

  for (let c = 4; c <= feuille.columnCount; c += 1) {
    const titre = normaliser(titreColonne(c));
    const totalSemestre = titre.match(/total credits s([1-6])$/);
    if (totalSemestre) colonneCreditsSemestre.set(Number(totalSemestre[1]), c);
    if (/total credits s1\s*\+\s*s2$/.test(titre)) colonneCreditsAnnee = c;
    if (titre === "credits") colonnesCreditsUE.add(c);
    if (/decision du jury/.test(titre)) colonnesDecision.add(c);
  }

  for (let c = 4; c <= feuille.columnCount; c += 1) {
    if (String(feuille.getCell(1, c).value || "").trim().toLowerCase() !== `semestre ${numero}`) continue;
    if (String(feuille.getCell(4, c).value || "").trim().toUpperCase() !== "CC") continue;
    if (String(feuille.getCell(4, c + 1).value || "").trim().toUpperCase() !== "ET") {
      erreurs.push({ ligne: 4, probleme: `La colonne ET manque après la colonne CC ${c}.` });
      continue;
    }
    const ueLabel = String(feuille.getCell(2, c).value || "").trim();
    const ecLabel = String(feuille.getCell(3, c).value || "").trim();
    if (!ueLabel || !ecLabel || /^crédits?$/i.test(ueLabel)) continue;
    const matiere = matiereParCle.get(`${normaliser(ueLabel)}|${normaliser(ecLabel)}`);
    if (!matiere) {
      avertissements.push({ ligne: 3, probleme: `EC non reconnue dans le référentiel : ${ueLabel} / ${ecLabel}.` });
      continue;
    }
    colonnes.push({ cc: numCol(c - 1), et: numCol(c), matiere });
  }
  if (!colonnes.length) throw new AppError(`Aucune paire CC/ET reconnue pour le semestre ${numero}.`, 422, "FORMAT_INVALIDE");

  let nbLignesLues = 0;
  const credits_officiels = [];
  let creditsUERenseignes = false;
  let decisionOfficielleRenseignee = false;
  for (let rowNum = 5; rowNum <= feuille.rowCount; rowNum += 1) {
    const matricule = String(feuille.getCell(rowNum, 2).value ?? "").trim().toUpperCase();
    if (!matricule) continue;
    nbLignesLues += 1;
    const etudiantId = etudiantParMatricule.get(matricule);
    if (!etudiantId) {
      erreurs.push({ ligne: rowNum, matricule, probleme: "Matricule inconnu dans la promotion sélectionnée." });
      continue;
    }
    for (const colonne of colonnes) {
      const brutCC = feuille.getCell(rowNum, colonne.cc).value;
      const brutET = feuille.getCell(rowNum, colonne.et).value;
      if ((brutCC === null || brutCC === undefined || brutCC === "") && (brutET === null || brutET === undefined || brutET === "")) continue;
      const cc = normaliserNombre(brutCC);
      const et = normaliserNombre(brutET);
      if (cc === null || et === null || cc < 0 || cc > 20 || et < 0 || et > 20) {
        erreurs.push({ ligne: rowNum, matricule, probleme: `CC et ET doivent être renseignés entre 0 et 20 pour « ${colonne.matiere.ec} ».` });
        continue;
      }
      notes.push({ etudiant_id: etudiantId, matiere_id: colonne.matiere.id, valeur: arrondirNote((cc + et) / 2), session });
    }
    const creditSemestreBrut = colonneCreditsSemestre.get(numero) ? feuille.getCell(rowNum, colonneCreditsSemestre.get(numero)).value : null;
    const creditAnneeBrut = colonneCreditsAnnee ? feuille.getCell(rowNum, colonneCreditsAnnee).value : null;
    const creditSemestre = creditSemestreBrut === null || creditSemestreBrut === undefined || creditSemestreBrut === "" ? null : normaliserNombre(creditSemestreBrut);
    const creditAnnee = creditAnneeBrut === null || creditAnneeBrut === undefined || creditAnneeBrut === "" ? null : normaliserNombre(creditAnneeBrut);
    for (const [valeur, libelle] of [[creditSemestre, `Total crédits S${numero}`], [creditAnnee, "Total crédits annuel"]]) {
      if (valeur !== null && (!Number.isInteger(valeur) || valeur < 0 || valeur > 300)) {
        erreurs.push({ ligne: rowNum, matricule, probleme: `${libelle} invalide : le total doit être un nombre entier positif.` });
      }
    }
    if ((creditSemestre === null || (Number.isInteger(creditSemestre) && creditSemestre >= 0 && creditSemestre <= 300))
      && (creditAnnee === null || (Number.isInteger(creditAnnee) && creditAnnee >= 0 && creditAnnee <= 300))
      && (creditSemestre !== null || creditAnnee !== null)) {
      credits_officiels.push({ etudiant_id: etudiantId, matricule, credits_semestre: creditSemestre, credits_annee: creditAnnee });
    }

    for (let c = 4; c <= feuille.columnCount; c += 1) {
      const valeur = feuille.getCell(rowNum, c).value;
      if (colonnesCreditsUE.has(c) && valeur !== null && valeur !== undefined && valeur !== "") creditsUERenseignes = true;
      if (colonnesDecision.has(c) && valeur !== null && valeur !== undefined && String(valeur).trim() !== "") decisionOfficielleRenseignee = true;
    }
  }

  const bloquant = creditsUERenseignes || decisionOfficielleRenseignee;
  if (creditsUERenseignes) avertissements.push({ probleme: "Le classeur contient des crédits attribués UE par UE. L'import des crédits UE n'est pas encore pris en charge; le total de crédits, s'il est présent, peut être importé séparément." });
  if (decisionOfficielleRenseignee) avertissements.push({ probleme: "Le classeur contient une décision du jury; son import officiel n'est pas encore pris en charge. Rien ne peut être confirmé sans perte de cette valeur." });
  return {
    format: "excel-grille-ide-cc-et",
    semestre: numero,
    nb_lignes_lues: nbLignesLues,
    nb_notes_valides: notes.length,
    notes,
    credits_officiels,
    erreurs,
    avertissements,
    bloquant,
  };
}

const ODS_NS = {
  table: "urn:oasis:names:tc:opendocument:xmlns:table:1.0",
  office: "urn:oasis:names:tc:opendocument:xmlns:office:1.0",
  text: "urn:oasis:names:tc:opendocument:xmlns:text:1.0",
};
const ODS_MAX_COLUMNS = 128;
const ODS_MAX_ROWS = 200;

function attributODS(tag, namespace, localName) {
  const attribut = Object.values(tag.attributes || {}).find((a) => a.uri === namespace && a.local === localName);
  return attribut?.value;
}

/** Lit uniquement les cellules utiles du content.xml, sans convertir ni réécrire le classeur. */
function lireFeuillesODS(contenu) {
  const feuilles = [];
  const parser = new SaxesParser({ xmlns: true });
  let feuille = null;
  let ligne = null;
  let cellule = null;
  let profondeurParagraphe = 0;

  parser.on("opentag", (tag) => {
    if (tag.uri === ODS_NS.table && tag.local === "table") {
      feuille = { nom: attributODS(tag, ODS_NS.table, "name") || "", lignes: [] };
      return;
    }
    if (!feuille) return;
    if (tag.uri === ODS_NS.table && tag.local === "table-row") {
      ligne = { cellules: new Map(), colonne: 1, repetitions: Number(attributODS(tag, ODS_NS.table, "number-rows-repeated") || 1) };
      return;
    }
    if (ligne && tag.uri === ODS_NS.table && (tag.local === "table-cell" || tag.local === "covered-table-cell")) {
      cellule = {
        couverte: tag.local === "covered-table-cell",
        debut: ligne.colonne,
        repetitions: Math.max(1, Number(attributODS(tag, ODS_NS.table, "number-columns-repeated") || 1)),
        portee: Math.max(1, Number(attributODS(tag, ODS_NS.table, "number-columns-spanned") || 1)),
        type: attributODS(tag, ODS_NS.office, "value-type"),
        valeur: attributODS(tag, ODS_NS.office, "value"),
        valeurTexte: attributODS(tag, ODS_NS.office, "string-value"),
        formule: attributODS(tag, ODS_NS.table, "formula"),
        texte: "",
      };
      return;
    }
    if (cellule && tag.uri === ODS_NS.text && tag.local === "p") {
      profondeurParagraphe += 1;
    } else if (cellule && profondeurParagraphe && tag.uri === ODS_NS.text && tag.local === "s") {
      cellule.texte += " ".repeat(Math.min(Number(attributODS(tag, ODS_NS.text, "c") || 1), 20));
    } else if (cellule && profondeurParagraphe && tag.uri === ODS_NS.text && tag.local === "tab") {
      cellule.texte += "\t";
    }
  });

  parser.on("text", (texte) => {
    if (cellule && profondeurParagraphe) cellule.texte += texte;
  });

  parser.on("closetag", (tag) => {
    if (cellule && tag.uri === ODS_NS.text && tag.local === "p") {
      profondeurParagraphe = Math.max(0, profondeurParagraphe - 1);
      return;
    }
    if (cellule && tag.uri === ODS_NS.table && (tag.local === "table-cell" || tag.local === "covered-table-cell")) {
      if (!cellule.couverte) {
        const valeur = cellule.valeur ?? cellule.valeurTexte ?? cellule.texte.trim();
        for (let i = 0; i < cellule.repetitions && cellule.debut + i <= ODS_MAX_COLUMNS; i++) {
          for (let j = 0; j < cellule.portee && cellule.debut + i + j <= ODS_MAX_COLUMNS; j++) {
            ligne.cellules.set(cellule.debut + i + j, {
              valeur,
              formule: cellule.formule,
              type: cellule.type,
            });
          }
        }
      }
      ligne.colonne += cellule.repetitions;
      cellule = null;
      return;
    }
    if (ligne && tag.uri === ODS_NS.table && tag.local === "table-row") {
      for (let i = 0; i < Math.min(ligne.repetitions, ODS_MAX_ROWS - feuille.lignes.length); i++) {
        feuille.lignes.push(ligne.cellules);
      }
      ligne = null;
      return;
    }
    if (feuille && tag.uri === ODS_NS.table && tag.local === "table") {
      feuilles.push(feuille);
      feuille = null;
    }
  });

  let erreurXML = null;
  parser.on("error", (err) => { erreurXML = err; });
  parser.write(contenu).close();
  if (erreurXML) throw erreurXML;
  return feuilles;
}

function texteCelluleODS(ligne, colonne) {
  return String(ligne?.get(colonne)?.valeur ?? "").trim();
}

function normaliserEnteteODS(valeur) {
  return String(valeur ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[–—−]/g, "-")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

const ALIASES_EC_ODS = new Map([
  [
    normaliserEnteteODS("Notions de base en santé communautaire ; changement de comportement en DSSR"),
    normaliserEnteteODS("Notions de base en santé communautaire ; Introduction et processus pour un changement de comportement en DSSR"),
  ],
  [
    normaliserEnteteODS("Droits et législation du travail (droits humains)"),
    normaliserEnteteODS("Droits et législation du travail (introduction aux droits humains)"),
  ],
]);

function construireEvenementsODS(ligneEvaluations, debut, fin) {
  const colonnes = [];
  for (let col = debut; col <= fin; col++) {
    const titre = texteCelluleODS(ligneEvaluations, col).toUpperCase();
    if (titre === "CC" || titre === "ET") colonnes.push({ col, titre });
  }

  const evenements = [];
  for (let i = 0; i < colonnes.length;) {
    const courant = colonnes[i];
    if (courant.titre === "CC") {
      const suivant = colonnes[i + 1];
      if (!suivant || suivant.titre !== "ET") {
        throw new AppError(`En-tête ODS incomplet : CC sans ET à la colonne ${courant.col}.`, 422, "FORMAT_INVALIDE");
      }
      evenements.push([courant.col, suivant.col]);
      i += 2;
    } else {
      evenements.push([courant.col]); // Certains EC sont évalués par ET seul dans le classeur.
      i += 1;
    }
  }
  return evenements;
}

function arrondirNote(valeur) {
  return Math.round(valeur * 100) / 100;
}

/** Importe la matrice ODS CC/ET fournie pour le bêta ESSFE L2 S3/S4. */
async function analyserODSNotes(buffer, semestreId, promotionId, session) {
  if (session !== "normale") {
    throw new AppError("Le classeur CC/ET s'importe en session normale uniquement.", 422, "SESSION_INVALIDE");
  }

  const { rows: semestres } = await query(`SELECT numero FROM semestre WHERE id = $1`, [semestreId]);
  const numeroSemestre = Number(semestres[0]?.numero);
  if (![3, 4].includes(numeroSemestre)) {
    throw new AppError("Ce classeur ODS est prévu pour les semestres 3 et 4 du bêta ESSFE L2.", 422, "SEMESTRE_INVALIDE");
  }

  let workbook;
  try {
    workbook = await JSZip.loadAsync(buffer, { checkCRC32: true });
  } catch {
    throw new AppError("Fichier ODS illisible ou corrompu.", 422, "FICHIER_INVALIDE");
  }
  const contentFile = workbook.file("content.xml");
  if (!contentFile) throw new AppError("Le fichier ODS ne contient pas content.xml.", 422, "FICHIER_INVALIDE");

  let feuilles;
  try {
    const contenu = await contentFile.async("string");
    if (Buffer.byteLength(contenu, "utf8") > 30 * 1024 * 1024) {
      throw new Error("ODS content.xml exceeds the parser limit");
    }
    feuilles = lireFeuillesODS(contenu);
  } catch {
    throw new AppError("Impossible de lire la structure du classeur ODS.", 422, "FICHIER_INVALIDE");
  }

  const feuille = feuilles.find((f) => f.nom === "Semestre 3");
  if (!feuille || feuille.lignes.length < 5) {
    throw new AppError("Feuille 'Semestre 3' introuvable ou incomplète dans le classeur ODS.", 422, "FORMAT_INVALIDE");
  }
  const [entetesSemestre, entetesUE, entetesEC, entetesEvaluation] = feuille.lignes;
  const totalS3 = [...entetesSemestre.entries()].find(([, c]) => /total\s+cr[eé]dits\s+s3/i.test(String(c.valeur || "")))?.[0];
  const totalS4 = [...entetesSemestre.entries()].find(([, c]) => /total\s+cr[eé]dits\s+s4/i.test(String(c.valeur || "")))?.[0];
  if (!totalS3 || !totalS4 || totalS4 <= totalS3) {
    throw new AppError("Les blocs de notes S3/S4 n'ont pas été reconnus dans la feuille principale.", 422, "FORMAT_INVALIDE");
  }
  const debutBloc = numeroSemestre === 3 ? 4 : totalS3 + 1;
  const finBloc = numeroSemestre === 3 ? totalS3 - 1 : totalS4 - 1;
  const evenements = construireEvenementsODS(entetesEvaluation, debutBloc, finBloc);
  if (evenements.length === 0) throw new AppError("Aucune colonne CC/ET trouvée pour ce semestre.", 422, "FORMAT_INVALIDE");

  const { rows: matieres } = await query(
    `SELECT m.id, m.code, m.libelle, ue.code AS ue_code, ue.libelle AS ue_libelle
     FROM matiere m JOIN ue ON ue.id = m.ue_id
     WHERE ue.semestre_id = $1`,
    [semestreId]
  );
  const ueParLibelle = new Map();
  for (const m of matieres) ueParLibelle.set(normaliserEnteteODS(m.ue_libelle), m.ue_code);
  const matiereParCle = new Map();
  for (const m of matieres) {
    const cle = `${m.ue_code}|${normaliserEnteteODS(m.libelle)}`;
    if (matiereParCle.has(cle)) matiereParCle.set(cle, null);
    else matiereParCle.set(cle, m.id);
  }

  const { rows: etudiants } = await query(
    `SELECT id, matricule FROM etudiant WHERE promotion_id = $1 AND statut = 'actif'`,
    [promotionId]
  );
  const etudiantParMatricule = new Map(etudiants.map((e) => [String(e.matricule).trim().toUpperCase(), e.id]));
  const notes = [];
  const erreurs = [];
  const avertissements = [];
  const lignes = feuille.lignes;
  let nbLignesLues = 0;

  for (let index = 4; index < lignes.length; index++) {
    const ligne = lignes[index];
    const matricule = texteCelluleODS(ligne, 2).toUpperCase();
    if (!matricule) continue;
    nbLignesLues++;
    const etudiantId = etudiantParMatricule.get(matricule);
    if (!etudiantId) {
      erreurs.push({ ligne: index + 1, matricule, probleme: "Matricule inconnu dans la promotion sélectionnée." });
      continue;
    }

    for (const colonnes of evenements) {
      const colonne = colonnes[0];
      const ueEntete = texteCelluleODS(entetesUE, colonne);
      const ecEntete = texteCelluleODS(entetesEC, colonne);
      const ueCode = ueParLibelle.get(normaliserEnteteODS(ueEntete));
      const ecNormalise = normaliserEnteteODS(ecEntete);
      const ecAlias = ALIASES_EC_ODS.get(ecNormalise) || ecNormalise;
      const matiereId = ueCode ? matiereParCle.get(`${ueCode}|${ecAlias}`) : null;
      if (!matiereId) {
        avertissements.push({
          ligne: index + 1,
          matricule,
          probleme: `EC non reconnue dans le référentiel : ${ueEntete} / ${ecEntete}.`,
        });
        continue;
      }

      const brut = colonnes.map((col) => texteCelluleODS(ligne, col));
      if (brut.some((v) => v === "")) {
        erreurs.push({ ligne: index + 1, matricule, probleme: `Note CC/ET manquante pour « ${ecEntete} ».` });
        continue;
      }
      const valeurs = brut.map(normaliserNombre);
      if (valeurs.some((v) => v === null || v < 0 || v > 20)) {
        erreurs.push({ ligne: index + 1, matricule, probleme: `Note hors barème (0-20) pour « ${ecEntete} » : ${brut.join(" / ")}.` });
        continue;
      }
      const valeur = colonnes.length === 2 ? arrondirNote((valeurs[0] + valeurs[1]) / 2) : valeurs[0];
      notes.push({ etudiant_id: etudiantId, matiere_id: matiereId, valeur, session });
    }
  }

  return {
    format: "ods-cc-et",
    semestre: numeroSemestre,
    matieres_trouvees: [...new Set(matieres.map((m) => m.code).filter(Boolean))],
    nb_lignes_lues: nbLignesLues,
    nb_notes_valides: notes.length,
    notes,
    erreurs,
    avertissements,
  };
}

function normaliser(texte) {
  return texte.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

module.exports = { analyserFichierNotes, analyserCSV, normaliserNombre, detecterDelimiteur, obtenirStructureImport, analyserImportConfigure };
