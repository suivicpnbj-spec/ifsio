import { describe, expect, it } from 'vitest'
import { formatAmount, initialsOf, makeDossierId, qrMatrix } from '@/lib/utils'

describe('formatAmount', () => {
  it('formats an amount with the establishment currency', () => {
    expect(formatAmount(15000, 'FCFA')).toBe(`${(15000).toLocaleString('fr-FR')} FCFA`)
  })

  it('returns "Gratuit" for a zero amount', () => {
    expect(formatAmount(0, 'FCFA')).toBe('Gratuit')
  })
})

describe('identifiers', () => {
  it('builds a dossier number in the ACTE-YYYY-0000 format', () => {
    expect(makeDossierId('ACTE')).toMatch(/^ACTE-\d{4}-\d{4}$/)
  })

  it('keeps a custom prefix', () => {
    expect(makeDossierId('REC')).toMatch(/^REC-\d{4}-\d{4}$/)
  })

  it('computes initials', () => {
    expect(initialsOf('Moussa', 'DIALLO')).toBe('MD')
  })
})

describe('qrMatrix', () => {
  it('returns a square matrix of modules', () => {
    const matrix = qrMatrix('VERIF-IFSIO-2026-12345')
    expect(matrix.length).toBeGreaterThan(20)
    expect(matrix.every((row) => row.length === matrix.length)).toBe(true)
  })

  it('is stable for a given code', () => {
    expect(qrMatrix('VERIF-IFSIO-2026-12345')).toEqual(qrMatrix('VERIF-IFSIO-2026-12345'))
  })
})
