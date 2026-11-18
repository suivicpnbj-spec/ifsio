import React from "react";
import LoginPage from "./LoginPage.jsx";
import ConsultationEtudiant from "./ConsultationEtudiant.jsx";

/** Les étudiants consultent directement; le personnel arrive directement au formulaire de connexion. */
export default function EntreePage({ type, onLogin, onAccueil }) {
  if (type === "etudiant") return <ConsultationEtudiant onAccueil={onAccueil} />;

  return <LoginPage
    type="scolarite"
    onBack={onAccueil}
    exitLabel="Accueil"
    backLabel="Retour à l’accueil"
    onSuccess={onLogin}
  />;
}
