import React, { useEffect, useRef, useState } from "react";
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, XCircle, PenLine, Trash2, ListChecks } from "lucide-react";
import { Button, Card, ErrorBox, Field } from "./ui.jsx";
import { importerNotesExcel, confirmerImportNotes, obtenirStructureImport, analyserImportConfigure } from "../api.js";

const CLE_MODELES_IMPORT = "ifsio_modeles_import_notes_v1";

function nomColonneExcel(index) {
  let n = index + 1; let nom = "";
  while (n > 0) { const reste = (n - 1) % 26; nom = String.fromCharCode(65 + reste) + nom; n = Math.floor((n - 1) / 26); }
  return nom;
}

/**
 * Onglet « Import Excel/CSV » du back-office scolarité.
 *
 * Le format attendu (1ère feuille) : colonne A = matricule, colonne B = nom (informatif),
 * puis une colonne par matière avec le libellé exact en en-tête.
 *
 * Flux : dépôt du fichier → analyse (POST /api/notes/import, aucune écriture) →
 * revue du rapport → confirmation d'écriture via POST /api/notes/lot.
 */
export default function ImportTab({ semestreId, promotionId, onNotesImportees, flash }) {
  const [fichier, setFichier] = useState(null);
  const [analyse, setAnalyse] = useState(null);
  const [chargement, setChargement] = useState(false);
  const [ecriture, setEcriture] = useState(false);
  const [error, setError] = useState("");
  const [drag, setDrag] = useState(false);
  const [session, setSession] = useState("normale");
  const [modeImport, setModeImport] = useState("auto");
  const [structure, setStructure] = useState(null);
  const [chargementStructure, setChargementStructure] = useState(false);
  const [ligneEntete, setLigneEntete] = useState(1);
  const [colonneMatricule, setColonneMatricule] = useState(0);
  const [colonneCreditsSemestre, setColonneCreditsSemestre] = useState("");
  const [colonneCreditsAnnee, setColonneCreditsAnnee] = useState("");
  const [mappings, setMappings] = useState({});
  const [nomModele, setNomModele] = useState("");
  const [modeles, setModeles] = useState(() => {
    try { return JSON.parse(localStorage.getItem(CLE_MODELES_IMPORT) || "[]"); } catch { return []; }
  });
  const [modeleSelectionne, setModeleSelectionne] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    // Un rapport analysé appartient au couple promotion/semestre courant.
    // L'effacer quand le contexte change évite d'écrire les notes dans l'ancien contexte.
    setAnalyse(null);
    setStructure(null);
    setModeImport("auto");
    setMappings({});
  }, [promotionId, semestreId, session]);

  function choisirFichier(f) {
    if (!f) return;
    const nom = f.name.toLowerCase();
    if (!nom.endsWith(".xlsx") && !nom.endsWith(".ods") && !nom.endsWith(".csv")) {
      setError("Seuls les fichiers .xlsx, .ods et .csv sont acceptés.");
      return;
    }
    setError("");
    setAnalyse(null);
    setStructure(null);
    setModeImport("auto");
    setFichier(f);
  }

  async function analyser() {
    if (!fichier || !semestreId || !promotionId) return;
    setChargement(true);
    setError("");
    try {
      const rapport = await importerNotesExcel(fichier, semestreId, promotionId, session);
      setAnalyse(rapport);
    } catch (err) {
      setError(err.message);
      setAnalyse(null);
    } finally {
      setChargement(false);
    }
  }

  async function ouvrirConfiguration() {
    if (!fichier || !semestreId) return;
    setModeImport("manuel");
    setAnalyse(null);
    setError("");
    if (structure) return;
    setChargementStructure(true);
    try {
      const resultat = await obtenirStructureImport(fichier, semestreId);
      setStructure(resultat);
      setLigneEntete(1);
      setColonneMatricule(0);
      setColonneCreditsSemestre("");
      setColonneCreditsAnnee("");
      setMappings({});
    } catch (err) { setError(err.message); setModeImport("auto"); }
    finally { setChargementStructure(false); }
  }

  async function analyserConfigure() {
    if (!fichier || !structure) return;
    const associations = Object.entries(mappings)
      .filter(([, matiereId]) => matiereId)
      .map(([colonne, matiere_id]) => ({ colonne: Number(colonne), matiere_id }));
    setChargement(true);
    setError("");
    try {
      setAnalyse(await analyserImportConfigure(fichier, { promotionId, semestreId, session, ligneEntete, colonneMatricule, colonneCreditsSemestre, colonneCreditsAnnee, mappings: associations }));
    } catch (err) { setError(err.message); setAnalyse(null); }
    finally { setChargement(false); }
  }

  function sauvegarderModele() {
    const nom = nomModele.trim();
    const associations = Object.entries(mappings).filter(([, id]) => id).map(([colonne, matiere_id]) => ({ colonne: Number(colonne), matiere_id }));
    if (!nom || !structure || !associations.length) return;
    const signature = structure.lignes[ligneEntete - 1]?.map((v) => String(v ?? "").trim()) || [];
    const cleParId = new Map(structure.matieres.map((m) => [m.id, m.code || `${m.ue_code || m.ue}|${m.libelle}`]));
    const modele = { id: `${Date.now()}`, nom, ligneEntete, colonneMatricule, colonneCreditsSemestre, colonneCreditsAnnee, mappings: associations.map((m) => ({ ...m, cle: cleParId.get(m.matiere_id) })), signature };
    const suivants = [...modeles.filter((m) => m.nom.toLowerCase() !== nom.toLowerCase()), modele];
    setModeles(suivants);
    localStorage.setItem(CLE_MODELES_IMPORT, JSON.stringify(suivants));
    setModeleSelectionne(modele.id);
    setNomModele("");
  }

  function appliquerModele(id) {
    setModeleSelectionne(id);
    const modele = modeles.find((m) => m.id === id);
    if (!modele || !structure) return;
    const ligne = structure.lignes[modele.ligneEntete - 1] || [];
    const signature = ligne.map((v) => String(v ?? "").trim());
    if (modele.signature?.some((v, i) => v !== signature[i])) {
      setError("Les en-têtes du classeur ne correspondent pas au modèle choisi. Vérifiez les associations avant de poursuivre.");
      return;
    }
    const idsParCle = new Map(structure.matieres.map((m) => [m.code || `${m.ue_code || m.ue}|${m.libelle}`, m.id]));
    setLigneEntete(modele.ligneEntete);
    setColonneMatricule(modele.colonneMatricule);
    setColonneCreditsSemestre(modele.colonneCreditsSemestre ?? "");
    setColonneCreditsAnnee(modele.colonneCreditsAnnee ?? "");
    setMappings(Object.fromEntries(modele.mappings.map((m) => [m.colonne, idsParCle.get(m.cle) || m.matiere_id])));
    setError("");
  }

  async function ecrire() {
    if ((!analyse?.notes?.length && !analyse?.credits_officiels?.length) || analyse.bloquant || analyse.erreurs?.length || analyse.avertissements?.length) return;
    setEcriture(true);
    setError("");
    try {
      const res = await confirmerImportNotes(analyse, promotionId, semestreId);
      flash(`Import enregistré : ${res.nb_enregistrees} note${res.nb_enregistrees > 1 ? "s" : ""} et ${res.nb_totaux_credits} total${res.nb_totaux_credits > 1 ? "s" : ""} de crédits`);
      setAnalyse(null);
      setFichier(null);
      onNotesImportees();
    } catch (err) {
      setError(err.message);
    } finally {
      setEcriture(false);
    }
  }

  return (
    <Card style={{ padding: 28 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <FileSpreadsheet size={18} color="#173b63" />
        <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Import de notes (Excel ou CSV)</h3>
      </div>
      <p className="muted" style={{ margin: "0 0 20px", lineHeight: 1.6 }}>
        <strong>CSV « format bulletin »</strong>&nbsp;: en-têtes avec les codes matières (ex. APG1101),
        puis N° | matricule | nom et prénoms | notes (colonne « Moy » par matière).<br />
        <strong>Classeur IDE</strong>&nbsp;: les paires CC/ET sont reconnues par UE et EC; la note finale est leur moyenne.<br />
        <strong>ODS bêta ESSFE L2</strong>&nbsp;: grille CC/ET des semestres 3 et 4.<br />
        <strong>Autres classeurs</strong>&nbsp;: configurez la ligne d’en-tête, la colonne matricule et l’association des colonnes de notes aux EC. Vous pourrez enregistrer le modèle pour le réutiliser.<br />
        L’import automatique conserve les modèles déjà reconnus. La configuration manuelle accepte les notes finales en .xlsx ou .csv.
      </p>

      <Field label="Session des notes à importer">
        <select className="select" value={session} onChange={(e) => setSession(e.target.value)} style={{ maxWidth: 360 }}>
          <option value="normale">Session normale</option>
          <option value="rattrapage">Session de rattrapage</option>
        </select>
      </Field>

      {/* Zone de dépôt */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Déposer un fichier Excel de notes"
        onClick={() => semestreId && promotionId && inputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && semestreId && promotionId) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => { e.preventDefault(); semestreId && promotionId && setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          choisirFichier(e.dataTransfer.files?.[0]);
        }}
        style={{
          border: `2px dashed ${drag ? "#173b63" : "#347fbd"}`,
          borderRadius: 10,
          padding: "34px 24px",
          textAlign: "center",
          background: drag ? "#e8f1f9" : "#fbf7ec",
          cursor: semestreId && promotionId ? "pointer" : "not-allowed",
          transition: "background 0.15s ease, border-color 0.15s ease",
          opacity: semestreId && promotionId ? 1 : 0.6,
        }}
      >
        <Upload size={30} color={drag ? "#173b63" : "#347fbd"} style={{ marginBottom: 10 }} />
        <div style={{ fontWeight: 600, fontSize: 14.5, color: "#173b63" }}>
          {fichier ? fichier.name : "Cliquer ou déposer un fichier ici"}
        </div>
        <div className="muted" style={{ marginTop: 4 }}>Formats .xlsx, .ods (grille bêta L2) ou .csv (bulletin à codes matières)</div>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.ods,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.oasis.opendocument.spreadsheet"
          style={{ display: "none" }}
          onChange={(e) => { choisirFichier(e.target.files?.[0]); e.target.value = ""; }}
        />
      </div>

      {/* Actions sous la zone */}
      {fichier && (
        <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap", alignItems: "center" }}>
          <Button icon={ListChecks} onClick={modeImport === "auto" ? analyser : analyserConfigure} disabled={chargement || !semestreId || !promotionId}>
            {chargement ? "Analyse en cours…" : modeImport === "auto" ? (analyse ? "Ré-analyser le fichier" : "Analyser avec un modèle reconnu") : "Re-analyser selon la configuration"}
          </Button>
          {modeImport === "auto" ? (
            <Button variant="subtle" icon={FileSpreadsheet} onClick={ouvrirConfiguration} disabled={chargementStructure || !semestreId}>
              {chargementStructure ? "Lecture du classeur…" : "Configurer ce classeur"}
            </Button>
          ) : (
            <Button variant="subtle" onClick={() => { setModeImport("auto"); setAnalyse(null); setError(""); }}>Utiliser un modèle reconnu</Button>
          )}
          <Button variant="subtle" icon={Trash2} onClick={() => { setFichier(null); setAnalyse(null); setError(""); }}>
            Retirer
          </Button>
          {analyse && (
            <span className="muted">
              {analyse.nb_notes_valides} note{analyse.nb_notes_valides > 1 ? "s" : ""} valide{analyse.nb_notes_valides > 1 ? "s" : ""}
              {" · "}{analyse.erreurs.length} erreur{analyse.erreurs.length > 1 ? "s" : ""}
              {" · "}{analyse.avertissements.length} avertissement{analyse.avertissements.length > 1 ? "s" : ""}
            </span>
          )}
        </div>
      )}

      {modeImport === "manuel" && structure && (
        <div className="info-box" style={{ marginTop: 18, padding: 18 }}>
          <h4 style={{ margin: "0 0 12px", color: "#173b63" }}>Configurer les colonnes du classeur</h4>
          <p className="small muted" style={{ marginTop: 0 }}>Les colonnes de notes sont importées comme notes finales. Vous pouvez aussi associer les totaux officiels de crédits. Les décisions du jury et les autres colonnes non associées ne sont pas importées : si elles sont présentes, l’analyse bloque la confirmation.</p>
          <div className="table-wrap" style={{ maxHeight: 220, overflow: "auto", marginBottom: 14, background: "#fff" }}>
            <table className="table" style={{ minWidth: Math.max(700, structure.nb_colonnes * 115) }}>
              <thead><tr><th>Ligne</th>{Array.from({ length: structure.nb_colonnes }, (_, i) => <th key={i}>{nomColonneExcel(i)}</th>)}</tr></thead>
              <tbody>{structure.lignes.slice(Math.max(0, ligneEntete - 2), Math.min(structure.lignes.length, ligneEntete + 2)).map((row, index) => {
                const numero = Math.max(0, ligneEntete - 2) + index + 1;
                return <tr key={numero} style={numero === ligneEntete ? { background: "#eaf4fc", fontWeight: 700 } : undefined}><th>{numero}</th>{Array.from({ length: structure.nb_colonnes }, (_, i) => <td key={i}>{String(row[i] ?? "")}</td>)}</tr>;
              })}</tbody>
            </table>
          </div>
          {modeles.length > 0 && <Field label="Réutiliser un modèle enregistré">
            <select className="select" value={modeleSelectionne} onChange={(e) => appliquerModele(e.target.value)}>
              <option value="">Choisir un modèle…</option>
              {modeles.map((m) => <option key={m.id} value={m.id}>{m.nom}</option>)}
            </select>
          </Field>}
          <div className="grid-2">
            <Field label="Ligne contenant les en-têtes">
              <select className="select" value={ligneEntete} onChange={(e) => setLigneEntete(Number(e.target.value))}>
                {structure.lignes.map((_, i) => <option key={i} value={i + 1}>Ligne {i + 1}</option>)}
              </select>
            </Field>
            <Field label="Colonne du matricule">
              <select className="select" value={colonneMatricule} onChange={(e) => {
                const colonne = Number(e.target.value);
                setColonneMatricule(colonne);
                setMappings((prev) => { const suivant = { ...prev }; delete suivant[colonne]; return suivant; });
              }}>
                {Array.from({ length: structure.nb_colonnes }, (_, i) => <option key={i} value={i}>{nomColonneExcel(i)} — {String(structure.lignes[ligneEntete - 1]?.[i] ?? "(sans titre)")}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid-2">
            {[ ["Total de crédits du semestre", colonneCreditsSemestre, setColonneCreditsSemestre], ["Total de crédits de l’année", colonneCreditsAnnee, setColonneCreditsAnnee] ].map(([label, valeur, setter]) => (
              <Field key={label} label={label}>
                <select className="select" value={valeur} onChange={(e) => {
                  const prochaine = e.target.value;
                  setter(prochaine);
                  if (prochaine !== "") setMappings((prev) => { const suivant = { ...prev }; delete suivant[prochaine]; return suivant; });
                }}>
                  <option value="">Non présent</option>
                  {Array.from({ length: structure.nb_colonnes }, (_, i) => <option key={i} value={i}>{nomColonneExcel(i)} — {String(structure.lignes[ligneEntete - 1]?.[i] ?? "(sans titre)")}</option>)}
                </select>
              </Field>
            ))}
          </div>
          <div style={{ display: "grid", gap: 8, margin: "12px 0 16px" }}>
            {Array.from({ length: structure.nb_colonnes }, (_, i) => {
              const titre = String(structure.lignes[ligneEntete - 1]?.[i] ?? "").trim();
              if (i === Number(colonneMatricule) || String(i) === String(colonneCreditsSemestre) || String(i) === String(colonneCreditsAnnee)) return null;
              return <div key={i} className="grid-2" style={{ alignItems: "center", padding: "7px 10px", background: "#fff", borderRadius: 7 }}>
                <span><strong>{nomColonneExcel(i)}</strong> · {titre || <span className="muted">Sans en-tête</span>}</span>
                <select className="select" value={mappings[i] || ""} onChange={(e) => setMappings((prev) => {
                  const suivant = { ...prev };
                  for (const [colonne, id] of Object.entries(suivant)) if (colonne !== String(i) && id === e.target.value) delete suivant[colonne];
                  suivant[i] = e.target.value;
                  return suivant;
                })}>
                  <option value="">Ignorer cette colonne</option>
                  {structure.matieres.map((m) => <option key={m.id} value={m.id}>{m.ue_code ? `${m.ue_code} — ` : ""}{m.ue} · {m.code ? `${m.code} — ` : ""}{m.libelle}</option>)}
                </select>
              </div>;
            })}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "end" }}>
            <Field label="Nom du modèle à enregistrer"><input className="input" value={nomModele} onChange={(e) => setNomModele(e.target.value)} placeholder="Ex. Grille ESSFE L2" /></Field>
            <Button variant="subtle" onClick={sauvegarderModele} disabled={!nomModele.trim() || (!Object.values(mappings).some(Boolean) && colonneCreditsSemestre === "" && colonneCreditsAnnee === "")}>Enregistrer le modèle</Button>
            <Button icon={ListChecks} onClick={analyserConfigure} disabled={chargement || (!Object.values(mappings).some(Boolean) && colonneCreditsSemestre === "" && colonneCreditsAnnee === "")}>{chargement ? "Analyse…" : "Analyser ce classeur"}</Button>
          </div>
          <div className="small muted" style={{ marginTop: 8 }}>Aperçu : {structure.nb_lignes} lignes détectées, première feuille uniquement. Le fichier n’est pas modifié.</div>
        </div>
      )}

      <ErrorBox message={error} />

      {/* Rapport d'analyse */}
      {analyse && (
        <div style={{ marginTop: 20 }}>
          {analyse.nb_notes_valides > 0 && (
            <div className="info-box" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <CheckCircle2 size={16} color="#2d6c9c" />
              <strong style={{ color: "#2d6c9c" }}>
                {analyse.nb_notes_valides} note{analyse.nb_notes_valides > 1 ? "s" : ""} prête{analyse.nb_notes_valides > 1 ? "s" : ""} à être enregistrée{analyse.nb_notes_valides > 1 ? "s" : ""}
              </strong>
              <span style={{ color: "#5c5a50", fontSize: 12.5 }}>— sur {analyse.nb_lignes_lues} ligne{analyse.nb_lignes_lues > 1 ? "s" : ""} lue{analyse.nb_lignes_lues > 1 ? "s" : ""}</span>
            </div>
          )}

          {analyse.erreurs.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#b23a2e", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <XCircle size={15} /> Erreurs ({analyse.erreurs.length})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {analyse.erreurs.map((e, i) => (
                  <div key={i} style={{ fontSize: 12.5, background: "#f7e4e1", border: "1px solid #ecc9c3", borderRadius: 7, padding: "8px 12px", color: "#8c2f26" }}>
                    <strong>Ligne {e.ligne}</strong> — {e.matricule} : {e.probleme}
                  </div>
                ))}
              </div>
            </div>
          )}

          {analyse.avertissements.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#285c84", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <AlertTriangle size={15} /> Avertissements ({analyse.avertissements.length})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {analyse.avertissements.map((a, i) => (
                  <div key={i} style={{ fontSize: 12.5, background: "#eaf4fc", border: "1px solid #ead9a8", borderRadius: 7, padding: "8px 12px", color: "#285c84" }}>
                    <strong>Ligne {a.ligne}</strong> — {a.matricule} : {a.probleme}
                  </div>
                ))}
              </div>
            </div>
          )}

          {analyse.credits_officiels?.length > 0 && (
            <div className="info-box" style={{ marginBottom: 14 }}>
              <strong>Total de crédits lu dans le classeur</strong>
              <div className="table-wrap" style={{ marginTop: 8 }}>
                <table className="table">
                  <thead><tr><th>Matricule</th><th>Total semestre</th><th>Total annuel</th></tr></thead>
                  <tbody>{analyse.credits_officiels.map((c) => (
                    <tr key={c.etudiant_id}>
                      <td>{c.matricule}</td>
                      <td>{c.credits_semestre ?? "—"}</td>
                      <td>{c.credits_annee ?? "—"}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
              <div className="small muted">Ces valeurs sont importées telles qu’elles figurent dans le fichier, sans calcul depuis les crédits UE.</div>
            </div>
          )}

          {analyse.bloquant && (
            <div className="error-box" style={{ marginBottom: 14 }}>
              Import bloqué : des crédits attribués UE par UE ou une décision du jury sont renseignés, mais ce format ne sait pas encore conserver ces champs. Les totaux de crédits peuvent, eux, être importés tels quels.
            </div>
          )}

          {(analyse.nb_notes_valides > 0 || analyse.credits_officiels?.length > 0) && (
            <Button icon={PenLine} variant="gold" onClick={ecrire} disabled={ecriture || analyse.bloquant || analyse.erreurs.length > 0 || analyse.avertissements.length > 0}>
              {ecriture ? "Écriture en cours…" : `Enregistrer ${analyse.nb_notes_valides} notes et les crédits lus`}
            </Button>
          )}
          {(analyse.erreurs.length > 0 || analyse.avertissements.length > 0) && <div className="error-box" style={{ marginTop: 10 }}>Enregistrement bloqué : corrigez les erreurs et avertissements ou ajustez la configuration puis relancez l’analyse. Aucune ligne de cet import ne sera enregistrée.</div>}
          {analyse.nb_notes_valides === 0 && analyse.erreurs.length > 0 && (
            <div className="muted">Aucune note valide — corrigez les erreurs dans le fichier puis ré-analysez.</div>
          )}
        </div>
      )}
    </Card>
  );
}
