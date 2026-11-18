import { CSV_BOM } from './csv'

/**
 * Déclenche le téléchargement d'un CSV depuis le navigateur.
 * Isolé de `csv.ts` : ce dernier reste utilisable côté serveur (Node),
 * où `document` n'existe pas.
 */
export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([CSV_BOM + content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
