/* Client HTTP de l'API — gère le token JWT et normalise les erreurs. */

const TOKEN_KEY = "ifsio_token";
const USER_KEY = "ifsio_user";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
}

export function setSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

class ApiError extends Error {
  constructor(message, status, code, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function requete(path, { method = "GET", body, isFormData = false } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined && !isFormData) headers["Content-Type"] = "application/json";

  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body:
      body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
  });

  if (res.status === 401 && token) {
    // Session expirée ou invalide
    clearSession();
  }

  if (!res.ok) {
    let erreur = null;
    try {
      erreur = await res.json();
    } catch {
      /* corps non-JSON */
    }
    const e = erreur?.erreur || {};
    throw new ApiError(e.message || `Erreur ${res.status}`, res.status, e.code, e.details);
  }

  if (res.status === 204) return null;
  return res.json();
}

/* ---------- Configuration du service ---------- */

/**
 * GET /api/config — renseigne le frontend sur l'espace imposé par le service
 * de déploiement ({ entree: "etudiant" | "scolarite" | "" }).
 * En développement (pas de serveur), l'appel échoue et l'app reste en mode libre.
 */
export function obtenirConfig() {
  return requete("/config");
}

/* ---------- Authentification ---------- */

export function loginEtudiant(matricule, motDePasse) {
  return requete("/auth/etudiant/connexion", { method: "POST", body: { matricule, mot_de_passe: motDePasse } });
}

export function loginScolarite(email, motDePasse) {
  return requete("/auth/scolarite/connexion", { method: "POST", body: { email, mot_de_passe: motDePasse } });
}

export function changerMotDePasse(ancien, nouveau) {
  return requete("/auth/etudiant/changer-mot-de-passe", {
    method: "POST",
    body: { ancien_mot_de_passe: ancien, nouveau_mot_de_passe: nouveau },
  }).then((resultat) => {
    const user = getUser();
    const token = getToken();
    if (user && token) setSession(token, { ...user, doit_changer_mdp: false });
    return resultat;
  });
}

/* ---------- Référentiel (scolarité) ---------- */

export function listerFilieres() {
  return requete("/referentiel/filieres");
}

export function listerAnneesAcademiques() { return requete("/referentiel/annees"); }
export function creerAnneeAcademique(body) { return requete("/referentiel/annees", { method: "POST", body }); }
export function creerPromotion(body) { return requete("/referentiel/promotions", { method: "POST", body }); }
export function creerSemestres(body) { return requete("/referentiel/semestres", { method: "POST", body }); }
export function creerUE(body) { return requete("/referentiel/ues", { method: "POST", body }); }
export function creerEC(body) { return requete("/referentiel/ecs", { method: "POST", body }); }

export function listerPromotions(filiereId) {
  const q = filiereId ? `?filiere_id=${encodeURIComponent(filiereId)}` : "";
  return requete(`/referentiel/promotions${q}`);
}

export function listerSemestres(promotionId) {
  const q = promotionId ? `?promotion_id=${encodeURIComponent(promotionId)}` : "";
  return requete(`/referentiel/semestres${q}`);
}

export function listerMatieres(semestreId) {
  return requete(`/referentiel/matieres?semestre_id=${encodeURIComponent(semestreId)}`);
}

export function listerUEs(semestreId) {
  return requete(`/referentiel/ues?semestre_id=${encodeURIComponent(semestreId)}`);
}

/* ---------- Notes & workflow (scolarité) ---------- */

export function obtenirNotesPromotion(promotionId, semestreId) {
  return requete(`/notes/promotion/${promotionId}/${semestreId}`);
}

export function saisirNotesLot(notes) {
  return requete("/notes/lot", { method: "POST", body: { notes } });
}

export function confirmerImportNotes(rapport, promotionId, semestreId) {
  return requete("/notes/import/confirmer", {
    method: "POST",
    body: {
      notes: rapport.notes || [],
      credits_officiels: rapport.credits_officiels || [],
      promotion_id: promotionId,
      semestre_id: semestreId,
    },
  });
}

export function verifierResultats(promotionId, semestreId) {
  return requete("/notes/verifier", { method: "POST", body: { promotion_id: promotionId, semestre_id: semestreId } });
}

export function publierResultats(promotionId, semestreId) {
  return requete("/notes/publier", { method: "POST", body: { promotion_id: promotionId, semestre_id: semestreId } });
}

