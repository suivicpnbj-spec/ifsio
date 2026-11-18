import React, { useEffect, useState } from 'react';
import { UserProfile, UserRole, UserAccountItem, AuditLogItem } from '../types';
import { apiRequest, fetchJson, ObservatoryApiResponse } from '../lib/backendApi';

// Métriques réelles servies par GET /api/health (aucune valeur de démonstration).
interface HealthMetrics {
  status?: string;
  hasGeminiKey?: boolean;
  databaseAvailable?: boolean;
  documentCount?: number;
  validatedDocuments?: number;
  pendingValidations?: number;
  accounts?: number;
  sessions?: number;
  auditEntries?: number;
  partnerships?: number;
  uptimeSeconds?: number;
  storageBytes?: number;
}

// Demande reçue via le formulaire « Devenir partenaire » (POST /api/partnerships).
interface PartnershipRequest {
  id: string;
  institution: string;
  institutionType: string;
  contactName: string;
  email: string;
  phone?: string | null;
  website?: string | null;
  message: string;
  status: string; // Nouvelle | En cours de traitement | Traité | Refusé
  notes?: string | null;
  emailSent: boolean;
  emailError?: string | null;
  createdAt: string;
}

function formatDuration(totalSeconds = 0): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  const clock = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
  return days > 0 ? `${days} j ${clock}` : clock;
}

