const express = require("express");
const multer = require("multer");
const { z } = require("zod");
const { authenticate, requireScolarite } = require("../../middleware/auth");
const { AppError } = require("../../middleware/errorHandler");
const importService = require("./import.service");
const notesService = require("./notes.service");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 Mo
  fileFilter: (req, file, cb) => {
    const typesAutorises = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
      "application/vnd.oasis.opendocument.spreadsheet", // .ods
      "text/csv", "application/csv", "text/plain", "application/vnd.ms-excel", // .csv
    ];
    const extensionOk = /\.(csv|xlsx|ods)$/i.test(file.originalname);
    if (!typesAutorises.includes(file.mimetype) || !extensionOk) {
      return cb(new AppError("Seuls les fichiers .xlsx, .ods et .csv sont acceptés.", 422, "FORMAT_INVALIDE"));
    }
    cb(null, true);
  },
});


const confirmationSchema = z.object({
  promotion_id: z.string().uuid(),
  semestre_id: z.string().uuid(),
  notes: z.array(z.object({
    etudiant_id: z.string().uuid(),
    matiere_id: z.string().uuid(),
    valeur: z.number().min(0).max(20),
    session: z.enum(["normale", "rattrapage"]),
  })),
  credits_officiels: z.array(z.object({
    etudiant_id: z.string().uuid(),
    credits_semestre: z.number().int().min(0).max(300).nullable(),
    credits_annee: z.number().int().min(0).max(600).nullable(),
  })).default([]),
}).refine((data) => data.notes.length > 0 || data.credits_officiels.length > 0, {
  message: "Le fichier ne contient aucune note ni total de crédits à importer.",
});

router.post("/confirmer", authenticate, requireScolarite, async (req, res, next) => {
  try {
    const params = confirmationSchema.safeParse(req.body);
    if (!params.success) throw new AppError("Les données confirmées sont invalides.", 422, "DONNEES_IMPORT_INVALIDE");
    const { notes, credits_officiels: credits, promotion_id: promotionId, semestre_id: semestreId } = params.data;
    const resultat = await notesService.confirmerImport(notes, credits, promotionId, semestreId, req.auth.id);
    res.status(201).json({ nb_enregistrees: resultat.notes.length, nb_totaux_credits: resultat.nb_credits });
  } catch (err) { next(err); }
});

router.post("/structure", authenticate, requireScolarite, upload.single("fichier"), async (req, res, next) => {
  try {
    if (!req.file) throw new AppError("Aucun fichier reçu.", 422, "FICHIER_MANQUANT");
    const params = z.object({ semestre_id: z.string().uuid() }).safeParse(req.body);
    if (!params.success) throw new AppError("Le semestre sélectionné est invalide.", 422, "PARAMETRE_INVALIDE");
    const structure = await importService.obtenirStructureImport(req.file.buffer, req.file.originalname, params.data.semestre_id);
    res.json(structure);
  } catch (err) { next(err); }
});

router.post("/configurer", authenticate, requireScolarite, upload.single("fichier"), async (req, res, next) => {
  try {
    if (!req.file) throw new AppError("Aucun fichier reçu.", 422, "FICHIER_MANQUANT");
    let mappings;
    try { mappings = JSON.parse(req.body.mappings || "[]"); }
    catch { throw new AppError("La configuration des colonnes est invalide.", 422, "MAPPING_INVALIDE"); }
    const params = z.object({
      promotion_id: z.string().uuid(), semestre_id: z.string().uuid(),
      session: z.enum(["normale", "rattrapage"]),
      ligne_entete: z.coerce.number().int().min(1),
      colonne_matricule: z.coerce.number().int().min(0),
      colonne_credits_semestre: z.coerce.number().int().min(0).max(79).optional(),
      colonne_credits_annee: z.coerce.number().int().min(0).max(79).optional(),
      mappings: z.array(z.object({ colonne: z.number().int().min(0), matiere_id: z.string().uuid() })).max(80),
    }).refine((data) => data.mappings.length > 0 || data.colonne_credits_semestre !== undefined || data.colonne_credits_annee !== undefined, {
      message: "Associez au moins une note ou un total officiel de crédits.",
    }).safeParse({ ...req.body, mappings });
    if (!params.success) throw new AppError("Les paramètres de configuration sont incomplets ou invalides.", 422, "MAPPING_INVALIDE");
    const rapport = await importService.analyserImportConfigure(req.file.buffer, { nomFichier: req.file.originalname, ...params.data });
    res.json(rapport);
  } catch (err) { next(err); }
});

// POST /api/notes/import?semestre_id=...&promotion_id=...&session=normale
// Analyse le fichier et retourne un rapport — n'écrit RIEN en base.
// L'agent doit ensuite appeler POST /api/notes/lot avec le champ `notes` du rapport
// pour confirmer l'écriture, après avoir revu les erreurs/avertissements.
router.post("/", authenticate, requireScolarite, upload.single("fichier"), async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError("Aucun fichier reçu (champ attendu : 'fichier').", 422, "FICHIER_MANQUANT");
    }
    const params = z.object({
      semestre_id: z.string().uuid(),
      promotion_id: z.string().uuid(),
      session: z.enum(["normale", "rattrapage"]).default("normale"),
    }).safeParse(req.query);
    if (!params.success) {
      throw new AppError("Les paramètres semestre_id, promotion_id ou session sont invalides.", 422, "PARAMETRE_INVALIDE");
    }
    const { semestre_id, promotion_id, session } = params.data;

    const rapport = await importService.analyserFichierNotes(req.file.buffer, semestre_id, promotion_id, session, {
      nomFichier: req.file.originalname,
    });
    res.json(rapport);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
