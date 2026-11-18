const express = require("express");
const { z } = require("zod");
const { validate } = require("../../middleware/validate");
const { authenticate, requireScolarite } = require("../../middleware/auth");
const { creerEtudiantSchema } = require("./etudiants.schemas");
const etudiantsService = require("./etudiants.service");

const router = express.Router();

// POST /api/etudiants — création d'un compte étudiant (agent de scolarité)
router.post("/", authenticate, requireScolarite, validate(creerEtudiantSchema), async (req, res, next) => {
  try {
    const etudiant = await etudiantsService.creerEtudiant(req.body, req.auth.id);
    res.status(201).json(etudiant);
  } catch (err) {
    next(err);
  }
});

// GET /api/etudiants?promotion_id=... — liste des étudiants d'une promotion
router.get("/", authenticate, requireScolarite, async (req, res, next) => {
  try {
    const { promotion_id } = req.query;
    if (!promotion_id) {
      return res.status(422).json({ erreur: { message: "Le paramètre promotion_id est requis." } });
    }
    const etudiants = await etudiantsService.listerEtudiantsParPromotion(promotion_id);
    res.json(etudiants);
  } catch (err) {
    next(err);
  }
});

// POST /api/etudiants/:id/pin-sms — définit le code PIN utilisé pour le canal SMS
router.post(
  "/:id/pin-sms",
  authenticate,
  requireScolarite,
  validate(z.object({ pin: z.string().length(4) })),
  async (req, res, next) => {
    try {
      await etudiantsService.definirCodePinSms(req.params.id, req.body.pin, req.auth.id);
      res.json({ message: "Code PIN défini avec succès." });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
