const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { query } = require("../../db/pool");
const env = require("../../config/env");
const { AppError } = require("../../middleware/errorHandler");

function signToken(payload) {
  return jwt.sign(payload, env.jwt.secret, { expiresIn: env.jwt.expiresIn });
}

async function loginEtudiant(matricule, motDePasse) {
  const { rows } = await query(
    `SELECT id, matricule, nom, prenoms, mot_de_passe_hash, doit_changer_mdp, statut
     FROM etudiant WHERE matricule = $1`,
    [matricule]
  );
  const etudiant = rows[0];

  // Message volontairement identique en cas de matricule inconnu ou mot de passe faux
  if (!etudiant) {
    throw new AppError("Matricule ou mot de passe incorrect.", 401, "IDENTIFIANTS_INVALIDES");
  }
  if (etudiant.statut !== "actif") {
    throw new AppError("Ce compte n'est plus actif. Contactez la scolarité.", 403, "COMPTE_INACTIF");
  }

  const motDePasseValide = await bcrypt.compare(motDePasse, etudiant.mot_de_passe_hash);
  if (!motDePasseValide) {
    throw new AppError("Matricule ou mot de passe incorrect.", 401, "IDENTIFIANTS_INVALIDES");
  }

  const token = signToken({ id: etudiant.id, type: "etudiant" });
  return {
    token,
    doit_changer_mdp: etudiant.doit_changer_mdp,
    etudiant: { id: etudiant.id, matricule: etudiant.matricule, nom: etudiant.nom, prenoms: etudiant.prenoms },
  };
}

async function loginScolarite(email, motDePasse) {
  const { rows } = await query(
    `SELECT id, nom, email, mot_de_passe_hash, role, actif
     FROM utilisateur_scolarite WHERE email = $1`,
    [email]
  );
  const utilisateur = rows[0];

  if (!utilisateur) {
    throw new AppError("Email ou mot de passe incorrect.", 401, "IDENTIFIANTS_INVALIDES");
  }
  if (!utilisateur.actif) {
    throw new AppError("Ce compte a été désactivé.", 403, "COMPTE_INACTIF");
  }

  const motDePasseValide = await bcrypt.compare(motDePasse, utilisateur.mot_de_passe_hash);
  if (!motDePasseValide) {
    throw new AppError("Email ou mot de passe incorrect.", 401, "IDENTIFIANTS_INVALIDES");
  }

  const token = signToken({ id: utilisateur.id, type: "scolarite", role: utilisateur.role });
  return {
    token,
    utilisateur: { id: utilisateur.id, nom: utilisateur.nom, email: utilisateur.email, role: utilisateur.role },
  };
}

async function changerMotDePasseEtudiant(etudiantId, ancien, nouveau) {
  const { rows } = await query("SELECT mot_de_passe_hash FROM etudiant WHERE id = $1", [etudiantId]);
  if (!rows[0]) throw new AppError("Étudiant introuvable.", 404, "INTROUVABLE");

  const valide = await bcrypt.compare(ancien, rows[0].mot_de_passe_hash);
  if (!valide) throw new AppError("Ancien mot de passe incorrect.", 401, "MDP_INCORRECT");

  const hash = await bcrypt.hash(nouveau, env.bcryptSaltRounds);
  await query(
    "UPDATE etudiant SET mot_de_passe_hash = $1, doit_changer_mdp = false WHERE id = $2",
    [hash, etudiantId]
  );
}

module.exports = { loginEtudiant, loginScolarite, changerMotDePasseEtudiant, signToken };
