const express = require("express");
const { validate } = require("../../middleware/validate");
const { authenticate, requireScolarite, requireEtudiant, requireRole } = require("../../middleware/auth");
const { saisirNoteSchema, saisirNotesLotSchema, changerStatutSchema } = require("./notes.schemas");
const notesService = require("./notes.service");
const notificationsService = require("../notifications/notifications.service");

const router = express.Router();

// Consultation publique par matricule, limitée aux notes effectivement publiées.
router.get("/consultation", async (req, res, next) => {
  try {
    const { matricule, filiere, niveau, session } = req.query;
    if (!matricule || !filiere || !["L1", "L2", "L3"].includes(niveau) || !["normale", "rattrapage"].includes(session)) {
      return res.status(400).json({ erreur: { message: "Choisissez l'école, le niveau et la session, puis saisissez votre matricule." } });
    }
    const { rows } = await require("../../db/pool").query(
      `SELECT e.id, e.matricule, e.nom, e.prenoms, f.code AS filiere, f.libelle AS filiere_libelle, p.niveau
       FROM etudiant e JOIN filiere f ON f.id=e.filiere_id JOIN promotion p ON p.id=e.promotion_id
       WHERE upper(trim(e.matricule))=upper(trim($1)) AND f.code=$2 AND p.niveau=$3 AND e.statut='actif'
       LIMIT 1`, [matricule, filiere, niveau]
    );
    const etudiant = rows[0];
    if (!etudiant) return res.status(404).json({ erreur: { message: "Aucun résultat publié ne correspond à ces informations." } });
    const semestres = await notesService.listerSemestresPubliesEtudiant(etudiant.id);
    const resultats = [];
    for (const semestre of semestres) {
      const data = await notesService.obtenirResultatsAffiches(etudiant.id, semestre.id, session);
      if (data.publie && data.notes.length) resultats.push({ semestre, ...data });
    }
    if (!resultats.length) return res.status(404).json({ erreur: { message: "Aucun résultat publié pour cette session." } });
    res.json({ etudiant: { matricule: etudiant.matricule, nom: etudiant.nom, prenoms: etudiant.prenoms, filiere: etudiant.filiere_libelle, niveau: etudiant.niveau }, session, resultats });
  } catch (err) { next(err); }
});

// POST /api/notes  — saisie d'une note unique (scolarité uniquement)
router.post("/", authenticate, requireScolarite, validate(saisirNoteSchema), async (req, res, next) => {
  try {
    const note = await notesService.saisirNote(req.body, req.auth.id);
    res.status(201).json(note);
  } catch (err) {
    next(err);
  }
});

// POST /api/notes/lot — saisie multiple (utilisé par la saisie manuelle en tableau, et après import)
router.post("/lot", authenticate, requireScolarite, validate(saisirNotesLotSchema), async (req, res, next) => {
  try {
    const notes = await notesService.saisirNotesLot(req.body.notes, req.auth.id);
    res.status(201).json({ nb_enregistrees: notes.length, notes });
  } catch (err) {
    next(err);
  }
});

// POST /api/notes/verifier — étape 1→2 du workflow (responsable/admin uniquement)
router.post(
  "/verifier",
  authenticate,
  requireScolarite,
  requireRole("responsable", "admin"),
  validate(changerStatutSchema),
  async (req, res, next) => {
    try {
      const { promotion_id, semestre_id } = req.body;
      const resultats = await notesService.verifierResultats(promotion_id, semestre_id, req.auth.id);
      res.json({ message: "Résultats vérifiés.", nb_etudiants: resultats.length, resultats });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/notes/publier — étape 2→3 du workflow (responsable/admin uniquement)
// Déclenche également l'envoi des notifications aux étudiants concernés.
router.post(
  "/publier",
  authenticate,
  requireScolarite,
  requireRole("responsable", "admin"),
  validate(changerStatutSchema),
  async (req, res, next) => {
    try {
      const { promotion_id, semestre_id } = req.body;
      const resultat = await notesService.publierResultats(promotion_id, semestre_id, req.auth.id);
      // La notification est déclenchée de façon asynchrone, sans bloquer la réponse HTTP :
      // un échec d'envoi SMS/email ne doit jamais annuler une publication déjà actée.
      notificationsService
        .notifierPublication(resultat.etudiant_ids, semestre_id)
        .catch((err) => console.error("[notifications] échec de l'envoi après publication", err));

      res.json({ message: "Résultats publiés. Notifications en cours d'envoi.", ...resultat });
    } catch (err) {
      next(err);
    }
  }
);

router.post("/publier-partiel", authenticate, requireScolarite, requireRole("responsable", "admin"), async (req, res, next) => {
  try {
    const { promotion_id: promotionId, semestre_id: semestreId, ue_ids: ueIds } = req.body || {};
    if (!promotionId || !semestreId || !Array.isArray(ueIds) || !ueIds.length) {
      return res.status(422).json({ erreur: { message: "Promotion, semestre et au moins une UE sont requis." } });
    }
    const resultat = await notesService.publierUnites(promotionId, semestreId, ueIds, req.auth.id);
    notificationsService.notifierPublication(resultat.etudiant_ids, semestreId)
      .catch((err) => console.error("[notifications] échec après publication partielle", err));
    res.json({ message: "UE sélectionnées publiées.", ...resultat });
  } catch (err) { next(err); }
});

// GET /api/notes/moi/semestres — semestres publiés consultables par l'étudiant connecté
// (déclaré avant /moi/:semestreId pour éviter la capture du segment)
router.get("/moi/semestres", authenticate, requireEtudiant, async (req, res, next) => {
  try {
    const semestres = await notesService.listerSemestresPubliesEtudiant(req.auth.id);
    res.json(semestres);
  } catch (err) {
    next(err);
  }
});

// GET /api/notes/moi/:semestreId — un étudiant consulte ses propres résultats publiés
router.get("/moi/:semestreId", authenticate, requireEtudiant, async (req, res, next) => {
  try {
    const resultats = await notesService.obtenirResultatsEtudiant(req.auth.id, req.params.semestreId, {
      seulementPublies: true,
    });
    res.json(resultats);
  } catch (err) {
    next(err);
  }
});

// GET /api/notes/promotion/:promotionId/:semestreId — tableau complet pour le back-office
router.get("/promotion/:promotionId/:semestreId", authenticate, requireScolarite, async (req, res, next) => {
  try {
    const donnees = await notesService.obtenirNotesPromotion(req.params.promotionId, req.params.semestreId);
    res.json(donnees);
  } catch (err) {
    next(err);
  }
});

// GET /api/notes/etudiant/:etudiantId/:semestreId — la scolarité consulte tout, y compris brouillons
router.get("/etudiant/:etudiantId/:semestreId", authenticate, requireScolarite, async (req, res, next) => {
  try {
    const resultats = await notesService.obtenirResultatsEtudiant(req.params.etudiantId, req.params.semestreId, {
      seulementPublies: false,
    });
    res.json(resultats);
  } catch (err) {
    next(err);
  }
});

// GET /api/notes/journal — journal de traçabilité (dernières entrées)
router.get("/journal", authenticate, requireScolarite, async (req, res, next) => {
  try {
    const journal = await notesService.listerJournal(req.query.limite);
    res.json(journal);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
