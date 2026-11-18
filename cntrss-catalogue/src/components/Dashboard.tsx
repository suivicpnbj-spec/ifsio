import React, { useState } from 'react';
import { CntrssEmblem, CntrssLogo } from './CntrssLogo';
import { DocumentItem, DisciplineType, UserProfile } from '../types';
import { DISCIPLINES, POPULAR_SEARCH_SUGGESTIONS } from '../data/mockDocuments';
import { CatalogView } from './CatalogView';
import { ResearchAssistant } from './ResearchAssistant';
import { ObservatoryAnalytics } from './ObservatoryAnalytics';
import {
  Home,
  BookOpen,
  FolderTree,
  FileCheck2,
  SlidersHorizontal,
  Bookmark,
  History,
  Info,
  Search,
  Bell,
  Moon,
  Sun,
  ChevronDown,
  Eye,
  FileText,
  Building2,
  Users,
  Download,
  Stethoscope,
  HeartHandshake,
  Pill,
  FlaskConical,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  PanelLeftClose,
  PanelLeftOpen,
  HelpCircle,
  Clock,
  Sparkles,
  LogOut,
  BarChart2,
  Menu,
  X,
  ExternalLink
} from 'lucide-react';

export type DashboardSection =
  | 'accueil'
  | 'catalogue'
  | 'assistant'
  | 'depot'
  | 'observatoire'
  | 'favoris'
  | 'historique';

