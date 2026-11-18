const { query, withTransaction } = require("../../db/pool");
const { AppError } = require("../../middleware/errorHandler");
const { determinerDecision } = require("./calculs");

/**
 * Enregistre (ou met à jour) une note en statut "brouillon".
 * Toute modification est journalisée dans journal_modification.
 * Si une note publiée est corrigée, elle repasse en "brouillon"
 * (elle doit être re-vérifiée et re-publiée explicitement).
 */
async function saisirNoteAvecClient(client, { etudiant_id, matiere_id, valeur, session }, auteurId) {
    const existante = await client.query(
      `SELECT * FROM note WHERE etudiant_id = $1 AND matiere_id = $2 AND session = $3`,
      [etudiant_id, matiere_id, session]
    );

    // Une modification de note invalide les résultats calculés du semestre concerné :
    // le resultat_semestre repasse en 'brouillon' (qu'il soit 'verifie' ou 'publie')
    // pour imposer une re-vérification et une re-publication explicites.
    await remettreResultatEnBrouillon(client, etudiant_id, matiere_id, auteurId);

    let note;
    if (existante.rows[0]) {
      const ancienne = existante.rows[0];
      const { rows } = await client.query(
        `UPDATE note
         SET valeur = $1, statut_publication = 'brouillon', saisi_par = $2, date_saisie = now(),
             valide_par = NULL, date_publication = NULL
         WHERE id = $3
         RETURNING *`,
        [valeur, auteurId, ancienne.id]
      );
      note = rows[0];
      await client.query(
        `INSERT INTO journal_modification (table_cible, ligne_id, action, ancienne_valeur, nouvelle_valeur, auteur_id)
         VALUES ('note', $1, 'modification', $2, $3, $4)`,
        [note.id, JSON.stringify({ valeur: ancienne.valeur, statut: ancienne.statut_publication }), JSON.stringify({ valeur, statut: "brouillon" }), auteurId]
      );
    } else {
      const { rows } = await client.query(
        `INSERT INTO note (etudiant_id, matiere_id, valeur, session, statut_publication, saisi_par)
         VALUES ($1, $2, $3, $4, 'brouillon', $5)
         RETURNING *`,
        [etudiant_id, matiere_id, valeur, session, auteurId]
      );
      note = rows[0];
      await client.query(
        `INSERT INTO journal_modification (table_cible, ligne_id, action, nouvelle_valeur, auteur_id)
         VALUES ('note', $1, 'creation', $2, $3)`,
        [note.id, JSON.stringify({ valeur, statut: "brouillon" }), auteurId]
      );
    }
    return note;
}

async function saisirNote(note, auteurId) {
  return withTransaction((client) => saisirNoteAvecClient(client, note, auteurId));
}

/**
 * Repasse le resultat_semestre de l'étudiant pour le semestre de la matière en
 * 'brouillon' si une ligne calculée existe (et n'est pas déjà en brouillon).
 * L'ancienne valeur est journalisée pour la traçabilité.
 */
async function remettreResultatEnBrouillon(client, etudiantId, matiereId, auteurId) {
  const { rows: semestreRows } = await client.query(
    `SELECT ue.semestre_id FROM matiere m JOIN ue ON ue.id = m.ue_id WHERE m.id = $1`,
    [matiereId]
  );
  const semestreId = semestreRows[0]?.semestre_id;
  if (!semestreId) return;

  const { rows } = await client.query(
    `UPDATE resultat_semestre
     SET statut_publication = 'brouillon', calcule_le = NULL, publie_le = NULL
     WHERE etudiant_id = $1 AND semestre_id = $2 AND statut_publication <> 'brouillon'
     RETURNING id, statut_publication`,
    [etudiantId, semestreId]
  );

  if (rows[0]) {
    await client.query(
      `INSERT INTO journal_modification (table_cible, ligne_id, action, ancienne_valeur, nouvelle_valeur, auteur_id)
       VALUES ('resultat_semestre', $1, 'modification', $2, $3, $4)`,
      [rows[0].id, JSON.stringify({ statut: rows[0].statut_publication }), JSON.stringify({ statut: "brouillon" }), auteurId]
    );
  }
}

async function saisirNotesLot(notes, auteurId) {
  return withTransaction(async (client) => {
    const resultats = [];
    for (const note of notes) resultats.push(await saisirNoteAvecClient(client, note, auteurId));
    return resultats;
  });
}

