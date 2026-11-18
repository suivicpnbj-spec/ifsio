import type {
  ActItem,
  Applicant,
  Attachment,
  DossierMessage,
  Establishment,
  NotificationItem,
  PaymentInfo,
  ReclamationDetails,
  RequestStatus,
  ServiceType,
  TimelineEvent,
  UserRequest,
  UserRole,
} from '../../src/types'

/* ─────────────────────────────── Lignes SQLite ─────────────────────────────── */

export interface UserRow {
  id: string
  role: UserRole
  email: string
  password_hash: string
  first_name: string
  last_name: string
  matricule: string | null
  ine: string | null
  phone: string | null
  filiere: string | null
  promotion: string | null
  title: string | null
  birth_date: string | null
  birth_place: string | null
  nationality: string | null
  address: string | null
  emergency_contact: string | null
  department: string | null
  office: string | null
  sms_alerts: number
  email_alerts: number
  status: string
  created_at: string
  updated_at: string
}

export interface RequestRow {
  id: string
  student_id: string
  act_id: string
  act_title: string
  service_type: ServiceType
  status: RequestStatus
  applicant: string
  reclamation: string | null
  admin_note: string | null
  payment: string | null
  created_at: string
  created_label: string
  updated_at: string
  updated_label: string
}

export interface TimelineRow {
  id: string
  request_id: string
  title: string
  label: string
  description: string
  completed: number
  current: number
  author: string | null
  position: number
  created_at: string
}

export interface MessageRow {
  id: string
  request_id: string
  role: UserRole
  author: string
  text: string
  label: string
  attachment_name: string | null
  created_at: string
}

export interface AttachmentRow {
  id: string
  request_id: string | null
  owner_id: string
  name: string
  stored_name: string
  document_name: string | null
  size: number
  mime: string | null
  verified: number
  uploaded_at: string
  created_at: string
}

export interface NotificationRow {
  id: string
  user_id: string
  title: string
  message: string
  label: string
  read: number
  request_id: string | null
  type: NotificationItem['type']
  created_at: string
}

export interface PaymentRow {
  id: string
  request_id: string
  provider: string
  provider_ref: string | null
  amount: number
  currency: string
  status: string
  method: string | null
  receipt_number: string | null
  instructions: string | null
  checkout_url: string | null
  raw: string | null
  created_at: string
  confirmed_at: string | null
}

/* ─────────────────────────────────── DTO ─────────────────────────────────── */

export interface StudentDto {
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

export interface AdminDto {
  id: string
  firstName: string
  lastName: string
  role: string
  department: string
  email: string
  phone: string
  office?: string
}

export interface SessionDto {
  id: string
  role: UserRole
  email: string
  firstName: string
  lastName: string
  matricule?: string
  filiere?: string
  promotion?: string
}

export function toStudentDto(row: UserRow): StudentDto {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    initials: `${row.first_name.charAt(0)}${row.last_name.charAt(0)}`.toUpperCase(),
    matricule: row.matricule ?? '',
    ...(row.ine ? { ine: row.ine } : {}),
    promotion: row.promotion ?? '',
    filiere: row.filiere ?? '',
    email: row.email,
    phone: row.phone ?? '',
    role: row.title ?? 'Étudiant',
    ...(row.birth_date ? { birthDate: row.birth_date } : {}),
    ...(row.birth_place ? { birthPlace: row.birth_place } : {}),
    ...(row.nationality ? { nationality: row.nationality } : {}),
    ...(row.address ? { address: row.address } : {}),
    ...(row.emergency_contact ? { emergencyContact: row.emergency_contact } : {}),
    smsAlerts: row.sms_alerts === 1,
    emailAlerts: row.email_alerts === 1,
  }
}

export function toAdminDto(row: UserRow): AdminDto {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    role: row.title ?? 'Agent de la scolarité',
    department: row.department ?? '',
    email: row.email,
    phone: row.phone ?? '',
    ...(row.office ? { office: row.office } : {}),
  }
}

export function toSessionDto(row: UserRow): SessionDto {
  return {
    id: row.id,
    role: row.role,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    ...(row.matricule ? { matricule: row.matricule } : {}),
    ...(row.filiere ? { filiere: row.filiere } : {}),
    ...(row.promotion ? { promotion: row.promotion } : {}),
  }
}

/** Convertit un nombre d'octets en libellé lisible français (« 850 Ko »). */
export function formatFileSize(bytes: number): string {
  if (!bytes) return '0 Ko'
  if (bytes < 1024) return `${bytes} o`
  const ko = bytes / 1024
  if (ko < 1024) return `${Math.round(ko * 10) / 10} Ko`.replace('.', ',')
  return `${Math.round((ko / 1024) * 10) / 10} Mo`.replace('.', ',')
}

export function toAttachmentDto(row: AttachmentRow): Attachment {
  return {
    id: row.id,
    name: row.name,
    size: formatFileSize(row.size),
    uploadedAt: row.uploaded_at,
    verified: row.verified === 1,
    ...(row.document_name ? { documentName: row.document_name } : {}),
  }
}

export function toTimelineDto(row: TimelineRow): TimelineEvent {
  return {
    title: row.title,
    date: row.label,
    description: row.description,
    completed: row.completed === 1,
    ...(row.current === 1 ? { current: true } : {}),
    ...(row.author ? { author: row.author } : {}),
  }
}

export function toMessageDto(row: MessageRow): DossierMessage {
  return {
    id: row.id,
    role: row.role,
    author: row.author,
    text: row.text,
    at: row.label,
    ...(row.attachment_name ? { attachmentName: row.attachment_name } : {}),
  }
}

export function toPaymentInfoDto(row: PaymentRow): PaymentInfo {
  return {
    receiptNumber: row.receipt_number ?? row.id,
    amount: row.amount,
    method: row.method ?? row.provider,
    date: row.confirmed_at ?? row.created_at,
  }
}

export function toRequestDto(
  row: RequestRow,
  timeline: TimelineRow[],
  messages: MessageRow[],
  attachments: AttachmentRow[],
): UserRequest {
  const applicant = JSON.parse(row.applicant) as Applicant
  const reclamation = row.reclamation ? (JSON.parse(row.reclamation) as ReclamationDetails) : undefined
  const payment = row.payment ? (JSON.parse(row.payment) as PaymentInfo) : undefined

  return {
    id: row.id,
    actId: row.act_id,
    actTitle: row.act_title,
    serviceType: row.service_type,
    createdAt: row.created_label,
    lastUpdated: row.updated_label,
    status: row.status,
    applicant,
    attachments: attachments.map(toAttachmentDto),
    timeline: timeline.map(toTimelineDto),
    messages: messages.map(toMessageDto),
    ...(payment ? { payment } : {}),
    ...(reclamation ? { reclamationDetails: reclamation } : {}),
    ...(row.admin_note ? { adminNote: row.admin_note } : {}),
  }
}

export function toNotificationDto(row: NotificationRow): NotificationItem {
  return {
    id: row.id,
    title: row.title,
    message: row.message,
    timestamp: row.label,
    read: row.read === 1,
    ...(row.request_id ? { requestId: row.request_id } : {}),
    type: row.type,
  }
}

export function parseEstablishment(payload: string): Establishment {
  return JSON.parse(payload) as Establishment
}

export function parseAct(payload: string): ActItem {
  return JSON.parse(payload) as ActItem
}
