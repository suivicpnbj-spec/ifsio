import { describe, expect, it } from 'vitest'
import jsQR from 'jsqr'
import { encodeQrMatrix, qrModuleCount } from '@/lib/qr'

/** Turns a QR matrix into a black & white RGBA image, the way a scanner sees it. */
function rasterize(
  matrix: boolean[][],
  scale = 4,
  quietZone = 4,
): { data: Uint8ClampedArray; width: number; height: number } {
  const size = matrix.length
  const dimension = (size + quietZone * 2) * scale
  const data = new Uint8ClampedArray(dimension * dimension * 4).fill(255)

  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (!matrix[row][col]) continue
      for (let dy = 0; dy < scale; dy += 1) {
        for (let dx = 0; dx < scale; dx += 1) {
          const x = (col + quietZone) * scale + dx
          const y = (row + quietZone) * scale + dy
          const index = (y * dimension + x) * 4
          data[index] = 0
          data[index + 1] = 0
          data[index + 2] = 0
          data[index + 3] = 255
        }
      }
    }
  }

  return { data, width: dimension, height: dimension }
}

function decode(matrix: boolean[][]): string | null {
  const { data, width, height } = rasterize(matrix)
  return jsQR(data, width, height)?.data ?? null
}

describe('encodeQrMatrix', () => {
  it('produces a QR code that a scanner decodes back to the verification code', () => {
    const code = 'VERIF-IFSIO-2026-12345'
    expect(decode(encodeQrMatrix(code))).toBe(code)
  })

  it('decodes a dossier reference as well', () => {
    const code = 'ACTE-2026-0042'
    expect(decode(encodeQrMatrix(code))).toBe(code)
  })

  it('encodes long verification codes without losing information', () => {
    const code = `VERIF-IFSIO-2026-${'A1B2C3D4E5'.repeat(2)}`
    expect(decode(encodeQrMatrix(code))).toBe(code)
  })

  it('falls back to a placeholder payload for an empty code', () => {
    expect(decode(encodeQrMatrix(''))).toBe('MES-ACTES')
  })

  it('exposes the module count of the generated matrix', () => {
    expect(qrModuleCount('VERIF-IFSIO-2026-12345')).toBe(encodeQrMatrix('VERIF-IFSIO-2026-12345').length)
  })
})
