import { describe, expect, it } from 'vitest'
import { buildQueueCsv, escapeCsvValue, QUEUE_CSV_COLUMNS, toCsvRow } from '@/lib/csv'
import type { ActItem, UserRequest } from '@/types'

const ACTS: ActItem[] = [
  {
    id: 'attestation-scolarite',
    title: 'Attestation de scolarité',
    shortDescription: '',
    category: 'scolarite',
    categoryLabel: 'Scolarité',
    serviceType: 'act',
    audience: 'Étudiants',
    deliveryMode: 'Retrait',
    delay: '48 heures ouvrées',
    feeAmount: 0,
    eligibilityConditions: [],
    requiredDocuments: [],
    deliveryDetails: '',
    iconType: 'document',
  },
]

function request(overrides: Partial<UserRequest> = {}): UserRequest {
  return {
    id: 'ACTE-2026-0001',
    actId: 'attestation-scolarite',
    actTitle: 'Attestation de scolarité',
    serviceType: 'act',
    createdAt: '21 octobre 2026',
    lastUpdated: '21 octobre 2026',
    status: 'Validé',
    applicant: {
      fullName: 'Awa KOFFI',
      firstName: 'Awa',
      lastName: 'KOFFI',
      matricule: 'IFSIO2025-00999',
      promotion: 'Licence 2',
      filiere: 'Soins Infirmiers',
      email: 'awa.koffi@etudiant.up.bj',
      telephone: '+229 97 00 00 00',
      deliveryMethod: 'online',
      purpose: 'Dossier de candidature de stage',
    },
    attachments: [{ name: 'piece.pdf', size: '1,2 Mo', uploadedAt: 'Aujourd’hui', verified: true }],
    timeline: [],
    messages: [],
    payment: {
      receiptNumber: 'QUITUS-123456',
      amount: 2000,
      method: 'MTN Mobile Money',
      date: '21 octobre 2026',
    },
    ...overrides,
  }
}

describe('escapeCsvValue', () => {
  it('leaves plain values untouched', () => {
    expect(escapeCsvValue('Validé')).toBe('Validé')
  })

  it('quotes values containing the separator', () => {
    expect(escapeCsvValue('Soins; Infirmiers')).toBe('"Soins; Infirmiers"')
  })

  it('doubles internal quotes', () => {
    expect(escapeCsvValue('Projet "Alpha"')).toBe('"Projet ""Alpha"""')
  })

  it('handles empty values', () => {
    expect(escapeCsvValue(undefined)).toBe('')
    expect(escapeCsvValue(null)).toBe('')
  })
})

describe('toCsvRow', () => {
  it('joins values with a semicolon', () => {
    expect(toCsvRow(['a', 1, undefined])).toBe('a;1;')
  })
})

describe('buildQueueCsv', () => {
  it('writes the expected header', () => {
    const csv = buildQueueCsv([request()], ACTS)
    expect(csv.split('\r\n')[0]).toBe(QUEUE_CSV_COLUMNS.join(';'))
  })

  it('writes one line per dossier plus the header', () => {
    const csv = buildQueueCsv([request(), request({ id: 'ACTE-2026-0002' })], ACTS)
    expect(csv.split('\r\n')).toHaveLength(3)
  })

  it('exports the identity, the act, the status and the update date', () => {
    const csv = buildQueueCsv([request()], ACTS)
    const line = csv.split('\r\n')[1]
    expect(line).toContain('ACTE-2026-0001')
    expect(line).toContain('Awa KOFFI')
    expect(line).toContain('Attestation de scolarité')
    expect(line).toContain('Validé')
    expect(line).toContain('21 octobre 2026')
    expect(line).toContain('QUITUS-123456')
  })

  it('escapes values containing the separator', () => {
    const csv = buildQueueCsv(
      [request({ applicant: { ...request().applicant, filiere: 'Soins; Infirmiers' } })],
      ACTS,
    )
    expect(csv).toContain('"Soins; Infirmiers"')
  })

  it('leaves the payment columns empty for a free act', () => {
    const csv = buildQueueCsv([request({ payment: undefined })], ACTS)
    const cells = csv.split('\r\n')[1].split(';')
    expect(cells[10]).toBe('0')
    expect(cells[11]).toBe('')
  })
})
