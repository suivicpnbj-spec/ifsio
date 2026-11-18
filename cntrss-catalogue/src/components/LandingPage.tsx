import React, { useEffect, useState } from 'react';
import { CntrssLogo } from './CntrssLogo';
import { DocumentItem, DisciplineType, UserProfile } from '../types';
import { DISCIPLINES, POPULAR_SEARCH_SUGGESTIONS } from '../data/mockDocuments';
import { fetchJson, ObservatoryApiResponse } from '../lib/backendApi';
import {
  Search,
  Home,
  BarChart3,
  ShieldCheck,
  BookOpen,
  ChevronRight,
  ArrowRight,
  Users,
  FileCheck,
  Check,
  Stethoscope,
  HeartHandshake,
  Pill,
  FlaskConical,
  Apple,
  Smile,
  Activity,
  Ear,
  Eye,
  Layers,
  LogIn,
  UserPlus,
  Sparkles,
  Network,
  Cloud,
  ExternalLink
} from 'lucide-react';

function campusUrl(port: number, path = ''): string {
  const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  return `http://${host}:${port}${path}`;
}

interface LandingPageProps {
  documents: DocumentItem[];
  currentUser: UserProfile | null;
  onOpenDocument: (doc: DocumentItem) => void;
  onExploreCatalog: (filter?: { query?: string; discipline?: string }) => void;
  onGoToDashboard: () => void;
  onOpenAuth: (mode: 'login' | 'register', notice?: string) => void;
  onOpenAssistant: () => void;
  onOpenAnalytics: () => void;
  onRequestPartner: () => void;
  onRequestDocument: () => void;
  onQuickLoginAsRole?: (role: 'Étudiant' | 'Bibliothécaire' | 'Administrateur') => void;
  onLogout?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  documents,
  currentUser,
  onOpenDocument,
  onExploreCatalog,
  onGoToDashboard,
  onOpenAuth,
  onOpenAssistant,
  onOpenAnalytics,
  onRequestPartner,
  onRequestDocument,
  onQuickLoginAsRole,
  onLogout
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Indicateurs réels : aucun chiffre n'est affiché depuis des données figées.
  // Avec un catalogue vide, tous les compteurs s'affichent à zéro et montent
  // automatiquement dès que les écoles et facultés déposent leurs travaux.
  const [indicators, setIndicators] = useState({
    documents: 0,
    downloads: 0,
    users: 0,
    institutions: 0
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [health, observatory] = await Promise.all([
        fetchJson<{ documentCount: number; accounts: number }>('/api/health', undefined, 5000).catch(
          () => null
        ),
        fetchJson<ObservatoryApiResponse>('/api/observatory', undefined, 5000).catch(() => null)
      ]);
      if (cancelled) return;

      setIndicators({
        documents: health?.documentCount ?? 0,
        users: health?.accounts ?? 0,
        downloads: observatory?.totalDownloads ?? 0,
        institutions: observatory ? Object.keys(observatory.byInstitution || {}).length : 0
      });
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleProtectedAction = (action: () => void, notice: string) => {
    if (!currentUser) {
      onOpenAuth('login', notice);
      return;
    }
    action();
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleProtectedAction(
      () => onExploreCatalog({ query: searchQuery }),
      'La recherche dans le catalogue numérique complet nécessite une authentification.'
    );
  };

  const getDisciplineIcon = (name: string) => {
    switch (name) {
      case 'Médecine':
        return <Stethoscope className="w-4 h-4 text-blue-800 dark:text-blue-300" />;
      case 'Soins infirmiers':
        return <HeartHandshake className="w-4 h-4 text-blue-800 dark:text-blue-300" />;
      case 'Pharmacie':
        return <Pill className="w-4 h-4 text-blue-800 dark:text-blue-300" />;
      case 'Santé publique':
        return <Users className="w-4 h-4 text-blue-800 dark:text-blue-300" />;
      case 'Biologie médicale':
        return <FlaskConical className="w-4 h-4 text-blue-800 dark:text-blue-300" />;
      case 'Nutrition':
        return <Apple className="w-4 h-4 text-blue-800 dark:text-blue-300" />;
      case 'Odontostomatologie':
        return <Smile className="w-4 h-4 text-blue-800 dark:text-blue-300" />;
      case 'Kinésithérapie':
        return <Activity className="w-4 h-4 text-blue-800 dark:text-blue-300" />;
      case 'ORL':
        return <Ear className="w-4 h-4 text-blue-800 dark:text-blue-300" />;
      case 'Ophtalmologie':
        return <Eye className="w-4 h-4 text-blue-800 dark:text-blue-300" />;
      default:
        return <Layers className="w-4 h-4 text-blue-800 dark:text-blue-300" />;
    }
  };

  const featuredDocs = documents.slice(0, 4);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col">
      {/* Top Navigation — sobre, scientifique */}
      <header className="landing-topbar sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
          <CntrssLogo size="md" textColor="text-white" subtitleColor="text-blue-100/75" />

          <nav className="hidden lg:flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="px-3 py-2 rounded-xl bg-white/10 text-white flex items-center gap-1.5 transition-colors"
              title="Retour en haut de page"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Accueil</span>
            </button>
            <button
              onClick={() =>
                handleProtectedAction(
                  () => onExploreCatalog(),
                  "L'accès au catalogue numérique intégral nécessite un compte certifié."
                )
              }
              className="px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 transition-colors"
              title="Explorer le catalogue national"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Catalogue</span>
            </button>
            <button
              onClick={() =>
                handleProtectedAction(
                  onOpenAssistant,
                  "L'Assistant IA de méthodologie médicale et scientifique nécessite une authentification."
                )
              }
              className="px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1.5 transition-colors"
              title="Assistant IA de recherche"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Assistant IA</span>
            </button>
            <button
              onClick={() => {
                const el = document.getElementById('filieres-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 transition-colors"
              title="Filières couvertes"
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Filières</span>
            </button>
            <button
              onClick={() =>
                handleProtectedAction(
                  onOpenAnalytics,
                  "L'accès aux données de l'observatoire nécessite un compte."
                )
              }
              className="px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 transition-colors"
              title="Observatoire de la recherche"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Observatoire</span>
            </button>
            <button
              onClick={() => {
                const el = document.getElementById('mission-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 transition-colors"
              title="Mission du CNTRSS"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>À propos</span>
            </button>
            <a
              href={campusUrl(8081, '/')}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-xl text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/40 flex items-center gap-1.5 transition-colors border border-teal-200 dark:border-teal-800/60 font-semibold"
              title="Portail académique IFSIO"
            >
              <span>Campus IFSIO</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            {!currentUser ? (
              <>
                {/* 1-Click Role Switcher — visible mais discret, pour les évaluateurs */}
                {onQuickLoginAsRole && (
                  <div className="hidden xl:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-[11px] font-semibold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                    <span className="px-1 text-[10px] text-slate-400 font-bold">DÉMO</span>
                    <button
                      type="button"
                      onClick={() => onQuickLoginAsRole('Étudiant')}
                      className="px-2 py-0.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 hover:text-blue-800 transition-colors"
                      title="Tester l'interface Étudiant / Chercheur"
                    >
                      Étudiant
                    </button>
                    <button
                      type="button"
                      onClick={() => onQuickLoginAsRole('Bibliothécaire')}
                      className="px-2 py-0.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 hover:text-blue-800 transition-colors"
                      title="Tester l'interface Bibliothécaire"
                    >
                      Bibliothécaire
                    </button>
                    <button
                      type="button"
                      onClick={() => onQuickLoginAsRole('Administrateur')}
                      className="px-2 py-0.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 hover:text-blue-800 transition-colors"
                      title="Tester l'interface Administrateur"
                    >
                      Admin
                    </button>
                  </div>
                )}

                <button
                  onClick={() => onOpenAuth('login')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Connexion</span>
                </button>

                <button
                  onClick={() => onOpenAuth('register')}
                  className="cntrss-header-cta inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-900 dark:bg-blue-700 dark:text-white hover:bg-blue-800 dark:hover:bg-blue-600 transition-all shadow-sm"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Inscription</span>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={onGoToDashboard}
                  className="cntrss-header-cta inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-900 dark:bg-blue-700 dark:text-white hover:bg-blue-800 dark:hover:bg-blue-600 shadow-sm transition-all"
                >
                  <span>
                    {currentUser.role === 'Bibliothécaire'
                      ? 'Console Bibliothécaire'
                      : currentUser.role === 'Administrateur'
                      ? 'Centre Admin'
                      : 'Mon espace'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs font-semibold"
                    title="Déconnexion"
                  >
                    Déconnexion
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero — bloc fort scientifique */}
      <section className="cntrss-hero">
        <div aria-hidden="true" className="cntrss-hero-pattern" />
        <div className="cntrss-hero-grid">
            {/* Left Column : identité, proposition, recherche */}
            <div className="cntrss-hero-copy">
              <div className="cntrss-eyebrow">
                <span className="cntrss-eyebrow-mark"><ShieldCheck className="w-4 h-4" /></span>
                <span>Plateforme nationale</span><i /><span>Bénin</span>
              </div>

              <div className="cntrss-kicker">CATALOGUE NUMÉRIQUE · SCIENCES DE LA SANTÉ</div>
              <h1>
                La recherche en santé.<br/><span>Au service de demain.</span>
              </h1>

              <p>
                Retrouvez les mémoires, thèses et travaux scientifiques produits au Bénin. Un espace commun pour préserver, consulter et faire connaître la recherche en sciences de la santé.
              </p>

              {/* Research form */}
              <form onSubmit={handleSearchSubmit} className="cntrss-search-form">
                <div className="cntrss-search-box">
                  <Search className="w-4 h-4" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher un document, un auteur, un sujet, une filière…"
                    className="cntrss-search-input"
                  />
                  <button
                    type="submit"
                    className="cntrss-search-button"
                  >
                    <span>Rechercher</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="cntrss-search-suggestions">
                  <span>Explorer par sujet</span>
                  {POPULAR_SEARCH_SUGGESTIONS.slice(0, 6).map((sug, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => onExploreCatalog({ query: sug })}
                      className="cntrss-suggestion"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </form>

              {/* Research assistant teaser — factuel */}
              <div className="cntrss-assistant-link">
                <div>
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <span>Besoin d'un appui méthodologique pour vos travaux ?</span>
                <button
                  onClick={() =>
                    handleProtectedAction(
                      onOpenAssistant,
                      "L'Assistant IA de méthodologie médicale et scientifique nécessite une authentification."
                    )
                  }
                  className="cntrss-assistant-action"
                >
                  L'essayer
                </button>
              </div>
            </div>

            {/* Right Column : visuel documentaire sobre */}
            <div className="cntrss-hero-visual" aria-label="Aperçu d'une fiche du catalogue">
              <div className="cntrss-visual-glow" />
              <div className="cntrss-document-card">
                <div className="cntrss-document-top">
                  <div className="cntrss-document-brand"><span><BookOpen className="w-4 h-4" /></span><div><b>CATALOGUE CNTRSS</b><small>Sciences de la santé · Bénin</small></div></div>
                  <span className="cntrss-document-status"><i/> RÉFÉRENTIEL</span>
                </div>
                <div className="cntrss-document-title"><div><small>NOTICE DOCUMENTAIRE</small><h2>Travaux de recherche</h2></div><div className="cntrss-document-icon"><FileCheck className="w-5 h-5" /></div></div>
                <div className="cntrss-document-head"><span>COLLECTION</span><span>DISCIPLINE</span><span>ACCÈS</span></div>
                <div className="cntrss-document-row"><span><i/> Mémoires</span><span>Médecine</span><b>Catalogue</b></div>
                <div className="cntrss-document-row"><span><i/> Thèses</span><span>Santé publique</span><b>Catalogue</b></div>
                <div className="cntrss-document-row"><span><i/> Articles</span><span>Sciences infirmières</span><b>Catalogue</b></div>
                <div className="cntrss-document-bottom"><span><ShieldCheck className="w-3.5 h-3.5"/> Références scientifiques centralisées</span><span><Search className="w-3.5 h-3.5"/> Recherche par discipline</span></div>
                <div className="cntrss-document-note">Un portail commun pour les productions scientifiques en santé.</div>
              </div>
              <div className="cntrss-floating-tag"><span><Check className="w-3.5 h-3.5"/></span><div><b>Accès structuré</b><small>Recherche · Santé · Bénin</small></div>
              </div>
            </div>
          </div>
        <div className="cntrss-hero-bottom"><span>LA RECHERCHE EN SANTÉ, ACCESSIBLE</span><i/><span>MÉMOIRES <i/> THÈSES <i/> RECHERCHE EN SANTÉ</span></div>
      </section>

      {/* Assistant IA — bandeau factuel */}
      <section className="py-6 bg-blue-50/80 dark:bg-slate-900 border-b border-blue-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-800 dark:text-blue-200 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-blue-950 dark:text-white">
                  Assistant IA de recherche médicale — intégré
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Aide méthodologique : cadrage de thème, calculs d'échantillon (Schwartz/Daniel), protocoles PICO/PECO,
                  indexation MeSH, plan IMRAD et rédaction selon les normes académiques et FSS.
                </p>
              </div>
            </div>

            <button
              onClick={() =>
                handleProtectedAction(
                  onOpenAssistant,
                  "L'Assistant IA de recherche médicale nécessite une authentification académique."
                )
              }
              className="shrink-0 px-5 py-2 rounded-xl bg-blue-900 dark:bg-blue-700 hover:bg-blue-800 dark:hover:bg-blue-600 text-white font-semibold text-xs transition-colors shadow-sm flex items-center gap-2"
            >
              <span>Consulter l'Assistant IA</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Indicateurs — style rapport/scientifique */}
      <section className="py-8 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="border-l-2 border-blue-200 dark:border-blue-800 px-4 py-2">
              <p className="text-3xl font-bold text-blue-950 dark:text-blue-100 font-mono tabular-nums">
                {indicators.documents.toLocaleString('fr-FR')}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Documents indexés
              </p>
            </div>
            <div className="border-l-2 border-blue-200 dark:border-blue-800 px-4 py-2">
              <p className="text-3xl font-bold text-blue-950 dark:text-blue-100 font-mono tabular-nums">
                {DISCIPLINES.length}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Filières scientifiques
              </p>
            </div>
            <div className="border-l-2 border-blue-200 dark:border-blue-800 px-4 py-2">
              <p className="text-3xl font-bold text-blue-950 dark:text-blue-100 font-mono tabular-nums">
                {indicators.institutions}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Établissements partenaires
              </p>
            </div>
            <div className="border-l-2 border-blue-200 dark:border-blue-800 px-4 py-2">
              <p className="text-3xl font-bold text-blue-950 dark:text-blue-100 font-mono tabular-nums">
                {indicators.downloads.toLocaleString('fr-FR')}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Téléchargements
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Filières — grille sobre */}
      <section id="filieres-section" className="py-16 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Filières couvertes
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                Sciences de la santé au Bénin
              </h2>
            </div>
            <button
              onClick={() =>
                handleProtectedAction(
                  () => onExploreCatalog(),
                  "L'accès au catalogue complet nécessite un compte certifié."
                )
              }
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Voir tout le catalogue <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {DISCIPLINES.map((d) => (
              <div
                key={d.id}
                onClick={() =>
                  handleProtectedAction(
                    () => onExploreCatalog({ discipline: d.id }),
                    `L'accès aux travaux de ${d.title} nécessite une authentification.`
                  )
                }
                className="group p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-800 hover:shadow-md hover:shadow-blue-950/5 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 shadow-2xs flex items-center justify-center group-hover:scale-105 transition-transform">
                    {getDisciplineIcon(d.id)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-800 dark:group-hover:text-blue-300 transition-colors line-clamp-1">
                      {d.title}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                      {documents.filter((doc) => doc.discipline === d.id).length.toLocaleString('fr-FR')} documents
                    </p>
                  </div>
                </div>
                <div className="pt-2 text-right">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all inline" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Travaux scientifiques en vedette — cards documentaires */}
      <section className="py-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Travaux récents
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                Documents indexés
              </h2>
            </div>
            <button
              onClick={() =>
                handleProtectedAction(
                  () => onExploreCatalog(),
                  "L'accès au catalogue complet nécessite un compte certifié."
                )
              }
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Voir tout le catalogue <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featuredDocs.length === 0 && (
              <p className="sm:col-span-2 lg:col-span-4 text-xs text-slate-400 py-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                Aucun document publié pour le moment — le catalogue national est en cours d'alimentation par les écoles
                et facultés partenaires.
              </p>
            )}
            {featuredDocs.map((doc) => (
              <div
                key={doc.id}
                className="bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between overflow-hidden group"
              >
                <div className="p-4 space-y-3">
                  <div className="w-full h-32 rounded-lg bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 p-3 flex flex-col justify-between relative overflow-hidden group-hover:bg-slate-100 transition-colors">
                    <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono">
                      <span>RÉPUBLIQUE DU BÉNIN</span>
                      <span className="font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60 px-1.5 py-0.5 rounded">
                        PDF
                      </span>
                    </div>

                    <div className="text-center my-auto px-1">
                      <p className="text-[10px] font-bold text-slate-800 dark:text-slate-200 line-clamp-2">
                        {doc.title}
                      </p>
                      <p className="text-[8px] text-slate-500 mt-0.5">{doc.author}</p>
                    </div>

                    <div className="flex items-center justify-between text-[8px] text-slate-400">
                      <span>{doc.institution}</span>
                      <span>{doc.year}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <span className="font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                        {doc.type}
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-500 dark:text-slate-400">{doc.discipline}</span>
                    </div>

                    <h3
                      onClick={() =>
                        handleProtectedAction(
                          () => onOpenDocument(doc),
                          "Veuillez vous connecter pour consulter ce travail de recherche."
                        )
                      }
                      className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-slate-700 dark:group-hover:text-slate-200 cursor-pointer transition-colors line-clamp-2"
                    >
                      {doc.title}
                    </h3>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                      Auteur : <strong className="text-slate-700 dark:text-slate-200">{doc.author}</strong>
                    </p>
                  </div>
                </div>

                <div className="px-4 py-3 bg-white dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-400">
                    {doc.year} · {doc.pages}p
                  </span>
                  <button
                    onClick={() =>
                      handleProtectedAction(
                        () => onOpenDocument(doc),
                        "Veuillez vous connecter pour consulter ce travail de recherche."
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700 shadow-2xs"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    Consulter
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Notre mission — sobre */}
      <section id="mission-section" className="py-16 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-5 relative">
              <div className="rounded-2xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800 aspect-4/3">
                <img
                  src="/src/assets/images/cntrss_team_research_1791922681921.jpg"
                  alt="Étudiants et chercheurs en sciences de santé au Bénin"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            <div className="lg:col-span-7 space-y-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                CNTRSS
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                Notre mission
              </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                Rendre accessibles, exploitables et visibles les travaux de recherche en sciences de santé
                produits au Bénin, pour soutenir la formation médicale, l'épidémiologie locale et les décisions
                en santé publique.
              </p>

              <div className="grid grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 mb-1">
                    <FileCheck className="w-3.5 h-3.5" />
                    <span className="text-[9px] font-semibold uppercase tracking-wider">Travaux</span>
                  </div>
                  <p className="text-xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                    {indicators.documents.toLocaleString('fr-FR')}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">documents indexés</p>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 mb-1">
                    <Network className="w-3.5 h-3.5" />
                    <span className="text-[9px] font-semibold uppercase tracking-wider">Partenaires</span>
                  </div>
                  <p className="text-xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                    {indicators.institutions}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">établissements</p>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 mb-1">
                    <Users className="w-3.5 h-3.5" />
                    <span className="text-[9px] font-semibold uppercase tracking-wider">Lecteurs</span>
                  </div>
                  <p className="text-xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                    {indicators.users.toLocaleString('fr-FR')}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">utilisateurs</p>
                </div>
              </div>

              <div className="pt-2 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Partenaires académiques
                </p>
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2 text-xs">
                    <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[9px] font-bold text-slate-600 dark:text-slate-300">
                      IRSP
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">IRSP Ouidah</span>
                  </div>

                  <div className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2 text-xs">
                    <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[9px] font-bold text-slate-600 dark:text-slate-300">
                      UP
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Université de Parakou</span>
                  </div>

                  <div className="px-3 py-2 rounded-xl border border-teal-200 dark:border-teal-800/80 bg-teal-50/50 dark:bg-teal-950/30 flex items-center gap-2 text-xs">
                    <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[9px] font-bold">
                      IF
                    </span>
                    <span className="font-semibold text-teal-900 dark:text-teal-200">IFSIO Parakou</span>
                  </div>

                  <button
                    onClick={onRequestPartner}
                    className="px-3 py-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-slate-400 bg-transparent flex items-center gap-2 cursor-pointer transition-colors text-xs text-slate-600 dark:text-slate-300"
                  >
                    + Votre établissement
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bannière institutionnelle — sobre */}
      <section className="cntrss-partner-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="cntrss-partner-card p-8 sm:p-10 rounded-2xl bg-blue-950 border border-blue-900 flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg">
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-xl bg-blue-900 flex items-center justify-center text-blue-200 shrink-0 border border-blue-800">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold">
                  Vous représentez une institution ?
                </h3>
                <p className="text-xs sm:text-sm text-blue-100/75 mt-0.5 max-w-md">
                  Intégrez le catalogue et valorisez la production scientifique de votre établissement.
                </p>
              </div>
            </div>

            <button
              onClick={onRequestPartner}
              className="px-5 py-2.5 rounded-xl bg-white hover:bg-blue-50 text-blue-950 font-semibold text-xs transition-colors shadow-lg shrink-0"
            >
              Devenir partenaire
            </button>
          </div>
        </div>
      </section>

      {/* Footer — sobre */}
      <footer className="mt-auto bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-10 text-slate-500 dark:text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <CntrssLogo size="md" />

            <div className="flex flex-wrap items-center gap-5 text-xs font-medium">
              <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-slate-700 dark:hover:text-slate-200">
                Accueil
              </button>
              <button onClick={() => onExploreCatalog()} className="hover:text-slate-700 dark:hover:text-slate-200">
                Catalogue
              </button>
              <button onClick={() => onOpenAssistant()} className="hover:text-slate-700 dark:hover:text-slate-200">
                Assistant IA
              </button>
              <button onClick={() => onOpenAnalytics()} className="hover:text-slate-700 dark:hover:text-slate-200">
                Observatoire
              </button>
              <button onClick={onRequestDocument} className="hover:text-slate-700 dark:hover:text-slate-200">
                Faire une demande
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer">
                <Cloud className="w-4 h-4" />
              </span>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px]">
            <p>© 2025-2026 CNTRSS · Centre National des Travaux de Recherches en Sciences de Santé.</p>
            <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400">
              <span className="font-medium">Campus Numérique IFSIO :</span>
              <a href={campusUrl(8081, '/')} target="_blank" rel="noopener noreferrer" className="hover:text-teal-600 dark:hover:text-teal-400 underline">
                Site Vitrine (Port 8081)
              </a>
              <a href={campusUrl(5174, '/')} target="_blank" rel="noopener noreferrer" className="hover:text-teal-600 dark:hover:text-teal-400 underline">
                eRésultats (Port 5174)
              </a>
              <a href={campusUrl(5173, '/')} target="_blank" rel="noopener noreferrer" className="hover:text-teal-600 dark:hover:text-teal-400 underline">
                Mes Actes (Port 5173)
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