interface DashboardProps {
  documents: DocumentItem[];
  currentUser: UserProfile;
  bookmarks: string[];
  history: string[];
  activeSection: DashboardSection;
  onSectionChange: (section: DashboardSection) => void;
  onSelectDocument: (doc: DocumentItem) => void;
  onToggleBookmark: (docId: string) => void;
  onRequestDocument: (discipline?: string) => void;
  onAddNewDocument: (newDoc: DocumentItem) => void;
  catalogFilters: { query?: string; discipline?: string };
  onUpdateCatalogFilters: (filters: { query?: string; discipline?: string }) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onGoToLanding: () => void;
  onSwitchUser: () => void;
  onLogout: () => void;
  assistantDocContext?: DocumentItem | null;
  onSwitchUserRole?: (role: 'Étudiant' | 'Bibliothécaire' | 'Administrateur') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  documents,
  currentUser,
  bookmarks,
  history,
  activeSection,
  onSectionChange,
  onSelectDocument,
  onToggleBookmark,
  onRequestDocument,
  onAddNewDocument,
  catalogFilters,
  onUpdateCatalogFilters,
  isDarkMode,
  onToggleDarkMode,
  onGoToLanding,
  onSwitchUser,
  onLogout,
  assistantDocContext,
  onSwitchUserRole
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onUpdateCatalogFilters({ query: searchQuery.trim() });
      onSectionChange('catalogue');
    }
  };

  const getDisciplineIcon = (name: string) => {
    switch (name) {
      case 'Médecine':
        return <Stethoscope className="w-5 h-5 text-sky-500" />;
      case 'Soins infirmiers':
        return <HeartHandshake className="w-5 h-5 text-teal-500" />;
      case 'Pharmacie':
        return <Pill className="w-5 h-5 text-emerald-500" />;
      case 'Santé publique':
        return <Users className="w-5 h-5 text-blue-500" />;
      case 'Biologie médicale':
        return <FlaskConical className="w-5 h-5 text-indigo-500" />;
      default:
        return <FolderTree className="w-5 h-5 text-slate-400" />;
    }
  };

  const featuredDocs = documents.filter((d) => d.isFeatured).slice(0, 3);
  const savedDocs = documents.filter((d) => bookmarks.includes(d.id));
  const historyDocs = documents.filter((d) => history.includes(d.id));

  // Compteurs réels : recalculés depuis le catalogue indexé (aucune donnée
  // statique, mise à jour automatique à chaque dépôt validé).
  const catalogInstitutions = new Set(documents.map((doc) => doc.institution)).size;
  const catalogDisciplines = new Set(documents.map((doc) => doc.discipline)).size;
  const catalogDownloads = documents.reduce((acc, doc) => acc + (doc.downloads || 0), 0);

  const navItems = [
    { id: 'accueil' as DashboardSection, label: 'Accueil', icon: Home },
    { id: 'catalogue' as DashboardSection, label: 'Catalogue', icon: BookOpen, count: documents.length },
    { id: 'assistant' as DashboardSection, label: 'Assistant IA Médical', icon: Sparkles, highlight: true },
    { id: 'observatoire' as DashboardSection, label: 'Observatoire & Stats', icon: BarChart2 }
  ];

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col md:flex-row text-slate-800 dark:text-slate-100 antialiased font-sans">
      {/* MOBILE HEADER BAR */}
      <div className="md:hidden bg-[#0a1829] text-white px-4 py-3 flex items-center justify-between border-b border-slate-800 sticky top-0 z-40">
        <div className="flex items-center gap-2.5" onClick={onGoToLanding}>
          <CntrssEmblem className="w-7 h-7" />
          <span className="font-extrabold text-base tracking-tight">CNTRSS</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onSectionChange('assistant')}
            className="p-1.5 rounded-lg bg-teal-900/60 text-teal-300"
            title="Assistant IA"
          >
            <Sparkles className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* LEFT SIDEBAR (Deep navy #0a1829) */}
      <aside
        className={`fixed md:sticky top-0 inset-y-0 left-0 z-40 bg-[#0a1829] text-slate-300 flex flex-col shrink-0 border-r border-slate-800 select-none transition-all duration-300 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${isSidebarCollapsed ? 'w-20' : 'w-64 lg:w-72'}`}
      >
        {/* Brand Lockup & Collapse Action */}
        <div className={`p-4 flex items-center border-b border-slate-800/80 ${isSidebarCollapsed ? 'flex-col gap-2 justify-center py-4' : 'justify-between'}`}>
          {!isSidebarCollapsed ? (
            <>
              <div
                onClick={onGoToLanding}
                className="flex items-center gap-3 cursor-pointer group min-w-0"
              >
                <CntrssEmblem className="w-9 h-9 shrink-0 group-hover:scale-105 transition-transform" />
                <div className="flex flex-col min-w-0">
                  <span className="font-extrabold text-lg text-white tracking-tight truncate">CNTRSS</span>
                  <span className="text-[9px] text-teal-400 font-medium truncate">Bénin · Sciences de Santé</span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* Desktop collapse toggle */}
                <button
                  type="button"
                  onClick={() => setIsSidebarCollapsed(true)}
                  className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/70 transition-colors"
                  title="Replier la barre latérale"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>

                {/* Mobile close menu */}
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="md:hidden p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </>
          ) : (
            <>
              <div
                onClick={onGoToLanding}
                className="cursor-pointer group flex items-center justify-center"
                title="CNTRSS - Retour au portail public"
              >
                <CntrssEmblem className="w-8 h-8 group-hover:scale-105 transition-transform" />
              </div>
              <button
                type="button"
                onClick={() => setIsSidebarCollapsed(false)}
                className="hidden md:flex p-1 rounded-lg text-slate-400 hover:text-teal-300 hover:bg-slate-800/70 transition-colors"
                title="Déplier la barre latérale"
              >
                <PanelLeftOpen className="w-4 h-4 text-teal-400" />
              </button>
            </>
          )}
        </div>

        {/* Sidebar Navigation */}
        <nav className="p-3 space-y-1.5 flex-1 overflow-y-auto text-xs font-medium">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSectionChange(item.id);
                  setIsMobileMenuOpen(false);
                }}
                title={isSidebarCollapsed ? item.label : undefined}
                className={`w-full flex items-center rounded-xl transition-all relative group ${
                  isSidebarCollapsed
                    ? 'justify-center p-3'
                    : 'justify-between px-3.5 py-2.5'
                } ${
                  isActive
                    ? 'bg-teal-600 text-white font-semibold shadow-md'
                    : item.highlight
                    ? 'text-teal-300 hover:bg-teal-950/60 hover:text-white bg-teal-950/20'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : item.highlight ? 'text-teal-400' : ''}`} />
                  {!isSidebarCollapsed && <span>{item.label}</span>}
                </div>
                {!isSidebarCollapsed && item.count && (
                  <span className="text-[10px] font-mono text-slate-400">{item.count}</span>
                )}
                {/* Floating tooltip when collapsed */}
                {isSidebarCollapsed && (
                  <span className="hidden md:block absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-medium rounded-lg shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 border border-slate-800">
                    {item.label} {item.count ? `(${item.count})` : ''}
                  </span>
                )}
              </button>
            );
          })}

          {!isSidebarCollapsed ? (
            <div className="pt-3 pb-1 px-3 text-[10px] uppercase font-bold tracking-wider text-slate-500">
              Espace personnel
            </div>
          ) : (
            <div className="my-2 border-t border-slate-800/80 mx-2" />
          )}

          <button
            onClick={() => {
              onSectionChange('favoris');
              setIsMobileMenuOpen(false);
            }}
            title={isSidebarCollapsed ? 'Mes favoris' : undefined}
            className={`w-full flex items-center rounded-xl transition-all relative group ${
              isSidebarCollapsed
                ? 'justify-center p-3'
                : 'justify-between px-3.5 py-2.5'
            } ${
              activeSection === 'favoris'
                ? 'bg-teal-600 text-white font-semibold'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
              <Bookmark className="w-4 h-4 shrink-0" />
              {!isSidebarCollapsed && <span>Mes favoris</span>}
            </div>
            {!isSidebarCollapsed && bookmarks.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold">
                {bookmarks.length}
              </span>
            )}
            {isSidebarCollapsed && (
              <span className="hidden md:block absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-medium rounded-lg shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 border border-slate-800">
                Mes favoris ({bookmarks.length})
              </span>
            )}
          </button>

          <button
            onClick={() => {
              onSectionChange('historique');
              setIsMobileMenuOpen(false);
            }}
            title={isSidebarCollapsed ? 'Historique' : undefined}
            className={`w-full flex items-center rounded-xl transition-all relative group ${
              isSidebarCollapsed
                ? 'justify-center p-3'
                : 'justify-between px-3.5 py-2.5'
            } ${
              activeSection === 'historique'
                ? 'bg-teal-600 text-white font-semibold'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
              <History className="w-4 h-4 shrink-0" />
              {!isSidebarCollapsed && <span>Historique</span>}
            </div>
            {!isSidebarCollapsed && history.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-md bg-slate-700 text-slate-300 font-mono text-[10px]">
                {history.length}
              </span>
            )}
            {isSidebarCollapsed && (
              <span className="hidden md:block absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-medium rounded-lg shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 border border-slate-800">
                Historique ({history.length})
              </span>
            )}
          </button>

          {!isSidebarCollapsed ? (
            <div className="pt-3 pb-1 px-3 text-[10px] uppercase font-bold tracking-wider text-slate-500">
              Navigation externe
            </div>
          ) : (
            <div className="my-2 border-t border-slate-800/80 mx-2" />
          )}

          <button
            onClick={onGoToLanding}
            title={isSidebarCollapsed ? 'Portail Public (Landing)' : undefined}
            className={`w-full flex items-center rounded-xl text-slate-400 hover:bg-slate-800/60 hover:text-white transition-all relative group ${
              isSidebarCollapsed
                ? 'justify-center p-3'
                : 'gap-3 px-3.5 py-2.5'
            }`}
          >
            <ExternalLink className="w-4 h-4 shrink-0" />
            {!isSidebarCollapsed && <span>Portail Public (Landing)</span>}
            {isSidebarCollapsed && (
              <span className="hidden md:block absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-medium rounded-lg shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 border border-slate-800">
                Portail Public
              </span>
            )}
          </button>
        </nav>

        {/* Sidebar Footer / Collapse Controls */}
        {!isSidebarCollapsed ? (
          <div className="p-4 mx-3 mb-3 rounded-2xl bg-slate-900/70 border border-slate-800/90 text-center relative overflow-hidden">
            <CntrssEmblem className="w-24 h-24 absolute -right-6 -bottom-6 opacity-10 pointer-events-none" />
            <p className="text-[11px] italic font-serif text-teal-300/80 leading-relaxed relative z-10">
              "La connaissance d'aujourd'hui, la santé de demain."
            </p>
            <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Service actif</span>
              </div>
              <button
                type="button"
                onClick={() => setIsSidebarCollapsed(true)}
                className="hidden md:inline-flex items-center gap-1 text-[10px] font-semibold text-teal-400 hover:text-teal-300 transition-colors"
                title="Replier la barre latérale"
              >
                <PanelLeftClose className="w-3.5 h-3.5" />
                <span>Replier</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-3 border-t border-slate-800/80 flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(false)}
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-teal-400 hover:text-white transition-colors"
              title="Déplier la barre latérale"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Service actif" />
          </div>
        )}
      </aside>

      {/* Backdrop for mobile menu */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-950/60 z-30 md:hidden backdrop-blur-xs"
        />
      )}

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 h-16 px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {/* Desktop Sidebar Toggle Button */}
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden md:inline-flex p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={isSidebarCollapsed ? 'Déplier la barre latérale' : 'Replier la barre latérale'}
            >
              {isSidebarCollapsed ? (
                <PanelLeftOpen className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              ) : (
                <PanelLeftClose className="w-5 h-5" />
              )}
            </button>

            <h1 className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
              CNTRSS · Catalogue Numérique des Travaux de Recherches en Sciences de Santé
            </h1>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {activeSection !== 'assistant' && (
              <button
                onClick={() => onSectionChange('assistant')}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span>Assistant IA</span>
              </button>
            )}

            {/* Role Switcher for Evaluators */}
            {onSwitchUserRole && (
              <div className="hidden lg:flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700 text-xs">
                <span className="text-[10px] text-slate-400 font-bold px-1.5">Démo :</span>
                <button
                  type="button"
                  className="px-2 py-0.5 rounded-lg text-[11px] font-bold text-white bg-teal-600 shadow-xs"
                >
                  🎓 Étudiant
                </button>
                <button
                  type="button"
                  onClick={() => onSwitchUserRole('Bibliothécaire')}
                  className="px-2 py-0.5 rounded-lg text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:text-teal-600 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  title="Basculer vers l'interface Bibliothécaire"
                >
                  📚 Bibliothécaire
                </button>
                <button
                  type="button"
                  onClick={() => onSwitchUserRole('Administrateur')}
                  className="px-2 py-0.5 rounded-lg text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:text-teal-600 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  title="Basculer vers l'interface Administrateur"
                >
                  🛡️ Admin
                </button>
              </div>
            )}

            {/* Dark mode */}
            <button
              onClick={onToggleDarkMode}
              className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={isDarkMode ? 'Passer en mode clair' : 'Passer en mode sombre'}
              aria-label="Mode sombre"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-4 text-xs z-50 animate-in fade-in">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 font-semibold text-slate-800 dark:text-white">
                    <span>Notifications récentes</span>
                    <span className="text-[10px] text-teal-600 cursor-pointer">Tout marquer lu</span>
                  </div>
                  <div className="pt-3">
                    <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-5 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                      Aucune notification pour le moment — les dépôts, validations et demandes de
                      documents apparaîtront ici.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <div className={`w-8 h-8 rounded-full ${currentUser.avatarColor || 'bg-teal-600'} text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs`}>
                  {currentUser.avatarLetter}
                </div>
                <div className="hidden sm:flex flex-col text-left leading-tight">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {currentUser.fullName}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    {currentUser.role}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 text-xs z-50">
                  <div className="p-3 border-b border-slate-100 dark:border-slate-800">
                    <p className="font-bold text-slate-900 dark:text-white">{currentUser.fullName}</p>
                    <p className="text-[11px] text-slate-500">{currentUser.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-semibold text-[10px]">
                      {currentUser.role} · {currentUser.institution}
                    </span>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => {
                        onSwitchUser();
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 text-teal-600 font-medium"
                    >
                      <Users className="w-3.5 h-3.5" /> Changer de profil / Inscription
                    </button>
                  </div>
                  <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => {
                        onLogout();
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 text-red-600"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Déconnexion
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* SECTION ROUTER */}
        {activeSection === 'catalogue' ? (
          <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Catalogue National des Travaux de Recherche
                </h2>
                <p className="text-xs text-slate-500">
                  {documents.length} thèses, mémoires et rapports validés au Bénin
                </p>
              </div>

            </div>

            <CatalogView
              documents={documents}
              selectedDiscipline={catalogFilters.discipline}
              initialQuery={catalogFilters.query}
              onSelectDocument={onSelectDocument}
              bookmarks={bookmarks}
              onToggleBookmark={onToggleBookmark}
              onRequestDocument={() => onRequestDocument(catalogFilters.discipline)}
            />
          </div>
        ) : activeSection === 'assistant' ? (
          <div className="p-4 sm:p-6 lg:p-8">
            <ResearchAssistant
              currentUser={currentUser}
              contextDocument={assistantDocContext}
              onSelectDocument={onSelectDocument}
            />
          </div>
        ) : activeSection === 'observatoire' ? (
          <div className="p-4 sm:p-6 lg:p-8">
            <ObservatoryAnalytics />
          </div>
        ) : activeSection === 'favoris' ? (
          <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Mes favoris</h2>
                <p className="text-xs text-slate-500">
                  {savedDocs.length} travaux enregistrés pour consultation ultérieure
                </p>
              </div>
              <button
                onClick={() => onSectionChange('accueil')}
                className="text-xs text-teal-600 dark:text-teal-400 font-medium hover:underline"
              >
                ← Retour à l'accueil
              </button>
            </div>

            {savedDocs.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <Bookmark className="w-8 h-8 text-slate-400 mx-auto" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Aucun document enregistré pour le moment
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Cliquez sur l'icône de signet d'un mémoire ou d'une thèse pour le sauvegarder dans cette collection.
                </p>
                <button
                  onClick={() => onSectionChange('catalogue')}
                  className="px-4 py-2 rounded-xl bg-teal-600 text-white font-semibold text-xs"
                >
                  Explorer le catalogue
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-teal-600">{doc.type}</span>
                        <button
                          onClick={() => onToggleBookmark(doc.id)}
                          className="text-amber-500 p-1"
                          title="Retirer des favoris"
                        >
                          <Bookmark className="w-4 h-4 fill-amber-500" />
                        </button>
                      </div>
                      <h4
                        onClick={() => onSelectDocument(doc)}
                        className="text-sm font-bold text-slate-900 dark:text-white cursor-pointer hover:text-teal-600 line-clamp-2"
                      >
                        {doc.title}
                      </h4>
                      <p className="text-xs text-slate-500">{doc.author} · {doc.institution}</p>
                    </div>
                    <button
                      onClick={() => onSelectDocument(doc)}
                      className="w-full py-2 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-semibold text-xs border border-teal-200 dark:border-teal-800"
                    >
                      Consulter ce document
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeSection === 'historique' ? (
          <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Historique de consultation</h2>
                <p className="text-xs text-slate-500">Documents consultés récemment</p>
              </div>
              <button
                onClick={() => onSectionChange('accueil')}
                className="text-xs text-teal-600 dark:text-teal-400 font-medium hover:underline"
              >
                ← Retour à l'accueil
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
              {historyDocs.length > 0 ? (
                historyDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  >
                    <div>
                      <span className="text-[10px] font-bold text-teal-600">{doc.type} · {doc.discipline}</span>
                      <h4
                        onClick={() => onSelectDocument(doc)}
                        className="text-xs font-bold text-slate-900 dark:text-white cursor-pointer hover:text-teal-600"
                      >
                        {doc.title}
                      </h4>
                      <span className="text-[11px] text-slate-400">{doc.author} ({doc.year})</span>
                    </div>
                    <button
                      onClick={() => onSelectDocument(doc)}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300"
                    >
                      Revoir
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-slate-500">
                  Votre historique apparaîtra dès que vous consulterez des documents du catalogue.
                </div>
              )}
            </div>
          </div>
        ) : (
          /* DEFAULT DASHBOARD ACCUEIL (MATCHING USER SCREENSHOT 2) */
          <div className="p-4 sm:p-6 lg:p-8 space-y-8">
            {/* HERO BANNER */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#091f38] via-[#0c2e52] to-[#0f3d6c] text-white p-6 sm:p-8 lg:p-10 shadow-xl border border-slate-800">
              <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay">
                <img
                  src="/src/assets/images/cntrss_hero_desk_1791922681478.jpg"
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-8 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-400/30 text-xs font-semibold">
                      Session : {currentUser.fullName}
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                    Bienvenue sur le CNTRSS
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-200 max-w-xl leading-relaxed">
                    Accédez facilement aux mémoires, rapports de stage, thèses et autres travaux de recherche en sciences de santé.
                  </p>

                  <form onSubmit={handleSearchSubmit} className="pt-2">
                    <div className="flex items-center bg-white rounded-2xl p-1.5 shadow-lg focus-within:ring-2 focus-within:ring-teal-400">
                      <Search className="w-4 h-4 text-slate-400 ml-3 shrink-0" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Rechercher un document, un auteur, un sujet, une filière..."
                        className="w-full px-3 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shrink-0 transition-colors shadow-sm"
                      >
                        Rechercher
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 text-xs pt-3 text-slate-300">
                      <span className="text-[11px] font-medium text-slate-300">
                        Suggestions populaires :
                      </span>
                      {POPULAR_SEARCH_SUGGESTIONS.slice(0, 5).map((sug, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            onUpdateCatalogFilters({ query: sug });
                            onSectionChange('catalogue');
                          }}
                          className="px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-white text-[11px] font-medium transition-colors"
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  </form>
                </div>

                {/* Right stats strip */}
                <div className="lg:col-span-4 grid grid-cols-2 gap-3">
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 space-y-1">
                    <div className="flex items-center gap-2 text-teal-300">
                      <FileText className="w-4 h-4" />
                      <span className="text-xl sm:text-2xl font-bold font-mono tabular-nums">
                        {documents.length.toLocaleString('fr-FR')}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300">Documents disponibles</div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 space-y-1">
                    <div className="flex items-center gap-2 text-teal-300">
                      <Building2 className="w-4 h-4" />
                      <span className="text-xl sm:text-2xl font-bold font-mono tabular-nums">
                        {catalogInstitutions}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300">Établissements partenaires</div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 space-y-1">
                    <div className="flex items-center gap-2 text-teal-300">
                      <BookOpen className="w-4 h-4" />
                      <span className="text-xl sm:text-2xl font-bold font-mono tabular-nums">
                        {catalogDisciplines}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300">Filières couvertes</div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 space-y-1">
                    <div className="flex items-center gap-2 text-teal-300">
                      <Download className="w-4 h-4" />
                      <span className="text-xl sm:text-2xl font-bold font-mono tabular-nums">
                        {catalogDownloads.toLocaleString('fr-FR')}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300">Téléchargements</div>
                  </div>
                </div>
              </div>
            </div>

            {/* FILIÈRES CARDS */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Explorer par filière
                </h3>
                <button
                  onClick={() => onSectionChange('catalogue')}
                  className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
                >
                  Voir toutes les filières <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {DISCIPLINES.slice(0, 5).map((d) => (
                  <div
                    key={d.id}
                    onClick={() => {
                      onUpdateCatalogFilters({ discipline: d.id });
                      onSectionChange('catalogue');
                    }}
                    className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-teal-500/50 hover:shadow-sm cursor-pointer transition-all flex flex-col justify-between group"
                  >
                    <div className="space-y-2">
                      <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center group-hover:scale-105 transition-transform">
                        {getDisciplineIcon(d.id)}
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-teal-600 transition-colors">
                        {d.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 font-mono tabular-nums">
                        {documents.filter((doc) => doc.discipline === d.id).length.toLocaleString('fr-FR')} documents
                      </p>
                    </div>
                    <div className="pt-2 text-right">
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600 inline" />
                    </div>
                  </div>
                ))}

                <div
                  onClick={() => onSectionChange('catalogue')}
                  className="p-4 bg-teal-50/50 dark:bg-teal-950/30 rounded-2xl border border-dashed border-teal-300 dark:border-teal-800 hover:border-teal-500 cursor-pointer transition-all flex flex-col justify-center items-center text-center group"
                >
                  <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center text-teal-700 dark:text-teal-300 mb-2 group-hover:scale-105 transition-transform">
                    <FolderTree className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-teal-800 dark:text-teal-200">
                    Voir toutes
                  </h4>
                  <p className="text-[11px] text-teal-600 dark:text-teal-400">les filières</p>
                </div>
              </div>
            </div>

            {/* TWO-COLUMN LAYOUT */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column (8 cols): Featured docs + request banner */}
              <div className="lg:col-span-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bookmark className="w-4 h-4 text-teal-600" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Documents en vedette
                    </h3>
                  </div>
                  <button
                    onClick={() => onSectionChange('catalogue')}
                    className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
                  >
                    Voir tout <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {featuredDocs.length === 0 && (
                    <p className="text-xs text-slate-400 py-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                      Aucun travail mis en avant pour le moment : les travaux validés apparaîtront ici.
                    </p>
                  )}
                  {featuredDocs.map((doc) => {
                    const isBookmarked = bookmarks.includes(doc.id);
                    return (
                      <div
                        key={doc.id}
                        className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 hover:border-teal-500/50 hover:shadow-sm transition-all flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between group"
                      >
                        <div className="w-16 h-20 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1.5 flex flex-col justify-between shrink-0 shadow-2xs group-hover:scale-102 transition-transform">
                          <div className="text-[8px] font-bold text-center text-slate-500 leading-tight">
                            CNTRSS
                          </div>
                          <div className="w-6 h-6 mx-auto rounded-full bg-teal-100 dark:bg-teal-950 flex items-center justify-center text-teal-700 font-bold text-[9px]">
                            {doc.discipline.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="text-[8px] font-mono text-center text-slate-400">
                            {doc.year}
                          </div>
                        </div>

                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                            <span className="font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded">
                              {doc.type}
                            </span>
                            <span className="text-slate-400">·</span>
                            <span className="text-slate-600 dark:text-slate-400">{doc.discipline}</span>
                            <span className="text-slate-400">·</span>
                            <span className="font-mono text-slate-500">{doc.year}</span>
                          </div>

                          <h4
                            onClick={() => onSelectDocument(doc)}
                            className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 cursor-pointer transition-colors leading-snug line-clamp-2"
                          >
                            {doc.title}
                          </h4>

                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                              {doc.author}
                            </span>
                            <span>·</span>
                            <span className="truncate">{doc.institution}</span>
                          </div>

                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {doc.keywords.slice(0, 3).map((kw, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-400"
                              >
                                {kw}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <button
                            onClick={() => onSelectDocument(doc)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-600 text-teal-700 dark:text-teal-300 hover:text-white dark:hover:text-white font-semibold text-xs transition-colors border border-teal-200 dark:border-teal-800"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Consulter</span>
                          </button>

                          <button
                            onClick={() => onToggleBookmark(doc.id)}
                            className="p-2 text-slate-400 hover:text-amber-500 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title={isBookmarked ? 'Retirer' : 'Enregistrer'}
                          >
                            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-500 text-amber-500' : ''}`} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Assistance banner */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-teal-50 to-sky-50 dark:from-teal-950/40 dark:to-sky-950/40 border border-teal-200 dark:border-teal-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <HelpCircle className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        Vous ne trouvez pas un document ?
                      </h4>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300">
                        Contactez notre service documentaire ou utilisez notre formulaire de demande rapide.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => onRequestDocument()}
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shrink-0 shadow-sm transition-colors"
                  >
                    Faire une demande
                  </button>
                </div>
              </div>

              {/* Right Column (4 cols): Accès rapide & Activité récente */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Accès rapide</h3>
                    <p className="text-xs text-slate-500">Trouvez plus facilement ce que vous cherchez</p>
                  </div>

                  <div className="space-y-2">
                    <div
                      onClick={() => onSectionChange('catalogue')}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-teal-50 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 cursor-pointer transition-colors flex items-center justify-between group"
                    >
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-teal-600">
                          Recherche avancée
                        </div>
                        <div className="text-[11px] text-slate-500">Affinez vos critères de recherche</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors" />
                    </div>

                    <div
                      onClick={() => onSectionChange('assistant')}
                      className="p-3 rounded-xl bg-teal-50/50 dark:bg-teal-950/40 hover:bg-teal-100/50 border border-teal-200 dark:border-teal-800 cursor-pointer transition-colors flex items-center justify-between group"
                    >
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-teal-800 dark:text-teal-200 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                          Assistant IA Médical
                        </div>
                        <div className="text-[11px] text-slate-500">Aide au cadrage et à la rédaction</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-teal-600 transition-colors" />
                    </div>

                    <div
                      onClick={() => onSectionChange('observatoire')}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-teal-50 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 cursor-pointer transition-colors flex items-center justify-between group"
                    >
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-teal-600">
                          Observatoire & Tendances
                        </div>
                        <div className="text-[11px] text-slate-500">Statistiques nationales de santé</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors" />
                    </div>
                  </div>
                </div>

                {/* Activité récente */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-teal-600" />
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        Activité récente
                      </h3>
                    </div>
                    <button
                      onClick={() => onSectionChange('catalogue')}
                      className="text-xs text-teal-600 dark:text-teal-400 hover:underline"
                    >
                      Voir tout →
                    </button>
                  </div>

                  <div className="space-y-3 divide-y divide-slate-100 dark:divide-slate-800">
                    <p className="text-xs text-slate-500 dark:text-slate-400 py-4 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                      Aucune activité récente — les dépôts, validations et nouvelles parutions apparaîtront ici.
                    </p>

                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p className="font-medium text-[11px]">
            CNTRSS · Catalogue Numérique des Travaux de Recherches en Sciences de Santé
          </p>

          <div className="flex items-center gap-4 text-[11px]">
            <button onClick={() => onRequestDocument()} className="hover:text-teal-600 transition-colors">
              Aide
            </button>
            <span>·</span>
            <button onClick={() => onRequestDocument()} className="hover:text-teal-600 transition-colors">
              Contact documentaire
            </button>
            <span>·</span>
            <button onClick={() => onRequestDocument()} className="hover:text-teal-600 transition-colors">
              Mentions légales
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
};
