import React, { useEffect, useState } from 'react';
import { UserProfile, UserRole } from '../types';
import { DISCIPLINES } from '../data/mockDocuments';
import {
  X,
  LogIn,
  UserPlus,
  Lock,
  Mail,
  User,
  Building2,
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
  KeyRound,
  AlertCircle,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { CntrssLogo } from './CntrssLogo';
import {
  DemoAccount,
  login,
  loginAsDemoAccount,
  register,
  requestPasswordReset,
  resetPassword
} from '../lib/authClient';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessLogin: (user: UserProfile) => void;
  initialMode?: AuthMode;
  restrictedNotice?: string;
  /** Comptes de démonstration fournis par le serveur (/api/auth/config). */
  demoAccounts?: DemoAccount[];
  /** Jeton extrait du lien de réinitialisation (#reset=...) reçu par e-mail. */
  resetToken?: string;
}

type AuthMode = 'login' | 'register' | 'forgot' | 'reset';

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccessLogin,
  initialMode = 'login',
  restrictedNotice,
  demoAccounts = [],
  resetToken = ''
}) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState('');

  // Register fields
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('Étudiant');
  const [institution, setInstitution] = useState('Université de Parakou');
  const [discipline, setDiscipline] = useState('Médecine');
  const [studentId, setStudentId] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');

  // Réinitialisation du mot de passe
  const [resetTokenValue, setResetTokenValue] = useState(resetToken);
  const [forgotInfo, setForgotInfo] = useState('');

  // Le mode demandé par l'application s'applique à chaque ouverture : le
  // composant reste monté entre deux ouvertures (parcours « mot de passe
  // oublié » et lien #reset=... reçu par e-mail).
  useEffect(() => {
    if (!isOpen) return;
    setMode(initialMode);
    setAuthError('');
    setForgotInfo('');
    if (initialMode === 'reset') setResetTokenValue(resetToken);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialMode, resetToken]);

  if (!isOpen) return null;

  // Les identifiants sont désormais vérifiés par le serveur, qui ouvre une
  // session (cookie httpOnly) : plus aucun compte fabriqué par le navigateur.
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setAuthError('');
    setSubmitting(true);

    try {
      const user = await login(email, password, rememberMe);
      setSuccessMessage(`Bienvenue, ${user.fullName} !`);
      setTimeout(() => {
        onSuccessLogin(user);
        onClose();
        setSuccessMessage('');
        setSubmitting(false);
      }, 700);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Connexion impossible.');
      setSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || !termsAccepted) return;

    if (password.length < 8) {
      setAuthError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (password !== confirmPassword) {
      setAuthError('Les deux mots de passe ne correspondent pas.');
      return;
    }

    setAuthError('');
    setSubmitting(true);

    try {
      const user = await register({
        fullName,
        email,
        password,
        role,
        institution,
        discipline,
        studentId: studentId || undefined
      });

      setSuccessMessage(`Compte académique créé avec succès pour ${user.fullName} !`);
      setTimeout(() => {
        onSuccessLogin(user);
        onClose();
        setSuccessMessage('');
        setSubmitting(false);
      }, 1000);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Inscription impossible.');
      setSubmitting(false);
    }
  };

  const handleQuickLogin = async (demo: DemoAccount) => {
    if (submitting) return;
    setAuthError('');
    setSubmitting(true);

    try {
      const user = await loginAsDemoAccount(demo);
      setSuccessMessage(`Connexion en tant que ${user.fullName}...`);
      setTimeout(() => {
        onSuccessLogin(user);
        onClose();
        setSuccessMessage('');
        setSubmitting(false);
      }, 500);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Connexion impossible.');
      setSubmitting(false);
    }
  };

  // Demande d'un lien de réinitialisation : le serveur répond de façon
  // identique que le compte existe ou non (aucune énumération possible).
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setAuthError('');
    setForgotInfo('');
    setSubmitting(true);

    try {
      const result = await requestPasswordReset(email);
      setForgotInfo(result.message);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Demande de réinitialisation impossible.');
    } finally {
      setSubmitting(false);
    }
  };

  // Consommation du lien reçu par e-mail : jeton à usage unique (30 minutes).
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!resetTokenValue) {
      setAuthError("Lien de réinitialisation incomplet : ouvrez le lien reçu par e-mail.");
      return;
    }
    if (password.length < 8) {
      setAuthError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (password !== confirmPassword) {
      setAuthError('Les deux mots de passe ne correspondent pas.');
      return;
    }

    setAuthError('');
    setSubmitting(true);

    try {
      const userEmail = await resetPassword(resetTokenValue, password);
      setResetTokenValue('');
      setSuccessMessage(`Mot de passe réinitialisé pour ${userEmail}.`);
      setTimeout(() => {
        setMode('login');
        setPassword('');
        setConfirmPassword('');
        setSuccessMessage('');
        setForgotInfo('');
        setSubmitting(false);
      }, 1600);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Réinitialisation impossible.');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <CntrssLogo size="sm" />
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Restricted Notice Banner */}
        {restrictedNotice && (
          <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 flex items-start gap-3 text-xs text-amber-800 dark:text-amber-200">
            <Lock className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <strong className="font-bold block">Accès réservé aux membres accrédités</strong>
              <span>{restrictedNotice}</span>
            </div>
          </div>
        )}

        {/* Tab switch */}
        <div className="px-6 pt-4">
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-semibold">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                mode === 'login' || mode === 'forgot' || mode === 'reset'
                  ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Connexion</span>
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                mode === 'register'
                  ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Créer un compte</span>
            </button>
          </div>
        </div>

        {/* Success Alert */}
        {successMessage ? (
          <div className="p-10 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-teal-600 mx-auto animate-bounce" />
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              {successMessage}
            </h4>
            <p className="text-xs text-slate-500">
              {mode === 'reset'
                ? 'Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.'
                : 'Redirection vers votre espace de travail...'}
            </p>
          </div>
        ) : mode === 'forgot' ? (
          /* FORGOT PASSWORD FORM */
          <form onSubmit={handleForgotSubmit} className="p-6 space-y-4 text-xs">
            {authError && (
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 flex items-start gap-2 text-rose-700 dark:text-rose-300">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {forgotInfo && (
              <div className="p-3 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 flex items-start gap-2 text-teal-800 dark:text-teal-200">
                <Mail className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{forgotInfo}</span>
              </div>
            )}

            <p className="text-slate-500 dark:text-slate-500 leading-relaxed">
              Indiquez l'adresse e-mail de votre compte académique : un lien sécurisé, valable
              30 minutes, vous sera transmis pour choisir un nouveau mot de passe.
            </p>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Adresse e-mail académique
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="etudiant@u-parakou.bj"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-bold text-xs shadow-sm transition-all"
            >
              {submitting ? 'Enregistrement de la demande...' : 'Recevoir le lien de réinitialisation'}
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('login');
                setAuthError('');
                setForgotInfo('');
              }}
              className="w-full flex items-center justify-center gap-1 text-[11px] text-slate-500 hover:text-teal-600"
            >
              <ArrowLeft className="w-3 h-3" />
              Retour à la connexion
            </button>
          </form>
        ) : mode === 'reset' ? (
          /* RESET PASSWORD FORM (lien #reset=... reçu par e-mail) */
          <form onSubmit={handleResetSubmit} className="p-6 space-y-4 text-xs">
            {authError && (
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 flex items-start gap-2 text-rose-700 dark:text-rose-300">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {!resetTokenValue && (
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 flex items-start gap-2 text-amber-800 dark:text-amber-200">
                <KeyRound className="w-4 h-4 mt-0.5 shrink-0" />
                <span>
                  Aucun jeton de réinitialisation détecté : ouvrez le lien complet reçu par e-mail, ou
                  demandez un nouveau lien depuis « Mot de passe oublié ? ».
                </span>
              </div>
            )}

            <p className="text-slate-500 dark:text-slate-500 leading-relaxed">
              Choisissez un nouveau mot de passe (8 caractères minimum). Toutes les sessions
              ouvertes seront déconnectées par sécurité.
            </p>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Confirmer le nouveau mot de passe
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-bold text-xs shadow-sm transition-all"
            >
              {submitting ? 'Enregistrement du nouveau mot de passe...' : 'Enregistrer le nouveau mot de passe'}
            </button>
          </form>
        ) : mode === 'login' ? (
          /* LOGIN FORM */
          <div className="p-6 space-y-5 text-xs">
            {authError && (
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 flex items-start gap-2 text-rose-700 dark:text-rose-300">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Adresse e-mail académique
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ex: aymericakpo2@gmail.com"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-medium text-slate-700 dark:text-slate-300">
                    Mot de passe
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthError('');
                      setForgotInfo('');
                      setMode('forgot');
                    }}
                    className="text-[11px] text-teal-600 hover:underline"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-slate-600 dark:text-slate-400">Rester connecté</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-bold text-xs shadow-sm transition-all"
              >
                {submitting ? 'Vérification des identifiants...' : 'Se connecter au CNTRSS'}
              </button>
            </form>

            {/* Quick Demo Logins Section (activée par le serveur : ENABLE_DEMO_LOGIN) */}
            {demoAccounts.length > 0 && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Comptes de démonstration instantanés :
              </p>
              <div className="space-y-1.5">
                {demoAccounts.map((demo) => (
                  <button
                    key={demo.id}
                    type="button"
                    onClick={() => handleQuickLogin(demo)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 hover:bg-teal-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-left transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-full ${demo.avatarColor} text-white font-bold text-xs flex items-center justify-center`}>
                        {demo.avatarLetter}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-teal-600 transition-colors">
                          {demo.fullName}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {demo.role} · {demo.institution}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            </div>
            )}
          </div>
        ) : (
          /* REGISTER FORM */
          <form onSubmit={handleRegisterSubmit} className="p-6 space-y-4 text-xs">
            {authError && (
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 flex items-start gap-2 text-rose-700 dark:text-rose-300">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{authError}</span>
              </div>
            )}
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Nom complet
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ex: AKPO Laurel Aymeric"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Email universitaire
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="etudiant@u-parakou.bj"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Rôle académique
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                >
                  <option value="Étudiant">Étudiant (Licence/Master/Doctorat)</option>
                  <option value="Enseignant-Chercheur">Enseignant-Chercheur</option>
                  <option value="Chercheur">Chercheur affilié</option>
                  <option value="Institution">Représentant d'institution</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Établissement
                </label>
                <select
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                >
                  <option value="Université de Parakou">Université de Parakou (Faculté de Médecine)</option>
                  <option value="INMeS Cotonou">INMeS Cotonou (Soins & Paramédical)</option>
                  <option value="FSS Cotonou">FSS Cotonou (UAC)</option>
                  <option value="CHUD Borgou">CHUD Borgou / Alibori</option>
                  <option value="IRSP Ouidah">IRSP Ouidah (Institut Régional de Santé Publique)</option>
                  <option value="Autre établissement">Autre institution béninoise</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Filière principale
                </label>
                <select
                  value={discipline}
                  onChange={(e) => setDiscipline(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                >
                  {DISCIPLINES.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Mot de passe (8 caractères minimum)
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Matricule ou N° d'étudiant (optionnel)
              </label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="Ex: UP-2023-MED-0921"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="pt-1">
              <label className="flex items-start gap-2 cursor-pointer text-slate-600 dark:text-slate-400 text-[11px]">
                <input
                  type="checkbox"
                  required
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="rounded text-teal-600 mt-0.5 focus:ring-teal-500"
                />
                <span>
                  J'accepte la Charte nationale d'intégrité scientifique et les conditions d'accès aux travaux de recherche en santé du CNTRSS.
                </span>
              </label>
            </div>

            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Les comptes Bibliothécaire et Administrateur sont créés par la direction du CNTRSS.
            </p>

            <button
              type="submit"
              disabled={!termsAccepted || submitting}
              className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs shadow-sm transition-all"
            >
              {submitting ? 'Création du compte...' : 'Finaliser mon inscription académique'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
