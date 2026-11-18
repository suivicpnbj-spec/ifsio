import React, { useEffect, useMemo, useState } from "react";
import { BookOpen, CalendarDays, GraduationCap, Layers3, Plus, RefreshCw } from "lucide-react";
import { Button, Card, Field } from "./ui.jsx";
import { listerAnneesAcademiques, listerUEs, creerAnneeAcademique, creerPromotion, creerSemestres, creerUE, creerEC } from "../api.js";

const inputClass = "input";

export default function ReferentielTab({ filieres, promotions, semestres, filiereId, promotionId, semestreId, onCreated, flash }) {
  const [annees, setAnnees] = useState([]);
  const [ues, setUes] = useState([]);
  const [annee, setAnnee] = useState("");
  const [semestreAnnee, setSemestreAnnee] = useState("");
  const [semestresChoisis, setSemestresChoisis] = useState([]);
  const [ueId, setUeId] = useState("");
  const [busy, setBusy] = useState(false);
  const [anneeForm, setAnneeForm] = useState({ libelle: "", date_debut: "", date_fin: "", active: false });
  const [promoForm, setPromoForm] = useState({ annee_entree: new Date().getFullYear(), niveau: "L1" });
  const [ueForm, setUeForm] = useState({ code: "", libelle: "", credits: 0 });
  const [ecForm, setEcForm] = useState({ code: "", libelle: "", coefficient: 1 });

  async function chargerAnnees() {
    const data = await listerAnneesAcademiques();
    setAnnees(data);
    setAnnee((current) => data.some((item) => item.id === current) ? current : (data.find((item) => item.active)?.id || data[0]?.id || ""));
    setSemestreAnnee((current) => data.some((item) => item.id === current) ? current : (data.find((item) => item.active)?.id || data[0]?.id || ""));
  }

  useEffect(() => { chargerAnnees().catch((err) => flash(err.message, "error")); }, []);
  useEffect(() => {
    if (!semestreId) { setUes([]); setUeId(""); return; }
    listerUEs(semestreId).then((liste) => {
      setUes(liste);
      setUeId((current) => liste.some((ue) => ue.id === current) ? current : (liste[0]?.id || ""));
    }).catch((err) => flash(err.message, "error"));
  }, [semestreId]);

  const promoSemestres = useMemo(() => semestres.filter((item) => item.promotion_id === promotionId), [semestres, promotionId]);
  const niveauSelectionne = promotions.find((item) => item.id === promotionId)?.niveau;
  const numerosNiveau = niveauSelectionne === "L2" ? [3, 4] : niveauSelectionne === "L3" ? [5, 6] : [1, 2];
  const usedSemesters = new Set(promoSemestres.filter((s) => s.annee_academique_id === semestreAnnee).map((s) => Number(s.numero)));

  async function action(fn, message) {
    setBusy(true);
    try { const result = await fn(); flash(message); return result; }
    catch (err) { flash(err.message, "error"); return null; }
    finally { setBusy(false); }
  }

  async function submitAnnee(e) {
    e.preventDefault();
    const result = await action(() => creerAnneeAcademique(anneeForm), "Année académique créée.");
    if (result) { setAnneeForm({ libelle: "", date_debut: "", date_fin: "", active: false }); await chargerAnnees(); }
  }
  async function submitPromotion(e) {
    e.preventDefault();
    const result = await action(() => creerPromotion({ filiere_id: filiereId, ...promoForm, annee_entree: Number(promoForm.annee_entree) }), "Promotion créée.");
    if (result) onCreated({ promotionId: result.id });
  }
  async function submitSemestres() {
    const result = await action(() => creerSemestres({ promotion_id: promotionId, annee_academique_id: semestreAnnee, numeros: semestresChoisis }), "Semestre(s) créé(s).");
    if (result?.length) { setSemestresChoisis([]); onCreated({ semestreId: result[0].id }); }
  }
  async function submitUE(e) {
    e.preventDefault();
    const result = await action(() => creerUE({ semestre_id: semestreId, ...ueForm, credits: Number(ueForm.credits) }), "UE créée.");
    if (result) { setUeForm({ code: "", libelle: "", credits: 0 }); setUes((current) => [...current, result]); setUeId(result.id); }
  }
  async function submitEC(e) {
    e.preventDefault();
    const result = await action(() => creerEC({ ue_id: ueId, ...ecForm, coefficient: Number(ecForm.coefficient) }), "Élément constitutif créé.");
    if (result) { setEcForm({ code: "", libelle: "", coefficient: 1 }); flash("Élément constitutif créé."); }
  }

  return <div className="referentiel-grid">
    <Card className="referentiel-card">
      <div className="referentiel-card-title"><CalendarDays size={18}/><div><h3>Année académique</h3><p>Créer une année et définir l’année en cours.</p></div></div>
      <form className="referentiel-form" onSubmit={submitAnnee}>
        <Field label="Libellé"><input className={inputClass} required placeholder="2026-2027" value={anneeForm.libelle} onChange={(e) => setAnneeForm({ ...anneeForm, libelle: e.target.value })}/></Field>
        <div className="referentiel-two"><Field label="Début"><input className={inputClass} type="date" required value={anneeForm.date_debut} onChange={(e) => setAnneeForm({ ...anneeForm, date_debut: e.target.value })}/></Field><Field label="Fin"><input className={inputClass} type="date" required value={anneeForm.date_fin} onChange={(e) => setAnneeForm({ ...anneeForm, date_fin: e.target.value })}/></Field></div>
        <label className="referentiel-check"><input type="checkbox" checked={anneeForm.active} onChange={(e) => setAnneeForm({ ...anneeForm, active: e.target.checked })}/> Définir comme année active</label>
        <Button type="submit" icon={Plus} disabled={busy}>Créer l’année</Button>
      </form>
      <div className="referentiel-existing"><strong>Années enregistrées</strong>{annees.length ? annees.map((item) => <span key={item.id}>{item.libelle}{item.active ? " · active" : ""}</span>) : <span>Aucune année pour le moment</span>}</div>
    </Card>

    <Card className="referentiel-card">
      <div className="referentiel-card-title"><GraduationCap size={18}/><div><h3>Promotion</h3><p>Créer un groupe de niveau pour une filière.</p></div></div>
      <form className="referentiel-form" onSubmit={submitPromotion}>
        <Field label="Filière"><select className="select" value={filiereId} onChange={(e) => onCreated({ filiereId: e.target.value })} required><option value="">Choisir une filière</option>{filieres.map((f) => <option key={f.id} value={f.id}>{f.code} · {f.libelle}</option>)}</select></Field>
        <div className="referentiel-two"><Field label="Année d’entrée"><input className={inputClass} type="number" min="2000" max="2100" required value={promoForm.annee_entree} onChange={(e) => setPromoForm({ ...promoForm, annee_entree: e.target.value })}/></Field><Field label="Niveau"><select className="select" value={promoForm.niveau} onChange={(e) => setPromoForm({ ...promoForm, niveau: e.target.value })}>{["L1", "L2", "L3"].map((n) => <option key={n}>{n}</option>)}</select></Field></div>
        <Button type="submit" icon={Plus} disabled={busy || !filiereId}>Créer la promotion</Button>
      </form>
      <div className="referentiel-existing"><strong>Promotions de {filieres.find((f) => f.id === filiereId)?.code || "la filière"}</strong>{promotions.map((p) => <span key={p.id}>{p.annee_entree} · {p.niveau}</span>)}</div>
    </Card>

    <Card className="referentiel-card">
      <div className="referentiel-card-title"><Layers3 size={18}/><div><h3>Semestres</h3><p>Associer les semestres à une promotion et à leur année.</p></div></div>
      <div className="referentiel-form">
        <Field label="Promotion"><select className="select" value={promotionId} onChange={(e) => onCreated({ promotionId: e.target.value })}><option value="">Choisir une promotion</option>{promotions.map((p) => <option key={p.id} value={p.id}>{p.annee_entree} · {p.niveau}</option>)}</select></Field>
        <Field label="Année académique"><select className="select" value={semestreAnnee} onChange={(e) => setSemestreAnnee(e.target.value)}><option value="">Choisir une année</option>{annees.map((a) => <option key={a.id} value={a.id}>{a.libelle}{a.active ? " · active" : ""}</option>)}</select></Field>
        <div className="referentiel-semester-options">{numerosNiveau.map((n) => <label key={n} className={usedSemesters.has(n) ? "disabled" : ""}><input type="checkbox" disabled={usedSemesters.has(n)} checked={semestresChoisis.includes(n)} onChange={(e) => setSemestresChoisis((prev) => e.target.checked ? [...prev,n] : prev.filter((v) => v !== n))}/> S{n}</label>)}</div>
        <Button icon={Plus} onClick={submitSemestres} disabled={busy || !promotionId || !semestreAnnee || !semestresChoisis.length}>Créer les semestres</Button>
      </div>
      <div className="referentiel-existing"><strong>Semestres configurés</strong>{promoSemestres.length ? promoSemestres.map((s) => <span key={s.id}>S{s.numero} · {s.annee_academique}</span>) : <span>Aucun semestre configuré</span>}</div>
    </Card>

    <Card className="referentiel-card referentiel-card-wide">
      <div className="referentiel-card-title"><BookOpen size={18}/><div><h3>UE et éléments constitutifs</h3><p>Reproduire la structure du classeur officiel pour permettre la correspondance à l’import.</p></div></div>
      <div className="referentiel-form referentiel-course-form">
        <Field label="Semestre"><select className="select" value={semestreId} onChange={(e) => onCreated({ semestreId: e.target.value })}><option value="">Choisir un semestre</option>{semestres.map((s) => <option key={s.id} value={s.id}>S{s.numero} · {s.annee_academique}</option>)}</select></Field>
        <form className="referentiel-inline-form" onSubmit={submitUE}><strong>Ajouter une UE</strong><div className="referentiel-three"><Field label="Code"><input className={inputClass} required value={ueForm.code} onChange={(e) => setUeForm({ ...ueForm, code: e.target.value })}/></Field><Field label="Intitulé"><input className={inputClass} required value={ueForm.libelle} onChange={(e) => setUeForm({ ...ueForm, libelle: e.target.value })}/></Field><Field label="Crédits"><input className={inputClass} type="number" min="0" max="60" value={ueForm.credits} onChange={(e) => setUeForm({ ...ueForm, credits: e.target.value })}/></Field></div><Button type="submit" size="sm" icon={Plus} disabled={busy || !semestreId}>Ajouter l’UE</Button></form>
        <form className="referentiel-inline-form" onSubmit={submitEC}><strong>Ajouter un EC</strong><div className="referentiel-three"><Field label="UE"><select className="select" value={ueId} onChange={(e) => setUeId(e.target.value)}><option value="">Choisir une UE</option>{ues.map((ue) => <option key={ue.id} value={ue.id}>{ue.code} · {ue.libelle}</option>)}</select></Field><Field label="Code EC"><input className={inputClass} value={ecForm.code} onChange={(e) => setEcForm({ ...ecForm, code: e.target.value })}/></Field><Field label="Intitulé EC"><input className={inputClass} required value={ecForm.libelle} onChange={(e) => setEcForm({ ...ecForm, libelle: e.target.value })}/></Field></div><Button type="submit" size="sm" icon={Plus} disabled={busy || !ueId}>Ajouter l’EC</Button></form>
      </div>
      <div className="referentiel-footnote"><RefreshCw size={14}/> Les codes doivent correspondre à ceux du classeur, lorsqu’il en contient.</div>
    </Card>
  </div>;
}
