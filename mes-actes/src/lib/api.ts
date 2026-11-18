import type {
  ActItem,
  AdminProfile,
  Attachment,
  Establishment,
  NotificationItem,
  StudentProfile,
  UserRequest,
  UserRole,
} from '@/types'

const BASE_URL = '/api'
const TOKEN_KEY = 'mes-actes:access-token'
const SESSION_HINT_KEY = 'mes-actes:had-session'

/** Erreur HTTP normalisée renvoyée par l'API. */
export class ApiError extends Error {
  readonly status: number
  readonly details?: unknown

  constructor(status: number, message: string, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

export interface SessionUser {
  id: string
  role: UserRole
  email: string
  firstName: string
  lastName: string
  matricule?: string
  filiere?: string
  promotion?: string
}

interface AuthResponse {
  user: SessionUser
  student?: StudentProfile
  accessToken: string
  expiresIn: number
}

export interface BootstrapResponse {
  establishment: Establishment
  acts: ActItem[]
  requests: UserRequest[]
  notifications: NotificationItem[]
  student: StudentProfile | null
  admin: AdminProfile | null
  role: UserRole
  session: boolean
  user: SessionUser | null
}

/** Session de paiement ouverte par le serveur (CinetPay, mock ou manuel). */
export interface PaymentSession {
  provider: string
  providerRef: string
  amount: number
  currency: string
  status: string
  instructions?: string | null
  checkoutUrl?: string | null
}

export interface RegisterPayload {
  firstName: string
  lastName: string
  email: string
  password: string
  matricule: string
  filiere: string
  promotion: string
  phone?: string
}

/* ───────────────────────────── Gestion des jetons ─────────────────────────── */

let accessToken: string | null = readStoredToken()

function readStoredToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

function persistToken(token: string | null): void {
  accessToken = token
  try {
    if (token) {
      window.localStorage.setItem(TOKEN_KEY, token)
      window.localStorage.setItem(SESSION_HINT_KEY, '1')
    } else {
      window.localStorage.removeItem(TOKEN_KEY)
    }
  } catch {
    // Stockage indisponible : le jeton reste en mémoire.
  }
}

export function hasToken(): boolean {
  return Boolean(accessToken)
}

/** Indique qu'une session a déjà existé (cookie de rafraîchissement probable). */
export function hasSessionHint(): boolean {
  try {
    return window.localStorage.getItem(SESSION_HINT_KEY) === '1'
  } catch {
    return false
  }
}

export function clearToken(): void {
  persistToken(null)
  try {
    window.localStorage.removeItem(SESSION_HINT_KEY)
  } catch {
    // ignore
  }
}

/* ────────────────────────────── Requête de base ───────────────────────────── */

interface RequestOptions {
  method?: string
  body?: unknown
  /** Empêche la tentative de rafraîchissement (évite la boucle infinie). */
  skipRefresh?: boolean
  raw?: boolean
}

async function rawRequest(path: string, options: RequestOptions = {}): Promise<Response> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`

  return fetch(`${BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    credentials: 'same-origin',
    ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
  })
}

let refreshInFlight: Promise<boolean> | null = null

/** Tente d'obtenir un nouveau jeton d'accès à partir du cookie de session. */
export async function refreshSession(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight

  refreshInFlight = (async () => {
    try {
      const response = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        credentials: 'same-origin',
      })
      if (!response.ok) {
        persistToken(null)
        return false
      }
      const payload = (await response.json()) as AuthResponse
      persistToken(payload.accessToken)
      return true
    } catch {
      return false
    } finally {
      refreshInFlight = null
    }
  })()

  return refreshInFlight
}

async function parseError(response: Response): Promise<ApiError> {
  let message = `Erreur ${response.status}`
  let details: unknown
  try {
    const payload = (await response.json()) as { error?: string; details?: unknown }
    if (payload?.error) message = payload.error
    details = payload?.details
  } catch {
    // Réponse non JSON : on garde le message générique.
  }
  return new ApiError(response.status, message, details)
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let response = await rawRequest(path, options)

  if (response.status === 401 && !options.skipRefresh && !path.startsWith('/auth/')) {
    const refreshed = await refreshSession()
    if (refreshed) response = await rawRequest(path, options)
  }

  if (!response.ok) throw await parseError(response)
  if (options.raw) return response as unknown as T
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

/* ──────────────────────────────── Authentification ────────────────────────── */

export async function login(email: string, password: string): Promise<AuthResponse> {
  const payload = await request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: { email, password },
    skipRefresh: true,
  })
  persistToken(payload.accessToken)
  return payload
}

export async function register(input: RegisterPayload): Promise<AuthResponse> {
  const payload = await request<AuthResponse>('/auth/register', {
    method: 'POST',
    body: input,
    skipRefresh: true,
  })
  persistToken(payload.accessToken)
  return payload
}

export async function logout(): Promise<void> {
  try {
    await request<void>('/auth/logout', { method: 'POST', skipRefresh: true })
  } catch {
    // La session locale doit être purgée même si le serveur est injoignable.
  } finally {
    clearToken()
  }
}

export async function fetchMe(): Promise<{ user: SessionUser; student?: StudentProfile }> {
  return request<{ user: SessionUser; student?: StudentProfile }>('/auth/me', { skipRefresh: true })
}

