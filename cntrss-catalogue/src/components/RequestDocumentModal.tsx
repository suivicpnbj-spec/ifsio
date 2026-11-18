import React, { useEffect, useState } from 'react';
import { X, Send, CheckCircle2, HelpCircle, AlertCircle } from 'lucide-react';
import { DISCIPLINES } from '../data/mockDocuments';
import { UserProfile } from '../types';
import { apiRequest } from '../lib/backendApi';

interface RequestDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefilledDiscipline?: string;
  /** Session courante : pré-remplit la demande avec le profil réel de l'utilisateur. */
  currentUser?: UserProfile | null;
}

/**
 * Demande documentaire adressée à l'équipe du CNTRSS : la requête part
 * réellement vers /api/auth…/api/requests (session + anti-CSRF) et apparaît
 * dans la file des bibliothécaires. Aucun contenu de démonstration n'est affiché.
 */
export const RequestDocumentModal: React.FC<RequestDocumentModalProps> = ({
  isOpen,
  onClose,
  prefilledDiscipline = '',
  currentUser = null
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [institution, setInstitution] = useState('');
  const [discipline, setDiscipline] = useState(prefilledDiscipline || 'Médecine');
  const [topic, setTopic] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Pré-remplissage depuis la session réelle (jamais depuis des données figées).
  useEffect(() => {
    if (!isOpen) return;
    setDiscipline(prefilledDiscipline || currentUser?.discipline || 'Médecine');
    if (currentUser) {
      setFullName(currentUser.fullName);
      setEmail(currentUser.email);
      setInstitution(currentUser.institution);
    }
  }, [isOpen, currentUser, prefilledDiscipline]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError('');
    setIsSubmitting(true);

    try {
      await apiRequest<{ ok: boolean }>('/api/requests', {
        method: 'POST',
        body: JSON.stringify({
          title: topic,
          requesterName: fullName,
          requesterEmail: email,
          requesterRole: currentUser?.role || 'Étudiant',
          institution,
          priority: 'Normale',
          notes: [notes, phone ? `Téléphone : ${phone}` : '', `Filière : ${discipline}`]
            .filter(Boolean)
            .join(' · ')
        })
      });
      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        setTopic('');
        setNotes('');
        onClose();
      }, 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible d’envoyer la demande.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    'w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/60 flex items-center justify-center text-teal-600 dark:text-teal-400">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Demande de document</h3>
              <p className="text-xs text-slate-500">Service de liaison documentaire CNTRSS / Réseau Universitaire</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSubmitted ? (
          <div className="p-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-teal-600 mx-auto animate-bounce" />
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">Demande enregistrée avec succès !</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
              Votre demande apparaît dans la file de recherche des bibliothécaires. Réponse sous 24 à 48 heures ouvrées,
              avec un accusé de réception par e-mail.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-3 text-xs">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 flex items-start gap-2 text-rose-700 dark:text-rose-300">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Nom et prénom(s)</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Téléphone / WhatsApp
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+229 …"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Adresse e-mail</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Établissement de rattachement
                </label>
                <input
                  type="text"
                  required
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  className={inputClass}
                  placeholder="Faculté de Médecine Parakou, FSS Cotonou, INMeS..."
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Filière médicale ou paramédicale
              </label>
              <select
                value={discipline}
                onChange={(e) => setDiscipline(e.target.value)}
                className={inputClass}
              >
                {DISCIPLINES.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Titre recherché ou thème d'intérêt
              </label>
              <input
                type="text"
                required
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Ex: Thèse sur le paludisme grave à Parakou (2020-2023)"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Précisions supplémentaires (Auteur, année, cote de bibliothèque...)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Indiquez tous les détails utiles pour accélérer la recherche par l'archiviste..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                {isSubmitting ? 'Envoi…' : 'Envoyer la demande'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