async function enregistrerCreditsOfficielsAvecClient(client, totaux, promotionId, semestreId, auteurId) {
  if (!totaux?.length) return 0;
    const { rows: semestre } = await client.query(
      `SELECT id FROM semestre WHERE id = $1 AND promotion_id = $2`, [semestreId, promotionId]
    );
    if (!semestre.length) throw new AppError("Le semestre ne correspond pas à la promotion sélectionnée.", 422, "SEMESTRE_INVALIDE");

    for (const total of totaux) {
      const { rows: etudiants } = await client.query(
        `SELECT id FROM etudiant WHERE id = $1 AND promotion_id = $2 AND statut = 'actif'`,
        [total.etudiant_id, promotionId]
      );
      if (!etudiants.length) throw new AppError("Un total de crédits référence un étudiant hors de la promotion.", 422, "ETUDIANT_INVALIDE");

      const { rows } = await client.query(
        `INSERT INTO resultat_semestre
           (etudiant_id, semestre_id, credits_semestre_officiels, credits_annee_officiels, statut_publication)
         VALUES ($1, $2, $3, $4, 'brouillon')
         ON CONFLICT (etudiant_id, semestre_id) DO UPDATE
           SET credits_semestre_officiels = COALESCE(EXCLUDED.credits_semestre_officiels, resultat_semestre.credits_semestre_officiels),
               credits_annee_officiels = COALESCE(EXCLUDED.credits_annee_officiels, resultat_semestre.credits_annee_officiels),
               statut_publication = 'brouillon', calcule_le = NULL, publie_le = NULL
         RETURNING id, credits_semestre_officiels, credits_annee_officiels`,
        [total.etudiant_id, semestreId, total.credits_semestre, total.credits_annee]
      );
      await client.query(
        `INSERT INTO journal_modification (table_cible, ligne_id, action, nouvelle_valeur, auteur_id)
         VALUES ('resultat_semestre', $1, 'modification', $2, $3)`,
        [rows[0].id, JSON.stringify({ credits_semestre_officiels: rows[0].credits_semestre_officiels, credits_annee_officiels: rows[0].credits_annee_officiels }), auteurId]
      );
    }
    return totaux.length;
}

async function enregistrerCreditsOfficiels(totaux, promotionId, semestreId, auteurId) {
  if (!totaux?.length) return 0;
  return withTransaction((client) => enregistrerCreditsOfficielsAvecClient(client, totaux, promotionId, semestreId, auteurId));
}

async function confirmerImport(notes, credits, promotionId, semestreId, auteurId) {
  return withTransaction(async (client) => {
    const notesEnregistrees = [];
    for (const note of notes || []) {
      const { rows } = await client.query(
        `SELECT 1 FROM etudiant e JOIN matiere m ON m.id=$2 JOIN ue ON ue.id=m.ue_id
         WHERE e.id=$1 AND e.promotion_id=$3 AND e.statut='actif' AND ue.semestre_id=$4`,
        [note.etudiant_id, note.matiere_id, promotionId, semestreId]
      );
      if (!rows.length) throw new AppError("Une note ne correspond pas à un étudiant et une matière de la promotion/du semestre sélectionné.", 422, "NOTE_HORS_PROMOTION");
      notesEnregistrees.push(await saisirNoteAvecClient(client, note, auteurId));
    }
    const nbCredits = await enregistrerCreditsOfficielsAvecClient(client, credits, promotionId, semestreId, auteurId);
    return { notes: notesEnregistrees, nb_credits: nbCredits };
  });
}

/**
 * Calcule la moyenne générale comme moyenne simple des moyennes d'UE,
 * à partir des notes finales d'EC en session normale.
 */
async function calculerMoyenneSemestre(etudiantId, semestreId) {
  const { rows } = await query(
    `SELECT AVG(n.valeur)::numeric AS moyenne_ue
     FROM note n
     JOIN matiere m ON m.id = n.matiere_id
     JOIN ue ON ue.id = m.ue_id
     WHERE n.etudiant_id = $1 AND ue.semestre_id = $2 AND n.session = 'normale'
     GROUP BY ue.id`,
    [etudiantId, semestreId]
  );

  if (rows.length === 0) return null;
  const moyennesUE = rows.map((row) => Number(row.moyenne_ue)).filter(Number.isFinite);
  if (moyennesUE.length === 0) return null;
  const moyenne = moyennesUE.reduce((sum, value) => sum + value, 0) / moyennesUE.length;
  return Math.round(moyenne * 100) / 100;
}

