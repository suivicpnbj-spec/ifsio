const express = require("express");
const { validate } = require("../../middleware/validate");
const { authenticate, requireEtudiant } = require("../../middleware/auth");
const {
  loginEtudiantSchema,
  loginScolariteSchema,
  changerMotDePasseSchema,
} = require("./auth.schemas");
const authService = require("./auth.service");

const router = express.Router();

// POST /api/auth/etudiant/connexion
router.post("/etudiant/connexion", validate(loginEtudiantSchema), async (req, res, next) => {
  try {
    const { matricule, mot_de_passe } = req.body;
    const result = await authService.loginEtudiant(matricule, mot_de_passe);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/scolarite/connexion
router.post("/scolarite/connexion", validate(loginScolariteSchema), async (req, res, next) => {
  try {
    const { email, mot_de_passe } = req.body;
    const result = await authService.loginScolarite(email, mot_de_passe);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/etudiant/changer-mot-de-passe
router.post(
  "/etudiant/changer-mot-de-passe",
  authenticate,
  requireEtudiant,
  validate(changerMotDePasseSchema),
  async (req, res, next) => {
    try {
      const { ancien_mot_de_passe, nouveau_mot_de_passe } = req.body;
      await authService.changerMotDePasseEtudiant(req.auth.id, ancien_mot_de_passe, nouveau_mot_de_passe);
      res.json({ message: "Mot de passe mis à jour avec succès." });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
