export type ApiState<T> =
  | { status: 'loading' }
  | { status: 'available'; data: T }
  | { status: 'unavailable'; fallback: T; error: string }
  | { status: 'error'; error: string };

export function isBackendAvailable(): boolean {
  // Explicit check: if the page is served by the real backend,
  // /api/health should respond. In dev with Vite middleware this also works.
  if (typeof window === 'undefined') return false;
  if ((window as any).__CNTRSS_BACKEND_AVAILABLE__ === true) return true;
  return false;
}

export async function checkBackend(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    const res = await fetch('/api/health', {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(4000)
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Événement émis quand une requête authentifiée est refusée (session expirée ou révoquée). */
export const UNAUTHORIZED_EVENT = 'cntrss:unauthorized';

/** Cookie lisible déposé par le serveur, réutilisé comme jeton anti-CSRF (double soumission). */
const CSRF_COOKIE = 'cntrss_csrf';
const CSRF_HEADER = 'x-csrf-token';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.split('; ').find((entry) => entry.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

/** Jeton anti-CSRF courant (cookie lisible) : utilisé par les envois binaires. */
export function currentCsrfToken(): string | null {
  return readCookie(CSRF_COOKIE);
}

function notifyUnauthorized(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
}

/**
 * Appel API du SPA : cookies de session inclus, jeton anti-CSRF ajouté sur les
 * mutations (le serveur l'exige), et événement global en cas de session
 * expirée. Les appels d'authentification eux-mêmes sont exclus de la
 * notification (un mot de passe erroné n'est pas une session expirée).
 */
export async function apiRequest<T>(url: string, options: RequestInit = {}, timeoutMs = 8000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const method = (options.method || 'GET').toUpperCase();
  const headers = new Headers(options.headers || {});

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (method !== 'GET' && method !== 'HEAD') {
    const csrfToken = readCookie(CSRF_COOKIE);
    if (csrfToken) headers.set(CSRF_HEADER, csrfToken);
  }

  try {
    const res = await fetch(url, {
      ...options,
      method,
      headers,
      credentials: 'same-origin',
      signal: controller.signal
    });

    if (res.status === 401 && !url.startsWith('/api/auth/')) {
      notifyUnauthorized();
    }

    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      throw new ApiError(body?.error || `Erreur HTTP ${res.status}`, res.status);
    }

    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchJson<T>(url: string, options?: RequestInit, timeoutMs = 8000): Promise<T> {
  return apiRequest<T>(url, options, timeoutMs);
}

export interface CatalogApiResponse {
  items: any[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  /** Compteurs réels par filière (calculés côté serveur sur tout le catalogue). */
  disciplineCounts?: Record<string, number>;
}

export interface ObservatoryApiResponse {
  totalDocuments: number;
  validatedDocuments: number;
  pendingValidations: number;
  totalDownloads: number;
  totalViews: number;
  totalCitations: number;
  recentSubmissions: any[];
  openRequests: number;
  topInstitutions: { name: string; count: number }[];
  topDisciplines: { name: string; count: number }[];
  byDiscipline: Record<string, number>;
  byInstitution: Record<string, number>;
  insertedAt: string;
}
