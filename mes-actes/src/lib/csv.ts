import type { ActItem, UserRequest } from '@/types'

/** French Excel expects a semicolon separator and a UTF-8 byte order mark. */
export const CSV_SEPARATOR = ';'
export const CSV_BOM = '\uFEFF'

export const QUEUE_CSV_COLUMNS = [
  'Dossier',
  'Déposé le',
  'Demandeur',
  'Matricule',
  'Filière',
  'Niveau',
  'Acte demandé',
  'Statut',
  'Pièces jointes',
  'Pièces validées',
  'Frais (FCFA)',
  'Quittance',
  'Dernière mise à jour',
  'Réclamation',
] as const

export function escapeCsvValue(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return ''
  const text = String(value)
  if (/[";\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

export function toCsvRow(values: Array<string | number | undefined | null>): string {
  return values.map(escapeCsvValue).join(CSV_SEPARATOR)
}

/** Builds the instruction-queue export, one line per dossier. */
export function buildQueueCsv(requests: UserRequest[], acts: ActItem[]): string {
  const actTitles = new Map(acts.map((act) => [act.id, act.title]))
  const header = toCsvRow([...QUEUE_CSV_COLUMNS])

  const rows = requests.map((request) =>
    toCsvRow([
      request.id,
      request.createdAt,
      request.applicant.fullName,
      request.applicant.matricule,
      request.applicant.filiere,
      request.applicant.promotion,
      actTitles.get(request.actId) ?? request.actTitle,
      request.status,
      request.attachments.length,
      request.attachments.filter((item) => item.verified).length,
      request.payment?.amount ?? 0,
      request.payment?.receiptNumber ?? '',
      request.lastUpdated,
      request.reclamationDetails ? request.reclamationDetails.matiere : '',
    ]),
  )

  return [header, ...rows].join('\r\n')
}
