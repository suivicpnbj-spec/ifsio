import React, { useState, useEffect, useMemo, useCallback } from "react";
import { PenLine, CheckCircle2, Send, RefreshCw, FileSpreadsheet, ScrollText, AlertTriangle, Users, BookOpen, ClipboardCheck, ShieldCheck, Settings2 } from "lucide-react";
import { Topbar, Card, Field, Button, Seal, DecisionBadge, Toast, Loading, ErrorBox } from "../components/ui.jsx";
import ImportTab from "../components/ImportTab.jsx";
import ReferentielTab from "../components/ReferentielTab.jsx";
import {
  listerFilieres, listerPromotions, listerSemestres,
  obtenirNotesPromotion, saisirNotesLot, verifierResultats, publierResultats, publierUnites, listerJournal,
} from "../api.js";

/* Reproduit le calcul officiel : moyenne des EC par UE, puis moyenne simple des UE. */
function moyenneSemestre(notesEtudiant, matieres) {
  const notesParUE = new Map();
  matieres.forEach((m) => {
    const v = notesEtudiant?.[m.id];
    if (v !== undefined && v !== "" && v !== null && !Number.isNaN(parseFloat(v))) {
      const notes = notesParUE.get(m.ue_id) || [];
      notes.push(parseFloat(v));
      notesParUE.set(m.ue_id, notes);
    }
  });
  const moyennesUE = [...notesParUE.values()].map((notes) =>
    notes.reduce((sum, note) => sum + note, 0) / notes.length
  );
  if (moyennesUE.length === 0) return null;
  return Math.round((moyennesUE.reduce((sum, moyenne) => sum + moyenne, 0) / moyennesUE.length) * 100) / 100;
}

/* Statut global du workflow dérivé des données serveur.
   La source de vérité est resultat_semestre : la vérification met à jour uniquement
   ces lignes (les notes individuelles restent en brouillon jusqu'à la publication).
   Cas particulier : une note modifiée après publication repasse en brouillon →
   l'ensemble doit être re-vérifié et re-publié (statut Brouillon). */
function statutGlobal(notes, resultats) {
  if (notes.some((n) => n.statut_publication === "publie") && !notes.every((n) => n.statut_publication === "publie")) return "Publié partiellement";
  if (!resultats || resultats.length === 0) return "Brouillon";
  if (resultats.every((r) => r.statut_publication === "publie")) {
    return notes.some((n) => n.statut_publication === "brouillon") ? "Brouillon" : "Publié";
  }
  if (resultats.every((r) => r.statut_publication === "verifie")) return "Vérifié";
  return "Brouillon";
}

