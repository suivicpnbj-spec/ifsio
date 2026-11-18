import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile, DocumentItem, ValidationItem, DocumentRequestRecord } from '../types';
import { apiRequest } from '../lib/backendApi';
import { CntrssEmblem } from './CntrssLogo';
import { SubmissionStudio } from './SubmissionStudio';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  FileText,
  Search,
  Filter,
  Eye,
  Send,
  Building2,
  User,
  Tag,
  Hash,
  Download,
  Check,
  ChevronRight,
  LogOut,
  Shield,
  Layers,
  Inbox,
  Archive,
  Library,
  Sparkles,
  RefreshCw,
  Sun,
  Moon,
  Upload
} from 'lucide-react';

interface LibrarianDashboardProps {
  currentUser: UserProfile;
  documents: DocumentItem[];
  onSelectDocument: (doc: DocumentItem) => void;
  onLogout: () => void;
  onSwitchUserRole: (role: 'Étudiant' | 'Bibliothécaire' | 'Administrateur') => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const LibrarianDashboard: React.FC<LibrarianDashboardProps> = ({
  currentUser,
  documents,
  onSelectDocument,
  onLogout,
  onSwitchUserRole,
  isDarkMode,
  onToggleDarkMode
}) => {
  const [activeTab, setActiveTab] = useState<'validations' | 'import' | 'requests' | 'catalog' | 'archives'>(
    'validations'
  );

  // Live backend sources with local mirror for edit state
  // États vides : la file de validation est chargée depuis l'API, aucune donnée
  // de démonstration n'est affichée.
  const [validationQueue, setValidationQueue] = useState<ValidationItem[]>([]);
  const [validationTotal, setValidationTotal] = useState(0);
  const [validationLoading, setValidationLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [documentRequests, setDocumentRequests] = useState<DocumentRequestRecord[]>([]);
  const [documentRequestsTotal, setDocumentRequestsTotal] = useState(0);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestsError, setRequestsError] = useState<string | null>(null);

  const [localValidationMirror, setLocalValidationMirror] = useState<ValidationItem[]>([]);
  const [localRequestsMirror, setLocalRequestsMirror] = useState<DocumentRequestRecord[]>([]);

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedValidationItem, setSelectedValidationItem] = useState<ValidationItem | null>(null);
  const [reviewNoteInput, setReviewNoteInput] = useState('');
  const [shelfLocationInput, setShelfLocationInput] = useState('');
  const [newMeshInput, setNewMeshInput] = useState('');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setActionSuccessMessage(msg);
    setTimeout(() => setActionSuccessMessage(null), 3500);
  };

  const refreshValidationQueue = useCallback(async () => {
    setValidationLoading(true);
    setValidationError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const data = await apiRequest<{ items: ValidationItem[]; total?: number }>(
        `/api/validation?${params.toString()}`
      );
      const items = data.items || [];
      setValidationQueue(items);
      setLocalValidationMirror(items);
      setValidationTotal(data.total ?? items.length);
      if (selectedValidationItem && !items.find((i: ValidationItem) => i.id === selectedValidationItem.id)) {
        setSelectedValidationItem(items[0] || null);
      }
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : 'Impossible de charger la file de validation');
    } finally {
      setValidationLoading(false);
    }
  }, [statusFilter, selectedValidationItem?.id]);

  const refreshDocumentRequests = useCallback(async () => {
    setRequestsLoading(true);
    setRequestsError(null);
    try {
      const params = new URLSearchParams();
      const data = await apiRequest<{ items: DocumentRequestRecord[]; total?: number }>(
        '/api/requests?' + params.toString()
      );
      const items = data.items || [];
      setDocumentRequests(items);
      setLocalRequestsMirror(items);
      setDocumentRequestsTotal(data.total ?? items.length);
    } catch (err) {
      setRequestsError(err instanceof Error ? err.message : 'Impossible de charger les demandes');
    } finally {
      setRequestsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshValidationQueue();
  }, [refreshValidationQueue]);

  useEffect(() => {
    refreshDocumentRequests();
  }, [refreshDocumentRequests]);

  const syncLocalMirrorFromServer = (serverItems: ValidationItem[]) => {
    setLocalValidationMirror(serverItems);
    setValidationQueue(serverItems);
    if (selectedValidationItem && !serverItems.find((i) => i.id === selectedValidationItem.id)) {
      setSelectedValidationItem(serverItems[0] || null);
    }
    const current = selectedValidationItem;
    if (current) {
      const refreshed = serverItems.find((i) => i.id === current.id);
      if (refreshed) {
        setSelectedValidationItem({ ...current, ...refreshed });
      }
    }
  };

  const syncLocalRequestsMirrorFromServer = (serverItems: DocumentRequestRecord[]) => {
    setLocalRequestsMirror(serverItems);
    setDocumentRequests(serverItems);
  };

  const handleApprove = async (item: ValidationItem) => {
    const shelfLocation = shelfLocationInput || item.shelfLocation || `COTE: CNTRSS-${new Date().toISOString().slice(2).replace(/[^0-9]/g, '')}-VAL`;
    const reviewNotes = 'Validé par le bibliothécaire en chef. Versé dans le dépôt national.';

    try {
      const data = await apiRequest<{ ok: boolean; item: ValidationItem }>(
        `/api/validation/${item.id}/approve`,
        { method: 'POST', body: JSON.stringify({ shelfLocation, reviewNotes }) }
      );
      const updated: ValidationItem = data.item;
      syncLocalMirrorFromServer(
        validationQueue.map((q) => (q.id === item.id ? updated : q))
      );
      if (selectedValidationItem?.id === item.id) {
        setSelectedValidationItem({ ...selectedValidationItem, ...updated });
        setShelfLocationInput(updated.shelfLocation || shelfLocationInput);
      }
      showNotification(`Le document "${item.title}" a été validé, certifié et publié au catalogue national !`);
    } catch (err) {
      showNotification(`Erreur lors de la validation : ${err instanceof Error ? err.message : 'inconnue'}`);
    }
  };

  const handleRequestCorrections = async (item: ValidationItem) => {
    if (!reviewNoteInput.trim()) {
      alert('Veuillez renseigner un motif ou les remarques de correction pour l\'étudiant.');
      return;
    }
    try {
      const data = await apiRequest<{ ok: boolean; item: ValidationItem }>(
        `/api/validation/${item.id}/request-corrections`,
        { method: 'POST', body: JSON.stringify({ reviewNotes: reviewNoteInput }) }
      );
      const updated: ValidationItem = data.item;
      syncLocalMirrorFromServer(
        validationQueue.map((q) => (q.id === item.id ? updated : q))
      );
      if (selectedValidationItem?.id === item.id) {
        setSelectedValidationItem({ ...selectedValidationItem, ...updated });
      }
      setReviewNoteInput('');
      showNotification(`Demande de corrections transmise à l'auteur (${item.author}).`);
    } catch (err) {
      showNotification(`Erreur lors de la demande de corrections : ${err instanceof Error ? err.message : 'inconnue'}`);
    }
  };

  const handleReject = async (item: ValidationItem) => {
    if (!reviewNoteInput.trim()) {
      alert('Veuillez renseigner le motif du refus : il sera transmis à\'auteur.');
      return;
    }
    try {
      const data = await apiRequest<{ ok: boolean; item: ValidationItem }>(
        `/api/validation/${item.id}/reject`,
        { method: 'POST', body: JSON.stringify({ reviewNotes: reviewNoteInput }) }
      );
      const updated: ValidationItem = data.item;
      syncLocalMirrorFromServer(
        validationQueue.map((q) => (q.id === item.id ? updated : q))
      );
      if (selectedValidationItem?.id === item.id) {
        setSelectedValidationItem({ ...selectedValidationItem, ...updated });
      }
      setReviewNoteInput('');
      showNotification(`Dépôt "${item.title}" refusé — motif transmis à l'auteur (${item.author}).`);
    } catch (err) {
      showNotification(`Erreur lors du refus : ${err instanceof Error ? err.message : 'inconnue'}`);
    }
  };

  const handleAddMeshTerm = async () => {
    if (!newMeshInput.trim() || !selectedValidationItem) return;
    const term = newMeshInput.trim();
    if (selectedValidationItem.meshTerms.includes(term)) return;
    try {
      const data = await apiRequest<{ ok: boolean; item: ValidationItem }>(
        `/api/validation/${selectedValidationItem.id}/mesh`,
        { method: 'POST', body: JSON.stringify({ term }) }
      );
      const updated: ValidationItem = data.item;
      syncLocalMirrorFromServer(
        validationQueue.map((q) => (q.id === selectedValidationItem.id ? updated : q))
      );
      if (selectedValidationItem?.id === updated.id) {
        setSelectedValidationItem({ ...selectedValidationItem, ...updated });
      }
      setNewMeshInput('');
      showNotification(`Descripteur MeSH "${term}" ajouté.`);
    } catch (err) {
      showNotification(`Erreur MeSH : ${err instanceof Error ? err.message : 'inconnue'}`);
    }
  };

  const handleUpdateRequestStatus = async (reqId: string, newStatus: DocumentRequestRecord['status']) => {
    try {
      const data = await apiRequest<{ ok: boolean; record: DocumentRequestRecord }>(
        `/api/requests/${reqId}/status`,
        { method: 'POST', body: JSON.stringify({ status: newStatus }) }
      );
      const updated = data.record;
      syncLocalRequestsMirrorFromServer(
        documentRequests.map((r) => (r.id === reqId ? updated : r))
      );
      showNotification(`Statut de la demande documentaire mis à jour : ${newStatus}.`);
    } catch (err) {
      showNotification(`Erreur : ${err instanceof Error ? err.message : 'inconnue'}`);
    }
  };

  const filteredValidationQueue = localValidationMirror.filter((item) => {
    if (statusFilter === 'all') return true;
    return item.status === statusFilter;
  });

  const pendingCount = localValidationMirror.filter((i: ValidationItem) => i.status === 'En attente').length;
  const urgentRequestsCount = localRequestsMirror.filter((r: DocumentRequestRecord) => r.status === 'En cours de recherche').length;

  return (
    <div className="cntrss-dashboard cntrss-librarian-dashboard min-h-screen bg-[#f3f6fa] dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Header - Consistent Signature Navy #102e4e with Student Space */}
      <header className="cntrss-dashboard-header sticky top-0 z-40 bg-[#102e4e] text-white border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CntrssEmblem className="w-9 h-9 shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-white text-sm sm:text-base">CNTRSS</span>
                <span className="px-2 py-0.5 rounded-md bg-sky-950/80 text-sky-300 border border-sky-800 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <Library className="w-3 h-3 text-sky-400" /> Console Bibliothécaire
                </span>
              </div>
              <p className="text-[11px] text-sky-400/90 hidden sm:block">
                Gestion des Dépôts, Indexation Thésaurus & Services Documentaires
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Role Switcher */}
            <div className="cntrss-role-switcher flex items-center bg-slate-900/90 rounded-xl p-1 border border-slate-800 text-xs">
              <span className="text-[10px] text-slate-400 font-semibold px-2 hidden md:inline">Espaces :</span>
              <button
                onClick={() => onSwitchUserRole('Étudiant')}
                className="px-2 py-1 rounded-lg text-[11px] font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                title="Basculer vers l'espace Étudiant"
              >
                Étudiant
              </button>
              <button
                className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-white bg-sky-600 shadow-xs"
              >
                Bibliothécaire
              </button>
              <button
                onClick={() => onSwitchUserRole('Administrateur')}
                className="px-2 py-1 rounded-lg text-[11px] font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                title="Basculer vers l'espace Administrateur"
              >
                Admin
              </button>
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={onToggleDarkMode}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              title={isDarkMode ? 'Passer en mode clair' : 'Passer en mode sombre'}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-sky-300" />}
            </button>

            {/* User Profile */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="w-8 h-8 rounded-full bg-sky-700 flex items-center justify-center font-bold text-xs text-white">
                {currentUser.avatarLetter}
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-xs font-bold leading-tight text-white">{currentUser.fullName}</div>
                <div className="text-[10px] text-slate-400 truncate max-w-[150px]">{currentUser.institution}</div>
              </div>
              <button
                onClick={onLogout}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                title="Déconnexion"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Subnav Tabs */}
        <div className="cntrss-dashboard-tabs cntrss-librarian-tabs max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1 border-t border-slate-800/80 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('validations')}
            className={`px-4 py-2.5 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'validations'
                ? 'border-sky-400 text-sky-300 bg-sky-950/30'
                : 'border-transparent text-slate-300 hover:text-white'
            }`}
          >
            <Inbox className="w-3.5 h-3.5 text-sky-400" />
            <span>Validation des Dépôts</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 font-bold text-[10px]">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('import')}
            className={`px-4 py-2.5 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'import'
                ? 'border-sky-400 text-sky-300 bg-sky-950/30'
                : 'border-transparent text-slate-300 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5 text-sky-400" />
            <span>Importer un document</span>
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2.5 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'requests'
                ? 'border-sky-400 text-sky-300 bg-sky-950/30'
                : 'border-transparent text-slate-300 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            <span>Demandes & Numérisations</span>
            {urgentRequestsCount > 0 && (

              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-bold text-[10px]">
                {urgentRequestsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-2.5 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'catalog'
                ? 'border-sky-400 text-sky-300 bg-sky-950/30'
                : 'border-transparent text-slate-300 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-sky-400" />
            <span>Fonds Documentaire ({documents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('archives')}
            className={`px-4 py-2.5 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'archives'
                ? 'border-sky-400 text-sky-300 bg-sky-950/30'
                : 'border-transparent text-slate-300 hover:text-white'
            }`}
          >
            <Archive className="w-3.5 h-3.5 text-sky-400" />
            <span>Inventaire Physique</span>
          </button>
        </div>
      </header>

      {/* Action Notification Toast */}
      {actionSuccessMessage && (
        <div className="fixed top-24 right-6 z-50 bg-sky-600 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-sky-200 shrink-0" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="cntrss-dashboard-main max-w-7xl mx-auto w-full p-4 sm:p-6 flex-1 space-y-6">
        {/* TAB 1: VALIDATION QUEUE */}
        {activeTab === 'validations' && (
          <div className="space-y-6">
            {/* Header and Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Inbox className="w-4 h-4 text-sky-600 dark:text-sky-400" /> File de Validation et de Dépôt Académique
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Vérifiez la conformité des thèses et mémoires soumis par les étudiants avant publication au catalogue national.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Filtrer par statut :</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-sky-500"
                >
                  <option value="all">Tous ({localValidationMirror.length})</option>
                  <option value="En attente">En attente ({localValidationMirror.filter((i) => i.status === 'En attente').length})</option>
                  <option value="Validé & Publié">Validés & Publiés</option>                    <option value="Corrections requises">Corrections requises</option>
                    <option value="Refusé">Refusés ({localValidationMirror.filter((i) => i.status === 'Refusé').length})</option>
                </select>
              </div>
            </div>

            {/* Split layout: Queue List (Left) + Detailed Review Panel (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Queue List */}
              <div className="lg:col-span-5 space-y-3">
                {filteredValidationQueue.length === 0 && (
                  <p className="text-xs text-slate-400 py-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    {validationLoading
                      ? 'Chargement de la file de validation…'
                      : 'Aucun dossier dans la file : les dépôts reçus apparaîtront ici.'}
                  </p>
                )}
                {filteredValidationQueue.map((item) => {
                  const isSelected = selectedValidationItem?.id === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        setSelectedValidationItem(item);
                        setShelfLocationInput(item.shelfLocation || '');
                        setReviewNoteInput(item.reviewNotes || '');
                      }}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-sky-600 bg-sky-50/50 dark:bg-sky-950/30 shadow-xs ring-1 ring-sky-500'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-sky-300 dark:hover:border-sky-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {item.type} · {item.discipline}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.status === 'En attente'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : item.status === 'Validé & Publié'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug">
                        {item.title}
                      </h4>

                      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="font-medium text-slate-700 dark:text-slate-300">{item.author}</span>
                        <span>{item.submissionDate}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Detailed Review Panel */}
              <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                {selectedValidationItem ? (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <div className="text-[11px] text-sky-600 dark:text-sky-400 font-bold uppercase tracking-wider">
                          Dossier de dépôt #{selectedValidationItem.id}
                        </div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                          {selectedValidationItem.title}
                        </h3>
                      </div>

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          selectedValidationItem.status === 'En attente'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : selectedValidationItem.status === 'Validé & Publié'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {selectedValidationItem.status}
                      </span>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Auteur</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{selectedValidationItem.author}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Directeur / Encadrant</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{selectedValidationItem.supervisor}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Établissement</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">{selectedValidationItem.institution}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Identifiant DOI</span>
                        <span className="font-mono text-sky-600 dark:text-sky-400 font-semibold">{selectedValidationItem.assignedDoi}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Taille du fichier</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{selectedValidationItem.fileSize} (PDF/A)</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Date de soumission</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{selectedValidationItem.submissionDate}</span>
                      </div>
                    </div>

                    {/* Shelf Location & Physical Archiving */}
                    <div className="space-y-1.5 text-xs">
                      <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Hash className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                        Cote de classement physique (Bibliothèque universitaire) :
                      </label>
                      <input
                        type="text"
                        value={shelfLocationInput}
                        onChange={(e) => setShelfLocationInput(e.target.value)}
                        placeholder="Ex: COTE: UP-MED-2026-T14"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-sky-500"
                      />
                    </div>

                    {/* MeSH Vocabulary Enrichment */}
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                          Descripteurs MeSH indexés ({selectedValidationItem.meshTerms.length}) :
                        </label>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {selectedValidationItem.meshTerms.map((m, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-mono text-[11px] border border-sky-200 dark:border-sky-800"
                          >
                            {m}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="text"
                          value={newMeshInput}
                          onChange={(e) => setNewMeshInput(e.target.value)}
                          placeholder="Ajouter descripteur MeSH ex: Benin / epidemiology"
                          className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
                        />
                        <button
                          type="button"
                          onClick={handleAddMeshTerm}
                          className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs"
                        >
                          Ajouter
                        </button>
                      </div>
                    </div>

                    {/* Librarian Feedback / Notes */}
                    <div className="space-y-1.5 text-xs">
                      <label className="font-bold text-slate-700 dark:text-slate-300">
                        Remarques de conformité / Instructions à l'étudiant :
                      </label>
                      <textarea
                        rows={3}
                        value={reviewNoteInput}
                        onChange={(e) => setReviewNoteInput(e.target.value)}
                        placeholder="Ex: Vérifier la table des matières ou ajouter le résumé en anglais..."
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-sky-500"
                      />
                    </div>

                    {/* Curator Action Buttons */}
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => handleRequestCorrections(selectedValidationItem)}
                          className="px-4 py-2 rounded-xl border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-xs font-bold transition-colors flex items-center gap-1.5"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Demander corrections</span>
                        </button>
                        <button
                          onClick={() => handleReject(selectedValidationItem)}
                          className="px-4 py-2 rounded-xl border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-bold transition-colors flex items-center gap-1.5"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Refuser le dépôt</span>
                        </button>
                      </div>

                      <button
                        onClick={() => handleApprove(selectedValidationItem)}
                        className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Valider & Publier au Catalogue National</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    Sélectionnez un mémoire dans la liste pour examiner ses métadonnées.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: IMPORT D'UN DOCUMENT (rôle bibliothécaire uniquement) */}
        {activeTab === 'import' && (
          <SubmissionStudio
            currentUser={currentUser}
            onSubmitSuccess={(newDoc) => {
              showNotification(
                `Dépôt enregistré : « ${newDoc.title} » (DOI ${newDoc.doi}) attend votre validation.`
              );
              // Le dossier entre immédiatement dans la file ci-contre.
              refreshValidationQueue();
            }}
            onCancel={() => {
              setActiveTab('validations');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {/* TAB 3: DOCUMENT REQUESTS & SCANNING */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-600 dark:text-sky-400" /> Requêtes Documentaires et Demandes de Numérisation
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Demandes soumises par des étudiants et chercheurs pour des thèses physiques antérieures non encore numérisées.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {documentRequests.length === 0 && (
                <p className="text-xs text-slate-400 py-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  {requestsLoading
                    ? 'Chargement des demandes documentaires…'
                    : 'Aucune demande de document enregistrée pour le moment.'}
                </p>
              )}
              {documentRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-mono text-sky-600 dark:text-sky-400 font-bold">#{req.id}</span>
                      <span className="text-slate-400">·</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          req.priority === 'Urgente (Soutenance)'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {req.priority}
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-500 dark:text-slate-400 text-[11px]">{req.date}</span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{req.title}</h4>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span>Demandeur : <strong className="text-slate-700 dark:text-slate-300">{req.requesterName}</strong> ({req.requesterRole})</span>
                      <span>Email : <span className="font-mono">{req.requesterEmail}</span></span>
                      <span>Établissement : {req.institution}</span>
                    </div>

                    {req.notes && (
                      <p className="text-xs text-sky-800 dark:text-sky-200 bg-sky-50 dark:bg-sky-950/40 p-2.5 rounded-xl border border-sky-100 dark:border-sky-900">
                        {req.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex sm:flex-col items-center gap-2 shrink-0">
                    <select
                      value={req.status}
                      onChange={(e) => handleUpdateRequestStatus(req.id, e.target.value as any)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="En cours de recherche">En cours de recherche</option>
                      <option value="Numérisé & Transmis">Numérisé & Transmis</option>
                      <option value="Disponible en salle">Disponible en salle</option>
                      <option value="Introuvable">Introuvable</option>
                    </select>

                    <button
                      onClick={() => {
                        handleUpdateRequestStatus(req.id, 'Numérisé & Transmis');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-colors"
                    >
                      Notifier l'étudiant
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: GENERAL CATALOG WITH CURATOR PRIVILEGES */}
        {activeTab === 'catalog' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-sky-600 dark:text-sky-400" /> Fonds National Indexé ({documents.length} travaux)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Vue bibliothécaire avec accès rapide à la consultation et à la vérification des notices.
                </p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder="Rechercher par titre, auteur..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
              {documents
                .filter((d) =>
                  d.title.toLowerCase().includes(catalogSearch.toLowerCase()) ||
                  d.author.toLowerCase().includes(catalogSearch.toLowerCase())
                )
                .map((doc) => (
                  <div key={doc.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-mono text-sky-600 dark:text-sky-400 font-semibold">{doc.doi}</span>
                        <span className="text-slate-400">·</span>
                        <span className="font-medium text-slate-600 dark:text-slate-400">{doc.type}</span>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-500 dark:text-slate-400">{doc.discipline} ({doc.year})</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">{doc.title}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{doc.author} · {doc.institution}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => onSelectDocument(doc)}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-sky-600 text-slate-700 dark:text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Consulter notice</span>
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* TAB 4: PHYSICAL REPOSITORY & ARCHIVES */}
        {activeTab === 'archives' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Archive className="w-4 h-4 text-sky-600 dark:text-sky-400" /> Inventaire Physique des Fonds Documentaires en Santé
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cartographie des rayonnages et des magasins d'archivage des thèses papier dans les universités partenaires au Bénin.
              </p>
            </div>

            {/* Inventaire physique : aucune donnée fabriquée — saisie réelle à venir. */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-xs text-center space-y-2">
              <Archive className="w-8 h-8 text-sky-600 mx-auto" />
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Aucun magasin d'archivage renseigné pour le moment
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                L'inventaire physique des fonds (capacité, remplissage, état de conservation des rayonnages) sera
                saisi par la bibliothèque centrale lors du prochain audit des dépôts papier.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
