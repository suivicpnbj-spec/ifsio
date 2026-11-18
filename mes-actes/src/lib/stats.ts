import type { ActItem, UserRequest } from '@/types'

export interface StatusSlice {
  status: string
  count: number
  share: number
}

export interface ActVolume {
  actId: string
  title: string
  total: number
  delivered: number
}

export interface FiliereVolume {
  filiere: string
  count: number
}

export interface AdminStatistics {
  total: number
  inProgress: number
  pending: number
  delivered: number
  closed: number
  claims: number
  completionRate: number
  paidFiles: number
  revenue: number
  averageAttachments: number
  /** Délai moyen (heures) entre le dépôt et la dernière mise à jour des dossiers clos. */
  averageInstructionHours: number | null
  byStatus: StatusSlice[]
  byAct: ActVolume[]
  byFiliere: FiliereVolume[]
}

const IN_PROGRESS: string[] = ['Demande reçue', 'En traitement', 'En vérification']

const MONTHS: Record<string, number> = {
  janvier: 0,
  février: 1,
  fevrier: 1,
  mars: 2,
  avril: 3,
  mai: 4,
  juin: 5,
  juillet: 6,
  août: 7,
  aout: 7,
  septembre: 8,
  octobre: 9,
  novembre: 10,
  décembre: 11,
  decembre: 11,
}

/** Parses the French date strings produced by `formatDate` (and ISO dates). */
export function parseFrenchDate(value?: string): Date | null {
  if (!value) return null

  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) {
    return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]))
  }

  const match = value.match(/(\d{1,2})\s+([a-zA-Zéèêàîïôûç]+)\s+(\d{4})/)
  if (!match) return null
  const month = MONTHS[match[2].toLowerCase()]
  if (month === undefined) return null
  return new Date(Number(match[3]), month, Number(match[1]))
}

function share(count: number, total: number): number {
  if (!total) return 0
  return Math.round((count / total) * 1000) / 10
}

/** Aggregates the dossier dataset into the back-office statistics. */
export function computeAdminStatistics(
  requests: UserRequest[],
  acts: ActItem[],
): AdminStatistics {
  const total = requests.length
  const titles = new Map(acts.map((act) => [act.id, act.title]))

  const statusCounts = new Map<string, number>()
  const actCounts = new Map<string, { total: number; delivered: number }>()
  const filiereCounts = new Map<string, number>()

  let inProgress = 0
  let pending = 0
  let delivered = 0
  let closed = 0
  let claims = 0
  let revenue = 0
  let paidFiles = 0
  let attachmentTotal = 0
  const instructionDurations: number[] = []

  for (const request of requests) {
    statusCounts.set(request.status, (statusCounts.get(request.status) ?? 0) + 1)

    if (IN_PROGRESS.includes(request.status)) inProgress += 1
    if (request.status === 'En attente de complément') pending += 1
    if (request.status === 'Validé') delivered += 1
    if (request.status === 'Clôturé') closed += 1
    if (request.reclamationDetails) claims += 1

    if (request.payment) {
      revenue += request.payment.amount
      paidFiles += 1
    }

    attachmentTotal += request.attachments.length

    const actEntry = actCounts.get(request.actId) ?? { total: 0, delivered: 0 }
    actEntry.total += 1
    if (request.status === 'Validé') actEntry.delivered += 1
    actCounts.set(request.actId, actEntry)

    const filiere = request.applicant.filiere
    filiereCounts.set(filiere, (filiereCounts.get(filiere) ?? 0) + 1)

    const created = parseFrenchDate(request.createdAt)
    const finished =
      request.status === 'Validé' || request.status === 'Clôturé'
        ? parseFrenchDate(request.lastUpdated)
        : null
    if (created && finished) {
      const hours = (finished.getTime() - created.getTime()) / 3_600_000
      if (hours >= 0) instructionDurations.push(hours)
    }
  }

  const byStatus: StatusSlice[] = [...statusCounts.entries()]
    .map(([status, count]) => ({ status, count, share: share(count, total) }))
    .sort((a, b) => b.count - a.count)

  const byAct: ActVolume[] = [...actCounts.entries()]
    .map(([actId, entry]) => ({
      actId,
      title: titles.get(actId) ?? actId,
      total: entry.total,
      delivered: entry.delivered,
    }))
    .sort((a, b) => b.total - a.total || a.title.localeCompare(b.title, 'fr'))

  const byFiliere: FiliereVolume[] = [...filiereCounts.entries()]
    .map(([filiere, count]) => ({ filiere, count }))
    .sort((a, b) => b.count - a.count)

  const averageInstructionHours = instructionDurations.length
    ? Math.round(
        (instructionDurations.reduce((sum, value) => sum + value, 0) / instructionDurations.length) *
          10,
      ) / 10
    : null

  return {
    total,
    inProgress,
    pending,
    delivered,
    closed,
    claims,
    completionRate: share(delivered + closed, total),
    paidFiles,
    revenue,
    averageAttachments: total ? Math.round((attachmentTotal / total) * 10) / 10 : 0,
    averageInstructionHours,
    byStatus,
    byAct,
    byFiliere,
  }
}
