import { describe, expect, it } from 'vitest'
import { computeAdminStatistics, parseFrenchDate } from '@/lib/stats'
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
  {
    id: 'releve-notes',
    title: 'Relevé de notes',
    shortDescription: '',
    category: 'resultats',
    categoryLabel: 'Résultats',
    serviceType: 'act',
    audience: 'Étudiants',
    deliveryMode: 'Retrait',
    delay: '2 à 5 jours',
    feeAmount: 2000,
    eligibilityConditions: [],
    requiredDocuments: [],
    deliveryDetails: '',
    iconType: 'transcript',
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
    status: 'En traitement',
    applicant: {
      fullName: 'Moussa DIALLO',
      firstName: 'Moussa',
      lastName: 'DIALLO',
      matricule: 'IFSIO2023-00042',
      promotion: 'Licence 3',
      filiere: 'Soins Infirmiers',
      email: 'moussa.diallo@etudiant.up.bj',
      telephone: '+229 97 12 34 56',
      deliveryMethod: 'online',
      purpose: 'Autre motif légitime',
    },
    attachments: [],
    timeline: [],
    messages: [],
    ...overrides,
  }
}

describe('parseFrenchDate', () => {
  it('parses a French date', () => {
    const date = parseFrenchDate('21 octobre 2026')
    expect(date?.getFullYear()).toBe(2026)
    expect(date?.getMonth()).toBe(9)
    expect(date?.getDate()).toBe(21)
  })

  it('parses an ISO date', () => {
    expect(parseFrenchDate('2026-10-21')?.getDate()).toBe(21)
  })

  it('returns null for an unusable value', () => {
    expect(parseFrenchDate('demain')).toBeNull()
    expect(parseFrenchDate(undefined)).toBeNull()
  })
})

describe('computeAdminStatistics', () => {
  it('counts the dossiers by status', () => {
    const stats = computeAdminStatistics(
      [
        request(),
        request({ id: 'ACTE-2026-0002', status: 'Validé', lastUpdated: '22 octobre 2026' }),
        request({ id: 'ACTE-2026-0003', status: 'Validé', lastUpdated: '22 octobre 2026' }),
      ],
      ACTS,
    )

    expect(stats.total).toBe(3)
    expect(stats.inProgress).toBe(1)
    expect(stats.delivered).toBe(2)
    expect(stats.byStatus[0]).toMatchObject({ status: 'Validé', count: 2 })
  })

  it('sums the collected fees', () => {
    const stats = computeAdminStatistics(
      [
        request({ payment: { receiptNumber: 'Q1', amount: 2000, method: 'MoMo', date: '21 octobre 2026' } }),
        request({ payment: { receiptNumber: 'Q2', amount: 500, method: 'MoMo', date: '21 octobre 2026' } }),
        request({ id: 'ACTE-2026-0003' }),
      ],
      ACTS,
    )

    expect(stats.revenue).toBe(2500)
    expect(stats.paidFiles).toBe(2)
  })

  it('computes the completion rate', () => {
    const stats = computeAdminStatistics(
      [
        request({ status: 'Validé' }),
        request({ id: 'ACTE-2026-0002', status: 'Clôturé' }),
        request({ id: 'ACTE-2026-0003', status: 'En traitement' }),
        request({ id: 'ACTE-2026-0004', status: 'En traitement' }),
      ],
      ACTS,
    )

    expect(stats.completionRate).toBe(50)
  })

  it('ranks the acts by volume and resolves their title', () => {
    const stats = computeAdminStatistics(
      [
        request({ actId: 'releve-notes' }),
        request({ id: 'ACTE-2026-0002', actId: 'releve-notes' }),
        request({ id: 'ACTE-2026-0003' }),
      ],
      ACTS,
    )

    expect(stats.byAct[0]).toMatchObject({ actId: 'releve-notes', total: 2, title: 'Relevé de notes' })
    expect(stats.byAct[1].total).toBe(1)
  })

  it('averages the instruction delay in hours', () => {
    const stats = computeAdminStatistics(
      [
        request({ status: 'Validé', createdAt: '21 octobre 2026', lastUpdated: '22 octobre 2026' }),
        request({
          id: 'ACTE-2026-0002',
          status: 'Validé',
          createdAt: '21 octobre 2026',
          lastUpdated: '21 octobre 2026',
        }),
      ],
      ACTS,
    )

    expect(stats.averageInstructionHours).toBe(12)
  })

  it('counts the litigation files', () => {
    const stats = computeAdminStatistics(
      [
        request({
          reclamationDetails: {
            matiere: 'Pharmacologie clinique',
            semestre: 'S2',
            session: 'Session Normale',
            noteInitiale: 9,
            motifType: 'erreur_calcul',
            argumentaire: 'Total non reporté.',
          },
        }),
        request({ id: 'ACTE-2026-0002' }),
      ],
      ACTS,
    )

    expect(stats.claims).toBe(1)
  })

  it('handles an empty dataset', () => {
    const stats = computeAdminStatistics([], ACTS)
    expect(stats.total).toBe(0)
    expect(stats.completionRate).toBe(0)
    expect(stats.averageInstructionHours).toBeNull()
  })
})
