const express = require("express");
const { authenticate, requireEtudiant } = require("../../middleware/auth");
const relevePdfService = require("./releve-pdf.service");

const router = express.Router();

// GET /api/resultats/releve/:semestreId — téléchargement du relevé PDF (étudiant connecté, ses propres résultats)
router.get("/releve/:semestreId", authenticate, requireEtudiant, async (req, res, next) => {
  try {
    await relevePdfService.genererReleve(req.auth.id, req.params.semestreId, res);
  } catch (err) {
    next(err);
  }
});

// Relevé annuel : regroupe les semestres publiés d'une année académique.
router.get("/releve-annuel", authenticate, requireEtudiant, async (req, res, next) => {
  try {
    await relevePdfService.genererReleveAnnuel(req.auth.id, req.query.annee, res);
  } catch (err) {
    next(err);
  }
});

router.get("/releve-public", async (req, res, next) => {
  try {
    const { matricule, filiere, niveau, semestre_id: semestreId, session } = req.query;
    if (!matricule || !["ESSFE", "ESIIE"].includes(filiere) || !["L1", "L2", "L3"].includes(niveau) || !semestreId || !["normale", "rattrapage"].includes(session)) {
      return res.status(400).json({ erreur: { message: "Paramètres de consultation invalides." } });
    }
    await relevePdfService.genererRelevePublic({ matricule, filiere, niveau, semestreId, session }, res);
  } catch (err) { next(err); }
});

router.get("/releve-annuel-public", async (req, res, next) => {
  try {
    const { matricule, filiere, niveau, annee } = req.query;
    if (!matricule || !["ESSFE", "ESIIE"].includes(filiere) || !["L1", "L2", "L3"].includes(niveau) || !annee) {
      return res.status(400).json({ erreur: { message: "Paramètres de consultation invalides." } });
    }
    await relevePdfService.genererReleveAnnuelPublic({ matricule, filiere, niveau, annee }, res);
  } catch (err) { next(err); }
});

module.exports = router;
