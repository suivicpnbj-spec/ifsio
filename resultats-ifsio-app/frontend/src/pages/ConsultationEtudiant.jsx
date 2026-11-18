import React, { useState } from "react";
import { ArrowLeft, ExternalLink, FileCheck2, Search, GraduationCap, Download } from "lucide-react";
import { Topbar, Card, Field, Button, ErrorBox } from "../components/ui.jsx";
import { consulterResultatsPublics, telechargerRelevePublic, telechargerReleveAnnuelPublic } from "../api.js";

/* URL dynamique vers Mes Actes (s'adapte au réseau) */
function urlMesActes(matricule) {
  const host = window.location.hostname;
  const base = `http://${host}:5173`;
  return matricule ? `${base}/#/demande?matricule=${encodeURIComponent(matricule)}` : `${base}/`;
}

export default function ConsultationEtudiant({ onAccueil }) {
  const [filiere, setFiliere] = useState("ESSFE");
  const [niveau, setNiveau] = useState("L2");
  const [session, setSession] = useState("normale");
  const [matricule, setMatricule] = useState("");
  const [donnees, setDonnees] = useState(null);
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);
  const [pdfEnCours, setPdfEnCours] = useState("");

  async function telecharger(semestreId) {
    const cle = `s${semestreId}`; setPdfEnCours(cle); setErreur("");
    try { await telechargerRelevePublic({ matricule: donnees.etudiant.matricule, filiere, niveau, session, semestre_id: semestreId }); }
    catch (err) { setErreur(err.message || "Téléchargement impossible."); }
    finally { setPdfEnCours(""); }
  }

  async function telechargerAnnuel(annee) {
    setPdfEnCours("annuel"); setErreur("");
    try { await telechargerReleveAnnuelPublic({ matricule: donnees.etudiant.matricule, filiere, niveau, annee }); }
    catch (err) { setErreur(err.message || "Téléchargement impossible."); }
    finally { setPdfEnCours(""); }
  }

  async function chercher(e) {
    e.preventDefault();
    setErreur(""); setDonnees(null); setChargement(true);
    try {
      setDonnees(await consulterResultatsPublics({ matricule: matricule.trim(), filiere, niveau, session }));
    } catch (err) {
      setErreur(err.message || "Impossible de retrouver vos résultats.");
    } finally { setChargement(false); }
  }

  return <div className="page">
    <Topbar subtitle="Consultation des résultats" onExit={onAccueil} exitLabel="Accueil" />
    <main className="container-narrow">
      <button className="btn-link" onClick={onAccueil} style={{ marginBottom: 14 }}><ArrowLeft size={14}/> Retour à l’accueil</button>
      <Card style={{ padding: 28, marginBottom: 22 }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 22 }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: "var(--vert-tres-clair)", color: "var(--vert)", display: "grid", placeItems: "center" }}><GraduationCap size={25}/></div>
          <div><h1 style={{ margin: 0, fontSize: 23, color: "var(--vert)" }}>Consulter mes résultats</h1><p className="muted" style={{ margin: "4px 0 0" }}>Choisissez votre parcours, puis saisissez votre matricule.</p></div>
        </div>
        <form onSubmit={chercher}>
          <div className="grid-2">
            <Field label="École"><select className="select" value={filiere} onChange={(e) => setFiliere(e.target.value)}><option value="ESSFE">ESSFE</option><option value="ESIIE">ESIIE</option></select></Field>
            <Field label="Niveau"><select className="select" value={niveau} onChange={(e) => setNiveau(e.target.value)}><option value="L1">Licence 1</option><option value="L2">Licence 2</option><option value="L3">Licence 3</option><option value="M1">Master 1</option><option value="M2">Master 2</option></select></Field>
          </div>
          <div className="grid-2">
            <Field label="Session"><select className="select" value={session} onChange={(e) => setSession(e.target.value)}><option value="normale">Session normale</option><option value="rattrapage">Session de rattrapage</option></select></Field>
            <Field label="Numéro matricule"><input className="input" value={matricule} onChange={(e) => setMatricule(e.target.value)} placeholder="Votre numéro matricule" autoComplete="off" required /></Field>
          </div>
          <ErrorBox message={erreur}/>
          <Button type="submit" icon={Search} full disabled={chargement || !matricule.trim()}>{chargement ? "Recherche…" : "Afficher mes résultats"}</Button>
        </form>
      </Card>

      {donnees && <>
        <div style={{ marginBottom: 16 }}><h2 style={{ margin: "0 0 4px", fontSize: 21 }}>{donnees.etudiant.nom} {donnees.etudiant.prenoms}</h2><div className="muted">{donnees.etudiant.matricule} · {donnees.etudiant.filiere} · Licence {donnees.etudiant.niveau.slice(1)}</div></div>
        {session === "normale" && [...new Set(donnees.resultats.filter((r) => r.resultat && donnees.resultats.filter((x) => x.semestre.annee_academique === r.semestre.annee_academique && x.resultat).length >= 2 && donnees.resultats.filter((x) => x.semestre.annee_academique === r.semestre.annee_academique).every((x) => x.resultat)).map((r) => r.semestre.annee_academique))].map((annee) => <div key={annee} style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}><Button icon={Download} variant="ghost" size="sm" disabled={Boolean(pdfEnCours)} onClick={() => telechargerAnnuel(annee)}>{pdfEnCours === "annuel" ? "Génération…" : `Télécharger le relevé annuel ${annee}`}</Button></div>)}
        {donnees.resultats.map((resultat) => {
          const resumes = new Map((resultat.unites_enseignement || []).map((ue) => [ue.id, ue]));
          const groupes = new Map();
          resultat.notes.forEach((note) => { if (!groupes.has(note.ue_id)) groupes.set(note.ue_id, []); groupes.get(note.ue_id).push(note); });
          return <Card key={resultat.semestre.id} style={{ padding: 0, overflow: "hidden", marginBottom: 20 }}>
            <div style={{ padding: "17px 20px", background: "var(--vert-tres-clair)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}><strong style={{ color: "var(--vert)" }}>Semestre {resultat.semestre.numero} — {resultat.semestre.annee_academique}</strong><div style={{ display: "flex", alignItems: "center", gap: 10 }}><span className={`badge ${resultat.partiel ? "badge-rattrapage" : "badge-admis"}`}>{resultat.partiel ? "Publication partielle" : "Résultats publiés"}</span><Button icon={Download} variant="ghost" size="sm" disabled={Boolean(pdfEnCours)} onClick={() => telecharger(resultat.semestre.id)}>{pdfEnCours === `s${resultat.semestre.id}` ? "Génération…" : "PDF"}</Button></div></div>
            <div className="table-wrap"><table className="table"><thead><tr><th>Unité d’enseignement (UE)</th><th>Élément constitutif (EC)</th><th>Note finale / 20</th><th>Crédits UE</th></tr></thead><tbody>
              {[...groupes.entries()].flatMap(([ueId, notes]) => notes.map((note, i) => {
                const ue = resumes.get(ueId); const creditsConnus = (ue?.credits ?? note.ue_credits) != null; const total = creditsConnus ? Number(ue?.credits ?? note.ue_credits) : 0; const acquis = Number(ue?.credits_obtenus) || 0; const complete = ue && Number(ue.nb_ec) === Number(ue.nb_notes); const validee = complete && creditsConnus && acquis >= total;
                return <tr key={note.id}>{i === 0 && <td rowSpan={notes.length} className="resultat-ue-cell">{note.ue_code ? `${note.ue_code} — ` : ""}{note.ue}</td>}<td>{note.matiere}</td><td className="resultat-note-cell">{note.valeur}</td>{i === 0 && <td rowSpan={notes.length}><div className="resultat-credits-value">{creditsConnus ? (complete ? `${acquis} / ${total}` : `— / ${total}`) : "Non renseignés"}</div><span className={`resultat-credits-status${validee ? " is-valid" : ""}`}>{!creditsConnus ? "Barème absent du classeur" : (complete ? (validee ? "Validée" : "Non validée") : "Incomplète")}</span></td>}</tr>;
              }))}
            </tbody></table></div>
            {session === "normale" && <div style={{ padding: 14, borderTop: "1px solid var(--bordure)", color: "var(--gris)", fontSize: 13 }}>Moyenne générale : <strong>{resultat.resultat?.moyenne_generale ?? "—"} / 20</strong> · Décision : <strong>{resultat.resultat?.decision || "—"}</strong></div>}
            <p className="resultat-table-note">{session === "rattrapage" ? "Pour les EC non recomposés, la note normale est conservée. Pour les EC recomposés, la note publiée au rattrapage est affichée. Les crédits de l’UE sont acquis si la moyenne des notes finales de ses EC atteint 12/20." : "Note finale d’un EC : moyenne du CC et de l’ET. Les crédits d’une UE sont attribués si sa moyenne atteint 12/20."}</p>
          </Card>;
        })}

        {/* Lien vers Mes Actes */}
        <div className="mes-actes-cta">
          <FileCheck2 size={18} />
          <div>
            <strong>Besoin d'une attestation officielle ?</strong>
            <p className="muted" style={{ margin: "2px 0 0", fontSize: 13 }}>Téléchargez vos actes académiques sur la plateforme Mes Actes.</p>
          </div>
          <a
            href={urlMesActes(donnees.etudiant.matricule)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost btn-sm"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}
          >
            Accéder à Mes Actes <ExternalLink size={13} />
          </a>
        </div>
      </>}
      <div className="small muted" style={{ textAlign: "center", padding: "12px 0 24px" }}>Seuls les résultats publiés pour les informations saisies sont affichés.</div>
    </main>
  </div>;
}
