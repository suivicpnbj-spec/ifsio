const jwt = require("jsonwebtoken");
const env = require("../config/env");
const { AppError } = require("./errorHandler");

/**
 * Vérifie le token JWT et attache req.auth = { id, type, role }
 * type ∈ { "etudiant", "scolarite" }
 */
function authenticate(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return next(new AppError("Authentification requise.", 401, "NON_AUTHENTIFIE"));
  }

  try {
    const payload = jwt.verify(token, env.jwt.secret);
    req.auth = payload;
    next();
  } catch (err) {
    next(new AppError("Session invalide ou expirée.", 401, "TOKEN_INVALIDE"));
  }
}

/** Restreint l'accès aux comptes de type "scolarite" */
function requireScolarite(req, res, next) {
  if (req.auth?.type !== "scolarite") {
    return next(new AppError("Accès réservé au personnel de scolarité.", 403, "ACCES_INTERDIT"));
  }
  next();
}

/** Restreint l'accès aux comptes de type "etudiant" */
function requireEtudiant(req, res, next) {
  if (req.auth?.type !== "etudiant") {
    return next(new AppError("Accès réservé aux étudiants.", 403, "ACCES_INTERDIT"));
  }
  next();
}

/** Exige un rôle précis parmi le personnel de scolarité (ex: 'responsable', 'admin') */
function requireRole(...rolesAutorises) {
  return (req, res, next) => {
    if (!rolesAutorises.includes(req.auth?.role)) {
      return next(new AppError(
        `Cette action nécessite l'un des rôles suivants : ${rolesAutorises.join(", ")}.`,
        403,
        "ROLE_INSUFFISANT"
      ));
    }
    next();
  };
}

module.exports = { authenticate, requireScolarite, requireEtudiant, requireRole };
