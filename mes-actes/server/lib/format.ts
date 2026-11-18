/**
 * Formatage partagé avec le front (dates en français, identifiants de dossier).
 *
 * `src/lib/utils.ts` n'est pas importable côté serveur : il tire `qrcode`
 * via un alias `@/`. Les formats ci-dessous sont donc rejoués ici, et un
 * test unitaire (`server/lib/format.test.ts`) vérifie qu'ils restent
 * identiques à ceux du front.
 */

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

export function formatDate(date = new Date()): string {
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatDateTime(date = new Date()): string {
  return `${formatDate(date)} à ${date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })}`
}

/** Format court utilisé dans la messagerie : « 12 mars à 10:15 ». */
export function formatShortDateTime(date = new Date()): string {
  return `${date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} à ${date.toLocaleTimeString(
    'fr-FR',
    { hour: '2-digit', minute: '2-digit' },
  )}`
}

export function randomDigits(length: number): number {
  let value = ''
  for (let index = 0; index < length; index += 1) {
    value += Math.floor(Math.random() * 10)
  }
  return Number(value)
}

/**
 * Construit un identifiant de dossier séquentiel et lisible :
 * `ACTE-2026-0001`. La séquence est garantie unique par le compteur SQLite.
 */
export function makeDossierId(sequence: number, prefix = 'ACTE', date = new Date()): string {
  return `${prefix}-${date.getFullYear()}-${String(sequence).padStart(4, '0')}`
}

/** Convertit une date française (« 12 mars 2025 ») en date ISO locale. */
export function parseFrenchDate(value?: string | null): Date | null {
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