/**
 * Recalcule et enregistre resultat_semestre pour tous les étudiants d'une promotion,
 * en statut "brouillon" ou "verifie" selon le paramètre.
 */
async function recalculerResultatsSemestre(promotionId, semestreId, nouveauStatut, auteurId) {
  const { rows: etudiants } = await query(
    `SELECT id FROM etudiant WHERE promotion_id = $1 AND statut = 'actif'`,
    [promotionId]
  );

  const resultats = [];
  for (const e of etudiants) {
    const moyenne = await calculerMoyenneSemestre(e.id, semestreId);
    const { rows } = await query(
      `INSERT INTO resultat_semestre (etudiant_id, semestre_id, moyenne_generale, decision, statut_publication, calcule_le)
       VALUES ($1, $2, $3, NULL, $4, now())
       ON CONFLICT (etudiant_id, semestre_id)
       DO UPDATE SET moyenne_generale = $3, decision = NULL, statut_publication = $4, calcule_le = now()
       RETURNING *`,
      [e.id, semestreId, moyenne, nouveauStatut]
    );
    resultats.push(rows[0]);
  }

  await query(
    `INSERT INTO journal_modification (table_cible, ligne_id, action, nouvelle_valeur, auteur_id)
     VALUES ('resultat_semestre', $1, 'modification', $2, $3)`,
    [semestreId, JSON.stringify({ promotion_id: promotionId, statut: nouveauStatut, nb_etudiants: resultats.length }), auteurId]
  );

  return resultats;
}

async function verifierNotesCompletes(promotionId, semestreId) {
  const { rows: etudiants } = await query(
    `SELECT id FROM etudiant WHERE promotion_id = $1 AND statut = 'actif'`,
    [promotionId]
  );
  if (etudiants.length === 0) {
    throw new AppError("Aucun étudiant actif dans cette promotion.", 409, "PROMOTION_VIDE");
  }

  const { rows: matieres } = await query(
    `SELECT m.id
     FROM matiere m JOIN ue ON ue.id = m.ue_id
     WHERE ue.semestre_id = $1`,
    [semestreId]
  );
  if (matieres.length === 0) {
    throw new AppError("Aucune matière n'est configurée pour ce semestre.", 409, "SEMESTRE_SANS_MATIERE");
  }

  const { rows: incomplets } = await query(
    `SELECT e.matricule, COUNT(DISTINCT n.matiere_id)::int AS nb_notes
     FROM etudiant e
     LEFT JOIN note n
       ON n.etudiant_id = e.id
      AND n.session = 'normale'
      AND n.matiere_id = ANY($2::uuid[])
     WHERE e.promotion_id = $1 AND e.statut = 'actif'
     GROUP BY e.id, e.matricule
     HAVING COUNT(DISTINCT n.matiere_id) <> cardinality($2::uuid[])
     ORDER BY e.matricule`,
    [promotionId, matieres.map((m) => m.id)]
  );
  if (incomplets.length > 0) {
    const exemples = incomplets.slice(0, 5).map((e) => e.matricule).join(", ");
    const suffixe = incomplets.length > 5 ? "…" : "";
    throw new AppError(
      `Vérification impossible : ${incomplets.length} étudiant(s) n'ont pas une note normale pour chaque matière (${exemples}${suffixe}).`,
      409,
      "NOTES_INCOMPLETES"
    );
  }
}

/** Étape 1 → 2 du workflow : marque les résultats d'une promotion/semestre comme "vérifié" */
async function verifierResultats(promotionId, semestreId, auteurId) {
  await verifierNotesCompletes(promotionId, semestreId);
  return recalculerResultatsSemestre(promotionId, semestreId, "verifie", auteurId);
}

/**
 * Étape 2 → 3 du workflow : publie les résultats.
 * Ne peut publier que des résultats actuellement au statut "verifie".
 * Met aussi à jour les notes individuelles associées vers "publie".
 */
