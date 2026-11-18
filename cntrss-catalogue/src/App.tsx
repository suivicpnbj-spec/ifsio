import React, { useState, useEffect, useRef } from 'react';
import { DocumentItem, UserProfile } from './types';
import { LandingPage } from './components/LandingPage';
import { Dashboard, DashboardSection } from './components/Dashboard';
import { LibrarianDashboard } from './components/LibrarianDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { DocumentModal } from './components/DocumentModal';
import { RequestDocumentModal } from './components/RequestDocumentModal';
import { AuthModal } from './components/AuthModal';
import {
  AuthConfig,
  fetchAuthConfig,
  fetchSession,
  loginAsDemoAccount,
  logout
} from './lib/authClient';
import { UNAUTHORIZED_EVENT, fetchJson } from './lib/backendApi';
import { PartnerFormModal } from './components/PartnerFormModal';

/** Catalogue réel servi par l'API : aucune donnée statique n'est affichée. */
async function fetchCatalogue(): Promise<DocumentItem[]> {
  try {
    const data = await fetchJson<{ items: DocumentItem[] }>('/api/catalog?limit=100');
    return data.items || [];
  } catch {
    return [];
  }
}

export default function App() {
  // Navigation State
  const [currentView, setCurrentView] = useState<'landing' | 'workspace'>('landing');
  const [workspaceSection, setWorkspaceSection] = useState<DashboardSection>('accueil');

  // Documents & User State: Unauthenticated by default to enforce account requirement
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'forgot' | 'reset'>('login');
  const [authResetToken, setAuthResetToken] = useState('');
  const [authRestrictedNotice, setAuthRestrictedNotice] = useState<string>('');
  const [authConfig, setAuthConfig] = useState<AuthConfig>({ demoLoginEnabled: false, demoAccounts: [] });
  const hasSessionRef = useRef(false);

  // Modals & Filter State
  const [selectedDocument, setSelectedDocument] = useState<DocumentItem | null>(null);
  const [assistantDocContext, setAssistantDocContext] = useState<DocumentItem | null>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [requestDiscipline, setRequestDiscipline] = useState<string>('');

  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [catalogFilters, setCatalogFilters] = useState<{ query?: string; discipline?: string }>({});

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    hasSessionRef.current = !!currentUser;
  }, [currentUser]);

  // Restauration de session : le cookie httpOnly est vérifié auprès du serveur
  // (aucun profil n'est conservé dans le navigateur).
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [user, config, catalogue] = await Promise.all([
        fetchSession(),
        fetchAuthConfig(),
        fetchCatalogue()
      ]);
      if (cancelled) return;
      setAuthConfig(config);
      if (user) setCurrentUser(user);
      setDocuments(catalogue);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Lien de réinitialisation reçu par e-mail : #reset=<jeton> ouvre directement
  // le formulaire de nouveau mot de passe. Le jeton est ensuite retiré de l'URL
  // (il ne doit pas rester dans l'historique du navigateur).
  useEffect(() => {
    const match = /#reset=([^&\s]+)/.exec(window.location.hash);
    if (!match) return;
    setAuthResetToken(decodeURIComponent(match[1]));
    setAuthModalMode('reset');
    setAuthRestrictedNotice('');
    setIsAuthModalOpen(true);
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }, []);

  // Session expirée ou révoquée (suspension de compte) pendant la navigation.
  useEffect(() => {
    const handleUnauthorized = () => {
      if (!hasSessionRef.current) return;
      setCurrentUser(null);
      setCurrentView('landing');
      setAuthModalMode('login');
      setAuthRestrictedNotice('Votre session a expiré. Veuillez vous reconnecter.');
      setIsAuthModalOpen(true);
    };

    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
  }, []);

  const handleOpenAuthWithNotice = (mode: 'login' | 'register', notice?: string) => {
    setAuthModalMode(mode);
    setAuthRestrictedNotice(notice || '');
    setIsAuthModalOpen(true);
  };

  const handleOpenDocument = (doc: DocumentItem) => {
    if (!currentUser) {
      handleOpenAuthWithNotice(
        'login',
        'Veuillez vous connecter à votre compte académique pour lire, citer ou télécharger ce travail.'
      );
      return;
    }
    setSelectedDocument(doc);
    setHistory((prev) => [doc.id, ...prev.filter((id) => id !== doc.id)]);
  };

  const handleToggleBookmark = (docId: string) => {
    if (!currentUser) {
      handleOpenAuthWithNotice('login', 'Veuillez vous connecter pour enregistrer des favoris.');
      return;
    }
    setBookmarks((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  const handleExploreCatalogFromLanding = (filter?: { query?: string; discipline?: string }) => {
    if (!currentUser) {
      handleOpenAuthWithNotice(
        'login',
        'L\'accès au catalogue numérique intégral nécessite un compte certifié.'
      );
      return;
    }
    setCatalogFilters(filter || {});
    setWorkspaceSection('catalogue');
    setCurrentView('workspace');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAssistantFromLanding = () => {
    if (!currentUser) {
      handleOpenAuthWithNotice(
        'login',
        'L\'Assistant IA de méthodologie médicale et scientifique nécessite une authentification.'
      );
      return;
    }
    setAssistantDocContext(null);
    setWorkspaceSection('assistant');
    setCurrentView('workspace');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAnalyticsFromLanding = () => {
    if (!currentUser) {
      handleOpenAuthWithNotice(
        'login',
        'L\'accès aux données et indicateurs de l\'observatoire nécessite un compte.'
      );
      return;
    }
    setWorkspaceSection('observatoire');
    setCurrentView('workspace');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRequestDoc = (discipline?: string) => {
    if (!currentUser) {
      handleOpenAuthWithNotice(
        'login',
        'Veuillez vous connecter pour adresser une demande de document.'
      );
      return;
    }
    setRequestDiscipline(discipline || '');
    setIsRequestModalOpen(true);
  };

  const handleAddNewDocument = (newDoc: DocumentItem) => {
    setDocuments((prev) => [newDoc, ...prev]);
    setBookmarks((prev) => [newDoc.id, ...prev]);
  };

  /**
   * Bascule de rôle : elle passe par une vraie connexion serveur avec le compte
   * de démonstration correspondant (l'ancien mode démo changeait juste l'objet
   * utilisateur côté navigateur).
   */
  const handleSwitchUserRole = async (role: 'Étudiant' | 'Bibliothécaire' | 'Administrateur') => {
    const demo = authConfig.demoAccounts.find((account) => account.role === role);
    if (!demo) {
      handleOpenAuthWithNotice(
        'login',
        `Connectez-vous avec un compte ${role} pour accéder à cet espace.`
      );
      return;
    }

    try {
      const user = await loginAsDemoAccount(demo);
      setCurrentUser(user);
      setCurrentView('workspace');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      handleOpenAuthWithNotice(
        'login',
        err instanceof Error ? err.message : 'Connexion impossible pour le moment.'
      );
    }
  };

  const handleLogout = async () => {
    await logout();
    setCurrentUser(null);
    setCurrentView('landing');
    setAuthRestrictedNotice('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* 
        VIEW ROUTER:
        - If 'landing': Render the public LandingPage (gated actions require login).
        - If 'workspace': Render role-tailored interface:
          * 'Bibliothécaire' -> LibrarianDashboard
          * 'Administrateur' -> AdminDashboard
          * 'Étudiant' / 'Chercheur' -> Dashboard (Research Workspace)
      */}
      {currentView === 'landing' || !currentUser ? (
        <LandingPage
          documents={documents}
          currentUser={currentUser}
          onOpenDocument={handleOpenDocument}
          onExploreCatalog={handleExploreCatalogFromLanding}
          onGoToDashboard={() => {
            if (!currentUser) {
              handleOpenAuthWithNotice(
                'login',
                'Veuillez vous connecter pour accéder à votre espace de travail.'
              );
              return;
            }
            setWorkspaceSection('accueil');
            setCurrentView('workspace');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenAuth={handleOpenAuthWithNotice}
          onOpenAssistant={handleOpenAssistantFromLanding}
          onOpenAnalytics={handleOpenAnalyticsFromLanding}
          onRequestPartner={() => setIsPartnerModalOpen(true)}
          onRequestDocument={() => handleRequestDoc()}
          onQuickLoginAsRole={authConfig.demoLoginEnabled ? handleSwitchUserRole : undefined}
          onLogout={handleLogout}
        />
      ) : currentUser.role === 'Bibliothécaire' ? (
        <LibrarianDashboard
          currentUser={currentUser}
          documents={documents}
          onSelectDocument={handleOpenDocument}
          onLogout={handleLogout}
          onSwitchUserRole={handleSwitchUserRole}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        />
      ) : currentUser.role === 'Administrateur' ? (
        <AdminDashboard
          currentUser={currentUser}
          onLogout={handleLogout}
          onSwitchUserRole={handleSwitchUserRole}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        />
      ) : (
        <Dashboard
          documents={documents}
          currentUser={currentUser}
          bookmarks={bookmarks}
          history={history}
          activeSection={workspaceSection}
          onSectionChange={setWorkspaceSection}
          onSelectDocument={handleOpenDocument}
          onToggleBookmark={handleToggleBookmark}
          onRequestDocument={handleRequestDoc}
          onAddNewDocument={handleAddNewDocument}
          catalogFilters={catalogFilters}
          onUpdateCatalogFilters={setCatalogFilters}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
          onGoToLanding={() => {
            setCurrentView('landing');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onSwitchUser={() => {
            setAuthModalMode('register');
            setIsAuthModalOpen(true);
          }}
          onLogout={handleLogout}
          assistantDocContext={assistantDocContext}
          onSwitchUserRole={handleSwitchUserRole}
        />
      )}

      {/* Interactive Document Reader Modal */}
      <DocumentModal
        document={selectedDocument}
        onClose={() => setSelectedDocument(null)}
        isBookmarked={selectedDocument ? bookmarks.includes(selectedDocument.id) : false}
        onToggleBookmark={handleToggleBookmark}
      />

      {/* Library Document Request Modal */}
      <RequestDocumentModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        prefilledDiscipline={requestDiscipline}
      />

      {/* Formulaire de partenariat : demande transmise à l'administration */}
      <PartnerFormModal
        isOpen={isPartnerModalOpen}
        onClose={() => setIsPartnerModalOpen(false)}
      />

      {/* Auth Modal (Login / Register / Profile Switch) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          setAuthRestrictedNotice('');
        }}
        initialMode={authModalMode}
        resetToken={authResetToken}
        restrictedNotice={authRestrictedNotice}
        demoAccounts={authConfig.demoAccounts}
        onSuccessLogin={(user) => {
          setCurrentUser(user);
          setIsAuthModalOpen(false);
          setAuthRestrictedNotice('');
          setWorkspaceSection('accueil');
          setCurrentView('workspace');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </div>
  );
}
