import type { UserProfile, UserRole } from '../types';
import { apiRequest } from './backendApi';

// Client d'authentification du SPA. Le serveur ouvre une session et n'expose
// qu'un cookie httpOnly : aucun jeton n'est stockable ni lisible en JavaScript.
// Les appels ci-dessous passent tous par apiRequest (cookies inclus + jeton
// anti-CSRF sur les mutations).

export interface DemoAccount extends UserProfile {
  password: string;
}

export interface AuthConfig {
  demoLoginEnabled: boolean;
  demoAccounts: DemoAccount[];
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  institution: string;
  discipline?: string;
  studentId?: string;
}

const NO_DEMO: AuthConfig = { demoLoginEnabled: false, demoAccounts: [] };

/** Récupère la configuration d'authentification publique (tolérante aux pannes). */
export async function fetchAuthConfig(): Promise<AuthConfig> {
  try {
    const config = await apiRequest<AuthConfig>('/api/auth/config', {}, 5000);
    return { demoLoginEnabled: !!config.demoLoginEnabled, demoAccounts: config.demoAccounts || [] };
  } catch {
    return NO_DEMO;
  }
}

/** Session courante côté serveur (null si personne n'est connecté). */
export async function fetchSession(): Promise<UserProfile | null> {
  try {
    const data = await apiRequest<{ user: UserProfile | null }>('/api/auth/me', {}, 5000);
    return data.user ?? null;
  } catch {
    return null;
  }
}

export async function login(email: string, password: string, rememberMe = true): Promise<UserProfile> {
  const data = await apiRequest<{ user: UserProfile }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password, rememberMe })
  });
  return data.user;
}

export async function register(payload: RegisterPayload): Promise<UserProfile> {
  const data = await apiRequest<{ user: UserProfile }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  return data.user;
}

export interface PasswordResetRequestResult {
  /** Le serveur peut-il réellement envoyer un e-mail (RESEND_API_KEY configurée) ? */
  emailDeliveryAvailable: boolean;
  message: string;
}

/**
 * Demande d'un lien de réinitialisation. La réponse est volontairement la même
 * que le compte existe ou non (pas d'énumération de comptes).
 */
export async function requestPasswordReset(email: string): Promise<PasswordResetRequestResult> {
  const data = await apiRequest<{ emailDeliveryAvailable: boolean; message: string }>(
    '/api/auth/forgot-password',
    { method: 'POST', body: JSON.stringify({ email }) }
  );
  return {
    emailDeliveryAvailable: !!data.emailDeliveryAvailable,
    message: data.message || "Demande de réinitialisation enregistrée."
  };
}

/** Consomme un lien de réinitialisation (jeton à usage unique, 30 minutes). */
export async function resetPassword(token: string, password: string): Promise<string> {
  const data = await apiRequest<{ ok: boolean; email: string }>('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, password })
  });
  return data.email;
}

export async function logout(): Promise<void> {
  try {
    await apiRequest<{ ok: boolean }>('/api/auth/logout', { method: 'POST' });
  } catch {
    // La session locale est de toute façon abandonnée par le SPA.
  }
}

/** Connexion en tant que compte de démonstration (boutons de connexion rapide). */
export async function loginAsDemoAccount(account: DemoAccount): Promise<UserProfile> {
  return login(account.email, account.password, true);
}
