export type CategoryId =
  | 'scolarite'
  | 'resultats'
  | 'diplomes'
  | 'soutenance'
  | 'stages'
  | 'formation'
  | 'reclamations'
  | 'memoires'
  | 'autres'

export type ServiceType = 'act' | 'procedure'
export type Audience = 'Étudiants' | 'Diplômés' | 'Tous'
/** L’acte est retiré auprès de l’administration : la plateforme ne le produit pas. */
export type DeliveryMode = 'Retrait'

export type IconType =
  | 'document'
  | 'transcript'
  | 'award'
  | 'duplicate'
  | 'certificate'
  | 'complaint'
  | 'thesis'
  | 'download'

export type RequestStatus =
  | 'Demande reçue'
  | 'En traitement'
  | 'En vérification'
  | 'En attente de complément'
  | 'Validé'
  | 'Brouillon'
  | 'Clôturé'

export type UserRole = 'student' | 'admin'

export interface DynamicFormField {
  id: string
  label: string
  type: 'text' | 'select' | 'date' | 'textarea' | 'number'
  placeholder?: string
  options?: string[]
  required: boolean
  defaultValue?: string
  help?: string
}

export interface RequiredDocument {
  name: string
  details?: string
  mandatory: boolean
}

export interface ActItem {
  id: string
  title: string
  shortDescription: string
  category: CategoryId
  categoryLabel: string
  serviceType: ServiceType
  audience: Audience
  deliveryMode: DeliveryMode
  delay: string
  feeAmount: number
  feeNote?: string
  eligibilityConditions: string[]
  requiredDocuments: RequiredDocument[]
  deliveryDetails: string
  iconType: IconType
  specificFields?: DynamicFormField[]
  workflowSteps?: string[]
  popular?: boolean
  active?: boolean
}

export interface Attachment {
  /** Identifiant serveur (absent pour les pièces construites côté client) */
  id?: string
  name: string
  size: string
  uploadedAt: string
  verified?: boolean
  /** Required document this file satisfies, when applicable */
  documentName?: string
}

export interface TimelineEvent {
  title: string
  date: string
  description: string
  completed: boolean
  current?: boolean
  author?: string
}

export interface PaymentInfo {
  receiptNumber: string
  amount: number
  method: string
  date: string
}

export interface DossierMessage {
  id: string
  role: UserRole
  author: string
  text: string
  at: string
  attachmentName?: string
}

export type ReclamationMotif =
  | 'note_non_affichee'
  | 'erreur_report'
  | 'erreur_calcul'
  | 'credits_non_accordes'
  | 'desaccord_note'
  | 'bareme'
  | 'autre'
  /* Anciens motifs conservés pour lire les dossiers déjà déposés. */
  | 'omission_correction'

export interface CommissionDecision {
  date: string
  decision: 'rectifiee' | 'maintenue' | 'reprise_autorisee'
  noteFinale?: number
  rapporteur: string
  motif: string
  pvReference: string
}

export interface ReclamationDetails {
  matiere: string
  codeUE?: string
  /** Plus exigé : renseigné uniquement si l’étudiant le précise. */
  semestre?: string
  session: 'Session Normale' | 'Session de Rattrapage' | 'Contrôle Continu'
  /** Plus exigée : renseignée uniquement si l’étudiant l’indique. */
  noteInitiale?: number
  noteEsperee?: number
  motifType: ReclamationMotif
  argumentaire: string
  ecs?: string[]
  commissionDecision?: CommissionDecision
}

export interface Applicant {
  fullName: string
  firstName: string
  lastName: string
  matricule: string
  promotion: string
  filiere: string
  email: string
  telephone: string
  deliveryMethod: 'online' | 'physical'
  purpose: string
  specificResponses?: Record<string, string>
  academicDeliberation?: {
    admissible: boolean
    decision_jury: string
    moyenne_generale: number | null
    mention: string
    credits_ects_valides: number
    credits_ects_requis: number
    date_deliberation: string
    scelle_hmac?: string
  }
}

export interface UserRequest {
  id: string
  actId: string
  actTitle: string
  serviceType: ServiceType
  createdAt: string
  lastUpdated: string
  status: RequestStatus
  applicant: Applicant
  attachments: Attachment[]
  timeline: TimelineEvent[]
  messages: DossierMessage[]
  payment?: PaymentInfo
  reclamationDetails?: ReclamationDetails
  adminNote?: string
  securityCode?: string
  certifiedAt?: string
  documentFormat?: 'attestation' | 'diplome' | 'releve' | 'certificat'
}

export interface NotificationItem {
  id: string
  title: string
  message: string
  timestamp: string
  read: boolean
  requestId?: string
  type: 'info' | 'success' | 'warning'
}

export interface StudentProfile {
  id: string
  firstName: string
  lastName: string
  initials: string
  matricule: string
  ine?: string
  promotion: string
  filiere: string
  email: string
  phone: string
  role: string
  birthDate?: string
  birthPlace?: string
  nationality?: string
  address?: string
  emergencyContact?: string
  smsAlerts: boolean
  emailAlerts: boolean
}

export interface AdminProfile {
  id: string
  firstName: string
  lastName: string
  role: string
  department: string
  email: string
  phone: string
  office?: string
}

export interface Establishment {
  name: string
  shortName: string
  university: string
  ministry: string
  country: string
  motto: string
  address: string
  phone: string
  email: string
  website: string
  currency: string
  registrarTitle: string
  filieres: string[]
  signatories: string[]
  /** Base URL displayed under the QR code of official documents */
  verificationBaseUrl: string
}
