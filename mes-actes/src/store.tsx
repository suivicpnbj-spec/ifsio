import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { DEFAULT_ESTABLISHMENT } from '@/data/establishment'
import { ACTS_CATALOG } from '@/data/acts'
import { DEFAULT_ADMIN, DEFAULT_STUDENT } from '@/data/profiles'
import {
  api,
  errorMessage,
  hasSessionHint,
  hasToken,
  logout as apiLogout,
  login as apiLogin,
  refreshSession,
  register as apiRegister,
  type BootstrapResponse,
  type RegisterPayload,
} from '@/lib/api'
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

export type ToastTone = 'success' | 'info' | 'warning' | 'error'

export interface ToastItem {
  id: number
  message: string
  tone: ToastTone
}

interface RegisterInput extends Omit<RegisterPayload, 'password'> {
  password: string
}

interface AppState {
  establishment: Establishment
  acts: ActItem[]
  requests: UserRequest[]
  notifications: NotificationItem[]
  student: StudentProfile
  admin: AdminProfile
  role: UserRole
  session: boolean
}

export interface AppContextValue extends AppState {
  loading: boolean
  unreadCount: number
  toasts: ToastItem[]
  toast: (message: string, tone?: ToastTone) => void
  dismissToast: (id: number) => void
  refresh: () => Promise<void>
  login: (email: string, password: string) => Promise<UserRole>
  logout: () => Promise<void>
  register: (input: RegisterInput) => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>
  updateEstablishment: (patch: Partial<Establishment>) => Promise<void>
  updateStudent: (patch: Partial<StudentProfile>) => Promise<void>
  updateAdmin: (patch: Partial<AdminProfile>) => Promise<void>
  updateAct: (act: ActItem) => Promise<void>
  createAct: (act: ActItem) => Promise<void>
  deleteAct: (id: string) => Promise<void>
  submitRequest: (request: UserRequest) => Promise<UserRequest>
  reloadRequest: (requestId: string) => Promise<UserRequest>
  addMessage: (
    requestId: string,
    message: { role: UserRole; author: string; text: string; attachmentName?: string },
  ) => Promise<void>
  verifyAttachment: (requestId: string, attachmentName: string) => Promise<void>
  requestComplement: (requestId: string, reason: string) => Promise<void>
  approve: (requestId: string) => Promise<void>
  decideReclamation: (
    requestId: string,
    decision: 'rectifiee' | 'maintenue' | 'reprise_autorisee',
    noteFinale: number,
    motif: string,
    rapporteur: string,
  ) => Promise<void>
  addSupplement: (requestId: string, file: File, documentName?: string) => Promise<void>
  markNotificationRead: (id: string) => Promise<void>
  markAllNotificationsRead: () => Promise<void>
}

const AppContext = createContext<AppContextValue | null>(null)

const ANONYMOUS_STATE: AppState = {
  establishment: DEFAULT_ESTABLISHMENT,
  acts: ACTS_CATALOG,
  requests: [],
  notifications: [],
  student: DEFAULT_STUDENT,
  admin: DEFAULT_ADMIN,
  role: 'student',
  session: false,
}

function stateFromBootstrap(data: BootstrapResponse): AppState {
  return {
    establishment: data.establishment ?? ANONYMOUS_STATE.establishment,
    acts: data.acts?.length ? data.acts : ANONYMOUS_STATE.acts,
    requests: data.requests ?? [],
    notifications: data.notifications ?? [],
    student: data.student ?? ANONYMOUS_STATE.student,
    admin: data.admin ?? ANONYMOUS_STATE.admin,
    role: data.role ?? 'student',
    session: Boolean(data.session),
  }
}

