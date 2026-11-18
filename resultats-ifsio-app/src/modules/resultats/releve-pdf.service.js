const PDFDocument = require("pdfkit");
const { query } = require("../../db/pool");
const notesService = require("../notes/notes.service");
const { AppError } = require("../../middleware/errorHandler");

const DECISION_LISIBLE = { admis: "Admis(e)", ajourne: "Ajourné(e)", rattrapage: "Rattrapage" };

/**
 * Génère le relevé de notes PDF d'un étudiant pour un semestre publié,
 * et l'écrit directement dans le flux de réponse HTTP (`res`).
 */
async function genererReleve(etudiantId, semestreId, res, session = "normale") {
  const { rows: etudiantRows } = await query(
    `SELECT e.matricule, e.nom, e.prenoms, f.libelle AS filiere, p.niveau
     FROM etudiant e
     JOIN filiere f ON f.id = e.filiere_id
     JOIN promotion p ON p.id = e.promotion_id
     WHERE e.id = $1`,
    [etudiantId]
  );
  const etudiant = etudiantRows[0];
  if (!etudiant) throw new AppError("Étudiant introuvable.", 404, "INTROUVABLE");

  const { rows: semestreRows } = await query(
    `SELECT sa.numero, aa.libelle AS annee
     FROM semestre sa JOIN annee_academique aa ON aa.id = sa.annee_academique_id
     WHERE sa.id = $1`,
    [semestreId]
  );
  const semestre = semestreRows[0];
  if (!semestre) throw new AppError("Semestre introuvable.", 404, "INTROUVABLE");

  const resultats = await notesService.obtenirResultatsAffiches(etudiantId, semestreId, session);
  if (!resultats.publie || resultats.notes.length === 0) {
    throw new AppError("Les résultats de ce semestre ne sont pas encore publiés.", 409, "NON_PUBLIE");
  }

  const doc = new PDFDocument({ margin: 50 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=releve_${etudiant.matricule}_S${semestre.numero}_${session}.pdf`);
  doc.pipe(res);

  // Bande de couleur IFSIO (vert institutionnel)
  doc.rect(0, 0, doc.page.width, 8).fill("#0b3d2e");
  doc.moveDown(0.3);

  // En-tête institutionnel
  doc.fontSize(16).font("Helvetica-Bold").fillColor("#0b3d2e").text("INSTITUT DE FORMATION EN SOINS INFIRMIERS ET OBSTETRICAUX", { align: "center" });
  doc.fontSize(12).font("Helvetica").fillColor("#333333").text("Université de Parakou — République du Bénin", { align: "center" });
  doc.moveDown(1.5);
  doc.fontSize(14).font("Helvetica-Bold").fillColor("#1a1a1a").text(`RELEVÉ DE NOTES — SESSION ${session.toUpperCase()}`, { align: "center" });
  doc.fontSize(9).font("Helvetica").fillColor("#888888").text(`Réf. : IFSIO-RN-${etudiant.matricule}-S${semestre.numero}-${session.toUpperCase()}-${new Date().getFullYear()}`, { align: "center" });
  doc.moveDown(1.5);

  // Identité
  doc.fontSize(11).font("Helvetica");
  doc.text(`Nom et prénoms : ${etudiant.nom} ${etudiant.prenoms}`);
  doc.text(`Matricule : ${etudiant.matricule}`);
  doc.text(`Filière : ${etudiant.filiere} — ${etudiant.niveau}`);
  doc.text(`Semestre : ${semestre.numero} — Année académique ${semestre.annee}`);
  doc.moveDown(1);

  // Tableau des résultats : une ligne par EC, avec son UE et les crédits de l’UE.
  const startX = 50;
  let y = doc.y + 10;
  const colWidths = [145, 205, 65, 80];
  const tableWidth = colWidths.reduce((sum, width) => sum + width, 0);
  const cellPadding = 6;
  const resumeUE = new Map(resultats.unites_enseignement.map((ue) => [ue.id, ue]));

  function dessinerEnteteTableau() {
    doc.rect(startX, y, tableWidth, 24).fill("#0b3d2e");
    doc.font("Helvetica-Bold").fontSize(8).fillColor("#ffffff");
    const titres = ["UE", "EC", "Note /20", "Crédits UE"];
    let x = startX;
    titres.forEach((titre, index) => {
      doc.text(titre, x + cellPadding, y + 7, { width: colWidths[index] - cellPadding * 2 });
      x += colWidths[index];
    });
    y += 24;
  }

  dessinerEnteteTableau();
  const notesSession = resultats.notes;
  doc.font("Helvetica").fontSize(8.5);
  notesSession.forEach((note, index) => {
    const ue = resumeUE.get(note.ue_id);
    const ueLabel = `${note.ue_code ? `${note.ue_code} — ` : ""}${note.ue || ""}`;
    const totalCredits = Number(ue?.credits ?? note.ue_credits) || 0;
    const creditsObtenus = Number(ue?.credits_obtenus) || 0;
    const creditsComplets = !ue || Number(ue.nb_notes) === Number(ue.nb_ec);
    const statutUE = creditsComplets && totalCredits > 0 && creditsObtenus >= totalCredits ? "Validée" : "Non validée";
    const valeurs = [
      ueLabel,
      note.matiere,
      Number(note.valeur).toFixed(2),
      session === "normale" ? `${creditsComplets ? creditsObtenus : 0} / ${totalCredits} — ${statutUE}` : `${totalCredits} — selon délibération`,
    ];
    const hauteurs = valeurs.map((value, i) => doc.heightOfString(String(value), {
      width: colWidths[i] - cellPadding * 2,
    }));
    const rowHeight = Math.max(24, ...hauteurs.map((height) => height + cellPadding * 2));
    const bottomLimit = doc.page.height - doc.page.margins.bottom - 76;
    if (y + rowHeight > bottomLimit) {
      doc.addPage();
      y = doc.page.margins.top;
      dessinerEnteteTableau();
    }

    doc.rect(startX, y, tableWidth, rowHeight).fill(index % 2 ? "#f7f5f0" : "#ffffff");
    doc.font("Helvetica").fontSize(8.5).fillColor("#1f1f1f");
    let x = startX;
    valeurs.forEach((value, i) => {
      doc.text(String(value), x + cellPadding, y + cellPadding, {
        width: colWidths[i] - cellPadding * 2,
        align: i === 2 || i === 3 ? "center" : "left",
      });
      x += colWidths[i];
    });
    doc.strokeColor("#e4e0d4").lineWidth(0.5).moveTo(startX, y + rowHeight).lineTo(startX + tableWidth, y + rowHeight).stroke();
    y += rowHeight;
  });

  y += 10;
  if (y > doc.page.height - doc.page.margins.bottom - 70) {
    doc.addPage();
    y = doc.page.margins.top;
  }
  doc.moveTo(startX, y).lineTo(startX + tableWidth, y).stroke();
  y += 16;

  doc.font("Helvetica-Bold").fontSize(11);
  if (resultats.resultat) {
    if (resultats.resultat.moyenne_generale != null) {
      doc.text(`Moyenne générale : ${resultats.resultat.moyenne_generale} / 20`, startX, y);
      y += 18;
    }
    if (resultats.resultat.credits_semestre_officiels != null) {
      doc.text(`Total officiel des crédits du semestre : ${resultats.resultat.credits_semestre_officiels}`, startX, y);
      y += 18;
    }
    if (resultats.resultat.credits_annee_officiels != null) {
      doc.text(`Total officiel des crédits de l’année : ${resultats.resultat.credits_annee_officiels}`, startX, y);
      y += 18;
    }
    if (resultats.resultat.decision) {
      doc.text(`Décision : ${DECISION_LISIBLE[resultats.resultat.decision] || resultats.resultat.decision}`, startX, y);
      y += 20;
    }
  }
  doc.font("Helvetica").fontSize(8.5).fillColor("#555555").text(
    session === "normale"
      ? "Note finale d’un EC : moyenne du CC et de l’ET. Les crédits d’une UE sont obtenus si sa moyenne atteint 12/20."
      : "Les notes normales sont conservées pour les EC non recomposés. La note publiée au rattrapage remplace la note normale pour les EC recomposés. Les crédits d’une UE sont obtenus si la moyenne des notes finales atteint 12/20.",
    startX,
    y,
    { width: tableWidth }
  );

  doc.moveDown(3);
  doc.font("Helvetica").fontSize(9).fillColor("#555555").text(
    `Document généré électroniquement le ${new Date().toLocaleDateString("fr-FR")} — Plateforme de résultats IFSIO.`,
    { align: "center" }
  );

  doc.end();
}

async function genererReleveAnnuel(etudiantId, annee, res) {
  if (typeof annee !== "string" || annee.length > 30) {
    throw new AppError("Année académique invalide.", 400, "ANNEE_INVALIDE");
  }
  const { rows: etudiants } = await query(
    `SELECT e.matricule, e.nom, e.prenoms, f.libelle AS filiere, p.niveau
     FROM etudiant e JOIN filiere f ON f.id=e.filiere_id JOIN promotion p ON p.id=e.promotion_id
     WHERE e.id=$1`, [etudiantId]
  );
  const etudiant = etudiants[0];
  if (!etudiant) throw new AppError("Étudiant introuvable.", 404, "INTROUVABLE");
  const { rows: semestres } = await query(
    `SELECT sa.id, sa.numero, aa.libelle AS annee
     FROM resultat_semestre rs JOIN semestre sa ON sa.id=rs.semestre_id
     JOIN annee_academique aa ON aa.id=sa.annee_academique_id
     WHERE rs.etudiant_id=$1 AND rs.statut_publication='publie' AND aa.libelle=$2
     ORDER BY sa.numero`, [etudiantId, annee]
  );
  if (semestres.length < 2) {
    throw new AppError("Les résultats des deux semestres doivent être publiés pour générer le relevé annuel.", 409, "ANNEE_INCOMPLETE");
  }
  const sections = [];
  for (const semestre of semestres) {
    const resultats = await notesService.obtenirResultatsEtudiant(etudiantId, semestre.id, { seulementPublies: true });
    if (!resultats.publie || !resultats.resultat) {
      throw new AppError("Un des semestres de cette année n'est pas publié.", 409, "ANNEE_INCOMPLETE");
    }
    sections.push({ semestre, resultats });
  }
  const moyennes = sections.map(({ resultats }) => Number(resultats.resultat.moyenne_generale)).filter(Number.isFinite);
  const moyenneAnnuelle = moyennes.length
    ? (moyennes.reduce((sum, value) => sum + value, 0) / moyennes.length).toFixed(2)
    : "—";
  const doc = new PDFDocument({ margin: 42, size: "A4" });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=releve_${etudiant.matricule}_${annee.replace(/[^a-zA-Z0-9-]/g, "_")}.pdf`);
  doc.pipe(res);
  doc.font("Helvetica-Bold").fontSize(15).text("INSTITUT DE FORMATION EN SOINS INFIRMIERS ET OBSTÉTRICAUX", { align: "center" });
  doc.font("Helvetica").fontSize(10).text("Université de Parakou — République du Bénin", { align: "center" });
  doc.moveDown();
  doc.font("Helvetica-Bold").fontSize(14).text("RELEVÉ ANNUEL DE NOTES", { align: "center" });
  doc.font("Helvetica").fontSize(9).fillColor("#888888").text(`Réf. : IFSIO-RA-${etudiant.matricule}-${annee.replace(/[^a-zA-Z0-9-]/g, "_")}-${new Date().getFullYear()}`, { align: "center" });
  doc.fillColor("#1c1c1c");
  doc.moveDown();
  doc.font("Helvetica").fontSize(10)
    .text(`Nom et prénoms : ${etudiant.nom} ${etudiant.prenoms}`)
    .text(`Matricule : ${etudiant.matricule}`)
    .text(`Filière : ${etudiant.filiere} — ${etudiant.niveau}`)
    .text(`Année académique : ${annee}`);
  doc.moveDown(0.7);
  doc.font("Helvetica-Bold").fontSize(11).text(`Moyenne annuelle : ${moyenneAnnuelle} / 20`);
  const creditsAnnuels = sections.find(({ resultats }) => resultats.resultat?.credits_annee_officiels != null)?.resultats.resultat.credits_annee_officiels;
  if (creditsAnnuels != null) doc.font("Helvetica-Bold").fontSize(10).text(`Total officiel des crédits de l’année : ${creditsAnnuels}`);
  doc.font("Helvetica").fontSize(8).text("Moyenne annuelle calculée comme la moyenne simple des moyennes semestrielles, sans pondération par les crédits.");
  const x0 = 42;
  const widths = [132, 205, 62, 105];
  const titles = ["UE", "EC", "Note /20", "Crédits UE"];
  for (const { semestre, resultats } of sections) {
    doc.moveDown(1);
    if (doc.y > 700) doc.addPage();
    doc.font("Helvetica-Bold").fontSize(12).fillColor("#173b63").text(`Semestre ${semestre.numero} — Moyenne : ${resultats.resultat.moyenne_generale} / 20`);
    let y = doc.y + 7;
    const tableWidth = widths.reduce((a, b) => a + b, 0);
    const drawHeader = () => {
      doc.rect(x0, y, tableWidth, 21).fill("#173b63");
      doc.font("Helvetica-Bold").fontSize(8).fillColor("#ffffff");
      let x = x0;
      titles.forEach((title, i) => { doc.text(title, x + 5, y + 6, { width: widths[i] - 10 }); x += widths[i]; });
      y += 21;
    };
    drawHeader();
    const resumeUE = new Map(resultats.unites_enseignement.map((ue) => [ue.id, ue]));
    const notes = resultats.notes.filter((n) => n.session === "normale");
    notes.forEach((note, index) => {
      const ue = resumeUE.get(note.ue_id);
      const credits = Number(ue?.credits ?? note.ue_credits) || 0;
      const obtenu = Number(ue?.credits_obtenus) || 0;
      const complet = !ue || Number(ue.nb_notes) === Number(ue.nb_ec);
      const values = [`${note.ue_code ? `${note.ue_code} — ` : ""}${note.ue || ""}`, note.matiere, Number(note.valeur).toFixed(2), `${complet ? obtenu : 0} / ${credits}`];
      const heights = values.map((v, i) => doc.heightOfString(String(v), { width: widths[i] - 10 }));
      const height = Math.max(21, ...heights.map((h) => h + 8));
      if (y + height > doc.page.height - 42) { doc.addPage(); y = 42; drawHeader(); }
      doc.rect(x0, y, tableWidth, height).fill(index % 2 ? "#f1f6fa" : "#ffffff");
      doc.font("Helvetica").fontSize(8).fillColor("#1c2d3d");
      let x = x0;
      values.forEach((value, i) => { doc.text(String(value), x + 5, y + 4, { width: widths[i] - 10, align: i > 1 ? "center" : "left" }); x += widths[i]; });
      doc.strokeColor("#dce5ee").moveTo(x0, y + height).lineTo(x0 + tableWidth, y + height).stroke();
      y += height;
    });
    doc.y = y;
  }
  doc.moveDown(1);
  doc.font("Helvetica").fontSize(8).fillColor("#586a7a").text("Note finale d’un EC : moyenne du CC et de l’ET. Les crédits d’une UE sont obtenus si sa moyenne atteint 12/20.");
  doc.moveDown(1);
  doc.text(`Document généré le ${new Date().toLocaleDateString("fr-FR")} — Plateforme de résultats IFSIO.`, { align: "center" });
  doc.end();
}

async function genererRelevePublic({ matricule, filiere, niveau, semestreId, session = "normale" }, res) {
  const { rows } = await query(
    `SELECT e.id FROM etudiant e JOIN filiere f ON f.id=e.filiere_id JOIN promotion p ON p.id=e.promotion_id
     WHERE upper(trim(e.matricule))=upper(trim($1)) AND f.code=$2 AND p.niveau=$3 AND e.statut='actif' LIMIT 1`,
    [matricule, filiere, niveau]
  );
  if (!rows[0]) throw new AppError("Aucun résultat publié ne correspond à ces informations.", 404, "INTROUVABLE");
  return genererReleve(rows[0].id, semestreId, res, session);
}

async function genererReleveAnnuelPublic({ matricule, filiere, niveau, annee }, res) {
  const { rows } = await query(
    `SELECT e.id FROM etudiant e JOIN filiere f ON f.id=e.filiere_id JOIN promotion p ON p.id=e.promotion_id
     WHERE upper(trim(e.matricule))=upper(trim($1)) AND f.code=$2 AND p.niveau=$3 AND e.statut='actif' LIMIT 1`,
    [matricule, filiere, niveau]
  );
  if (!rows[0]) throw new AppError("Aucun résultat publié ne correspond à ces informations.", 404, "INTROUVABLE");
  return genererReleveAnnuel(rows[0].id, annee, res);
}

module.exports = { genererReleve, genererReleveAnnuel, genererRelevePublic, genererReleveAnnuelPublic };