async function publierResultats(promotionId, semestreId, auteurId) {
  // Protège aussi les lignes « vérifié » héritées d'une version précédente,
  // où le workflow n'imposait pas encore la présence de toutes les notes.
  await verifierNotesCompletes(promotionId, semestreId);
  return withTransaction(async (client) => {
    const { rows: aPublier } = await client.query(
      `SELECT rs.id, rs.etudiant_id FROM resultat_semestre rs
       JOIN etudiant e ON e.id = rs.etudiant_id
       WHERE e.promotion_id = $1 AND e.statut = 'actif'
         AND rs.semestre_id = $2 AND rs.statut_publication = 'verifie'`,
      [promotionId, semestreId]
    );

    if (aPublier.length === 0) {
      throw new AppError(
        "Aucun résultat au statut 'vérifié' pour cette promotion et ce semestre. Vérifiez avant de publier.",
        409,
        "PUBLICATION_IMPOSSIBLE"
      );
    }

    await client.query(
      `UPDATE resultat_semestre SET statut_publication = 'publie', publie_le = now()
       WHERE semestre_id = $1 AND etudiant_id = ANY($2::uuid[])`,
      [semestreId, aPublier.map((r) => r.etudiant_id)]
    );

    await client.query(
      `UPDATE note SET statut_publication = 'publie', valide_par = $3, date_publication = now()
       WHERE etudiant_id = ANY($1::uuid[])
         AND matiere_id IN (SELECT m.id FROM matiere m JOIN ue ON ue.id = m.ue_id WHERE ue.semestre_id = $2)`,
      [aPublier.map((r) => r.etudiant_id), semestreId, auteurId]
    );

    await client.query(
      `INSERT INTO journal_modification (table_cible, ligne_id, action, nouvelle_valeur, auteur_id)
       VALUES ('resultat_semestre', $1, 'publication', $2, $3)`,
      [semestreId, JSON.stringify({ promotion_id: promotionId, nb_etudiants: aPublier.length }), auteurId]
    );

    return { nb_publies: aPublier.length, etudiant_ids: aPublier.map((r) => r.etudiant_id) };
  });
}

async function publierUnites(promotionId, semestreId, ueIds, auteurId) {
  const ids = [...new Set((ueIds || []).filter((id) => typeof id === "string"))];
  if (!ids.length) throw new AppError("Sélectionnez au moins une UE à publier.", 422, "UE_REQUISE");
  return withTransaction(async (client) => {
    const { rows: unites } = await client.query(
      `SELECT ue.id FROM ue WHERE ue.semestre_id=$1 AND ue.id=ANY($2::uuid[])`, [semestreId, ids]
    );
    if (unites.length !== ids.length) throw new AppError("Une UE sélectionnée ne correspond pas à ce semestre.", 422, "UE_INVALIDE");
    const { rows: incomplets } = await client.query(
      `SELECT e.matricule, ue.id AS ue_id, ue.libelle, COUNT(DISTINCT m.id)::int AS nb_ec,
              COUNT(DISTINCT n.matiere_id)::int AS nb_notes
       FROM etudiant e CROSS JOIN ue
       JOIN matiere m ON m.ue_id=ue.id
       LEFT JOIN note n ON n.etudiant_id=e.id AND n.matiere_id=m.id AND n.session='normale'
       WHERE e.promotion_id=$1 AND e.statut='actif' AND ue.id=ANY($2::uuid[])
       GROUP BY e.id,e.matricule,ue.id,ue.libelle
       HAVING COUNT(DISTINCT n.matiere_id) <> COUNT(DISTINCT m.id)`, [promotionId, ids]
    );
    if (incomplets.length) throw new AppError(`Publication impossible : toutes les notes des UE sélectionnées doivent être saisies pour chaque étudiant (ex. ${incomplets[0].matricule}, ${incomplets[0].libelle}).`, 409, "UE_INCOMPLETE");
    const { rows: notes } = await client.query(
      `UPDATE note SET statut_publication='publie',valide_par=$4,date_publication=now()
       WHERE session='normale' AND etudiant_id IN (SELECT id FROM etudiant WHERE promotion_id=$1 AND statut='actif')
         AND matiere_id IN (SELECT m.id FROM matiere m WHERE m.ue_id=ANY($2::uuid[]) AND m.ue_id IN (SELECT id FROM ue WHERE semestre_id=$3))
       RETURNING etudiant_id`, [promotionId, ids, semestreId, auteurId]
    );
    await client.query(
      `INSERT INTO journal_modification (table_cible,ligne_id,action,nouvelle_valeur,auteur_id)
       VALUES ('resultat_semestre',$1,'publication_partielle',$2,$3)`,
      [semestreId, JSON.stringify({ promotion_id: promotionId, ue_ids: ids, nb_notes: notes.length }), auteurId]
    );
    return { nb_notes_publiees: notes.length, ue_ids: ids, etudiant_ids: [...new Set(notes.map((n) => n.etudiant_id))] };
  });
}

