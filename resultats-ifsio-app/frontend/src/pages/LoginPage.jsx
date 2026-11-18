import React, { useState } from "react";
import { LogIn, ShieldCheck, GraduationCap, ArrowLeft } from "lucide-react";
import { Topbar, Card, Field, Button, ErrorBox } from "../components/ui.jsx";
import { loginEtudiant, loginScolarite, setSession } from "../api.js";

export default function LoginPage({ type, onBack, onSuccess, exitLabel = "Accueil", backLabel = "Choisir un autre espace" }) {
  const [identifiant, setIdentifiant] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isEtudiant = type === "etudiant";

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const resultat = isEtudiant
        ? await loginEtudiant(identifiant, motDePasse)
        : await loginScolarite(identifiant, motDePasse);

      const user = isEtudiant
        ? { type: "etudiant", ...resultat.etudiant, doit_changer_mdp: resultat.doit_changer_mdp }
        : { type: "scolarite", ...resultat.utilisateur };
      setSession(resultat.token, user);
      onSuccess();
    } catch (err) {
      setError(err.message || "Connexion impossible.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <Topbar subtitle={isEtudiant ? "Espace Étudiant" : "Espace Scolarité"} onExit={onBack} exitLabel={exitLabel} />
      <div className="center-box">
        <Card className="login-card" style={{ padding: 32 }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div
              style={{
                width: 48, height: 48, borderRadius: 10,
                background: isEtudiant ? "#347fbd" : "#173b63",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 14px",
              }}
            >
              {isEtudiant ? <GraduationCap size={22} color="#173b63" /> : <ShieldCheck size={22} color="#f4f7fb" />}
            </div>
            <h2 style={{ fontSize: 19, fontWeight: 700, margin: "0 0 4px" }}>
              Connexion {isEtudiant ? "étudiant" : "scolarité"}
            </h2>
            <p className="muted" style={{ margin: 0 }}>
              {isEtudiant ? "Votre matricule et votre mot de passe" : "Votre adresse email professionnelle"}
            </p>
          </div>

          <form onSubmit={submit}>
            <Field label={isEtudiant ? "Matricule" : "Adresse email"}>
              <input
                className="input"
                placeholder={isEtudiant ? "Ex. 17582124" : "scolarite@ifsio.up.bj"}
                value={identifiant}
                onChange={(e) => setIdentifiant(e.target.value)}
                autoFocus
              />
            </Field>
            <Field label="Mot de passe">
              <input
                className="input"
                type="password"
                placeholder="••••••••"
                value={motDePasse}
                onChange={(e) => setMotDePasse(e.target.value)}
              />
            </Field>
            <ErrorBox message={error} />
            <Button type="submit" full icon={LogIn} disabled={loading || !identifiant || !motDePasse}>
              {loading ? "Connexion…" : "Se connecter"}
            </Button>
          </form>

          <div style={{ textAlign: "center", marginTop: 18 }}>
            <button className="btn-link" onClick={onBack}>
              <ArrowLeft size={13} /> {backLabel}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