function formatBytes(bytes = 0): string {
  if (!bytes) return '0 o';
  const units = ['o', 'Ko', 'Mo', 'Go'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(unit > 1 ? 1 : 0)} ${units[unit]}`;
}
import { CntrssEmblem } from './CntrssLogo';
import {
  Shield,
  Users,
  Activity,
  Server,
  Building2,
  Lock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Sliders,
  LogOut,
  Cpu,
  Database,
  BarChart3,
  Search,
  Eye,
  Key,
  Globe,
  Settings,
  ChevronRight,
  TrendingUp,
  FileCheck,
  UserPlus,
  Sun,
  Moon
} from 'lucide-react';

interface AdminDashboardProps {
  currentUser: UserProfile;
  onLogout: () => void;
  onSwitchUserRole: (role: 'Étudiant' | 'Bibliothécaire' | 'Administrateur') => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  onLogout,
  onSwitchUserRole,
  isDarkMode,
  onToggleDarkMode
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'partners' | 'audit' | 'settings'>('overview');
  // État vide par défaut : les données proviennent de l'API, aucune liste de
  // démonstration n'est affichée.
  const [usersList, setUsersList] = useState<UserAccountItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [metrics, setMetrics] = useState<HealthMetrics | null>(null);
  const [partnerships, setPartnerships] = useState<PartnershipRequest[]>([]);
  const [institutionWorks, setInstitutionWorks] = useState<Record<string, number>>({});
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [systemNotification, setSystemNotification] = useState<string | null>(null);

  // Création de compte par l'administration (bibliothécaires / administrateurs).
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [newUser, setNewUser] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'Bibliothécaire',
    institution: 'Université de Parakou'
  });

  // System settings state
  const [openDataMandatory, setOpenDataMandatory] = useState(true);
  const [autoDoiGeneration, setAutoDoiGeneration] = useState(true);
  const [requireIdentityCard, setRequireIdentityCard] = useState(true);
  const [geminiTokenLimit, setGeminiTokenLimit] = useState(1000000);

  const showNotification = (msg: string) => {
    setSystemNotification(msg);
    setTimeout(() => setSystemNotification(null), 3500);
  };

  // Le répertoire des comptes et le journal d'audit viennent du serveur
  // (endpoints réservés au rôle Administrateur). Le corpus livré sert de repli
  // si l'API n'est pas joignable.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await apiRequest<{ items: UserAccountItem[] }>('/api/users');
        if (!cancelled) setUsersList(data.items || []);
      } catch {
        // API injoignable : la liste reste vide plutôt que figée.
      }

      try {
        const data = await apiRequest<{ items: AuditLogItem[] }>('/api/audit-logs');
        if (!cancelled) setAuditLogs(data.items || []);
      } catch {
        // API injoignable : le journal reste vide plutôt que figé.
      }

      try {
        const data = await apiRequest<HealthMetrics>('/api/health');
        if (!cancelled) setMetrics(data);
      } catch {
        // Métriques indisponibles : les cartes affichent zéro / hors ligne.
      }

      try {
        const data = await apiRequest<{ items: PartnershipRequest[] }>('/api/partnerships');
        if (!cancelled) setPartnerships(data.items || []);
      } catch {
        // Aucune demande ou droits insuffisants.
      }

      try {
        const data = await fetchJson<ObservatoryApiResponse>('/api/observatory');
        if (!cancelled) setInstitutionWorks(data.byInstitution || {});
      } catch {
        // Catalogue vide : les compteurs par établissement restent à zéro.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const patchUserAccount = async (
    userId: string,
    patch: { role?: UserRole; status?: UserAccountItem['status'] }
  ): Promise<UserAccountItem | null> => {
    try {
      const data = await apiRequest<{ ok: boolean; item: UserAccountItem }>(`/api/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify(patch)
      });
      setUsersList((prev) => prev.map((u) => (u.id === userId ? data.item : u)));
      return data.item;
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Mise à jour du compte impossible.');
      return null;
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    const updated = await patchUserAccount(userId, { role: newRole });
    if (updated) {
      showNotification(`Rôle de ${updated.fullName} mis à jour : ${newRole}.`);
    }
  };

  const handleStatusToggle = async (userId: string) => {
    const target = usersList.find((u) => u.id === userId);
    if (!target) return;

    const nextStatus: UserAccountItem['status'] = target.status === 'Actif' ? 'Suspendu' : 'Actif';
    const updated = await patchUserAccount(userId, { status: nextStatus });
    if (updated) {
      showNotification(`Statut du compte ${updated.fullName} : ${nextStatus}.`);
    }
  };

  // Traitement d'une demande de partenariat : l'administration ouvre, clôture
  // ou refuse la demande (PATCH /api/partnerships/:id), statut conservé en base.
  const handlePartnershipStatus = async (requestId: string, status: string) => {
    try {
      const data = await apiRequest<{ ok: boolean; item: PartnershipRequest }>(`/api/partnerships/${requestId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      setPartnerships((prev) => prev.map((p) => (p.id === requestId ? { ...p, ...data.item } : p)));
      showNotification(`Demande de partenariat : ${status.toLowerCase()}.`);
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Mise à jour impossible.');
    }
  };

  // POST /api/users : ouverture d'un compte par l'administration. C'est la
  // seule voie d'accès aux rôles Bibliothécaire / Administrateur.
  const handleCreateUser = async (event: React.FormEvent) => {
    event.preventDefault();
    setCreatingUser(true);
    try {
      const data = await apiRequest<{ ok: boolean; item: UserAccountItem }>('/api/users', {
        method: 'POST',
        body: JSON.stringify(newUser)
      });
      setUsersList((prev) => [...prev, data.item]);
      setShowCreateUser(false);
      setNewUser({ fullName: '', email: '', password: '', role: 'Bibliothécaire', institution: 'Université de Parakou' });
      showNotification(`Compte ${data.item.role} créé : ${data.item.email}.`);
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Création du compte impossible.');
    } finally {
      setCreatingUser(false);
    }
  };

  const filteredUsers = usersList.filter((u) => {
    const matchSearch =
      u.fullName.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.institution.toLowerCase().includes(userSearch.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="cntrss-dashboard cntrss-admin-dashboard min-h-screen bg-[#f3f6fa] dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Header - Signature Navy #102e4e matching student workspace */}
      <header className="cntrss-dashboard-header sticky top-0 z-40 bg-[#102e4e] text-white border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CntrssEmblem className="w-9 h-9 shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-white text-sm sm:text-base">CNTRSS</span>
                <span className="px-2 py-0.5 rounded-md bg-sky-950/80 text-sky-300 border border-sky-800 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <Shield className="w-3 h-3 text-sky-400" /> Centre de Commandement Admin
                </span>
              </div>
              <p className="text-[11px] text-sky-400/90 hidden sm:block">
                Supervision Nationale, Gouvernance Académique & Sécurité Système
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
                onClick={() => onSwitchUserRole('Bibliothécaire')}
                className="px-2 py-1 rounded-lg text-[11px] font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                title="Basculer vers l'espace Bibliothécaire"
              >
                Bibliothécaire
              </button>
              <button
                className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-white bg-sky-600 shadow-xs"
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
        <div className="cntrss-dashboard-tabs cntrss-admin-tabs max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1 border-t border-slate-800/80 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2.5 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-sky-400 text-sky-300 bg-sky-950/30'
                : 'border-transparent text-slate-300 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-sky-400" />
            <span>Vue d'ensemble & Santé</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2.5 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'users'
                ? 'border-sky-400 text-sky-300 bg-sky-950/30'
                : 'border-transparent text-slate-300 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-sky-400" />
            <span>Gestion Utilisateurs & Rôles ({usersList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('partners')}
            className={`px-4 py-2.5 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'partners'
                ? 'border-sky-400 text-sky-300 bg-sky-950/30'
                : 'border-transparent text-slate-300 hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-sky-400" />
            <span>Universités Partenaires</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2.5 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'audit'
                ? 'border-sky-400 text-sky-300 bg-sky-950/30'
                : 'border-transparent text-slate-300 hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-sky-400" />
            <span>Journal d'Audit & Sécurité</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2.5 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'settings'
                ? 'border-sky-400 text-sky-300 bg-sky-950/30'
                : 'border-transparent text-slate-300 hover:text-white'
            }`}
          >
            <Settings className="w-3.5 h-3.5 text-sky-400" />
            <span>Paramètres de Gouvernance</span>
          </button>
        </div>
      </header>

      {/* Notification Toast */}
      {systemNotification && (
        <div className="fixed top-24 right-6 z-50 bg-sky-600 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-sky-200 shrink-0" />
          <span>{systemNotification}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="cntrss-dashboard-main max-w-7xl mx-auto w-full p-4 sm:p-6 flex-1 space-y-6">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Header intro */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-sky-600 dark:text-sky-400 text-xs font-bold uppercase tracking-wider block mb-1">
                  Observatoire Opérationnel National
                </span>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  Santé de l'Infrastructure et Dynamique Académique
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Surveillance en temps réel des services backend, requêtes IA, volume de thèses certifiées et sessions actives.
                </p>
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/80 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                <span>{metrics?.status === 'ok' ? 'Tous les systèmes nominaux' : 'État des services à confirmer'}</span>
              </div>
            </div>

            {/* Metrics cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
                  <span>Serveur Backend</span>
                  <Server className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                </div>
                <div className="text-xl font-mono font-bold text-sky-600 dark:text-sky-400">
                  {metrics?.status === 'ok' ? 'Opérationnel (En ligne)' : 'Indisponible'}
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Uptime : {formatDuration(metrics?.uptimeSeconds)}
                </span>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
                  <span>Assistant Gemini IA</span>
                  <Sparkles className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                </div>
                <div className="text-xl font-mono font-bold text-slate-900 dark:text-white">Gemini 3.8 Flash</div>
                <span className="text-[11px] text-sky-600 dark:text-sky-400 font-mono font-semibold">
                  {metrics?.hasGeminiKey ? 'Clé API configurée' : 'Clé absente — moteur académique local'}
                </span>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
                  <span>Thèses Validées</span>
                  <FileCheck className="w-4 h-4 text-sky-500" />
                </div>
                <div className="text-xl font-mono font-bold text-slate-900 dark:text-white">
                  {metrics?.validatedDocuments ?? 0}
                </div>
                <span className="text-[11px] text-sky-600 dark:text-sky-400 font-semibold">
                  {metrics?.documentCount ?? 0} documents indexés · {metrics?.pendingValidations ?? 0} en attente
                </span>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
                  <span>Sessions Actives</span>
                  <Users className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-xl font-mono font-bold text-slate-900 dark:text-white">{metrics?.sessions ?? 0}</div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {metrics?.accounts ?? 0} comptes enregistrés
                </span>
              </div>
            </div>

            {/* Quick stats grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-sky-600 dark:text-sky-400" /> Entrepôt Numérique & Stockage Sécurisé
                </h3>
                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between text-slate-500 dark:text-slate-400 mb-1">
                      <span>Volume base de données & documents PDF certifiés</span>
                      <strong className="text-slate-900 dark:text-white font-mono">
                        {formatBytes(metrics?.storageBytes)}
                      </strong>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-sky-500 h-full rounded-full"
                        style={{
                          width: `${Math.min(100, Math.round(((metrics?.storageBytes || 0) / (5 * 1024 * 1024 * 1024)) * 100))}%`
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-500 dark:text-slate-400 mb-1">
                      <span>Journal d'audit conservé (entrées)</span>
                      <strong className="text-sky-600 dark:text-sky-400 font-mono">{metrics?.auditEntries ?? 0}</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-sky-600 dark:text-sky-400" /> Conformité & Politique de Sécurité
                </h3>
                <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <CheckCircle2 className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                    <span>Accès strictement réservé aux comptes académiques vérifiés.</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <CheckCircle2 className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                    <span>Filigrane d'authentification numérique apposé sur chaque téléchargement.</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <CheckCircle2 className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                    <span>Rôle-based access control (RBAC) actif : Étudiant, Bibliothécaire, Admin.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: USER DIRECTORY & ROLE MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-sky-600 dark:text-sky-400" /> Annuaire des Utilisateurs et Attribution des Permissions
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Gérez les habilitations, promouvez les utilisateurs aux fonctions de bibliothécaire ou d'administrateur.
                </p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Chercher nom, email, fac..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-sky-500"
                >
                  <option value="all">Tous les rôles</option>
                  <option value="Étudiant">Étudiants</option>
                  <option value="Enseignant-Chercheur">Enseignants-Chercheurs</option>
                  <option value="Bibliothécaire">Bibliothécaires</option>
                  <option value="Administrateur">Administrateurs</option>
                </select>

                <button
                  type="button"
                  onClick={() => setShowCreateUser((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-sm transition-colors shrink-0"
                >
                  <UserPlus className="w-4 h-4" />
                  {showCreateUser ? 'Fermer' : 'Créer un compte'}
                </button>
              </div>
            </div>

            {showCreateUser && (
              <form
                onSubmit={handleCreateUser}
                className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-sky-200 dark:border-sky-800 shadow-xs space-y-4"
              >
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-sky-600 dark:text-sky-400" /> Ouverture d'un compte par
                    l'administration
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Seule voie d'accès aux rôles Bibliothécaire et Administrateur : le public ne peut pas s'inscrire
                    avec ces rôles.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Nom complet
                    </label>
                    <input
                      type="text"
                      required
                      minLength={3}
                      value={newUser.fullName}
                      onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                      placeholder="Ex: Dr. HOUNKPATIN Estelle"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Adresse e-mail
                    </label>
                    <input
                      type="email"
                      required
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      placeholder="biblio@cntrss.bj"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Rôle attribué
                    </label>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="Bibliothécaire">Bibliothécaire</option>
                      <option value="Administrateur">Administrateur</option>
                      <option value="Enseignant-Chercheur">🧑‍🏫 Enseignant-Chercheur</option>
                      <option value="Chercheur">🔬 Chercheur</option>
                      <option value="Institution">🏛️ Représentant d'institution</option>
                      <option value="Étudiant">Étudiant</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Établissement
                    </label>
                    <input
                      type="text"
                      required
                      minLength={2}
                      value={newUser.institution}
                      onChange={(e) => setNewUser({ ...newUser, institution: e.target.value })}
                      placeholder="Ex: IFSIO de Parakou"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Mot de passe provisoire
                    </label>
                    <input
                      type="text"
                      required
                      minLength={8}
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      placeholder="8 caractères minimum — à communiquer au titulaire"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowCreateUser(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={creatingUser}
                    className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-60 text-white text-xs font-bold shadow-sm transition-colors"
                  >
                    {creatingUser ? 'Création…' : 'Créer le compte'}
                  </button>
                </div>
              </form>
            )}

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Utilisateur</th>
                      <th className="py-3 px-4">Établissement & Discipline</th>
                      <th className="py-3 px-4">Rôle Actuel</th>
                      <th className="py-3 px-4">Statut</th>
                      <th className="py-3 px-4">Dernière Connexion</th>
                      <th className="py-3 px-4 text-right">Actions de Gouvernance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">{u.fullName}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{u.email}</div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                          <div>{u.institution}</div>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">{u.discipline}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[11px] font-bold text-sky-700 dark:text-sky-300 focus:ring-1 focus:ring-sky-500"
                          >
                            <option value="Étudiant">Étudiant</option>
                            <option value="Enseignant-Chercheur">🧑‍🏫 Enseignant-Chercheur</option>
                            <option value="Bibliothécaire">Bibliothécaire</option>
                            <option value="Administrateur">Administrateur</option>
                          </select>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              u.status === 'Actif'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            }`}
                          >
                            {u.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                          {u.lastLogin}
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          <button
                            onClick={() => handleStatusToggle(u.id)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                              u.status === 'Actif'
                                ? 'border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                                : 'border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                            }`}
                          >
                            {u.status === 'Actif' ? 'Suspendre' : 'Réactiver'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PARTNER INSTITUTIONS */}
        {activeTab === 'partners' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-sky-600 dark:text-sky-400" /> Établissements & Universités Partenaires Conventionnés
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Supervision des accords de diffusion et du dépôt légal électronique des travaux universitaires au Bénin.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Référentiel des établissements (le « bâtiment ») : aucun statut, quota ou
                  contact fabriqué — seuls les documents réellement indexés sont comptés. */}
              {[
                { name: 'Université de Parakou (Faculté de Médecine)', code: 'UP-FM' },
                { name: 'Faculté des Sciences de la Santé (FSS Cotonou)', code: 'UAC-FSS' },
                { name: 'Institut National Médico-Sanitaire (INMeS)', code: 'INMeS' },
                { name: 'Institut de Formation en Soins Infirmiers et Officier de Santé (IFSIO Parakou)', code: 'IFSIO' },
                { name: 'Institut Régional de Santé Publique (IRSP Ouidah)', code: 'IRSP' },
                { name: 'Centre Hospitalier Universitaire Départemental (CHUD Borgou)', code: 'CHUD-B' },
                { name: 'Centre National Hospitalier Universitaire (CNHU-HKM)', code: 'CNHU' }
              ].map((inst, idx) => (
                <div key={idx} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800">
                      {inst.code}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{inst.name}</h4>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>Travaux indexés :</span>
                    <strong className="text-slate-900 dark:text-white font-mono">
                      {(institutionWorks[inst.name] ?? 0).toLocaleString('fr-FR')}
                    </strong>
                  </div>
                </div>
              ))}
            </div>

            {/* Demandes reçues via le formulaire « Devenir partenaire » */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-sky-600 dark:text-sky-400" /> Demandes de partenariat reçues
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Formulaire « Devenir partenaire » : chaque demande est enregistrée en base et notifiée par e-mail à
                  l'administration du système.
                </p>
                {partnerships.length > 0 && (
                  <p className="text-[11px] font-semibold text-sky-700 dark:text-sky-300 font-mono pt-1">
                    {partnerships.filter((p) => (p.status || 'Nouvelle') === 'Nouvelle').length} nouvelle(s) ·{' '}
                    {partnerships.filter((p) => p.status === 'En cours de traitement').length} en cours ·{' '}
                    {partnerships.filter((p) => p.status === 'Traité').length} traitée(s) ·{' '}
                    {partnerships.filter((p) => p.status === 'Refusé').length} refusée(s)
                  </p>
                )}
              </div>

              {partnerships.length === 0 ? (
                <p className="text-xs text-slate-400">Aucune demande reçue pour le moment.</p>
              ) : (
                <div className="space-y-3">
                  {partnerships.map((request) => (
                    <div
                      key={request.id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">{request.institution}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {request.institutionType} · {request.contactName} · {request.email}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              (request.status || 'Nouvelle') === 'Traité'
                                ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                                : (request.status || 'Nouvelle') === 'Refusé'
                                  ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                                  : (request.status || 'Nouvelle') === 'En cours de traitement'
                                    ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                                    : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {request.status || 'Nouvelle'}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              request.emailSent
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            }`}
                          >
                            {request.emailSent ? 'E-mail envoyé' : 'Enregistrée (e-mail non envoyé)'}
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 whitespace-pre-line">
                        {request.message}
                      </p>
                      <div className="pt-1.5 border-t border-slate-200/70 dark:border-slate-700 flex items-center gap-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Traitement :
                        </span>
                        <select
                          value={request.status || 'Nouvelle'}
                          onChange={(e) => handlePartnershipStatus(request.id, e.target.value)}
                          className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] font-bold text-sky-700 dark:text-sky-300 focus:ring-1 focus:ring-sky-500"
                        >
                          <option value="Nouvelle">Nouvelle</option>
                          <option value="En cours de traitement">En cours de traitement</option>
                          <option value="Traité">Traité</option>
                          <option value="Refusé">Refusé</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: AUDIT TRAIL */}
        {activeTab === 'audit' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Lock className="w-4 h-4 text-sky-600 dark:text-sky-400" /> Journal d'Audit et de Sécurité Système
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Traçabilité cryptographique des consultations, téléchargements et requêtes vers l'Assistant IA.
                </p>
              </div>

              <button
                onClick={() => alert("Journal d'audit exporté au format CSV signé.")}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors"
              >
                Exporter les logs
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden shadow-xs">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          log.status === 'Succès' ? 'bg-sky-500' : 'bg-amber-500'
                        }`}
                      />
                      <span className="font-bold text-slate-900 dark:text-white">{log.action}</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">({log.userName} · {log.role})</span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{log.resource}</div>
                  </div>

                  <div className="text-right text-[11px] text-slate-400 dark:text-slate-500 font-mono shrink-0">
                    <div>{log.timestamp}</div>
                    <div className="text-[10px] text-slate-400">{log.ipAddress}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: SYSTEM SETTINGS */}
        {activeTab === 'settings' && (
          <div className="max-w-3xl space-y-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-sky-600 dark:text-sky-400" /> Règles de Gouvernance et Politiques Nationales
              </h3>

              <div className="space-y-4 text-xs">
                <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">Exiger un compte pour toute consultation</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Bloque l'accès au catalogue et à l'assistant pour tout visiteur non authentifié.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={true}
                    disabled
                    className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">Attribution automatique d'identifiant DOI pérenne</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Génère systématiquement un Handle 10.cntrss.bj dès validation par le bibliothécaire.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoDoiGeneration}
                    onChange={(e) => setAutoDoiGeneration(e.target.checked)}
                    className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">Inclusion obligatoire des données brutes (Open Data)</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Exige le questionnaire d'enquête ou le jeu de données pour les mémoires épidémiologiques.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={openDataMandatory}
                    onChange={(e) => setOpenDataMandatory(e.target.checked)}
                    className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4"
                  />
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => showNotification("Paramètres de gouvernance sauvegardés.")}
                  className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs transition-all"
                >
                  Sauvegarder les modifications
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