export default function ScolariteApp({ onExit, user }) {
  const [filieres, setFilieres] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [semestres, setSemestres] = useState([]);
  const [filiereId, setFiliereId] = useState("");
  const [promotionId, setPromotionId] = useState("");
  const [semestreId, setSemestreId] = useState("");

  const [tab, setTab] = useState("import"); // import | saisie | journal
  const [data, setData] = useState(null);
  const [notesLocales, setNotesLocales] = useState({});
  const [notesInitiales, setNotesInitiales] = useState({});
  const [ueSelectionnees, setUeSelectionnees] = useState([]);
  const [journal, setJournal] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [envoi, setEnvoi] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [referentielRevision, setReferentielRevision] = useState(0);

  const flash = useCallback((msg, type = "success") => setToast({ msg, type }), []);

  /* Chargement initial du référentiel */
  useEffect(() => {
    (async () => {
      try {
        const f = await listerFilieres();
        setFilieres(f);
      } catch (err) {
        setError(err.message);
      } finally {
        setChargement(false);
      }
    })();
  }, []);

  /* Les référentiels de semestre sont propres à une promotion. */
  useEffect(() => {
    if (!promotionId) { setSemestres([]); setSemestreId(""); return; }
    listerSemestres(promotionId)
      .then((s) => {
        setSemestres(s);
        setSemestreId((actuel) => s.some((item) => item.id === actuel) ? actuel : (s[0]?.id || ""));
      })
      .catch((err) => setError(err.message));
  }, [promotionId, referentielRevision]);

  /* Promotion filtrée par filière */
  useEffect(() => {
    if (!filiereId) { setPromotions([]); setPromotionId(""); return; }
    listerPromotions(filiereId)
      .then((p) => { setPromotions(p); setPromotionId((current) => p.some((item) => item.id === current) ? current : (p[0]?.id || "")); })
      .catch((err) => setError(err.message));
  }, [filiereId, referentielRevision]);

  function actualiserReferentiel(changements = {}) {
    if (changements.filiereId !== undefined) setFiliereId(changements.filiereId);
    if (changements.promotionId !== undefined) setPromotionId(changements.promotionId);
    if (changements.semestreId !== undefined) setSemestreId(changements.semestreId);
    setReferentielRevision((revision) => revision + 1);
  }

  /* Chargement du tableau de notes quand promotion + semestre sont choisis */
  const chargerNotes = useCallback(async (pid, sid) => {
    if (!pid || !sid) return;
    setChargement(true);
    setError("");
    try {
      const d = await obtenirNotesPromotion(pid, sid);
      setData(d);
      const map = {};
      d.notes.forEach((n) => {
        if (n.session !== "normale") return;
        map[n.etudiant_id] = { ...(map[n.etudiant_id] || {}), [n.matiere_id]: n.valeur };
      });
      setNotesLocales(map);
      setNotesInitiales(JSON.parse(JSON.stringify(map)));
    } catch (err) {
      setError(err.message);
      setData(null);
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    chargerNotes(promotionId, semestreId);
  }, [promotionId, semestreId, chargerNotes]);

  /* Chargement du journal */
  useEffect(() => {
    if (tab !== "journal") return;
    listerJournal()
      .then(setJournal)
      .catch((err) => setError(err.message));
  }, [tab]);

  const statut = useMemo(() => (data ? statutGlobal(data.notes, data.resultats) : "Brouillon"), [data]);
  const nbModifs = useMemo(() => {
    let n = 0;
    data?.etudiants.forEach((e) =>
      data.matieres.forEach((m) => {
        if ((notesLocales[e.id]?.[m.id] ?? null) !== (notesInitiales[e.id]?.[m.id] ?? null)) n += 1;
      })
    );
    return n;
  }, [notesLocales, notesInitiales, data]);

  const notesSaisies = useMemo(() => {
    if (!data) return 0;
    return data.etudiants.reduce((total, e) => total + data.matieres.filter((m) => {
      const valeur = notesLocales[e.id]?.[m.id];
      return valeur !== undefined && valeur !== null && valeur !== "";
    }).length, 0);
  }, [data, notesLocales]);

  const decisionsImportees = useMemo(
    () => data?.resultats?.filter((r) => r.decision).length || 0,
    [data]
  );

  function majNote(etudiantId, matiereId, valeur) {
    setNotesLocales((prev) => ({ ...prev, [etudiantId]: { ...(prev[etudiantId] || {}), [matiereId]: valeur } }));
  }

  /* Envoi en lot des seules notes modifiées (idempotent, journal propre) */
  async function enregistrerBrouillon() {
    if (nbModifs === 0) { flash("Aucune modification à enregistrer.", "error"); return; }
    setEnvoi(true);
    setError("");
    try {
      const corps = [];
      data.etudiants.forEach((e) =>
        data.matieres.forEach((m) => {
          const actuelle = notesLocales[e.id]?.[m.id] ?? null;
          const initiale = notesInitiales[e.id]?.[m.id] ?? null;
          if (actuelle !== initiale && actuelle !== "" && actuelle !== null && actuelle !== undefined) {
            corps.push({ etudiant_id: e.id, matiere_id: m.id, valeur: parseFloat(actuelle), session: "normale" });
          }
        })
      );
      if (corps.length === 0) { flash("Aucune modification à enregistrer.", "error"); return; }
      const res = await saisirNotesLot(corps);
      await chargerNotes(promotionId, semestreId);
      flash(`Brouillon enregistré (${res.nb_enregistrees} note${res.nb_enregistrees > 1 ? "s" : ""})`);
    } catch (err) {
      setError(err.message);
      flash("Échec de l'enregistrement.", "error");
    } finally {
      setEnvoi(false);
    }
  }

  async function verifier() {
    setEnvoi(true); setError("");
    try {
      const res = await verifierResultats(promotionId, semestreId);
      await chargerNotes(promotionId, semestreId);
      flash(`Résultats vérifiés (${res.nb_etudiants} étudiant${res.nb_etudiants > 1 ? "s" : ""})`);
    } catch (err) {
      setError(err.message); flash("Vérification impossible.", "error");
    } finally { setEnvoi(false); }
  }

  async function publier() {
    setEnvoi(true); setError("");
    try {
      await publierResultats(promotionId, semestreId);
      await chargerNotes(promotionId, semestreId);
      flash("Résultats publiés — notifications en cours d'envoi");
    } catch (err) {
      setError(err.message); flash("Publication impossible.", "error");
    } finally { setEnvoi(false); }
  }

  async function publierSelectionUE() {
    if (!ueSelectionnees.length) { flash("Sélectionnez au moins une UE.", "error"); return; }
    setEnvoi(true); setError("");
    try {
      const res = await publierUnites(promotionId, semestreId, ueSelectionnees);
      await chargerNotes(promotionId, semestreId);
      setUeSelectionnees([]);
      flash(`${res.ue_ids.length} UE publiée(s) pour la promotion.`);
    } catch (err) { setError(err.message); flash("Publication partielle impossible.", "error"); }
    finally { setEnvoi(false); }
  }

  const unites = useMemo(() => {
    const uniques = new Map();
    (data?.matieres || []).forEach((m) => uniques.set(m.ue_id, { id: m.ue_id, libelle: m.ue }));
    return [...uniques.values()];
  }, [data]);

  const groupesMatieres = useMemo(() => {
    const groupes = new Map();
    (data?.matieres || []).forEach((m) => {
      if (!groupes.has(m.ue_id)) groupes.set(m.ue_id, { id: m.ue_id, libelle: m.ue, matieres: [] });
      groupes.get(m.ue_id).matieres.push(m);
    });
    return [...groupes.values()];
  }, [data]);

  if (chargement && !data && filieres.length === 0) {
    return (
      <div className="page scolarite-page">
        <Topbar subtitle="Espace Scolarité" onExit={onExit} />
        <Loading label="Chargement du référentiel…" />
      </div>
    );
  }

  const libellePromo = promotions.find((p) => p.id === promotionId);
  const libelleSemestre = semestres.find((s) => s.id === semestreId);

  return (
    <div className="page scolarite-page">
      <Topbar subtitle="Espace Scolarité" onExit={onExit}>
        {user && (
          <span className="muted" style={{ color: "#c5d9eb" }}>
            {user.nom} · {user.role}
          </span>
        )}
      </Topbar>

      <div className="container">
        <section className="scolarite-hero">
          <div>
            <div className="scolarite-eyebrow"><ShieldCheck size={14} /> Administration académique</div>
            <h1>Gestion des résultats</h1>
            <p>Chargez le classeur finalisé, vérifiez sa lecture et suivez la publication des résultats par promotion.</p>
          </div>
          <div className="scolarite-hero-side">
            <span className="scolarite-hero-label">ESPACE SÉCURISÉ</span>
            <strong>{user?.nom || "Scolarité"}</strong>
            <span>Accès secrétariat <i /></span>
          </div>
        </section>

        {/* Sélecteurs du contexte */}
        <Card className="scolarite-context-card" style={{ padding: 20, marginBottom: 24 }}>
          <div className="scolarite-section-heading">
            <div><span>Votre espace de travail</span><h2>Choisir le parcours</h2></div>
            <div className="scolarite-context-caption">Les résultats affichés suivent cette sélection.</div>
          </div>
          <div className="scolarite-context-grid">
            <Field label="Filière">
              <select className="select" value={filiereId} onChange={(e) => setFiliereId(e.target.value)}>
                <option value="">— Choisir —</option>
                {filieres.map((f) => (
                  <option key={f.id} value={f.id}>{f.libelle} ({f.code})</option>
                ))}
              </select>
            </Field>
            <Field label="Promotion">
              <select className="select" value={promotionId} onChange={(e) => setPromotionId(e.target.value)} disabled={!filiereId || promotions.length === 0}>
                <option value="">{filiereId && promotions.length === 0 ? "Aucune promotion créée" : "— Choisir —"}</option>
                {promotions.map((p) => (
                  <option key={p.id} value={p.id}>Année {p.annee_entree} · {p.niveau}</option>
                ))}
              </select>
            </Field>
            <Field label="Semestre">
              <select className="select" value={semestreId} onChange={(e) => setSemestreId(e.target.value)}>
                <option value="">— Choisir —</option>
                {semestres.map((s) => (
                  <option key={s.id} value={s.id}>
                    Semestre {s.numero} — {s.annee_academique}{s.active ? " (année active)" : ""}
                  </option>
                ))}
              </select>
            </Field>
            <div>
              <Button variant="subtle" icon={RefreshCw} onClick={() => chargerNotes(promotionId, semestreId)} disabled={!promotionId || !semestreId}>
                Actualiser les données
              </Button>
            </div>
          </div>
          {filiereId && promotions.length === 0 && <div className="scolarite-promo-empty"><AlertTriangle size={15} /><span>Aucune promotion n’est configurée pour cette filière. Ouvrez « Configurer les parcours » pour la créer.</span></div>}
        </Card>

        {error && <ErrorBox message={error} />}

        <div className="tabs scolarite-tabs">
          {[["import", "Importer un classeur", FileSpreadsheet], ["saisie", "Résultats de la promotion", PenLine], ["journal", "Journal d’activité", ScrollText], ["referentiel", "Configurer les parcours", Settings2]].map(([key, label, Icon]) => (
            <button key={key} className={`tab${tab === key ? " active" : ""}`} onClick={() => setTab(key)}><Icon size={15} /> {label}</button>
          ))}
        </div>
        {tab === "referentiel" && <ReferentielTab filieres={filieres} promotions={promotions} semestres={semestres} filiereId={filiereId} promotionId={promotionId} semestreId={semestreId} onCreated={actualiserReferentiel} flash={flash} />}

        {!data && tab !== "referentiel" ? (
          <Card className="empty-state" style={{ padding: 40 }}>
            Sélectionnez une filière, une promotion et un semestre pour afficher le tableau de saisie.
          </Card>
        ) : data && tab !== "referentiel" ? (
          <>
            {/* En-tête du contexte + workflow */}
            <div className="scolarite-workspace-heading">
              <div><span className="scolarite-kicker">PROMOTION SÉLECTIONNÉE</span>
                <h2>{libellePromo ? `${libellePromo.filiere} · ${libellePromo.niveau}` : "Résultats"}{libelleSemestre ? ` / Semestre ${libelleSemestre.numero}` : ""}</h2>
                <p>Moyenne simple des moyennes d’UE <i /> crédits UE acquis à partir de 12/20</p>
              </div>
              <div className="scolarite-workflow"><span>Étape de publication</span><Seal statut={statut} /></div>
            </div>

            <div className="scolarite-metrics">
              <div className="scolarite-metric"><span className="scolarite-metric-icon"><Users size={17}/></span><div><small>Étudiants</small><strong>{data.etudiants.length}</strong></div></div>
              <div className="scolarite-metric"><span className="scolarite-metric-icon"><BookOpen size={17}/></span><div><small>Éléments constitutifs</small><strong>{data.matieres.length}</strong></div></div>
              <div className="scolarite-metric"><span className="scolarite-metric-icon"><ClipboardCheck size={17}/></span><div><small>Notes renseignées</small><strong>{notesSaisies}<em> / {data.etudiants.length * data.matieres.length}</em></strong></div></div>
              <div className="scolarite-metric"><span className="scolarite-metric-icon"><ShieldCheck size={17}/></span><div><small>Décisions officielles</small><strong>{decisionsImportees}<em> / {data.etudiants.length}</em></strong></div></div>
            </div>

            {tab === "saisie" && (
              <>
              <Card className="scolarite-table-card" style={{ padding: 0, overflow: "hidden" }}>
                <div className="scolarite-table-toolbar"><div><h3>Relevé de la promotion</h3><p>Les modifications sont surlignées jusqu’à leur enregistrement.</p></div>{nbModifs > 0 && <span className="scolarite-pending"><i /> {nbModifs} modification{nbModifs > 1 ? "s" : ""} en attente</span>}</div>
                <div className="table-wrap scolarite-grade-table-wrap">
                  <table className="table scolarite-grade-table">
                    <thead>
                      <tr>
                        <th rowSpan={2}>Étudiant</th>
                        {groupesMatieres.map((g) => <th className="scolarite-ue-header" key={g.id} colSpan={g.matieres.length}>{g.libelle}</th>)}
                        <th rowSpan={2}>Moyenne</th><th rowSpan={2}>Décision</th>
                      </tr>
                      <tr>{groupesMatieres.flatMap((g) => g.matieres.map((m) => <th key={m.id} title={m.libelle}>{m.libelle}</th>))}</tr>
                    </thead>
                    <tbody>
                      {data.etudiants.map((e) => {
                        const moy = moyenneSemestre(notesLocales[e.id], data.matieres);
                        const dec = data.resultats?.find((r) => r.etudiant_id === e.id)?.decision || null;
                        return (
                          <tr key={e.id}>
                            <td style={{ fontWeight: 600 }}>
                              {e.nom} {e.prenoms}
                              <div className="small muted" style={{ fontWeight: 400 }}>{e.matricule}</div>
                            </td>
                            {data.matieres.map((m) => {
                              const modifie = (notesLocales[e.id]?.[m.id] ?? null) !== (notesInitiales[e.id]?.[m.id] ?? null);
                              return (
                                <td key={m.id}>
                                  <input
                                    type="number"
                                    step="0.25"
                                    min="0"
                                    max="20"
                                    className={`note-input${modifie ? " modified" : ""}`}
                                    value={notesLocales[e.id]?.[m.id] ?? ""}
                                    onChange={(ev) => majNote(e.id, m.id, ev.target.value)}
                                    title={`Note de ${m.libelle}`}
                                  />
                                </td>
                              );
                            })}
                            <td style={{ fontWeight: 700, color: "#173b63" }}>{moy !== null ? moy.toFixed(2) : "—"}</td>
                            <td>{dec ? <DecisionBadge decision={dec} /> : <span className="muted">Non renseignée</span>}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="scolarite-table-actions">
                  <Button icon={PenLine} onClick={enregistrerBrouillon} disabled={envoi || nbModifs === 0}>
                    {nbModifs > 0 ? `Enregistrer le brouillon (${nbModifs})` : "Enregistrer le brouillon"}
                  </Button>
                  <Button icon={CheckCircle2} variant="gold" onClick={verifier} disabled={envoi || nbModifs > 0 || statut === "Publié"}>
                    Marquer comme vérifié
                  </Button>
                  <Button icon={Send} variant={statut === "Vérifié" ? "primary" : "subtle"} onClick={publier} disabled={envoi || statut !== "Vérifié"}>
                    Publier les résultats
                  </Button>
                  {statut !== "Vérifié" && nbModifs === 0 && (
                    <span className="muted" style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                      <AlertTriangle size={13} /> Publication possible uniquement après vérification
                    </span>
                  )}
                  {nbModifs > 0 && (
                    <span className="muted" style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                      <AlertTriangle size={13} /> Enregistrez le brouillon avant de vérifier
                    </span>
                  )}
                </div>
              </Card>
              <Card className="scolarite-partial-card" style={{ padding: 20, marginTop: 18 }}>
                <div className="scolarite-partial-heading"><span><Send size={16}/></span><div><h3>Publier une partie des résultats</h3><p>Choisissez les UE prêtes à être communiquées aux étudiants.</p></div></div>
                <p className="muted" style={{ margin: "0 0 14px" }}>Rend visibles les notes des UE choisies, même si les autres UE du semestre restent en attente. Toutes les notes de ces UE doivent être saisies pour chaque étudiant.</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 18px", marginBottom: 14 }}>
                  {unites.map((ue) => <label key={ue.id} style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13, cursor: "pointer" }}><input type="checkbox" checked={ueSelectionnees.includes(ue.id)} onChange={(e) => setUeSelectionnees((prev) => e.target.checked ? [...prev, ue.id] : prev.filter((id) => id !== ue.id))} />{ue.libelle}</label>)}
                </div>
                <Button icon={Send} variant="ghost" onClick={publierSelectionUE} disabled={envoi || !ueSelectionnees.length || nbModifs > 0}>{envoi ? "Publication…" : `Publier ${ueSelectionnees.length || "les UE"} sélectionnée${ueSelectionnees.length > 1 ? "s" : ""}`}</Button>
              </Card>
              </>
            )}

            {tab === "import" && (
              <ImportTab
                semestreId={semestreId}
                promotionId={promotionId}
                onNotesImportees={() => {
                  chargerNotes(promotionId, semestreId);
                  setTab("saisie");
                }}
                flash={flash}
              />
            )}

            {tab === "journal" && (
              <Card style={{ padding: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <FileSpreadsheet size={16} color="#173b63" />
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Journal des modifications</h3>
                </div>
                {journal.length === 0 ? (
                  <div className="empty-state">Aucune entrée dans le journal pour l'instant.</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {journal.map((j, i) => (
                      <div key={j.id} style={{ fontSize: 13, padding: "10px 0", borderBottom: i < journal.length - 1 ? "1px solid #e4ebf2" : "none" }}>
                        <div>
                          <span className="badge badge-neutre">{j.table_cible}</span>{" "}
                          <span style={{ fontWeight: 600 }}>{j.action}</span>
                          {j.nouvelle_valeur && (
                            <span style={{ color: "#173b63", fontWeight: 600 }}>
                              {" "}→ {JSON.stringify(j.nouvelle_valeur).slice(0, 140)}
                            </span>
                          )}
                        </div>
                        <div className="small muted" style={{ marginTop: 2 }}>
                          {j.auteur || "Système"} · {new Date(j.date).toLocaleString("fr-FR")}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}
          </>
        ) : null}
      </div>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
