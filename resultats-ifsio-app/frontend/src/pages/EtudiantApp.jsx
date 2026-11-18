import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Bell, Download, KeyRound, FileText, LogOut } from "lucide-react";
import { Topbar, Card, Button, Seal, DecisionBadge, Toast, Loading, ErrorBox, Field } from "../components/ui.jsx";
import { listerSemestresEtudiant, obtenirResultatsEtudiant, telechargerReleve, telechargerReleveAnnuel, changerMotDePasse, clearSession } from "../api.js";

export default function EtudiantApp({ onExit, user, onLogout }) {
  const [semestres, setSemestres] = useState([]);
  const [semestreId, setSemestreId] = useState("");
  const [resultats, setResultats] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [telechargement, setTelechargement] = useState(false);
  const [anneeTelechargement, setAnneeTelechargement] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [showMdp, setShowMdp] = useState(false);
  const [changementMdpObligatoire, setChangementMdpObligatoire] = useState(Boolean(user?.doit_changer_mdp));
  const [ancien, setAncien] = useState("");
  const [nouveau, setNouveau] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [mdpEnvoi, setMdpEnvoi] = useState(false);

  const flash = useCallback((msg, type = "success") => setToast({ msg, type }), []);

  useEffect(() => {
    if (changementMdpObligatoire) setShowMdp(true);
  }, [changementMdpObligatoire]);

  useEffect(() => {
    listerSemestresEtudiant()
      .then((s) => {
        setSemestres(s);
        if (s.length) setSemestreId(s[0].id);
      })
      .catch((err) => setError(err.message))
      .finally(() => setChargement(false));
  }, []);

  useEffect(() => {
    if (!semestreId) { setResultats(null); return; }
    setChargement(true);
    setError("");
    obtenirResultatsEtudiant(semestreId)
      .then(setResultats)
      .catch((err) => setError(err.message))
      .finally(() => setChargement(false));
  }, [semestreId]);

  async function download() {
    setTelechargement(true);
    try {
      await telechargerReleve(semestreId);
      flash("Relevé PDF téléchargé");
    } catch (err) {
      flash(err.message || "Téléchargement impossible.", "error");
    } finally {
      setTelechargement(false);
    }
  }

  async function downloadYear(annee) {
    setAnneeTelechargement(annee);
    try {
      await telechargerReleveAnnuel(annee);
      flash("Relevé annuel PDF téléchargé");
    } catch (err) {
      flash(err.message || "Téléchargement impossible.", "error");
    } finally {
      setAnneeTelechargement("");
    }
  }

  const anneesAvecDeuxSemestres = [...new Set(semestres
    .filter((s) => semestres.filter((autre) => autre.annee_academique === s.annee_academique).length >= 2)
    .map((s) => s.annee_academique))];

  async function submitMdp(e) {
    e.preventDefault();
    setError("");
    if (nouveau !== confirmation) { setError("La confirmation ne correspond pas au nouveau mot de passe."); return; }
    setMdpEnvoi(true);
    try {
      await changerMotDePasse(ancien, nouveau);
      setShowMdp(false);
      setChangementMdpObligatoire(false);
      setAncien(""); setNouveau(""); setConfirmation("");
      flash("Mot de passe mis à jour avec succès");
    } catch (err) {
      setError(err.message);
    } finally {
      setMdpEnvoi(false);
    }
  }

  function deconnexion() {
    clearSession();
    onLogout();
  }

  const initiales =
    [user?.nom, user?.prenoms].filter(Boolean).map((p) => (p.trim()[0] || "")).join("").toUpperCase() || "E";
  const moyenne = resultats?.resultat?.moyenne_generale ? parseFloat(resultats.resultat.moyenne_generale) : null;
  const barreMoyenne = moyenne !== null && !Number.isNaN(moyenne) ? Math.max(0, Math.min(100, (moyenne / 20) * 100)) : 0;
  const groupesNotes = useMemo(() => {
    const resumesUE = new Map((resultats?.unites_enseignement || []).map((ue) => [ue.id, ue]));
    const groupes = new Map();
    (resultats?.notes || []).filter((note) => note.session === "normale").forEach((note) => {
      const id = note.ue_id;
      if (!groupes.has(id)) {
        groupes.set(id, {
          id,
          code: note.ue_code,
          libelle: note.ue,
          resume: resumesUE.get(id),
          notes: [],
        });
      }
      groupes.get(id).notes.push(note);
    });
    return [...groupes.values()];
  }, [resultats]);

  return (
    <div className="page">
      <Topbar subtitle="Espace Étudiant" onExit={onExit}>
        <button className="btn btn-ghost btn-sm" onClick={() => setShowMdp(true)} style={{ borderColor: "#527897", color: "#f4f7fb" }}>
          <KeyRound size={14} /> Changer le mot de passe
        </button>
        <button className="btn btn-ghost btn-sm" onClick={deconnexion} style={{ borderColor: "#527897", color: "#f4f7fb" }}>
          <LogOut size={14} /> Se déconnecter
        </button>
      </Topbar>

      <div className="container-narrow">
        {/* Identité */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14, marginBottom: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 48, height: 48, borderRadius: "50%", background: "var(--or)", color: "#173b63",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 700, fontSize: 17, flexShrink: 0,
                boxShadow: "0 2px 10px rgba(201, 162, 39, 0.45)",
              }}
            >
              {initiales}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 21, fontWeight: 700, color: "#173b63" }}>
                {user?.nom} {user?.prenoms}
              </h2>
              <div className="muted" style={{ marginTop: 2 }}>{user?.matricule}</div>
            </div>
          </div>

        </div>

        {error && <ErrorBox message={error} />}

        {chargement && semestres.length === 0 && !error ? (
          <Loading label="Chargement de vos résultats…" />
        ) : semestres.length === 0 ? (
          <Card className="empty-state" style={{ padding: 32 }}>
            <Bell size={30} color="#347fbd" style={{ marginBottom: 12 }} />
            <div style={{ fontWeight: 700, fontSize: 15, color: "#1f1f1f", marginBottom: 6 }}>Aucun résultat publié pour l'instant</div>
            <p style={{ margin: 0 }}>Dès que la scolarité publie vos résultats, ils apparaîtront ici et vous recevrez une notification.</p>
          </Card>
        ) : (
          <>
            {/* Sélecteur de semestre */}
            <Card style={{ padding: 16, marginBottom: 18, display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
              <Field label="Semestre">
                <select className="select" style={{ minWidth: 260 }} value={semestreId} onChange={(e) => setSemestreId(e.target.value)}>
                  {semestres.map((s) => (
                    <option key={s.id} value={s.id}>Semestre {s.numero} — {s.annee_academique}</option>
                  ))}
                </select>
              </Field>
              <div style={{ marginLeft: "auto" }}>
                <Button icon={Download} variant="ghost" onClick={download} disabled={telechargement || !resultats?.publie}>
                  {telechargement ? "Génération…" : "Relevé PDF"}
                </Button>
              </div>
              {anneesAvecDeuxSemestres.length > 0 && (
                <div style={{ width: "100%", borderTop: "1px solid var(--bordure)", paddingTop: 12, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <span className="muted">Relevé annuel</span>
                  {anneesAvecDeuxSemestres.map((annee) => (
                    <Button key={annee} icon={FileText} variant="subtle" size="sm" onClick={() => downloadYear(annee)} disabled={Boolean(anneeTelechargement)}>
                      {anneeTelechargement === annee ? "Génération…" : `${annee} · S${semestres.filter((s) => s.annee_academique === annee).map((s) => s.numero).sort((a,b) => a-b).join(" + S")}`}
                    </Button>
                  ))}
                  <span className="small muted">Moyenne annuelle : moyenne simple des moyennes semestrielles.</span>
                </div>
              )}
            </Card>

            {resultats && resultats.publie && (
              <>
                <Card style={{ padding: 0, overflow: "hidden", marginBottom: 18 }}>
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Unité d’enseignement (UE)</th>
                          <th>Élément constitutif (EC)</th>
                          <th>Note finale / 20</th>
                          <th>Crédits UE</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupesNotes.flatMap((groupe) => groupe.notes.map((note, index) => {
                          const creditsConnus = (groupe.resume?.credits ?? note.ue_credits) != null;
                          const obtenus = Number(groupe.resume?.credits_obtenus) || 0;
                          const total = creditsConnus ? Number(groupe.resume?.credits ?? note.ue_credits) : 0;
                          const complet = groupe.resume
                            ? Number(groupe.resume.nb_notes) === Number(groupe.resume.nb_ec)
                            : true;
                          const validee = complet && total > 0 && obtenus >= total;
                          return (
                            <tr key={note.id}>
                              {index === 0 && (
                                <td rowSpan={groupe.notes.length} className="resultat-ue-cell">
                                  {groupe.code ? `${groupe.code} — ` : ""}{groupe.libelle}
                                </td>
                              )}
                              <td>{note.matiere}</td>
                              <td className="resultat-note-cell">{note.valeur}</td>
                              {index === 0 && (
                                <td rowSpan={groupe.notes.length}>
                                  <div className="resultat-credits-value">{creditsConnus ? (complet ? `${obtenus} / ${total}` : `— / ${total}`) : "Non renseignés"}</div>
                                  <span className={`resultat-credits-status${validee ? " is-valid" : ""}`}>
                                    {!creditsConnus ? "Crédits UE non renseignés" : (complet ? (validee ? "Validée" : "Non validée") : "Incomplète")}
                                  </span>
                                </td>
                              )}
                            </tr>
                          );
                        }))}
                      </tbody>
                    </table>
                  </div>
                  <p className="resultat-table-note">Les crédits UE détaillés s’affichent lorsqu’ils sont configurés. Le total officiel ci-dessous, s’il figure dans le classeur, est reproduit tel quel.</p>
                </Card>

                {(resultats.resultat?.credits_semestre_officiels != null || resultats.resultat?.credits_annee_officiels != null) && (
                  <Card style={{ display: "flex", gap: 28, flexWrap: "wrap", marginBottom: 18 }}>
                    {resultats.resultat?.credits_semestre_officiels != null && (
                      <div><div className="stat-label">TOTAL OFFICIEL DU SEMESTRE</div><strong>{resultats.resultat.credits_semestre_officiels} crédits</strong></div>
                    )}
                    {resultats.resultat?.credits_annee_officiels != null && (
                      <div><div className="stat-label">TOTAL OFFICIEL DE L’ANNÉE</div><strong>{resultats.resultat.credits_annee_officiels} crédits</strong></div>
                    )}
                    <span className="small muted">Valeurs reprises du classeur de la scolarité.</span>
                  </Card>
                )}

                <div className="grid-2" style={{ marginBottom: 18 }}>
                  <Card className="stat-card">
                    <div className="stat-label">MOYENNE GÉNÉRALE</div>
                    <div className="stat-value">{resultats.resultat?.moyenne_generale ?? "—"} / 20</div>
                    <div style={{ height: 6, width: "72%", margin: "12px auto 0", background: "var(--vert-tres-clair)", borderRadius: 999, overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%", width: `${barreMoyenne}%`,
                          background: "linear-gradient(90deg, var(--vert-clair), var(--vert))",
                          borderRadius: 999, transition: "width 0.6s ease",
                        }}
                      />
                    </div>
                  </Card>
                  <Card className="stat-card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <div className="stat-label">DÉCISION</div>
                    <div style={{ marginTop: 4 }}>
                      <DecisionBadge decision={resultats.resultat?.decision} />
                    </div>
                  </Card>
                </div>

                <Button icon={FileText} variant="primary" full onClick={download} disabled={telechargement}>
                  {telechargement ? "Génération du PDF…" : "Télécharger le relevé de notes (PDF)"}
                </Button>
              </>
            )}
            {resultats && !resultats.publie && (
              <Card className="empty-state" style={{ padding: 32 }}>
                <Bell size={30} color="#347fbd" style={{ marginBottom: 12 }} />
                <div style={{ fontWeight: 700, fontSize: 15, color: "#1f1f1f", marginBottom: 6 }}>Résultats non encore publiés</div>
                <p style={{ margin: 0 }}>La scolarité n'a pas encore publié les résultats de ce semestre.</p>
              </Card>
            )}
          </>
        )}
      </div>

      {/* Modale changement de mot de passe */}
      {showMdp && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(11, 61, 46, 0.45)", zIndex: 40,
            display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
          }}
          onClick={() => { if (!changementMdpObligatoire) setShowMdp(false); }}
        >
          <Card style={{ padding: 28, width: 400 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 700 }}>Changer le mot de passe</h3>
            <p className="muted" style={{ margin: "0 0 18px" }}>Le nouveau mot de passe doit contenir au moins 8 caractères.</p>
            <form onSubmit={submitMdp}>
              <Field label="Ancien mot de passe">
                <input className="input" type="password" value={ancien} onChange={(e) => setAncien(e.target.value)} autoFocus />
              </Field>
              <Field label="Nouveau mot de passe">
                <input className="input" type="password" value={nouveau} onChange={(e) => setNouveau(e.target.value)} />
              </Field>
              <Field label="Confirmation">
                <input className="input" type="password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} />
              </Field>
              <ErrorBox message={error} />
              <div style={{ display: "flex", gap: 10 }}>
                <Button type="submit" full disabled={mdpEnvoi || !ancien || !nouveau || !confirmation}>
                  {mdpEnvoi ? "Enregistrement…" : "Mettre à jour"}
                </Button>
                {!changementMdpObligatoire && <Button variant="subtle" onClick={() => setShowMdp(false)}>Annuler</Button>}
              </div>
            </form>
          </Card>
        </div>
      )}

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
