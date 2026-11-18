import { mkdirSync } from 'node:fs'
import { ACTS_CATALOG } from '../../src/data/acts'
import { DEFAULT_ADMIN } from '../../src/data/profiles'
import { DEFAULT_ESTABLISHMENT } from '../../src/data/establishment'
import { hashPassword } from '../lib/crypto'
import type { Database } from './database'
import { Repository } from './repository'

export interface SeedResult {
  seeded: boolean
  users: number
  requests: number
  /** Compte scolarité de développement créé faute de configuration. */
  devAdmin?: { email: string; password: string }
}

export interface SeedOptions {
  /** Environnement de production : aucun compte par défaut, configuration obligatoire. */
  isProduction?: boolean
  /** Compte scolarité à créer au premier démarrage. */
  admin?: { email: string; password: string; firstName: string; lastName: string } | null
}

/** Compte local de développement (jamais créé en production). */
const DEV_ADMIN = { email: 'scolarite@local.test', password: 'ScolariteLocal2026!' }

/**
 * Amorce la base : établissement, catalogue d'actes, puis le compte
 * scolarité. Aucun compte ni dossier de démonstration n'est créé — les
 * comptes de test sont créés par les parcours de test (inscription, e2e).
 * Sans effet si la base contient déjà des comptes.
 */
export function seedDatabase(db: Database, uploadDir: string, options: SeedOptions = {}): SeedResult {
  const repository = new Repository(db)

  /* ── Établissement et catalogue (idempotent) ── */
  if (repository.listActs().length === 0) {
    repository.setEstablishment(DEFAULT_ESTABLISHMENT)
    ACTS_CATALOG.forEach((act, index) => repository.upsertAct(act, index))
  }

  const existingUsers = repository.listUsers().length
  if (existingUsers > 0) {
    return { seeded: false, users: existingUsers, requests: repository.listRequests({}).length }
  }

  mkdirSync(uploadDir, { recursive: true })

  const adminOptions = options.admin ?? null

  if (!adminOptions) {
    if (options.isProduction) {
      throw new Error(
        'Base vide en production : ADMIN_EMAIL et ADMIN_PASSWORD sont requis pour créer le compte scolarité.',
      )
    }

    // Développement : compte local unique, journalisé au démarrage.
    const admin = repository.insertUser({
      role: 'admin',
      email: DEV_ADMIN.email,
      passwordHash: hashPassword(DEV_ADMIN.password),
      firstName: DEFAULT_ADMIN.firstName,
      lastName: DEFAULT_ADMIN.lastName,
      title: DEFAULT_ADMIN.role,
      department: DEFAULT_ADMIN.department,
      phone: DEFAULT_ADMIN.phone,
      office: DEFAULT_ADMIN.office,
    })
    repository.audit({
      actorId: 'system',
      actorRole: 'admin',
      action: 'seed.admin.dev',
      entity: 'user',
      entityId: admin.id,
    })
    return { seeded: true, users: 1, requests: 0, devAdmin: DEV_ADMIN }
  }

  if (adminOptions.password.length < 12) {
    throw new Error('ADMIN_PASSWORD doit contenir au moins 12 caractères.')
  }

  const admin = repository.insertUser({
    role: 'admin',
    email: adminOptions.email,
    passwordHash: hashPassword(adminOptions.password),
    firstName: adminOptions.firstName,
    lastName: adminOptions.lastName,
    title: DEFAULT_ADMIN.role,
    department: DEFAULT_ADMIN.department,
    phone: DEFAULT_ADMIN.phone,
    office: DEFAULT_ADMIN.office,
  })

  repository.audit({
    actorId: 'system',
    actorRole: 'admin',
    action: 'seed.admin',
    entity: 'user',
    entityId: admin.id,
  })

  return { seeded: true, users: 1, requests: 0 }
}
