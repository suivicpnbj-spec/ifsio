import QRCode from 'qrcode'

/**
 * Encodes a verification code into a standard QR matrix.
 *
 * The matrix follows the QR specification (byte mode, error correction level M),
 * so any scanner or smartphone camera reads the exact code back — unlike a
 * decorative pattern, which cannot be decoded.
 */
export function encodeQrMatrix(code: string): boolean[][] {
  const payload = (code ?? '').trim() || 'MES-ACTES'
  const qr = QRCode.create(payload, { errorCorrectionLevel: 'M' })
  const size = qr.modules.size
  const data = qr.modules.data
  const matrix: boolean[][] = []

  for (let row = 0; row < size; row += 1) {
    const line: boolean[] = new Array<boolean>(size).fill(false)
    for (let col = 0; col < size; col += 1) {
      line[col] = Boolean(data[row * size + col])
    }
    matrix.push(line)
  }

  return matrix
}

/** Number of modules of the QR matrix used for a given payload. */
export function qrModuleCount(code: string): number {
  return encodeQrMatrix(code).length
}
