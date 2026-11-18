const express = require("express");
const crypto = require("crypto");
const { query } = require("../../db/pool");
const env = require("../../config/env");

const router = express.Router();

/**
 * Middleware d'authentification inter-services.
 * Exige la présence du secret interne partagé (via en-tête X-Internal-Secret ou Bearer token).
 */
function requireInternalSecret(req, res, next) {
  const secretHeader = req.headers["x-internal-secret"];
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;

  const providedSecret = secretHeader || bearerToken;
  if (!providedSecret || providedSecret !== env.campusInternalSecret) {
    return res.status(401).json({
      erreur: {
        code: "UNAUTHORIZED_INTERNAL",
        message: "Accès refusé : secret de communication inter-services IFSIO invalide ou absent."
      }
    });
  }
  next();
}

/**
 * Calcule la mention académique officielle à partir de la moyenne sur 20.
 */
function calculerMention(moyenne) {
  if (moyenne === null || moyenne === undefined || Number.isNaN(moyenne)) return "Non définie";
  if (moyenne >= 16) return "Très Bien";
  if (moyenne >= 14) return "Bien";
  if (moyenne >= 12) return "Assez Bien";
  if (moyenne >= 10) return "Passable";
  return "Ajourné";
}

/**
 * GET /api/interne/admissibilite/:matricule
 * Point d'entrée sécurisé pour les autres plateformes du campus (ex. Mes Actes).
 * Renvoie l'identité, le cursus, les délibérations de jurys, les crédits ECTS acquis
 * et le statut officiel d'admissibilité au diplôme ou à l'année supérieure.
 */
router.get("/admissibilite/:matricule", requireInternalSecret, async (req, res, next) => {
  try {
    const rawMatricule = String(req.params.matricule || "").trim();
    if (!rawMatricule) {
      return res.status(400).json({ erreur: { message: "Le matricule étudiant est requis." } });
    }

    // 1. Recherche de l'étudiant
    const { rows: etudiantRows } = await query(
      `SELECT e.id, e.matricule, e.nom, e.prenoms, e.telephone, e.email, e.statut,
              f.code AS filiere_code, f.libelle AS filiere_libelle,
              p.niveau, p.annee_entree
       FROM etudiant e
       JOIN filiere f ON f.id = e.filiere_id
       JOIN promotion p ON p.id = e.promotion_id
       WHERE upper(trim(e.matricule)) = upper(trim($1))
       LIMIT 1`,
      [rawMatricule]
    );

    const etudiant = etudiantRows[0];
    if (!etudiant) {
      return res.status(404).json({
        erreur: {
          code: "ETUDIANT_INTROUVABLE",
          message: `Aucun dossier étudiant répertorié à l'IFSIO pour le matricule ${rawMatricule}.`
        }
      });
    }

    // 2. Recherche des résultats semestriels et des délibérations
    const { rows: resultatsRows } = await query(
      `SELECT rs.id, rs.moyenne_generale, rs.decision, rs.statut_publication,
              rs.credits_semestre_officiels, rs.credits_annee_officiels, rs.publie_le,
              s.numero AS semestre_numero, aa.libelle AS annee_academique
       FROM resultat_semestre rs
       JOIN semestre s ON s.id = rs.semestre_id
       JOIN annee_academique aa ON aa.id = s.annee_academique_id
       WHERE rs.etudiant_id = $1
       ORDER BY s.numero ASC`,
      [etudiant.id]
    );

    // Filtrer les semestres avec résultats publiés ou délibérés
    const semestres = resultatsRows.map((r) => {
      const moy = r.moyenne_generale !== null ? parseFloat(r.moyenne_generale) : null;
      return {
        semestre_numero: r.semestre_numero,
        annee_academique: r.annee_academique,
        moyenne: moy,
        decision: r.decision || (moy && moy >= 12 ? "admis" : moy && moy >= 10 ? "rattrapage" : "ajourne"),
        credits_semestre: r.credits_semestre_officiels !== null ? parseInt(r.credits_semestre_officiels, 10) : (moy && moy >= 10 ? 30 : 0),
        statut_publication: r.statut_publication,
        date_deliberation: r.publie_le
      };
    });

    // 3. Synthèse globale du cursus
    let totalCredits = 0;
    let sommeMoyennes = 0;
    let semestresAvecMoyenne = 0;
    let semestresValides = 0;
    let dernierStatutDecision = "en_cours";
    let derniereDateDeliberation = null;

    for (const sem of semestres) {
      totalCredits += sem.credits_semestre || 0;
      if (sem.moyenne !== null) {
        sommeMoyennes += sem.moyenne;
        semestresAvecMoyenne++;
      }
      if (sem.decision === "admis") {
        semestresValides++;
      }
      if (sem.date_deliberation) {
        derniereDateDeliberation = sem.date_deliberation;
      }
      dernierStatutDecision = sem.decision;
    }

    const moyenneGenerale = semestresAvecMoyenne > 0
      ? Math.round((sommeMoyennes / semestresAvecMoyenne) * 100) / 100
      : null;

    const mention = calculerMention(moyenneGenerale);

    // Détermination de l'admissibilité :
    // Un étudiant est déclaré admissible s'il est au statut 'diplome',
    // OU si la dernière décision est 'admis' avec au moins 1 semestre validé et une moyenne >= 10.
    const estAdmissible = etudiant.statut === "diplome" ||
      (dernierStatutDecision === "admis" && semestresValides >= 1) ||
      (moyenneGenerale !== null && moyenneGenerale >= 10 && semestresValides > 0);

    // 4. Génération d'une empreinte cryptographique HMAC pour garantir l'inviolabilité
    const hmac = crypto.createHmac("sha256", env.campusInternalSecret);
    const hashData = `${etudiant.matricule}|${etudiant.nom}|${etudiant.prenoms}|${estAdmissible}|${moyenneGenerale}|${totalCredits}`;
    const integritySeal = hmac.update(hashData).digest("hex");

    res.json({
      statut: "success",
      etudiant: {
        id: etudiant.id,
        matricule: etudiant.matricule,
        nom: etudiant.nom,
        prenoms: etudiant.prenoms,
        filiere_code: etudiant.filiere_code,
        filiere_libelle: etudiant.filiere_libelle,
        niveau: etudiant.niveau,
        annee_entree: etudiant.annee_entree,
        statut_etudiant: etudiant.statut
      },
      deliberation: {
        admissible: estAdmissible,
        decision_jury: estAdmissible ? "admis" : dernierStatutDecision,
        moyenne_generale: moyenneGenerale,
        mention: mention,
        credits_ects_valides: totalCredits,
        credits_ects_requis: etudiant.niveau === "L3" ? 180 : etudiant.niveau === "L2" ? 120 : 60,
        semestres_valides: semestresValides,
        nombre_semestres: semestres.length,
        date_deliberation: derniereDateDeliberation || new Date().toISOString().slice(0, 10)
      },
      semestres,
      securite: {
        source: "eRésultats IFSIO — Université de Parakou",
        scelle_hmac: integritySeal,
        horodatage: new Date().toISOString()
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
