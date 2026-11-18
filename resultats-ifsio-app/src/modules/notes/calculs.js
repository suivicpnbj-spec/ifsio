/**
 * Calculs académiques purs — aucun accès à la base de données ni à l'environnement.
 * Ce module peut être testé unitairement sans configuration (contrairement aux
 * services qui dépendent du pool PostgreSQL).
 */

/**
 * Calcule la moyenne pondérée par les coefficients à partir d'une liste de
 * { valeur, coefficient }. Ignore les valeurs absentes.
 * Retourne null si aucune note exploitable.
 */
function calculerMoyennePonderee(notes) {
  let totalPondere = 0;
  let totalCoef = 0;
  for (const r of notes) {
    const valeur = parseFloat(r.valeur);
    const coefficient = parseFloat(r.coefficient);
    if (Number.isNaN(valeur) || Number.isNaN(coefficient)) continue;
    totalPondere += valeur * coefficient;
    totalCoef += coefficient;
  }
  return totalCoef > 0 ? Math.round((totalPondere / totalCoef) * 100) / 100 : null;
}

/**
 * Décision académique selon le cahier des charges :
 * admis ≥ 12 · rattrapage ≥ 10 · ajourné < 10.
 */
function determinerDecision(moyenne) {
  if (moyenne === null || moyenne === undefined) return null;
  if (moyenne >= 12) return "admis";
  if (moyenne >= 10) return "rattrapage";
  return "ajourne";
}

module.exports = { calculerMoyennePonderee, determinerDecision };