async function obtenirResultatsEtudiant(etudiantId, semestreId, { seulementPublies = true, session = "normale", permettrePartiel = false } = {}) {
  const filtreStatut = seulementPublies ? "AND n.statut_publication = 'publie'" : "";
  const { rows: notes } = await query(
    `SELECT n.id, n.matiere_id, n.valeur, n.session, n.statut_publication,
            m.libelle AS matiere, m.coefficient,
            ue.id AS ue_id, ue.code AS ue_code, ue.libelle AS ue, ue.credits AS ue_credits
     FROM note n
     JOIN matiere m ON m.id = n.matiere_id
     JOIN ue ON ue.id = m.ue_id
     WHERE n.etudiant_id = $1 AND ue.semestre_id = $2 AND n.session = $3 ${filtreStatut}
     ORDER BY ue.code, m.libelle`,
    [etudiantId, semestreId, session]
  );

  const { rows: unitesEnseignement } = await query(
    `SELECT ue.id, ue.code, ue.libelle, ue.credits,
            COUNT(m.id)::int AS nb_ec,
            COUNT(n.id)::int AS nb_notes,
            ROUND(AVG(n.valeur)::numeric, 2) AS moyenne_ec,
            CASE
              WHEN ue.credits IS NULL THEN NULL
              WHEN COUNT(n.id) = COUNT(m.id) AND AVG(n.valeur) >= 12 THEN ue.credits
              ELSE 0
            END AS credits_obtenus
     FROM ue
     JOIN matiere m ON m.ue_id = ue.id
     LEFT JOIN note n
       ON n.matiere_id = m.id AND n.etudiant_id = $1 AND n.session = $3
       ${filtreStatut}
     WHERE ue.semestre_id = $2 ${permettrePartiel ? "AND EXISTS (SELECT 1 FROM note np JOIN matiere mp ON mp.id=np.matiere_id WHERE mp.ue_id=ue.id AND np.etudiant_id=$1 AND np.session=$3 AND np.statut_publication='publie')" : ""}
     GROUP BY ue.id
     ORDER BY ue.code`,
    [etudiantId, semestreId, session]
  );

  const { rows: resultatRows } = await query(
    `SELECT moyenne_generale, decision, credits_semestre_officiels, credits_annee_officiels, statut_publication, publie_le
     FROM resultat_semestre WHERE etudiant_id = $1 AND semestre_id = $2`,
    [etudiantId, semestreId]
  );

  const resultat = resultatRows[0] || null;
  const resultatPublie = Boolean(resultat && resultat.statut_publication === "publie");
  if (seulementPublies && !resultatPublie && !(permettrePartiel && notes.length > 0)) {
    return { publie: false, notes: [], resultat: null };
  }

  return { publie: true, partiel: !resultatPublie, notes, resultat: resultatPublie ? resultat : null, unites_enseignement: unitesEnseignement };
}

async function obtenirResultatsAffiches(etudiantId, semestreId, session = "normale") {
  const normal = await obtenirResultatsEtudiant(etudiantId, semestreId, { seulementPublies: true, session: "normale", permettrePartiel: true });
  if (session === "normale") return normal;
  const rattrapage = await obtenirResultatsEtudiant(etudiantId, semestreId, { seulementPublies: true, session: "rattrapage", permettrePartiel: true });
  const notesParEC = new Map(normal.notes.map((note) => [note.matiere_id, note]));
  rattrapage.notes.forEach((note) => notesParEC.set(note.matiere_id, note));
  const notes = [...notesParEC.values()].sort((a, b) => String(a.ue_code).localeCompare(String(b.ue_code)) || String(a.matiere).localeCompare(String(b.matiere)));
  const unites = new Map([...normal.unites_enseignement, ...rattrapage.unites_enseignement].map((ue) => [ue.id, ue]));
  const parUE = new Map();
  notes.forEach((note) => { const liste = parUE.get(note.ue_id) || []; liste.push(Number(note.valeur)); parUE.set(note.ue_id, liste); });
  const unites_enseignement = [...unites.values()].filter((ue) => parUE.has(ue.id)).map((ue) => {
    const valeurs = parUE.get(ue.id);
    const moyenne = valeurs.reduce((sum, valeur) => sum + valeur, 0) / valeurs.length;
    const complete = valeurs.length === Number(ue.nb_ec);
    return { ...ue, nb_notes: valeurs.length, moyenne_ec: moyenne.toFixed(2), credits_obtenus: ue.credits == null ? null : (complete && moyenne >= 12 ? ue.credits : 0) };
  });
  const resultat = rattrapage.resultat || normal.resultat || null;
  return { publie: notes.length > 0, partiel: !resultat, notes, resultat, unites_enseignement };
}