/* ───────────────────────────────── Données ────────────────────────────────── */

export const api = {
  bootstrap: () => request<BootstrapResponse>('/bootstrap'),

  requests: () => request<UserRequest[]>('/requests'),

  getRequest: (requestId: string) =>
    request<UserRequest>(`/requests/${encodeURIComponent(requestId)}`),

  /** Envoie réellement un fichier au serveur (multipart) et renvoie la pièce jointe créée. */
  uploadAttachment: async (requestId: string, file: File, documentName?: string) => {
    const form = new FormData()
    form.append('file', file)
    if (documentName) form.append('documentName', documentName)

    const headers: Record<string, string> = {}
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`

    const response = await fetch(
      `${BASE_URL}/requests/${encodeURIComponent(requestId)}/attachments`,
      { method: 'POST', headers, credentials: 'same-origin', body: form },
    )
    if (!response.ok) throw await parseError(response)
    return (await response.json()) as Attachment
  },

  /** Télécharge réellement une pièce jointe depuis le serveur. */
  downloadAttachment: async (requestId: string, attachmentId: string, fileName: string) => {
    const headers: Record<string, string> = {}
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`

    const response = await fetch(
      `${BASE_URL}/requests/${encodeURIComponent(requestId)}/attachments/${encodeURIComponent(attachmentId)}`,
      { headers, credentials: 'same-origin' },
    )
    if (!response.ok) throw await parseError(response)

    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  },

  createRequest: (input: {
    actId: string
    purpose: string
    deliveryMethod: 'online' | 'physical'
    specificResponses?: Record<string, string>
    attachments?: Array<{ name: string; documentName?: string; sizeLabel?: string }>
    reclamationDetails?: UserRequest['reclamationDetails']
  }) => request<UserRequest>('/requests', { method: 'POST', body: input }),

  addMessage: (requestId: string, input: { text: string; attachmentName?: string }) =>
    request<UserRequest>(`/requests/${requestId}/messages`, { method: 'POST', body: input }),

  requestComplement: (requestId: string, reason: string) =>
    request<UserRequest>(`/requests/${requestId}/complement`, {
      method: 'POST',
      body: { reason },
    }),

  addSupplement: (
    requestId: string,
    input: { name: string; size?: number; documentName?: string },
  ) =>
    request<UserRequest>(`/requests/${requestId}/supplement`, { method: 'POST', body: input }),

  approve: (requestId: string) =>
    request<UserRequest>(`/requests/${requestId}/approve`, { method: 'POST' }),

  createPaymentSession: (
    requestId: string,
    input?: { method?: 'mobile_money' | 'card'; operator?: string; phone?: string },
  ) =>
    request<{ session: PaymentSession; request: UserRequest }>(
      `/requests/${requestId}/payment/session`,
      { method: 'POST', ...(input ? { body: input } : {}) },
    ),

  /** Reviens du checkout : le serveur recontrôle le statut avant de valider. */
  confirmPayment: (requestId: string, reference?: string) =>
    request<UserRequest>(`/requests/${requestId}/payment/confirm`, {
      method: 'POST',
      body: { reference },
    }),

  decide: (
    requestId: string,
    input: {
      decision: 'rectifiee' | 'maintenue' | 'reprise_autorisee'
      noteFinale: number
      motif: string
      rapporteur: string
    },
  ) => request<UserRequest>(`/requests/${requestId}/decision`, { method: 'POST', body: input }),

  verifyAttachment: (requestId: string, attachmentId: string, verified: boolean) =>
    request<UserRequest>(`/requests/${requestId}/attachments/${attachmentId}`, {
      method: 'PATCH',
      body: { verified },
    }),

  notifications: () => request<NotificationItem[]>('/notifications'),

  markNotificationRead: (id: string) =>
    request<NotificationItem>(`/notifications/${id}/read`, { method: 'PATCH' }),

  markAllNotificationsRead: () =>
    request<NotificationItem[]>('/notifications/read-all', { method: 'POST' }),

  updateEstablishment: (patch: Partial<Establishment>) =>
    request<Establishment>('/establishment', { method: 'PATCH', body: patch }),

  updateAct: (act: ActItem) =>
    request<ActItem>(`/acts/${encodeURIComponent(act.id)}`, { method: 'PATCH', body: act }),

  createAct: (act: ActItem) => request<ActItem>('/acts', { method: 'POST', body: act }),

  deleteAct: (id: string) =>
    request<{ id: string; deleted: boolean }>(`/acts/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  changePassword: (currentPassword: string, newPassword: string) =>
    request<void>('/auth/password', {
      method: 'POST',
      body: { currentPassword, newPassword },
    }),

  updateProfile: (patch: Partial<StudentProfile>) =>
    request<StudentProfile | AdminProfile>('/profile', { method: 'PATCH', body: patch }),

  checkEligibility: (actId: string, matricule?: string) =>
    request<{
      eligible: boolean
      exigeVerification: boolean
      message: string
      deliberation?: any
      etudiant?: any
    }>(`/requests/eligibility/${encodeURIComponent(actId)}${matricule ? `?matricule=${encodeURIComponent(matricule)}` : ''}`),
}

/** Traduit une erreur quelconque en message affichable. */
export function errorMessage(error: unknown, fallback = 'Action impossible pour le moment.'): string {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error && error.message) return error.message
  return fallback
}
