import React, { useEffect, useState } from "react";
import Accueil from "./pages/Accueil.jsx";
import EntreePage from "./pages/EntreePage.jsx";
import ScolariteApp from "./pages/ScolariteApp.jsx";
import { getUser, clearSession, obtenirConfig } from "./api.js";

/**
 * Routage de l'application :
 *  - La racine #/ affiche TOUJOURS la page d'accueil. Sur un service dédié
 *    (ENTREE_DEFAUT via /api/config) elle ne propose que la carte de l'espace
 *    imposé — l'autre espace reste invisible.
 *  - #/etudiant et #/scolarite mènent à l'entrée de l'espace (formulaire de
 *    connexion) ; le service dédié y impose son espace.
 *  - session scolarité → back-office · session étudiant → portail étudiant.
 * La session (token JWT + profil) est persistée dans localStorage.
 */
function lireRoute() {
  const h = window.location.hash.replace(/^#\/?/, "");
  return h === "etudiant" || h === "scolarite" ? h : "";
}

export default function App() {
  const [route, setRoute] = useState(lireRoute);
  const [config, setConfig] = useState(null); // null = config en cours de chargement
  const [session, setSession] = useState(() => {
    const u = getUser();
    const t = localStorage.getItem("ifsio_token");
    if (u?.type === "etudiant") { clearSession(); return null; }
    return u && t ? u : null;
  });

  useEffect(() => {
    const onChange = () => setRoute(lireRoute());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  // Récupère l'espace imposé par le service de déploiement (si configuré).
  useEffect(() => {
    obtenirConfig()
      .then((c) => setConfig(c || {}))
      .catch(() => setConfig({})); // erreur réseau ou serveur → mode libre
  }, []);

  function naviguer(routeCible) {
    const hash = routeCible ? `#/${routeCible}` : "#/";
    if (window.location.hash !== hash) window.location.hash = hash;
    setRoute(routeCible);
  }

  function apresConnexion() {
    setSession(getUser());
  }

  function deconnexion() {
    const role = session?.type;
    clearSession();
    setSession(null);
    // Retour à l'entrée du même espace (l'entrée imposée du service prime en production).
    naviguer(role === "scolarite" ? "scolarite" : role === "etudiant" ? "etudiant" : "");
  }

  if (session?.type === "scolarite") {
    return <ScolariteApp user={session} onExit={deconnexion} />;
  }

  // Écran de chargement : évite le « flash » de la page publique sur les services dédiés.
  if (!config) {
    return (
      <div className="page">
        <div className="center-box" style={{ flex: 1 }}>
          <p className="muted">Chargement…</p>
        </div>
      </div>
    );
  }

  // Route d'entrée directe (#/etudiant | #/scolarite) → carte + formulaire de connexion.
  // Sur un service dédié, le service impose son espace (config.entree prime).
  if (route === "etudiant" || route === "scolarite") {
    const entree = config.entree || route;
    // key={entree} : remonte le composant si on bascule d'entrée → étape remise à « choix »
    return <EntreePage key={entree} type={entree} onLogin={apresConnexion} onAccueil={() => naviguer("")} />;
  }

  // Racine : page d'accueil, avec la seule carte de l'espace imposé sur un service dédié.
  const entrees = config.entree ? [config.entree] : ["scolarite", "etudiant"];
  return <Accueil entrees={entrees} onSelect={(type) => naviguer(type)} />;
}
