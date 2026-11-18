import { encodeQrMatrix } from '@/lib/qr'

export function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ')
}

export function formatAmount(amount: number, currency: string): string {
  if (!amount) return 'Gratuit'
  return `${amount.toLocaleString('fr-FR')} ${currency}`
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

export function initialsOf(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

export function randomDigits(length: number): string {
  let value = ''
  for (let index = 0; index < length; index += 1) {
    value += Math.floor(Math.random() * 10)
  }
  return value
}

export function makeDossierId(prefix = 'ACTE'): string {
  return `${prefix}-${new Date().getFullYear()}-${randomDigits(4)}`
}

/**
 * Opens a standalone, printable copy of an official document.
 * The styles of the current page are copied so the official layout is preserved,
 * and the browser print dialog can save it as PDF.
 */
export function printNode(node: HTMLElement | null, title: string): boolean {
  if (!node) return false
  const popup = window.open('', '_blank', 'width=980,height=1200')
  if (!popup) return false

  const styles = Array.from(
    document.querySelectorAll('link[rel="stylesheet"], style'),
  )
    .map((element) => element.outerHTML)
    .join('')

  popup.document.open()
  popup.document.write(`<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>${title.replace(/[<>&]/g, '')}</title>
${styles}
<style>
  @page { size: A4; margin: 10mm; }
  body { background: #fff !important; margin: 0; padding: 16px; }
  .doc-print { max-width: 760px; margin: 0 auto; }
</style>
</head>
<body class="bg-white">
  <div class="doc-print">${node.outerHTML}</div>
</body>
</html>`)
  popup.document.close()

  const trigger = () => {
    popup.focus()
    popup.print()
  }
  if (popup.document.readyState === 'complete') {
    window.setTimeout(trigger, 300)
  } else {
    popup.addEventListener('load', () => window.setTimeout(trigger, 300))
  }
  return true
}

export function downloadJson(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

/**
 * QR matrix of a verification code, encoded with the QR specification so the
 * code can actually be scanned and decoded back (see `src/lib/qr.ts`).
 */
export function qrMatrix(code: string): boolean[][] {
  return encodeQrMatrix(code)
}
