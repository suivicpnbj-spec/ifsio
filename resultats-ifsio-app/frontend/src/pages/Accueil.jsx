import React from "react";
import {
  ArrowRight, BookOpen, Check, ChevronRight, Download, ExternalLink,
  FileSpreadsheet, GraduationCap, LockKeyhole, Search, ShieldCheck,
} from "lucide-react";
import { Topbar } from "../components/ui.jsx";

/* URL du campus numérique — s'adapte à l'hôte courant (LAN, localhost…) */
function urlCampus(port, path = "") {
  const host = window.location.hostname;
  return `http://${host}:${port}${path}`;
}

const CAMPUS_LIENS = [
  { label: "Site IFSIO", desc: "Accueil & informations institutionnelles", port: 8081, path: "/" },
  { label: "Mes Actes", desc: "Attestations & documents officiels", port: 5173, path: "/" },
  { label: "Catalogue CNTRSS", desc: "Ressources documentaires", port: 3100, path: "/" },
];

const ETAPES = [
  { numero: "01", icone: BookOpen, titre: "Choisissez votre parcours", texte: "Sélectionnez votre école, votre niveau et la session concernée." },
  { numero: "02", icone: Search, titre: "Retrouvez votre dossier", texte: "Votre numéro matricule suffit pour lancer la consultation." },
  { numero: "03", icone: Download, titre: "Consultez votre relevé", texte: "Affichez les résultats publiés et enregistrez votre relevé." },
];

function LienCampus({ label, desc, port, path }) {
  return (
    <a
      href={urlCampus(port, path)}
      target="_blank"
      rel="noopener noreferrer"
      className="campus-nav-link"
    >
      <span className="campus-nav-label">{label}<ExternalLink size={11} /></span>
      <span className="campus-nav-desc">{desc}</span>
    </a>
  );
}

export default function Accueil({ entrees = ["scolarite", "etudiant"], onSelect }) {
  const espaces = entrees.filter((type) => type === "scolarite" || type === "etudiant");
  if (!espaces.length) espaces.push("etudiant");
  const etudiantDisponible = espaces.includes("etudiant");
  const scolariteDisponible = espaces.includes("scolarite");
  const actionPrincipale = etudiantDisponible ? "etudiant" : "scolarite";

  return (
    <div className="page landing-page">
      <Topbar subtitle="Portail académique">
        <div className="landing-nav">
          <a href="#fonctionnement">Fonctionnement</a>
          <a href={urlCampus(8081, "/")} target="_blank" rel="noopener noreferrer" className="landing-nav-site">
            Site IFSIO <ExternalLink size={11} />
          </a>
        </div>
      </Topbar>

      <main>
        <section className="landing-hero">
          <div className="landing-hero-grid">
            <div className="landing-copy">
              <div className="landing-eyebrow"><span className="landing-eyebrow-mark"><GraduationCap size={15}/></span> Université de Parakou <i /> IFSIO</div>
              <div className="landing-kicker">PORTAIL DE CONSULTATION DES RÉSULTATS</div>
              <h1>Vos résultats.<br/><span>En toute clarté.</span></h1>
              <p>Consultez les notes transmises par la scolarité après délibération et retrouvez votre relevé en quelques instants.</p>
              <div className="landing-actions">
                <button type="button" className="landing-primary" onClick={() => onSelect(actionPrincipale)}>
                  {etudiantDisponible ? "Consulter mes résultats" : "Ouvrir l’espace scolarité"}<ChevronRight size={18}/>
                </button>
                <div className="landing-assurance"><LockKeyhole size={14}/> Accès étudiant par numéro matricule</div>
              </div>
            </div>

            <div className="landing-visual" aria-label="Aperçu de la présentation d’un relevé de notes">
              <div className="landing-visual-glow" />
              <div className="landing-result-card">
                <div className="landing-result-top">
              <div className="landing-result-brand"><span><GraduationCap size={17}/></span><div><b>MES RESULTATS</b><small>Université de Parakou · IFSIO</small></div></div>
                  <span className="landing-live"><i/> PORTAIL</span>
                </div>
                <div className="landing-result-title"><div><small>VOTRE ESPACE</small><h2>Relevé de notes</h2></div><div className="landing-file-icon"><FileSpreadsheet size={19}/></div></div>
                <div className="landing-result-meta"><span>UNITÉ D’ENSEIGNEMENT</span><span>ÉLÉMENT CONSTITUTIF</span><span>NOTE</span><span>CRÉDITS</span></div>
                <div className="landing-result-row"><span><i/> UE</span><span>Élément constitutif</span><b>— / 20</b><span>—</span></div>
                <div className="landing-result-row"><span><i/> UE</span><span>Élément constitutif</span><b>— / 20</b><span>—</span></div>
                <div className="landing-result-row"><span><i/> UE</span><span>Élément constitutif</span><b>— / 20</b><span>—</span></div>
                <div className="landing-result-bottom"><span><ShieldCheck size={15}/> Résultats publiés par la scolarité</span><span><Check size={14}/> Relevé consultable</span></div>
                <div className="landing-result-note">Aucune note fictive affichée · aperçu de présentation</div>
              </div>
              <div className="landing-float-tag"><span><Check size={14}/></span><div><b>Après délibération</b><small>Résultats officiels</small></div></div>
            </div>
          </div>
          <div className="landing-hero-bottom"><span>UN ACCÈS SIMPLE AUX RÉSULTATS PUBLIÉS</span><span className="landing-bottom-line"/><span>ESSFE <i/> ESIIE <i/> LICENCE 1 · 2 · 3</span></div>
        </section>

        <section className="landing-how" id="fonctionnement">
          <div className="landing-section-head">
            <div><div className="landing-section-kicker">COMMENT ÇA MARCHE</div><h2>Du matricule au relevé.</h2></div>
            <p>La plateforme restitue les résultats déposés par l’administration. Elle ne modifie ni les notes ni les décisions du jury.</p>
          </div>
          <div className="landing-steps">
            {ETAPES.map(({ numero, icone: Icon, titre, texte }, index) => <article className="landing-step" key={numero}>
              <div className="landing-step-top"><span>{numero}</span><div className="landing-step-icon"><Icon size={19}/></div>{index < ETAPES.length - 1 && <i className="landing-step-connector"/>}</div>
              <h3>{titre}</h3><p>{texte}</p>
            </article>)}
          </div>
        </section>

        <section className="landing-bottom-cta">
          <div className="landing-bottom-copy"><span>ESPACE ÉTUDIANT</span><h2>Prêt à consulter vos résultats ?</h2><p>Munissez-vous de votre numéro matricule et choisissez votre parcours.</p></div>
          <button type="button" onClick={() => onSelect(actionPrincipale)}>{etudiantDisponible ? "Accéder à la consultation" : "Accéder au portail"}<ArrowRight size={17}/></button>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-footer-brand">
          <span><GraduationCap size={17}/></span>
          <b>eRÉSULTATS</b>
          <i/> Université de Parakou · IFSIO
        </div>
        <nav className="landing-footer-campus">
          {CAMPUS_LIENS.map(({ label, desc, port, path }) => (
            <a key={port} href={urlCampus(port, path)} target="_blank" rel="noopener noreferrer" title={desc}>
              {label}
            </a>
          ))}
        </nav>
        <div className="landing-footer-meta">
          <small>© {new Date().getFullYear()} · Campus Numérique IFSIO</small>
          <button type="button" className="landing-staff-link" onClick={() => onSelect("scolarite")}>
            Accès personnel scolarité
          </button>
        </div>
      </footer>
    </div>
  );
}
