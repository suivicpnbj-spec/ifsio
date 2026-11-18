const express = require("express");
const { authenticate, requireScolarite } = require("../../middleware/auth");
const { AppError } = require("../../middleware/errorHandler");
const referentielService = require("./referentiel.service");

const router = express.Router();

function valider(condition, message) {
  if (!condition) {
    const err = new Error(message);
    err.statusCode = 422;
    throw err;
  }
}

function gestionnaire(fn) {
  return async (req, res, next) => {
    try { await fn(req, res); } catch (err) {
      if (err.code === "23505") return next(new AppError("Un élément portant ce code ou cette combinaison existe déjà.", 409, "REFERENTIEL_EXISTANT"));
      if (err.code === "23503") return next(new AppError("La filière, l’année, la promotion ou l’UE sélectionnée n’existe pas.", 422, "REFERENTIEL_INVALIDE"));
      next(err);
    }
  };
}

router.get("/filieres", authenticate, requireScolarite, async (req, res, next) => {
  try {
    res.json(await referentielService.listerFilieres());
  } catch (err) {
    next(err);
  }
});

router.get("/annees", authenticate, requireScolarite, gestionnaire(async (_req, res) => {
  res.json(await referentielService.listerAnnees());
}));

router.post("/annees", authenticate, requireScolarite, gestionnaire(async (req, res) => {
  const { libelle, date_debut, date_fin, active = false } = req.body || {};
  valider(/^\d{4}-\d{4}$/.test(libelle || ""), "L’année doit être au format AAAA-AAAA.");
  valider(date_debut && date_fin && date_fin > date_debut, "Les dates de l’année académique sont invalides.");
  res.status(201).json(await referentielService.creerAnnee({ libelle, date_debut, date_fin, active }));
}));

router.get("/promotions", authenticate, requireScolarite, async (req, res, next) => {
  try {
    res.json(await referentielService.listerPromotions(req.query.filiere_id));
  } catch (err) {
    next(err);
  }
});

router.post("/promotions", authenticate, requireScolarite, gestionnaire(async (req, res) => {
  const { filiere_id, annee_entree, niveau } = req.body || {};
  valider(filiere_id && Number.isInteger(Number(annee_entree)) && Number(annee_entree) >= 2000, "Filière et année d’entrée valides requises.");
  valider(["L1", "L2", "L3"].includes(niveau), "Le niveau doit être L1, L2 ou L3.");
  res.status(201).json(await referentielService.creerPromotion({ filiere_id, annee_entree: Number(annee_entree), niveau }));
}));

router.get("/semestres", authenticate, requireScolarite, async (req, res, next) => {
  try {
    res.json(await referentielService.listerSemestres(req.query.promotion_id));
  } catch (err) {
    next(err);
  }
});

router.post("/semestres", authenticate, requireScolarite, gestionnaire(async (req, res) => {
  const { promotion_id, annee_academique_id, numeros } = req.body || {};
  valider(promotion_id && annee_academique_id && Array.isArray(numeros) && numeros.length > 0, "Promotion, année académique et au moins un semestre requis.");
  valider(numeros.every((n) => Number.isInteger(Number(n)) && Number(n) >= 1 && Number(n) <= 6), "Les semestres doivent être compris entre 1 et 6.");
  valider(new Set(numeros.map(Number)).size === numeros.length, "Un semestre ne peut être sélectionné qu’une fois.");
  res.status(201).json(await referentielService.creerSemestres({ promotion_id, annee_academique_id, numeros: numeros.map(Number) }));
}));

router.post("/ues", authenticate, requireScolarite, gestionnaire(async (req, res) => {
  const { semestre_id, code, libelle, credits = 0 } = req.body || {};
  valider(semestre_id && code?.trim() && libelle?.trim(), "Semestre, code et intitulé d’UE requis.");
  valider(Number.isInteger(Number(credits)) && Number(credits) >= 0 && Number(credits) <= 60, "Le nombre de crédits doit être compris entre 0 et 60.");
  res.status(201).json(await referentielService.creerUE({ semestre_id, code: code.trim(), libelle: libelle.trim(), credits: Number(credits) }));
}));

router.post("/ecs", authenticate, requireScolarite, gestionnaire(async (req, res) => {
  const { ue_id, code, libelle, coefficient = 1 } = req.body || {};
  valider(ue_id && libelle?.trim(), "UE et intitulé d’EC requis.");
  valider(Number.isFinite(Number(coefficient)) && Number(coefficient) > 0 && Number(coefficient) <= 99, "Le coefficient doit être supérieur à zéro.");
  res.status(201).json(await referentielService.creerEC({ ue_id, code: code?.trim(), libelle: libelle.trim(), coefficient: Number(coefficient) }));
}));

router.get("/matieres", authenticate, requireScolarite, async (req, res, next) => {
  try {
    if (!req.query.semestre_id) {
      return res.status(422).json({ erreur: { message: "Le paramètre semestre_id est requis." } });
    }
    res.json(await referentielService.listerMatieres(req.query.semestre_id));
  } catch (err) {
    next(err);
  }
});

router.get("/ues", authenticate, requireScolarite, async (req, res, next) => {
  try {
    if (!req.query.semestre_id) return res.status(422).json({ erreur: { message: "Le paramètre semestre_id est requis." } });
    res.json(await referentielService.listerUEs(req.query.semestre_id));
  } catch (err) { next(err); }
});

module.exports = router;
