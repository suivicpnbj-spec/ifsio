import React, { useEffect, useState } from 'react';
import { DocumentItem } from '../types';
import {
  downloadDocumentCertificate,
  downloadDocumentPdf,
  registerDocumentView
} from '../lib/documentFiles';
import {
  X,
  Download,
  Bookmark,
  Share2,
  FileText,
  Building2,
  User,
  GraduationCap,
  Calendar,
  Layers,
  BookOpen,
  Copy,
  Check,
  AlertCircle,
  Eye,
  Award,
  Database,
  Quote,
  ShieldCheck,
  Stethoscope,
  QrCode,
  MapPin,
  TrendingUp
} from 'lucide-react';

interface DocumentModalProps {
  document: DocumentItem | null;
  onClose: () => void;
  isBookmarked: boolean;
  onToggleBookmark: (docId: string) => void;
}

export const DocumentModal: React.FC<DocumentModalProps> = ({
  document,
  onClose,
  isBookmarked,
  onToggleBookmark
}) => {
  const [activeTab, setActiveTab] = useState<'resume' | 'terrain' | 'sommaire' | 'apercu' | 'citation'>('resume');
  const [citationFormat, setCitationFormat] = useState<'apa' | 'vancouver' | 'bibtex' | 'ris'>('apa');
  const [copiedCitation, setCopiedCitation] = useState(false);
  const [copiedDoi, setCopiedDoi] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [viewsCount, setViewsCount] = useState(0);
  const [downloadsCount, setDownloadsCount] = useState(0);
  const [fileError, setFileError] = useState('');

  // Consultation réellement enregistrée côté serveur : le compteur « vues » du
  // catalogue reflète l'usage et non une valeur décorative.
  useEffect(() => {
    if (!document) return;
    setViewsCount(document.views);
    setDownloadsCount(document.downloads);
    setDownloadSuccess(false);
    setFileError('');
    registerDocumentView(document.id).then((views) => {
      if (typeof views === 'number') setViewsCount(views);
    });
  }, [document?.id]);

  if (!document) return null;

  const doi = document.doi || `10.cntrss.bj/${document.id}`;
  const doiUrl = `https://cntrss.bj/doi/${doi}`;

  const generateCitation = () => {
    switch (citationFormat) {
      case 'apa':
        return `${document.author}. (${document.year}). ${document.title} [${document.type}, ${document.institution}]. CNTRSS Bénin. https://doi.org/${doi}`;
      case 'vancouver':
        return `${document.author}. ${document.title}. [${document.type}]. Parakou, Bénin: ${document.institution}; ${document.year}. doi:${doi}. Disponible sur le CNTRSS.`;
      case 'bibtex':
        return `@thesis{${document.id},\n  author = {${document.author}},\n  title = {${document.title}},\n  school = {${document.institution}},\n  year = {${document.year}},\n  type = {${document.type}},\n  doi = {${doi}},\n  url = {${doiUrl}}\n}`;
      case 'ris':
        return `TY  - THES\nTI  - ${document.title}\nAU  - ${document.author}\nPB  - ${document.institution}\nPY  - ${document.year}\nDO  - ${doi}\nUR  - ${doiUrl}\nAB  - ${document.abstract.replace(/\n/g, ' ')}\n${document.keywords.map((k) => `KW  - ${k}`).join('\n')}\nER  - `;
      default:
        return '';
    }
  };

  const handleCopyCitation = () => {
    navigator.clipboard.writeText(generateCitation());
    setCopiedCitation(true);
    setTimeout(() => setCopiedCitation(false), 2000);
  };

  const handleCopyDoi = () => {
    navigator.clipboard.writeText(doiUrl);
    setCopiedDoi(true);
    setTimeout(() => setCopiedDoi(false), 2000);
  };

  const handleDownloadRis = () => {
    const risContent = `TY  - THES\nTI  - ${document.title}\nAU  - ${document.author}\nPB  - ${document.institution}\nPY  - ${document.year}\nDO  - ${doi}\nUR  - ${doiUrl}\nAB  - ${document.abstract.replace(/\n/g, ' ')}\n${document.keywords.map((k) => `KW  - ${k}`).join('\n')}\nER  - `;
    const blob = new Blob([risContent], { type: 'application/x-research-info-systems;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    link.href = url;
    link.download = `CNTRSS_${document.id}_reference.ris`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Téléchargement du PDF réel (fichier déposé par l'auteur, sinon PDF généré
  // par le serveur) : le compteur « téléchargements » est incrémenté côté serveur.
  const handleDownload = async () => {
    try {
      await downloadDocumentPdf(document.id);
      setDownloadsCount((previous) => previous + 1);
      setFileError('');
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      setFileError(err instanceof Error ? err.message : 'Téléchargement impossible.');
    }
  };

  const handleCertificateDownload = async () => {
    try {
      await downloadDocumentCertificate(document.id);
      setFileError('');
      setShowCertificate(false);
    } catch (err) {
      setFileError(err instanceof Error ? err.message : "Génération de l'attestation impossible.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4 bg-slate-50/70 dark:bg-slate-900/70">
          <div className="space-y-2 flex-1 min-w-0">
            {/* Badges strip */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span className="px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                {document.type}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                {document.discipline}
              </span>
              {document.studyDesign && (
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  {document.studyDesign}
                </span>
              )}
              {document.hasOpenData && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1 text-[11px]">
                  <Database className="w-3 h-3" /> Données d'enquête incluses
                </span>
              )}
              <span className="text-slate-400">·</span>
              <span className="text-slate-600 dark:text-slate-400 font-mono text-xs flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> {document.year}
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white leading-snug">
              {document.title}
            </h2>

            {/* Author, supervisor, institution */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100">
                <User className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" /> {document.author}
              </span>
              {document.supervisor && (
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-slate-400" /> Dir: {document.supervisor}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" /> {document.institution}
              </span>
              {document.healthZone && (
                <span className="flex items-center gap-1 text-slate-500">
                  <MapPin className="w-3 h-3 text-slate-400" /> {document.healthZone}
                </span>
              )}
            </div>

            {/* DOI Permalink Bar */}
            <div className="pt-1 flex items-center gap-2 text-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">DOI Pérenne :</span>
              <button
                onClick={handleCopyDoi}
                className="font-mono text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-800 text-[11px]"
                title="Copier le lien permanent"
              >
                <span>https://doi.org/{doi}</span>
                {copiedDoi ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-slate-400" />}
              </button>
              {document.citationsCount !== undefined && (
                <span className="text-[11px] text-slate-500 font-mono ml-2 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-teal-600" /> {document.citationsCount} citations au Bénin
                </span>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action bar & Navigation Tabs */}
        <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-3">
          {/* Navigation tabs */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold overflow-x-auto">
            <button
              onClick={() => setActiveTab('resume')}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'resume'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Résumé & MeSH
            </button>
            <button
              onClick={() => setActiveTab('terrain')}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'terrain'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-teal-700 dark:text-teal-300 hover:text-teal-800 font-bold'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>3 Points Clés Terrain</span>
            </button>
            <button
              onClick={() => setActiveTab('sommaire')}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'sommaire'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Sommaire
            </button>
            <button
              onClick={() => setActiveTab('apercu')}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'apercu'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Aperçu PDF
            </button>
            <button
              onClick={() => setActiveTab('citation')}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 ${
                activeTab === 'citation'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Quote className="w-3 h-3" />
              <span>Citer / Zotero</span>
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCertificate(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-colors"
              title="Attestation officielle d'indexation académique"
            >
              <Award className="w-3.5 h-3.5 text-teal-600" />
              <span>Attestation</span>
            </button>

            <button
              onClick={() => onToggleBookmark(document.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                isBookmarked
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-amber-500' : ''}`} />
              <span>{isBookmarked ? 'Enregistré' : 'Enregistrer'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloadSuccess ? 'Téléchargé !' : 'Télécharger PDF'}</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-700 dark:text-slate-300">
          {fileError && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{fileError}</span>
            </div>
          )}
          {/* TAB 1: Résumé & MeSH */}
          {activeTab === 'resume' && (
            <div className="space-y-6">
              {/* Metrics strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Pages</div>
                  <div className="text-base font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                    {document.pages}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Consultations</div>
                  <div className="text-base font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                    {viewsCount.toLocaleString('fr-FR')}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Téléchargements</div>
                  <div className="text-base font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                    {downloadsCount.toLocaleString('fr-FR')}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Validation</div>
                  <div className="text-base font-bold text-teal-600 dark:text-teal-400 font-mono">
                    Certifié CNTRSS / UP
                  </div>
                </div>
              </div>

              {/* Scientific abstract */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Résumé scientifique
                </h3>
                <p className="text-sm leading-relaxed text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                  {document.abstract}
                </p>
              </div>

              {/* Keywords & MeSH terms */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Mots-clés auteurs
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {document.keywords.map((kw, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium"
                      >
                        #{kw}
                      </span>
                    ))}
                  </div>
                </div>

                {document.meshTerms && (
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 mb-2">
                      Descripteurs MeSH normalisés
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {document.meshTerms.map((mesh, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 text-xs font-semibold border border-teal-200 dark:border-teal-800"
                        >
                          {mesh}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Synthèse Pratique & Recommandations de Terrain */}
          {activeTab === 'terrain' && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 space-y-2">
                <div className="flex items-center gap-2 text-teal-900 dark:text-teal-200 font-bold text-sm">
                  <Stethoscope className="w-4 h-4 text-teal-600" />
                  Implications pratiques pour les agents de santé & soignants de terrain
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Synthèse exécutive vulgarisée pour l'amélioration immédiate des pratiques cliniques et communautaires au Bénin.
                </p>
              </div>

              <div className="space-y-4">
                {document.clinicalKeyTakeaways && document.clinicalKeyTakeaways.length > 0 ? (
                  document.clinicalKeyTakeaways.map((takeaway, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex items-start gap-4"
                    >
                      <div className="w-8 h-8 rounded-xl bg-teal-600 text-white font-black text-sm flex items-center justify-center shrink-0">
                        {idx + 1}
                      </div>
                      <div className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed pt-1">
                        {takeaway}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs text-slate-500">
                    Synthèse en cours de validation par le comité de lecture académique du CNTRSS.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Sommaire */}
          {activeTab === 'sommaire' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Plan du document & Table des matières
              </h3>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
                {document.tableOfContents && document.tableOfContents.length > 0 ? (
                  document.tableOfContents.map((item, idx) => (
                    <div
                      key={idx}
                      className="px-4 py-3 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-teal-600" />
                        {item.title}
                      </span>
                      <span className="font-mono text-slate-400 tabular-nums">Page {item.page}</span>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs text-slate-500">
                    Table des matières standardisée conforme au canevas IMRAD national.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: Aperçu PDF */}
          {activeTab === 'apercu' && (
            <div className="space-y-4">
              <div className="bg-slate-100 dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="max-w-md mx-auto bg-white dark:bg-slate-900 shadow-md border border-slate-200 dark:border-slate-800 p-8 rounded-xl text-slate-900 dark:text-slate-100 space-y-6 min-h-[420px]">
                  <div className="text-center border-b border-slate-200 dark:border-slate-800 pb-4 space-y-1">
                    <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
                      RÉPUBLIQUE DU BÉNIN
                    </p>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {document.institution}
                    </p>
                    <p className="text-[10px] text-teal-600 dark:text-teal-400 font-medium">
                      Filière : {document.discipline} · {document.studyDesign}
                    </p>
                  </div>

                  <div className="text-center py-4 space-y-3">
                    <span className="inline-block text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono">
                      {document.type.toUpperCase()}
                    </span>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                      {document.title}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Présenté et soutenu publiquement par :<br />
                      <strong className="text-slate-900 dark:text-slate-200">{document.author}</strong>
                    </p>
                  </div>

                  <div className="border-t border-slate-200 dark:border-slate-800 pt-4 text-[10px] text-slate-500 flex justify-between font-mono">
                    <span>Directeur : {document.supervisor || 'Comité scientifique'}</span>
                    <span className="font-bold">Année {document.year}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Citer & Zotero / RIS */}
          {activeTab === 'citation' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCitationFormat('apa')}
                    className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-colors ${
                      citationFormat === 'apa'
                        ? 'bg-teal-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    APA 7e
                  </button>
                  <button
                    onClick={() => setCitationFormat('vancouver')}
                    className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-colors ${
                      citationFormat === 'vancouver'
                        ? 'bg-teal-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Vancouver
                  </button>
                  <button
                    onClick={() => setCitationFormat('bibtex')}
                    className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-colors ${
                      citationFormat === 'bibtex'
                        ? 'bg-teal-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    BibTeX
                  </button>
                  <button
                    onClick={() => setCitationFormat('ris')}
                    className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-colors ${
                      citationFormat === 'ris'
                        ? 'bg-teal-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Format RIS
                  </button>
                </div>

                {/* Direct download RIS for Zotero/Mendeley */}
                <button
                  onClick={handleDownloadRis}
                  className="px-3.5 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 font-semibold text-xs flex items-center gap-1.5 shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  Exporter vers Zotero / Mendeley (.RIS)
                </button>
              </div>

              <div className="relative">
                <pre className="p-4 rounded-2xl bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed border border-slate-800">
                  {generateCitation()}
                </pre>
                <button
                  onClick={handleCopyCitation}
                  className="absolute top-3 right-3 p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  {copiedCitation ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> Copié
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copier
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Official Indexing Certificate Modal */}
      {showCertificate && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-teal-50 dark:bg-teal-950 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-teal-600 mx-auto">
              <Award className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-teal-600">
                RÉPUBLIQUE DU BÉNIN · CNTRSS
              </span>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                Attestation Officielle d'Indexation et d'Archivage
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Certificat de dépôt légal universitaire pour soutenance
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-left text-xs space-y-1.5 font-mono">
              <div><strong>Auteur :</strong> {document.author}</div>
              <div><strong>Titre :</strong> {document.title}</div>
              <div><strong>Institution :</strong> {document.institution}</div>
              <div><strong>DOI :</strong> {doi}</div>
              <div><strong>Sceau d'archivage :</strong> CERT-CNTRSS-{document.id.toUpperCase()}-2024</div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setShowCertificate(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300"
              >
                Fermer
              </button>
              <button
                onClick={handleCertificateDownload}
                className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm"
              >
                Télécharger l'Attestation PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