/**
 * Récupère toutes les notes (tous statuts confondus) des étudiants d'une promotion
 * pour un semestre — utilisé par l'écran de saisie du back-office scolarité.
 */
async function obtenirNotesPromotion(promotionId, semestreId) {
  const { rows: etudiants } = await query(
    `SELECT id, matricule, nom, prenoms
     FROM etudiant WHERE promotion_id = $1 AND statut = 'actif' ORDER BY nom, prenoms`,
    [promotionId]
  );

  const { rows: matieres } = await query(
    `SELECT m.id, m.libelle, m.coefficient, ue.id AS ue_id, ue.libelle AS ue
     FROM matiere m JOIN ue ON ue.id = m.ue_id
     WHERE ue.semestre_id = $1 ORDER BY ue.libelle, m.libelle`,
    [semestreId]
  );

  const { rows: notes } = await query(
    `SELECT n.id, n.etudiant_id, n.matiere_id, n.valeur, n.session, n.statut_publication
     FROM note n
     WHERE n.etudiant_id IN (SELECT id FROM etudiant WHERE promotion_id = $1)
       AND n.matiere_id IN (SELECT m.id FROM matiere m JOIN ue ON ue.id = m.ue_id WHERE ue.semestre_id = $2)`,
    [promotionId, semestreId]
  );

  const { rows: resultats } = await query(
    `SELECT rs.etudiant_id, rs.moyenne_generale, rs.decision, rs.statut_publication, rs.publie_le
     FROM resultat_semestre rs
     JOIN etudiant e ON e.id = rs.etudiant_id
     WHERE e.promotion_id = $1 AND rs.semestre_id = $2`,
    [promotionId, semestreId]
  );

  return { etudiants, matieres, notes, resultats };
}

/**
 * Semestres pour lesquels l'étudiant dispose de résultats publiés —
 * liste de consultation côté portail étudiant.
 */
async function listerSemestresPubliesEtudiant(etudiantId) {
  const { rows } = await query(
    `SELECT DISTINCT sa.id, sa.numero, aa.libelle AS annee_academique
     FROM semestre sa JOIN annee_academique aa ON aa.id = sa.annee_academique_id
     WHERE EXISTS (SELECT 1 FROM resultat_semestre rs WHERE rs.semestre_id=sa.id AND rs.etudiant_id=$1 AND rs.statut_publication='publie')
        OR EXISTS (SELECT 1 FROM note n JOIN matiere m ON m.id=n.matiere_id JOIN ue ON ue.id=m.ue_id WHERE ue.semestre_id=sa.id AND n.etudiant_id=$1 AND n.statut_publication='publie')
     ORDER BY aa.libelle DESC, sa.numero DESC`,
    [etudiantId]
  );
  return rows;
}

/** Dernières entrées du journal de traçabilité (back-office scolarité). */
async function listerJournal(limite = 100) {
  const { rows } = await query(
    `SELECT j.id, j.table_cible, j.action, j.ancienne_valeur, j.nouvelle_valeur,
            j.date, u.nom AS auteur
     FROM journal_modification j
     LEFT JOIN utilisateur_scolarite u ON u.id = j.auteur_id
     ORDER BY j.date DESC
     LIMIT $1`,
    [Math.min(Math.max(parseInt(limite, 10) || 100, 1), 500)]
  );
  return rows;
}

module.exports = {
  saisirNote,
  saisirNotesLot,
  confirmerImport,
  enregistrerCreditsOfficiels,
  calculerMoyenneSemestre,
  determinerDecision,
  verifierResultats,
  publierResultats,
  publierUnites,
  obtenirResultatsEtudiant,
  obtenirResultatsAffiches,
  obtenirNotesPromotion,
  listerSemestresPubliesEtudiant,
  listerJournal,
};
