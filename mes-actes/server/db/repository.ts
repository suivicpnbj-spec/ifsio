import { randomUUID } from 'node:crypto'
import type { Database } from './database'
import { formatDateTime } from '../lib/format'
import type {
  AttachmentRow,
  MessageRow,
  NotificationRow,
  PaymentRow,
  RequestRow,
  TimelineRow,
  UserRow,
} from '../lib/dto'
import type {
  ActItem,
  Applicant,
  Establishment,
  NotificationItem,
  PaymentInfo,
  ReclamationDetails,
  RequestStatus,
  UserRole,
} from '../../src/types'

export interface NewAttachment {
  id?: string
  requestId: string | null
  ownerId: string
  name: string
  storedName: string
  documentName?: string | null
  size: number
  mime?: string | null
  uploadedAt: string
}

export class Repository {
  constructor(private readonly db: Database) {}

  /* ─────────────────────────────── Utilisateurs ─────────────────────────────── */

  findUserByEmail(email: string): UserRow | undefined {
    return this.db.get<UserRow>('SELECT * FROM users WHERE lower(email) = lower(?)', email)
  }

  findUserById(id: string): UserRow | undefined {
    return this.db.get<UserRow>('SELECT * FROM users WHERE id = ?', id)
  }

  listUsers(): UserRow[] {
    return this.db.all<UserRow>('SELECT * FROM users ORDER BY role, last_name, first_name')
  }

