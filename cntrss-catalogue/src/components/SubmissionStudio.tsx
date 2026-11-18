import React, { useRef, useState } from 'react';
import { DocumentItem, DocumentType, DisciplineType, StudyDesign, UserProfile } from '../types';
import { apiRequest } from '../lib/backendApi';
import {
  MAX_UPLOAD_BYTES,
  downloadDocumentCertificate,
  formatFileSize,
  isPdfFile,
  uploadSubmissionFile
} from '../lib/documentFiles';
import { DISCIPLINES, STUDY_DESIGNS, HEALTH_ZONES } from '../data/mockDocuments';
import {
  Upload,
  FileCheck,
  CheckCircle2,
  FileText,
  User,
  GraduationCap,
  Building2,
  Calendar,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Download,
  Database,
  MapPin
} from 'lucide-react';

interface SubmissionStudioProps {
  currentUser: UserProfile;
  onSubmitSuccess: (newDoc: DocumentItem) => void;
  onCancel: () => void;
}

export const SubmissionStudio: React.FC<SubmissionStudioProps> = ({
  currentUser,
  onSubmitSuccess,
  onCancel
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [title, setTitle] = useState('');
  const [type, setType] = useState<DocumentType>('Mémoire de licence');
  const [discipline, setDiscipline] = useState<DisciplineType>('Médecine');
  const [studyDesign, setStudyDesign] = useState<StudyDesign>('Étude transversale');
  const [healthZone, setHealthZone] = useState<string>(HEALTH_ZONES[0]);
  const [year, setYear] = useState<number>(2024);
  const [pages, setPages] = useState<number>(68);

  const [author, setAuthor] = useState('');
  const [supervisor, setSupervisor] = useState('');
  const [juryPresident, setJuryPresident] = useState('');
  const [institution, setInstitution] = useState(currentUser.institution);

  const [abstract, setAbstract] = useState('');
  const [keywords, setKeywords] = useState('');
  const [hasOpenData, setHasOpenData] = useState(true);

  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [submittedDoc, setSubmittedDoc] = useState<DocumentItem | null>(null);
  const [validationId, setValidationId] = useState('');
  const [fileUpload, setFileUpload] = useState<{
    status: 'idle' | 'sending' | 'sent' | 'error';
    message: string;
  }>({ status: 'idle', message: '' });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fileName = file ? file.name : '';

  // Le fichier du dépôt est le PDF réel de l'auteur : il est contrôlé ici
  // (format et taille), puis transmis au serveur une fois le dossier créé.
  const handleFileSelection = (selected: File | null | undefined) => {
    if (!selected) return;
    if (!isPdfFile(selected)) {
      setFile(null);
      setFileError('Seuls les fichiers PDF sont acceptés pour le dépôt.');
      return;
    }
    if (selected.size > MAX_UPLOAD_BYTES) {
      setFile(null);
      setFileError(
        `Fichier trop volumineux (${formatFileSize(selected.size)}) : ${Math.round(
          MAX_UPLOAD_BYTES / (1024 * 1024)
        )} Mo maximum.`
      );
      return;
    }
    setFileError(null);
    setFile(selected);
  };

  const uploadSelectedFile = async (targetValidationId: string, selected: File) => {
    setFileUpload({ status: 'sending', message: 'Envoi du PDF au serveur...' });
    try {
      const info = await uploadSubmissionFile(targetValidationId, selected);
      setFileUpload({
        status: 'sent',
        message: `Fichier enregistré : ${info.fileName} (${info.fileSize})`
      });
    } catch (err) {
      setFileUpload({
        status: 'error',
        message: err instanceof Error ? err.message : "Enregistrement du fichier impossible."
      });
    }
  };

  const [submitStatus, setSubmitStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitStatus('sending');
    setSubmitError(null);

    try {
      const data = await apiRequest<{ doc: DocumentItem; validationId?: string }>('/api/submissions', {
        method: 'POST',
        body: JSON.stringify({
          title: title || 'Travail de recherche sans titre',
          type,
          discipline,
          studyDesign,
          healthZone,
          year: Number(year),
          author: author || currentUser.fullName,
          supervisor: supervisor || 'Comité scientifique CNTRSS / Faculté',
          institution: institution || currentUser.institution,
          keywords: keywords
            ? keywords.split(',').map((k) => k.trim())
            : ['Santé publique', 'Recherche clinique', 'Bénin'],
          abstract:
            abstract ||
            'Travail de recherche déposé et archivé auprès du CNTRSS. Ce document est soumis à validation et indexation par le comité de lecture académique.',
          pagesCount: Number(pages) || 50,
          hasOpenData,
          fileName: file ? file.name : undefined,
          fileSize: file ? formatFileSize(file.size) : undefined
        })
      });

      const newDoc: DocumentItem = data.doc;

      setSubmittedDoc(newDoc);
      setValidationId(data.validationId || '');
      onSubmitSuccess(newDoc);
      setSubmitStatus('success');

      // Le PDF réel accompagne le dossier : le catalogue ne conserve donc pas
      // un simple nom de fichier saisi à la main.
      if (file && data.validationId) {
        await uploadSelectedFile(data.validationId, file);
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Impossible de déposer le mémoire');
      setSubmitStatus('error');
    }
  };

  const retrySubmit = () => {
    setSubmitStatus('idle');
    setSubmitError(null);
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-sm">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Import d'un travail de recherche au catalogue CNTRSS
              </h2>
              <p className="text-xs text-slate-500">
                Réservé au personnel bibliothécaire — attribution automatique du DOI et certification CNTRSS
              </p>
            </div>
          </div>

          {/* Stepper Dots */}
          {!submittedDoc && (
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                    step === s
                      ? 'bg-teal-600 text-white shadow-sm'
                      : step > s
                      ? 'bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Error state */}
        {submitStatus === 'error' && (
          <div className="p-8 sm:p-12 text-center space-y-4">
            <div className="w-14 h-14 rounded-3xl bg-rose-50 dark:bg-rose-950 flex items-center justify-center text-rose-600 dark:text-rose-400 mx-auto border border-rose-200 dark:border-rose-800">
              <AlertCircle className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Échec du dépôt
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Le serveur n'a pas pu enregistrer le document. Réessayez ou contactez le service documentaire.
              </p>
            </div>

            {submitError && (
              <div className="p-4 max-w-md mx-auto rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-left text-xs text-rose-700 dark:text-rose-300">
                <span className="font-semibold block mb-1">Détail :</span>
                {submitError}
              </div>
            )}
          </div>
        )}

        {/* Successful submission receipt */}
        {submittedDoc ? (
          <div className="p-8 sm:p-12 text-center space-y-5">
            <div className="w-16 h-16 rounded-3xl bg-teal-50 dark:bg-teal-950 flex items-center justify-center text-teal-600 dark:text-teal-400 mx-auto border border-teal-200 dark:border-teal-800">
              <CheckCircle2 className="w-8 h-8 animate-bounce" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Document importé dans le catalogue CNTRSS !
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                La notice est indexée avec un identifiant permanent et le dossier rejoint la file de
                validation avant publication au catalogue.
              </p>
            </div>

            <div className="p-5 max-w-md mx-auto rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">DOI Pérenne :</span>
                <span className="font-mono font-bold text-teal-600">
                  https://doi.org/{submittedDoc.doi}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Titre :</span>
                <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[240px]">
                  {submittedDoc.title}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Type de document :</span>
                <span className="text-slate-800 dark:text-slate-200">{submittedDoc.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Devis d'étude :</span>
                <span className="text-slate-800 dark:text-slate-200">{submittedDoc.studyDesign}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Données ouvertes :</span>
                <span className={submittedDoc.hasOpenData ? 'text-emerald-600 font-semibold' : 'text-slate-600'}>
                  {submittedDoc.hasOpenData ? 'Incluses (Open Data)' : 'Non communiquées'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Statut académique :</span>
                <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-semibold text-[10px]">
                  {submittedDoc.status || 'En cours de validation'}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-400 shrink-0">Fichier PDF :</span>
                <span className="text-slate-800 dark:text-slate-200 truncate max-w-[240px] text-right">
                  {submittedDoc.fileName || 'aucun fichier joint'}
                </span>
              </div>
            </div>

            {fileUpload.status !== 'idle' && (
              <div
                className={`p-3 rounded-2xl border text-xs flex items-start gap-2 ${
                  fileUpload.status === 'error'
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                    : 'bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-200'
                }`}
              >
                {fileUpload.status === 'error' ? (
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                ) : (
                  <FileCheck className="w-4 h-4 mt-0.5 shrink-0" />
                )}
                <div className="flex-1">
                  <div>{fileUpload.message}</div>
                  {fileUpload.status === 'error' && file && validationId && (
                    <button
                      type="button"
                      onClick={() => uploadSelectedFile(validationId, file)}
                      className="mt-2 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-rose-300 dark:border-rose-700 font-semibold"
                    >
                      Réessayer l'envoi du fichier
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {submitStatus === 'success' ? (
            <>
              <button
                onClick={async () => {
                  if (!submittedDoc) return;
                  try {
                    await downloadDocumentCertificate(submittedDoc.id);
                  } catch (err) {
                    alert(
                      err instanceof Error
                        ? err.message
                        : "Téléchargement de l'attestation impossible."
                    );
                  }
                }}
                className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center gap-2"
              >
                <Download className="w-3.5 h-3.5" />
                Télécharger l'attestation de dépôt PDF
              </button>

              <button
                onClick={onCancel}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-sm"
              >
                Retour au tableau de bord
              </button>
            </>
          ) : (
            <button
              onClick={retrySubmit}
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-sm"
            >
              Réessayer le dépôt
            </button>
          )}
            </div>
          </div>
        ) : (
          /* MULTI-STEP FORM */
          <form onSubmit={handleFinalSubmit} className="p-6 sm:p-8 space-y-6 text-xs sm:text-sm">
            {/* STEP 1 */}
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Étape 1 : Identification & Méthodologie
                  </h3>
                  <p className="text-xs text-slate-500">
                    Renseignez le titre et le type de devis méthodologique
                  </p>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1 text-xs">
                    Titre officiel complet du mémoire ou de la thèse *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Épidémiologie du paludisme gestationnel et profil anémique à Parakou"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 text-xs sm:text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1 text-xs">
                      Type de document académique *
                    </label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as DocumentType)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm"
                    >
                      <option value="Mémoire de licence">Mémoire de licence</option>
                      <option value="Rapport de stage">Rapport de stage</option>
                      <option value="Thèse">Thèse d'exercice (Doctorat)</option>
                      <option value="Mémoire de master">Mémoire de master</option>
                      <option value="Article scientifique">Article scientifique</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1 text-xs">
                      Devis d'étude méthodologique *
                    </label>
                    <select
                      value={studyDesign}
                      onChange={(e) => setStudyDesign(e.target.value as StudyDesign)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm"
                    >
                      {STUDY_DESIGNS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1 text-xs">
                      Filière principale *
                    </label>
                    <select
                      value={discipline}
                      onChange={(e) => setDiscipline(e.target.value as DisciplineType)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm"
                    >
                      {DISCIPLINES.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1 text-xs">
                      Zone sanitaire ou Hôpital d'investigation
                    </label>
                    <select
                      value={healthZone}
                      onChange={(e) => setHealthZone(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm"
                    >
                      {HEALTH_ZONES.map((z) => (
                        <option key={z} value={z}>
                          {z}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1 text-xs">
                      Année de soutenance *
                    </label>
                    <input
                      type="number"
                      required
                      min={2000}
                      max={2030}
                      value={year}
                      onChange={(e) => setYear(Number(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1 text-xs">
                      Nombre de pages total
                    </label>
                    <input
                      type="number"
                      value={pages}
                      onChange={(e) => setPages(Number(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <div className="space-y-4 animate-in fade-in">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Étape 2 : Auteur & Encadrement académique
                  </h3>
                  <p className="text-xs text-slate-500">
                    Renseignez les membres du jury et l'institution de rattachement
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1 text-xs">
                      Nom et prénom(s) de l'auteur *
                    </label>
                    <input
                      type="text"
                      required
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1 text-xs">
                      Directeur / Superviseur de mémoire *
                    </label>
                    <input
                      type="text"
                      required
                      value={supervisor}
                      onChange={(e) => setSupervisor(e.target.value)}
                      placeholder="Ex: Prof. ADEGBOLA Sylvain"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1 text-xs">
                      Président du jury (facultatif)
                    </label>
                    <input
                      type="text"
                      value={juryPresident}
                      onChange={(e) => setJuryPresident(e.target.value)}
                      placeholder="Ex: Prof. ALIHONOU Robert"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1 text-xs">
                      Établissement académique *
                    </label>
                    <input
                      type="text"
                      required
                      value={institution}
                      onChange={(e) => setInstitution(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <div className="space-y-4 animate-in fade-in">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Étape 3 : Résumé & Données ouvertes (Open Data)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Renseignez le résumé et choisissez de partager vos grilles d'enquête
                  </p>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1 text-xs">
                    Résumé en français (Introduction, Méthodologie, Résultats, Conclusion) *
                  </label>
                  <textarea
                    rows={6}
                    required
                    value={abstract}
                    onChange={(e) => setAbstract(e.target.value)}
                    placeholder="Collez ici le résumé officiel du document importé..."
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1 text-xs">
                    Mots-clés MeSH (séparés par des virgules) *
                  </label>
                  <input
                    type="text"
                    required
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="Ex: Paludisme, Épidémiologie, Parakou, Grossesse, Prévention"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm"
                  />
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasOpenData}
                      onChange={(e) => setHasOpenData(e.target.checked)}
                      className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                    />
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-xs">
                        <Database className="w-3.5 h-3.5 text-teal-600" />
                        Inclure les questionnaires et données de recherche (Open Data)
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Permet aux autres chercheurs de reproduire ou citer vos grilles d'enquête anonymisées.
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* STEP 4 */}
            {step === 4 && (
              <div className="space-y-4 animate-in fade-in">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Étape 4 : Téléversement du document PDF
                  </h3>
                  <p className="text-xs text-slate-500">
                    Choisissez la version PDF finale. Elle sera envoyée avec le dossier quand vous cliquerez sur « Importer et certifier le document ».
                  </p>
                </div>

                {/* Dropzone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    handleFileSelection(e.dataTransfer.files[0]);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  className={`p-8 border-2 border-dashed rounded-3xl text-center space-y-3 transition-colors ${
                    isDragOver
                      ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/40'
                      : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40'
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-950 flex items-center justify-center text-teal-600 dark:text-teal-400 mx-auto">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                      {fileName ? fileName : 'Glissez-déposez le fichier PDF du document ici'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {file
                        ? `${formatFileSize(file.size)} (PDF vérifié avant envoi)`
                        : `PDF jusqu'à ${Math.round(MAX_UPLOAD_BYTES / (1024 * 1024))} Mo (avec page de garde et signatures du jury)`}
                    </p>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf,.pdf"
                    className="hidden"
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      handleFileSelection(e.target.files?.[0]);
                      // Autorise à sélectionner à nouveau le même fichier après l'avoir retiré.
                      e.currentTarget.value = '';
                    }}
                  />

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                  >
                    {file ? 'Changer de fichier' : 'Parcourir les fichiers'}
                  </button>
                </div>

                {fileError && (
                  <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{fileError}</span>
                  </div>
                )}

                {file && (
                  <div className="p-3 rounded-2xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 text-xs text-teal-800 dark:text-teal-200 flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 truncate">
                      <FileCheck className="w-4 h-4 shrink-0" />
                      {file.name} — {formatFileSize(file.size)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      className="font-semibold text-teal-700 dark:text-teal-300 hover:underline shrink-0"
                    >
                      Retirer
                    </button>
                  </div>
                )}

                <div className="p-4 rounded-2xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                  <div className="font-bold text-teal-900 dark:text-teal-200 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-teal-600" />
                    Attribution automatique d'identifiant DOI & Licence académique
                  </div>
                  <p>
                    Un identifiant pérenne type <code className="font-mono text-teal-700 dark:text-teal-300">10.cntrss.bj/...</code> sera instantanément délivré à l'auteur pour citation dans les revues internationales.
                  </p>
                </div>
              </div>
            )}

            {/* Stepper Navigation Buttons */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => (s - 1) as any)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-xs flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Précédent
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium text-xs"
                >
                  Annuler
                </button>
              )}

              {step < 4 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (step === 1 && !title) {
                      alert('Veuillez renseigner le titre du travail.');
                      return;
                    }
                    if (step === 2 && !supervisor) {
                      alert('Veuillez renseigner le directeur de mémoire.');
                      return;
                    }
                    setStep((s) => (s + 1) as any);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                >
                  Suivant <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Importer et certifier le document
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