/** Remplace ou insère le dossier renvoyé par l'API, en tête de liste si nouveau. */
function upsertRequest(requests: UserRequest[], next: UserRequest): UserRequest[] {
  const index = requests.findIndex((item) => item.id === next.id)
  if (index < 0) return [next, ...requests]
  const copy = [...requests]
  copy[index] = next
  return copy
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(ANONYMOUS_STATE)
  const [loading, setLoading] = useState(true)
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const initialised = useRef(false)

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((item) => item.id !== id))
  }, [])

  const toast = useCallback(
    (message: string, tone: ToastTone = 'success') => {
      const id = Date.now() + Math.random()
      setToasts((current) => [...current, { id, message, tone }])
      window.setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== id))
      }, 4200)
    },
    [],
  )

  const fail = useCallback(
    (error: unknown, fallback?: string) => {
      toast(errorMessage(error, fallback), 'error')
    },
    [toast],
  )

  const hydrate = useCallback(async () => {
    try {
      let data = await api.bootstrap()
      // Le jeton d'accès est peut-être expiré : on tente le cookie de session.
      if (!data.session && hasSessionHint()) {
        const refreshed = await refreshSession()
        if (refreshed) data = await api.bootstrap()
      }
      setState(stateFromBootstrap(data))
    } catch (error) {
      fail(error, 'Impossible de joindre le serveur MES ACTES.')
    }
  }, [fail])

  useEffect(() => {
    if (initialised.current) return
    initialised.current = true
    const start = async () => {
      // Rechargement de page : le jeton d'accès vit en mémoire, le cookie non.
      if (!hasToken() && hasSessionHint()) await refreshSession()
      await hydrate()
      setLoading(false)
    }
    void start()
  }, [hydrate])

  const refresh = useCallback(async () => {
    await hydrate()
  }, [hydrate])

  /** Recharge les notifications du compte courant. */
  const syncNotifications = useCallback(async () => {
    try {
      const notifications = await api.notifications()
      setState((current) => ({ ...current, notifications }))
    } catch {
      // Silencieux : l'interface reste utilisable.
    }
  }, [])

  const login = useCallback(
    async (email: string, password: string) => {
      const payload = await apiLogin(email, password)
      setState((current) => ({
        ...current,
        role: payload.user.role,
        session: true,
        student: payload.student ?? current.student,
      }))
      await hydrate()
      return payload.user.role
    },
    [hydrate],
  )

  const register = useCallback(
    async (input: RegisterInput) => {
      const payload = await apiRegister(input)
      setState((current) => ({
        ...current,
        role: 'student',
        session: true,
        student: payload.student ?? current.student,
      }))
      await hydrate()
    },
    [hydrate],
  )

  const logout = useCallback(async () => {
    await apiLogout()
    setState({ ...ANONYMOUS_STATE })
    await hydrate()
  }, [hydrate])

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      try {
        await api.changePassword(currentPassword, newPassword)
        toast('Mot de passe mis à jour.', 'success')
        return true
      } catch (error) {
        fail(error, 'Le changement de mot de passe a échoué.')
        return false
      }
    },
    [fail, toast],
  )

  const updateEstablishment = useCallback(
    async (patch: Partial<Establishment>) => {
      try {
        const establishment = await api.updateEstablishment(patch)
        setState((current) => ({ ...current, establishment }))
        toast('Paramètres de l’établissement enregistrés.', 'success')
      } catch (error) {
        fail(error)
      }
    },
    [fail, toast],
  )

  const updateStudent = useCallback(
    async (patch: Partial<StudentProfile>) => {
      try {
        const updated = (await api.updateProfile(patch)) as StudentProfile
        setState((current) => ({ ...current, student: { ...current.student, ...updated } }))
        toast('Profil mis à jour.', 'success')
      } catch (error) {
        fail(error)
      }
    },
    [fail, toast],
  )

  const updateAdmin = useCallback(
    async (patch: Partial<AdminProfile>) => {
      try {
        const updated = (await api.updateProfile(patch)) as AdminProfile
        setState((current) => ({ ...current, admin: { ...current.admin, ...updated } }))
        toast('Profil mis à jour.', 'success')
      } catch (error) {
        fail(error)
      }
    },
    [fail, toast],
  )

  const updateAct = useCallback(
    async (act: ActItem) => {
      try {
        const updated = await api.updateAct(act)
        setState((current) => ({
          ...current,
          acts: current.acts.map((item) => (item.id === updated.id ? updated : item)),
        }))
        toast(`« ${updated.title} » mis à jour.`, 'success')
      } catch (error) {
        fail(error)
        throw error
      }
    },
    [fail, toast],
  )

  const createAct = useCallback(
    async (act: ActItem) => {
      try {
        const created = await api.createAct(act)
        setState((current) => ({ ...current, acts: [...current.acts, created] }))
        toast(`« ${created.title} » ajouté au catalogue.`, 'success')
      } catch (error) {
        fail(error)
        throw error
      }
    },
    [fail, toast],
  )

  const deleteAct = useCallback(
    async (id: string) => {
      try {
        await api.deleteAct(id)
        setState((current) => ({
          ...current,
          acts: current.acts.filter((item) => item.id !== id),
        }))
        toast('Prestation supprimée du catalogue.', 'success')
      } catch (error) {
        fail(error)
        throw error
      }
    },
    [fail, toast],
  )

  const submitRequest = useCallback(
    async (request: UserRequest) => {
      const created = await api.createRequest({
        actId: request.actId,
        purpose: request.applicant.purpose,
        deliveryMethod: request.applicant.deliveryMethod,
        ...(request.applicant.specificResponses
          ? { specificResponses: request.applicant.specificResponses }
          : {}),
        ...(request.attachments.length > 0
          ? {
              attachments: request.attachments.map((attachment) => ({
                name: attachment.name,
                ...(attachment.documentName ? { documentName: attachment.documentName } : {}),
                ...(attachment.size ? { sizeLabel: attachment.size } : {}),
              })),
            }
          : {}),
        ...(request.reclamationDetails ? { reclamationDetails: request.reclamationDetails } : {}),
      })
      setState((current) => ({ ...current, requests: upsertRequest(current.requests, created) }))
      await syncNotifications()
      return created
    },
    [syncNotifications],
  )

  const reloadRequest = useCallback(
    async (requestId: string) => {
      const fresh = await api.getRequest(requestId)
      setState((current) => ({ ...current, requests: upsertRequest(current.requests, fresh) }))
      return fresh
    },
    [],
  )

  const addMessage = useCallback<AppContextValue['addMessage']>(
    async (requestId, message) => {
      try {
        const updated = await api.addMessage(requestId, {
          text: message.text,
          ...(message.attachmentName ? { attachmentName: message.attachmentName } : {}),
        })
        setState((current) => ({
          ...current,
          requests: upsertRequest(current.requests, updated),
        }))
        await syncNotifications()
      } catch (error) {
        fail(error, 'Le message n’a pas pu être envoyé.')
      }
    },
    [fail, syncNotifications],
  )

  const verifyAttachment = useCallback(
    async (requestId: string, attachmentName: string) => {
      const request = state.requests.find((item) => item.id === requestId)
      const attachment = request?.attachments.find((item) => item.name === attachmentName)
      if (!attachment?.id) {
        toast('Cette pièce jointe est introuvable sur le serveur.', 'warning')
        return
      }
      try {
        const updated = await api.verifyAttachment(requestId, attachment.id, !attachment.verified)
        setState((current) => ({
          ...current,
          requests: upsertRequest(current.requests, updated),
        }))
      } catch (error) {
        fail(error, 'La vérification de la pièce a échoué.')
      }
    },
    [fail, state.requests, toast],
  )

  const requestComplement = useCallback(
    async (requestId: string, reason: string) => {
      try {
        const updated = await api.requestComplement(requestId, reason)
        setState((current) => ({
          ...current,
          requests: upsertRequest(current.requests, updated),
        }))
        toast('Demande de complément envoyée à l’étudiant.', 'info')
        await syncNotifications()
      } catch (error) {
        fail(error, 'La demande de complément a échoué.')
      }
    },
    [fail, syncNotifications, toast],
  )

  const approve = useCallback(
    async (requestId: string) => {
      try {
        const updated = await api.approve(requestId)
        setState((current) => ({
          ...current,
          requests: upsertRequest(current.requests, updated),
        }))
        toast('Dossier validé par la scolarité.', 'success')
        await syncNotifications()
      } catch (error) {
        fail(error, 'La validation du dossier a échoué.')
      }
    },
    [fail, syncNotifications, toast],
  )

  const decideReclamation = useCallback<AppContextValue['decideReclamation']>(
    async (requestId, decision, noteFinale, motif, rapporteur) => {
      try {
        const updated = await api.decide(requestId, {
          decision,
          noteFinale,
          motif,
          rapporteur,
        })
        setState((current) => ({
          ...current,
          requests: upsertRequest(current.requests, updated),
        }))
        toast('Décision de la commission enregistrée.', 'success')
        await syncNotifications()
      } catch (error) {
        fail(error, 'La décision n’a pas pu être enregistrée.')
      }
    },
    [fail, syncNotifications, toast],
  )

  const addSupplement = useCallback(
    async (requestId: string, file: File, documentName?: string) => {
      try {
        // 1. envoi réel du fichier, 2. trace d’instruction côté serveur.
        const uploaded = await api.uploadAttachment(requestId, file, documentName)
        const updated = await api.addSupplement(requestId, {
          name: uploaded.name,
          ...(documentName ? { documentName } : {}),
        })
        setState((current) => ({
          ...current,
          requests: upsertRequest(current.requests, updated),
        }))
        await syncNotifications()
      } catch (error) {
        fail(error, 'L’envoi de la pièce a échoué.')
        throw error
      }
    },
    [fail, syncNotifications],
  )

  const markNotificationRead = useCallback(
    async (id: string) => {
      setState((current) => ({
        ...current,
        notifications: current.notifications.map((item) =>
          item.id === id ? { ...item, read: true } : item,
        ),
      }))
      try {
        await api.markNotificationRead(id)
      } catch {
        await syncNotifications()
      }
    },
    [syncNotifications],
  )

  const markAllNotificationsRead = useCallback(async () => {
    setState((current) => ({
      ...current,
      notifications: current.notifications.map((item) => ({ ...item, read: true })),
    }))
    try {
      await api.markAllNotificationsRead()
    } catch {
      await syncNotifications()
    }
  }, [syncNotifications])

  const unreadCount = state.notifications.filter((item) => !item.read).length

  const value = useMemo<AppContextValue>(
    () => ({
      ...state,
      loading,
      unreadCount,
      toasts,
      toast,
      dismissToast,
      refresh,
      login,
      logout,
      register,
      changePassword,
      updateEstablishment,
      updateStudent,
      updateAdmin,
      updateAct,
      createAct,
      deleteAct,
      submitRequest,
      reloadRequest,
      addMessage,
      verifyAttachment,
      requestComplement,
      approve,
      decideReclamation,
      addSupplement,
      markNotificationRead,
      markAllNotificationsRead,
    }),
    [
      state,
      loading,
      unreadCount,
      toasts,
      toast,
      dismissToast,
      refresh,
      login,
      logout,
      register,
      changePassword,
      updateEstablishment,
      updateStudent,
      updateAdmin,
      updateAct,
      createAct,
      deleteAct,
      submitRequest,
      reloadRequest,
      addMessage,
      verifyAttachment,
      requestComplement,
      approve,
      decideReclamation,
      addSupplement,
      markNotificationRead,
      markAllNotificationsRead,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used inside <AppProvider>')
  return context
}