export function publierUnites(promotionId, semestreId, ueIds) {
  return requete("/notes/publier-partiel", { method: "POST", body: { promotion_id: promotionId, semestre_id: semestreId, ue_ids: ueIds } });
}

export function listerJournal(limite = 100) {
  return requete(`/notes/journal?limite=${limite}`);
}

/**
 * Analyse un fichier Excel de notes (POST /api/notes/import?semestre_id=…).
 * Le backend ne fait que l'analyse : rien n'est écrit en base tant que l'agent
 * ne confirme pas via saisirNotesLot(rapport.notes).
 */
export function importerNotesExcel(fichier, semestreId, promotionId, session = "normale") {
  const fd = new FormData();
  fd.append("fichier", fichier);
  const params = new URLSearchParams({ semestre_id: semestreId, promotion_id: promotionId, session });
  return requete(`/notes/import?${params}`, {
    method: "POST",
    body: fd,
    isFormData: true,
  });
}

export function obtenirStructureImport(fichier, semestreId) {
  const fd = new FormData();
  fd.append("fichier", fichier);
  fd.append("semestre_id", semestreId);
  return requete("/notes/import/structure", { method: "POST", body: fd, isFormData: true });
}

export function analyserImportConfigure(fichier, { promotionId, semestreId, session, ligneEntete, colonneMatricule, colonneCreditsSemestre, colonneCreditsAnnee, mappings }) {
  const fd = new FormData();
  fd.append("fichier", fichier);
  fd.append("promotion_id", promotionId);
  fd.append("semestre_id", semestreId);
  fd.append("session", session);
  fd.append("ligne_entete", String(ligneEntete));
  fd.append("colonne_matricule", String(colonneMatricule));
  if (colonneCreditsSemestre !== "") fd.append("colonne_credits_semestre", String(colonneCreditsSemestre));
  if (colonneCreditsAnnee !== "") fd.append("colonne_credits_annee", String(colonneCreditsAnnee));
  fd.append("mappings", JSON.stringify(mappings));
  return requete("/notes/import/configurer", { method: "POST", body: fd, isFormData: true });
}

export function listerEtudiantsPromotion(promotionId) {
  return requete(`/etudiants?promotion_id=${encodeURIComponent(promotionId)}`);
}

/* ---------- Portail étudiant ---------- */

export function listerSemestresEtudiant() {
  return requete("/notes/moi/semestres");
}

export function obtenirResultatsEtudiant(semestreId) {
  return requete(`/notes/moi/${semestreId}`);
}

export function consulterResultatsPublics({ matricule, filiere, niveau, session }) {
  const params = new URLSearchParams({ matricule, filiere, niveau, session });
  return requete(`/notes/consultation?${params}`);
}

async function telechargerPDFPublic(path, params, nomParDefaut) {
  const res = await fetch(`/api/resultats/${path}?${new URLSearchParams(params)}`);
  if (!res.ok) {
    let message = `Erreur ${res.status}`;
    try { const j = await res.json(); message = j.erreur?.message || message; } catch { /* ignore */ }
    throw new Error(message);
  }
  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="?([^";]+)"?/);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = match ? match[1] : nomParDefaut;
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

export function telechargerRelevePublic(params) {
  return telechargerPDFPublic("releve-public", params, "releve.pdf");
}

export function telechargerReleveAnnuelPublic(params) {
  return telechargerPDFPublic("releve-annuel-public", params, "releve-annuel.pdf");
}

export async function telechargerReleve(semestreId) {
  const token = getToken();
  const res = await fetch(`/api/resultats/releve/${semestreId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    let message = `Erreur ${res.status}`;
    try {
      const j = await res.json();
      message = j.erreur?.message || message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="?([^";]+)"?/);
  const nom = match ? match[1] : `releve_S${semestreId}.pdf`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nom;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function telechargerReleveAnnuel(annee) {
  const token = getToken();
  const params = new URLSearchParams({ annee });
  const res = await fetch(`/api/resultats/releve-annuel?${params}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    let message = `Erreur ${res.status}`;
    try { const j = await res.json(); message = j.erreur?.message || message; } catch { /* ignore */ }
    throw new Error(message);
  }
  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="?([^";]+)"?/);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = match ? match[1] : `releve_annuel_${annee}.pdf`;
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

export { ApiError };
