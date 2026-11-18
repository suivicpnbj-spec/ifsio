import React, { useEffect } from "react";
import { GraduationCap, ArrowLeft, CheckCircle2, AlertCircle, X } from "lucide-react";

/* En-tête institutionnel avec option de retour */
export function Topbar({ subtitle, onExit, exitLabel = "Quitter", children }) {
  return (
    <header className="topbar">
      <div className="topbar-brand">
        <div className="topbar-logo">
          <GraduationCap size={22} color="#173b63" strokeWidth={2.3} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div className="topbar-title">MES RESULTATS</div>
          {subtitle && <div className="topbar-subtitle">{subtitle}</div>}
        </div>
      </div>
      <div className="topbar-actions">
        {children}
        {onExit && (
          <button className="btn btn-ghost btn-sm" onClick={onExit} style={{ borderColor: "#527897", color: "#f4f7fb" }}>
            <ArrowLeft size={14} /> {exitLabel}
          </button>
        )}
      </div>
    </header>
  );
}

/* Bouton */
export function Button({ children, variant = "primary", onClick, disabled, icon: Icon, full, size, type = "button", title }) {
  return (
    <button type={type} className={`btn btn-${variant}${full ? " btn-full" : ""}${size === "sm" ? " btn-sm" : ""}`} onClick={disabled ? undefined : onClick} disabled={disabled} title={title}>
      {Icon && <Icon size={size === "sm" ? 15 : 17} strokeWidth={2.2} />}
      {children}
    </button>
  );
}

/* Carte */
export function Card({ children, style, hover, className = "" }) {
  return (
    <div className={`card${hover ? " card-hover" : ""} ${className}`} style={style}>
      {children}
    </div>
  );
}

/* Champ de formulaire */
export function Field({ label, children }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}

/* Sceau de statut du workflow brouillon → vérifié → publié */
const SEAL_CLASS = { brouillon: "seal-brouillon", verifie: "seal-verifie", publie: "seal-publie", "publie partiellement": "seal-verifie" };

function normaliserAccents(s) {
  return String(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function Seal({ statut, size }) {
  const key = normaliserAccents(statut || "");
  const cls = SEAL_CLASS[key] || SEAL_CLASS.brouillon;
  const libelle = statut || "Inconnu";
  return (
    <span className={`seal ${cls}${size === "sm" ? " seal-sm" : ""}`}>
      <span className="seal-dot" /> {libelle}
    </span>
  );
}

/* Badge de décision académique */
export function DecisionBadge({ decision }) {
  if (!decision || decision === "—") return <span className="badge badge-neutre">—</span>;
  const map = {
    admis: { cls: "badge-admis", label: "Admis(e)" },
    rattrapage: { cls: "badge-rattrapage", label: "Rattrapage" },
    ajourne: { cls: "badge-ajourne", label: "Ajourné(e)" },
  };
  const d = map[decision] || map.ajourne;
  return <span className={`badge ${d.cls}`}>{d.label}</span>;
}

/* Toast de notification */
export function Toast({ message, type = "success", onClose, autoHide = 2600 }) {
  useEffect(() => {
    if (!autoHide) return;
    const t = setTimeout(onClose, autoHide);
    return () => clearTimeout(t);
  }, [autoHide, onClose]);

  return (
    <div className={`toast${type === "error" ? " toast-error" : ""}`}>
      {type === "error" ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
      <span>{message}</span>
      <button onClick={onClose} aria-label="Fermer" style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", display: "flex", padding: 0 }}>
        <X size={14} />
      </button>
    </div>
  );
}

/* Indicateur de chargement centré */
export function Loading({ label = "Chargement…" }) {
  return (
    <div className="center-box" style={{ flexDirection: "column", gap: 12 }}>
      <div className="spinner" />
      <div className="muted">{label}</div>
    </div>
  );
}

/* Message d'erreur bloc */
export function ErrorBox({ message }) {
  if (!message) return null;
  return <div className="error-box">{message}</div>;
}