  insertUser(user: {
    id?: string
    role: UserRole
    email: string
    passwordHash: string
    firstName: string
    lastName: string
    matricule?: string | null
    ine?: string | null
    phone?: string | null
    filiere?: string | null
    promotion?: string | null
    title?: string | null
    birthDate?: string | null
    birthPlace?: string | null
    nationality?: string | null
    address?: string | null
    emergencyContact?: string | null
    department?: string | null
    office?: string | null
    smsAlerts?: boolean
    emailAlerts?: boolean
  }): UserRow {
    const id = user.id ?? randomUUID()
    const now = new Date().toISOString()
    this.db.run(
      `INSERT INTO users (
        id, role, email, password_hash, first_name, last_name, matricule, ine, phone,
        filiere, promotion, title, birth_date, birth_place, nationality, address,
        emergency_contact, department, office, sms_alerts, email_alerts, status, created_at, updated_at
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      id,
      user.role,
      user.email,
      user.passwordHash,
      user.firstName,
      user.lastName,
      user.matricule ?? null,
      user.ine ?? null,
      user.phone ?? null,
      user.filiere ?? null,
      user.promotion ?? null,
      user.title ?? null,
      user.birthDate ?? null,
      user.birthPlace ?? null,
      user.nationality ?? null,
      user.address ?? null,
      user.emergencyContact ?? null,
      user.department ?? null,
      user.office ?? null,
      user.smsAlerts === false ? 0 : 1,
      user.emailAlerts === false ? 0 : 1,
      'active',
      now,
      now,
    )
    return this.findUserById(id)!
  }

  updateUserPassword(id: string, passwordHash: string): void {
    this.db.run('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?', passwordHash, new Date().toISOString(), id)
  }

  updateUserProfile(id: string, patch: Record<string, unknown>): void {
    const allowed = [
      'first_name',
      'last_name',
      'matricule',
      'ine',
      'phone',
      'filiere',
      'promotion',
      'title',
      'birth_date',
      'birth_place',
      'nationality',
      'address',
      'emergency_contact',
      'department',
      'office',
      'sms_alerts',
      'email_alerts',
    ]
    const keys = Object.keys(patch).filter((key) => allowed.includes(key))
    if (keys.length === 0) return
    const assignments = keys.map((key) => `${key} = ?`).join(', ')
    this.db.run(
      `UPDATE users SET ${assignments}, updated_at = ? WHERE id = ?`,
      ...keys.map((key) => patch[key]),
      new Date().toISOString(),
      id,
    )
  }

  /* ───────────────────────────────── Sessions ──────────────────────────────── */

  insertSession(session: {
    id?: string
    userId: string
    tokenHash: string
    expiresAt: string
  }): string {
    const id = session.id ?? randomUUID()
    this.db.run(
      'INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at) VALUES (?,?,?,?,?)',
      id,
      session.userId,
      session.tokenHash,
      session.expiresAt,
      new Date().toISOString(),
    )
    return id
  }

  findSessionByTokenHash(tokenHash: string):
    | { id: string; user_id: string; expires_at: string; revoked_at: string | null }
    | undefined {
    return this.db.get<{
      id: string
      user_id: string
      expires_at: string
      revoked_at: string | null
    }>('SELECT * FROM sessions WHERE token_hash = ?', tokenHash)
  }

  revokeSession(id: string): void {
    this.db.run('UPDATE sessions SET revoked_at = ? WHERE id = ?', new Date().toISOString(), id)
  }

  revokeSessionsForUser(userId: string): void {
    this.db.run(
      'UPDATE sessions SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL',
      new Date().toISOString(),
      userId,
    )
  }

  /* ────────────────────────────── Établissement ───────────────────────────── */

  getEstablishment(): Establishment {
    const row = this.db.get<{ payload: string }>('SELECT payload FROM establishment WHERE id = 1')
    if (!row) throw new Error('Établissement non initialisé.')
    return JSON.parse(row.payload) as Establishment
  }

  setEstablishment(establishment: Establishment): Establishment {
    const now = new Date().toISOString()
    this.db.run(
      `INSERT INTO establishment (id, payload, updated_at) VALUES (1, ?, ?)
       ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at`,
      JSON.stringify(establishment),
      now,
    )
    return establishment
  }

  /* ──────────────────────────────── Catalogue ─────────────────────────────── */

  listActs(): ActItem[] {
    return this.db
      .all<{ payload: string }>('SELECT payload FROM acts ORDER BY position, id')
      .map((row) => JSON.parse(row.payload) as ActItem)
  }

  findAct(id: string): ActItem | undefined {
    const row = this.db.get<{ payload: string }>('SELECT payload FROM acts WHERE id = ?', id)
    return row ? (JSON.parse(row.payload) as ActItem) : undefined
  }

  upsertAct(act: ActItem, position?: number): ActItem {
    const now = new Date().toISOString()
    const existing = this.db.get<{ position: number }>('SELECT position FROM acts WHERE id = ?', act.id)
    const rank = position ?? existing?.position ?? 0
    this.db.run(
      `INSERT INTO acts (id, payload, position, updated_at) VALUES (?,?,?,?)
       ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, position = excluded.position, updated_at = excluded.updated_at`,
      act.id,
      JSON.stringify(act),
      rank,
      now,
    )
    return act
  }

  deleteAct(id: string): void {
    this.db.run('DELETE FROM acts WHERE id = ?', id)
  }

  /** Nombre de dossiers rattachés à une prestation — protège la suppression. */
  countRequestsForAct(actId: string): number {
    return (
      this.db.get<{ value: number }>(
        'SELECT COUNT(*) AS value FROM requests WHERE act_id = ?',
        actId,
      )?.value ?? 0
    )
  }

  /* ────────────────────────────────── Dossiers ────────────────────────────── */

  insertRequest(request: {
    id: string
    studentId: string
    actId: string
    actTitle: string
    serviceType: string
    status: RequestStatus
    applicant: Applicant
    reclamation?: ReclamationDetails | null
    createdAt: string
    createdLabel: string
    updatedAt: string
    updatedLabel: string
  }): void {
    this.db.run(
      `INSERT INTO requests (
        id, student_id, act_id, act_title, service_type, status, applicant, reclamation,
        admin_note, payment,
        created_at, created_label, updated_at, updated_label
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      request.id,
      request.studentId,
      request.actId,
      request.actTitle,
      request.serviceType,
      request.status,
      JSON.stringify(request.applicant),
      request.reclamation ? JSON.stringify(request.reclamation) : null,
      null,
      null,
      request.createdAt,
      request.createdLabel,
      request.updatedAt,
      request.updatedLabel,
    )
  }

  findRequest(id: string): RequestRow | undefined {
    return this.db.get<RequestRow>('SELECT * FROM requests WHERE id = ?', id)
  }

  listRequests(filter: { studentId?: string; status?: string; query?: string }): RequestRow[] {
    const clauses: string[] = []
    const params: unknown[] = []
    if (filter.studentId) {
      clauses.push('student_id = ?')
      params.push(filter.studentId)
    }
    if (filter.status && filter.status !== 'all') {
      clauses.push('status = ?')
      params.push(filter.status)
    }
    if (filter.query) {
      clauses.push('(lower(act_title) LIKE ? OR lower(id) LIKE ? OR lower(applicant) LIKE ?)')
      const like = `%${filter.query.toLowerCase()}%`
      params.push(like, like, like)
    }
    const where = clauses.length ? ` WHERE ${clauses.join(' AND ')}` : ''
    return this.db.all<RequestRow>(
      `SELECT * FROM requests${where} ORDER BY created_at DESC, id DESC`,
      ...params,
    )
  }

  updateRequest(id: string, patch: Record<string, unknown>): void {
    const allowed = [
      'status',
      'applicant',
      'reclamation',
      'admin_note',
      'payment',
      'act_title',
    ]
    const keys = Object.keys(patch).filter((key) => allowed.includes(key))
    const now = new Date().toISOString()
    const label =
      typeof patch.updated_label === 'string' && patch.updated_label
        ? patch.updated_label
        : formatDateTime(new Date())

    if (keys.length === 0) {
      this.db.run(
        'UPDATE requests SET updated_at = ?, updated_label = ? WHERE id = ?',
        now,
        label,
        id,
      )
      return
    }

    const assignments = keys.map((key) => `${key} = ?`).join(', ')
    this.db.run(
      `UPDATE requests SET ${assignments}, updated_at = ?, updated_label = ? WHERE id = ?`,
      ...keys.map((key) => {
        const value = patch[key]
        if (value === undefined || value === null) return null
        if (typeof value === 'object') return JSON.stringify(value)
        return value
      }),
      now,
      label,
      id,
    )
  }

  /* ─────────────────────────── Fil d'instruction ─────────────────────────── */

  listTimeline(requestId: string): TimelineRow[] {
    return this.db.all<TimelineRow>(
      'SELECT * FROM timeline_events WHERE request_id = ? ORDER BY position ASC, created_at ASC',
      requestId,
    )
  }

  insertTimelineEvent(event: {
    requestId: string
    title: string
    label: string
    description: string
    completed: boolean
    current?: boolean
    author?: string | null
    position?: number
  }): void {
    const max = this.db.get<{ value: number }>(
      'SELECT COALESCE(MAX(position), -1) AS value FROM timeline_events WHERE request_id = ?',
      event.requestId,
    )
    this.db.run(
      `INSERT INTO timeline_events (
        id, request_id, title, label, description, completed, current, author, position, created_at
      ) VALUES (?,?,?,?,?,?,?,?,?,?)`,
      randomUUID(),
      event.requestId,
      event.title,
      event.label,
      event.description,
      event.completed ? 1 : 0,
      event.current ? 1 : 0,
      event.author ?? null,
      event.position ?? (max?.value ?? -1) + 1,
      new Date().toISOString(),
    )
  }

  completeTimeline(requestId: string): void {
    this.db.run(
      'UPDATE timeline_events SET completed = 1, current = 0 WHERE request_id = ?',
      requestId,
    )
  }

  /* ───────────────────────────────── Messages ─────────────────────────────── */

  listMessages(requestId: string): MessageRow[] {
    return this.db.all<MessageRow>(
      'SELECT * FROM messages WHERE request_id = ? ORDER BY created_at ASC, rowid ASC',
      requestId,
    )
  }

  insertMessage(message: {
    requestId: string
    role: UserRole
    author: string
    text: string
    label: string
    attachmentName?: string | null
  }): void {
    this.db.run(
      `INSERT INTO messages (id, request_id, role, author, text, label, attachment_name, created_at)
       VALUES (?,?,?,?,?,?,?,?)`,
      randomUUID(),
      message.requestId,
      message.role,
      message.author,
      message.text,
      message.label,
      message.attachmentName ?? null,
      new Date().toISOString(),
    )
  }

  /* ───────────────────────────── Pièces jointes ───────────────────────────── */

  listAttachments(requestId: string): AttachmentRow[] {
    return this.db.all<AttachmentRow>(
      'SELECT * FROM attachments WHERE request_id = ? ORDER BY uploaded_at ASC, rowid ASC',
      requestId,
    )
  }

  findAttachment(id: string): AttachmentRow | undefined {
    return this.db.get<AttachmentRow>('SELECT * FROM attachments WHERE id = ?', id)
  }

  insertAttachment(attachment: NewAttachment): AttachmentRow {
    const id = attachment.id ?? randomUUID()
    const now = new Date().toISOString()
    this.db.run(
      `INSERT INTO attachments (
        id, request_id, owner_id, name, stored_name, document_name, size, mime, verified, uploaded_at, created_at
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      id,
      attachment.requestId,
      attachment.ownerId,
      attachment.name,
      attachment.storedName,
      attachment.documentName ?? null,
      attachment.size,
      attachment.mime ?? null,
      0,
      attachment.uploadedAt,
      now,
    )
    return this.findAttachment(id)!
  }

  setAttachmentVerified(id: string, verified: boolean): void {
    this.db.run('UPDATE attachments SET verified = ? WHERE id = ?', verified, id)
  }

  attachToRequest(attachmentId: string, requestId: string, documentName?: string | null): void {
    this.db.run(
      'UPDATE attachments SET request_id = ?, document_name = COALESCE(?, document_name) WHERE id = ?',
      requestId,
      documentName ?? null,
      attachmentId,
    )
  }

  deleteAttachment(id: string): void {
    this.db.run('DELETE FROM attachments WHERE id = ?', id)
  }

  /* ─────────────────────────────── Notifications ──────────────────────────── */

  listNotifications(userId: string): NotificationRow[] {
    return this.db.all<NotificationRow>(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC, rowid DESC',
      userId,
    )
  }

  insertNotification(notification: {
    userId: string
    title: string
    message: string
    label: string
    type: NotificationItem['type']
    requestId?: string | null
  }): void {
    this.db.run(
      `INSERT INTO notifications (id, user_id, title, message, label, read, request_id, type, created_at)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      randomUUID(),
      notification.userId,
      notification.title,
      notification.message,
      notification.label,
      0,
      notification.requestId ?? null,
      notification.type,
      new Date().toISOString(),
    )
  }

  markNotificationRead(userId: string, id: string): void {
    this.db.run('UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?', id, userId)
  }

  markAllNotificationsRead(userId: string): void {
    this.db.run('UPDATE notifications SET read = 1 WHERE user_id = ?', userId)
  }

  /** Vide les données transactionnelles (dossiers, messages, paiements…). */
  clearTransactionalData(): void {
    for (const table of [
      'payments',
      'notifications',
      'messages',
      'timeline_events',
      'attachments',
      'requests',
      'audit_log',
      'counters',
    ]) {
      this.db.run(`DELETE FROM ${table}`)
    }
  }

  /* ───────────────────────────────── Paiements ────────────────────────────── */

  insertPayment(payment: {
    id?: string
    requestId: string
    provider: string
    providerRef?: string | null
    amount: number
    currency: string
    status: string
    method?: string | null
    receiptNumber?: string | null
    instructions?: string | null
    checkoutUrl?: string | null
    raw?: unknown
  }): PaymentRow {
    const id = payment.id ?? randomUUID()
    const now = new Date().toISOString()
    this.db.run(
      `INSERT INTO payments (
        id, request_id, provider, provider_ref, amount, currency, status, method,
        receipt_number, instructions, checkout_url, raw, created_at, confirmed_at
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      id,
      payment.requestId,
      payment.provider,
      payment.providerRef ?? null,
      payment.amount,
      payment.currency,
      payment.status,
      payment.method ?? null,
      payment.receiptNumber ?? null,
      payment.instructions ?? null,
      payment.checkoutUrl ?? null,
      payment.raw ? JSON.stringify(payment.raw) : null,
      now,
      null,
    )
    return this.db.get<PaymentRow>('SELECT * FROM payments WHERE id = ?', id)!
  }

  findPayment(id: string): PaymentRow | undefined {
    return this.db.get<PaymentRow>('SELECT * FROM payments WHERE id = ?', id)
  }

  /** Recherche un règlement par la référence du prestataire (webhook, retour de checkout). */
  findPaymentByProviderRef(reference: string): PaymentRow | undefined {
    return this.db.get<PaymentRow>(
      'SELECT * FROM payments WHERE provider_ref = ? ORDER BY created_at DESC',
      reference,
    )
  }

  listPaymentsForRequest(requestId: string): PaymentRow[] {
    return this.db.all<PaymentRow>(
      'SELECT * FROM payments WHERE request_id = ? ORDER BY created_at DESC',
      requestId,
    )
  }

  confirmPayment(id: string, patch: { receiptNumber?: string; method?: string; raw?: unknown }): void {
    this.db.run(
      `UPDATE payments SET status = 'confirmed', receipt_number = COALESCE(?, receipt_number),
        method = COALESCE(?, method), raw = COALESCE(?, raw), confirmed_at = ? WHERE id = ?`,
      patch.receiptNumber ?? null,
      patch.method ?? null,
      patch.raw ? JSON.stringify(patch.raw) : null,
      new Date().toISOString(),
      id,
    )
  }

  /* ──────────────────────────────── Audit ─────────────────────────────────── */

  audit(entry: {
    actorId?: string | null
    actorRole?: UserRole | null
    action: string
    entity?: string | null
    entityId?: string | null
    details?: unknown
  }): void {
    this.db.run(
      `INSERT INTO audit_log (actor_id, actor_role, action, entity, entity_id, details, at)
       VALUES (?,?,?,?,?,?,?)`,
      entry.actorId ?? null,
      entry.actorRole ?? null,
      entry.action,
      entry.entity ?? null,
      entry.entityId ?? null,
      entry.details ? JSON.stringify(entry.details) : null,
      new Date().toISOString(),
    )
  }

  listAudit(limit = 100): Array<{
    id: number
    actor_id: string | null
    actor_role: string | null
    action: string
    entity: string | null
    entity_id: string | null
    details: string | null
    at: string
  }> {
    return this.db.all(
      'SELECT * FROM audit_log ORDER BY id DESC LIMIT ?',
      limit,
    )
  }

  /* ──────────────────────────────── Compteurs ─────────────────────────────── */

  nextSequence(name: string): number {
    const row = this.db.get<{ value: number }>('SELECT value FROM counters WHERE name = ?', name)
    const next = (row?.value ?? 0) + 1
    this.db.run(
      `INSERT INTO counters (name, value) VALUES (?, ?)
       ON CONFLICT(name) DO UPDATE SET value = excluded.value`,
      name,
      next,
    )
    return next
  }
}
