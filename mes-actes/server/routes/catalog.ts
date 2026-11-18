import { Router } from 'express'
import { z } from 'zod'
import type { AppContext } from '../context'
import { toAdminDto, toNotificationDto, toRequestDto, toStudentDto } from '../lib/dto'
import { conflict, notFound, parseBody } from '../lib/http'
import { requireAuth } from '../middleware/auth'
import { CATEGORY_LABELS } from '../../src/data/establishment'
import type { ActItem, Audience, CategoryId, IconType, ServiceType } from '../../src/types'

const establishmentSchema = z.object({
  name: z.string().trim().min(2).optional(),
  shortName: z.string().trim().min(1).optional(),
  university: z.string().trim().min(2).optional(),
  ministry: z.string().trim().optional(),
  country: z.string().trim().optional(),
  motto: z.string().trim().optional(),
  address: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  email: z.string().trim().optional(),
  website: z.string().trim().optional(),
  currency: z.string().trim().optional(),
  registrarTitle: z.string().trim().optional(),
  filieres: z.array(z.string().trim().min(2)).optional(),
  signatories: z.array(z.string().trim().min(2)).optional(),
  verificationBaseUrl: z.string().trim().optional(),
})

const profileSchema = z.object({
  firstName: z.string().trim().min(2).optional(),
  lastName: z.string().trim().min(2).optional(),
  phone: z.string().trim().optional(),
  matricule: z.string().trim().optional(),
  ine: z.string().trim().optional(),
  filiere: z.string().trim().optional(),
  promotion: z.string().trim().optional(),
  birthDate: z.string().trim().optional(),
  birthPlace: z.string().trim().optional(),
  nationality: z.string().trim().optional(),
  address: z.string().trim().optional(),
  emergencyContact: z.string().trim().optional(),
  smsAlerts: z.boolean().optional(),
  emailAlerts: z.boolean().optional(),
})

const CATEGORY_IDS = Object.keys(CATEGORY_LABELS) as [CategoryId, ...CategoryId[]]
const ICON_TYPES: [IconType, ...IconType[]] = [
  'document',
  'transcript',
  'award',
  'duplicate',
  'certificate',
  'complaint',
  'thesis',
  'download',
]

/** Identifiant d’URL dérivé du nom, sans accents ni caractères parasites. */
function slugify(value: string): string {
  return (
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60)
      .replace(/-+$/g, '') || 'prestation'
  )
}

const createActSchema = z.object({
  title: z.string().trim().min(2, 'Le nom de la prestation est requis.'),
  shortDescription: z.string().trim().optional(),
  category: z.enum(CATEGORY_IDS),
  serviceType: z.enum(['act', 'procedure']).default('act'),
  audience: z.enum(['Étudiants', 'Diplômés', 'Tous']).default('Étudiants'),
  delay: z.string().trim().optional(),
  feeAmount: z.number().min(0).default(0),
  feeNote: z.string().trim().optional(),
  eligibilityConditions: z.array(z.string().trim()).default([]),
  requiredDocuments: z
    .array(
      z.object({
        name: z.string().trim().min(1),
        details: z.string().trim().optional(),
        mandatory: z.boolean().default(true),
      }),
    )
    .default([]),
  deliveryDetails: z.string().trim().optional(),
  iconType: z.enum(ICON_TYPES).default('certificate'),
  specificFields: z
    .array(
      z.object({
        id: z.string().trim().min(1),
        label: z.string().trim().min(1),
        type: z.enum(['text', 'select', 'date', 'textarea', 'number']),
        placeholder: z.string().optional(),
        options: z.array(z.string().trim()).optional(),
        required: z.boolean().default(false),
        defaultValue: z.string().optional(),
        help: z.string().optional(),
      }),
    )
    .optional(),
  workflowSteps: z.array(z.string().trim()).optional(),
  popular: z.boolean().default(false),
  active: z.boolean().default(true),
})

export function createCatalogRouter(context: AppContext): Router {
  const router = Router()
  const { repo } = context

  /**
   * État initial de l'application : établissement, catalogue, dossiers et
   * notifications visibles par l'appelant.
   */
  router.get('/bootstrap', (req, res) => {
    const establishment = repo.getEstablishment()
    const acts = repo.listActs()

    const user = req.user ? repo.findUserById(req.user.id) : undefined

    const requests = user
      ? repo
          .listRequests(user.role === 'student' ? { studentId: user.id } : {})
          .map((row) =>
            toRequestDto(
              row,
              repo.listTimeline(row.id),
              repo.listMessages(row.id),
              repo.listAttachments(row.id),
            ),
          )
      : []

    const notifications = user
      ? repo.listNotifications(user.id).map(toNotificationDto)
      : []

    res.json({
      establishment,
      acts,
      requests,
      notifications,
      student: user && user.role === 'student' ? toStudentDto(user) : null,
      admin: user && user.role === 'admin' ? toAdminDto(user) : null,
      role: user?.role ?? 'student',
      session: Boolean(user),
      user: user
        ? {
            id: user.id,
            role: user.role,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
          }
        : null,
    })
  })

  router.get('/establishment', (_req, res) => {
    res.json(repo.getEstablishment())
  })

  router.patch('/establishment', requireAuth('admin'), (req, res) => {
    const patch = parseBody(establishmentSchema, req.body)
    const establishment = { ...repo.getEstablishment(), ...patch }
    repo.setEstablishment(establishment)
    repo.audit({
      actorId: req.user!.id,
      actorRole: req.user!.role,
      action: 'establishment.update',
      entity: 'establishment',
      entityId: '1',
      details: patch,
    })
    res.json(establishment)
  })

  router.get('/acts', (_req, res) => {
    res.json(repo.listActs())
  })

  router.get('/acts/:id', (req, res) => {
    const act = repo.findAct(req.params.id)
    if (!act) throw notFound('Cette prestation n’existe pas.')
    res.json(act)
  })

  router.patch('/acts/:id', requireAuth('admin'), (req, res) => {
    const existing = repo.findAct(req.params.id)
    if (!existing) throw notFound('Cette prestation n’existe pas.')

    const act = { ...existing, ...(req.body as Record<string, unknown>) } as typeof existing
    repo.upsertAct(act)
    repo.audit({
      actorId: req.user!.id,
      actorRole: req.user!.role,
      action: 'act.update',
      entity: 'act',
      entityId: act.id,
      details: { delay: act.delay, feeAmount: act.feeAmount, active: act.active },
    })
    res.json(act)
  })

  /** Crée une prestation. L’identifiant d’URL est dérivé du nom, unique. */
  router.post('/acts', requireAuth('admin'), (req, res) => {
    const input = parseBody(createActSchema, req.body)

    const taken = new Set(repo.listActs().map((act) => act.id))
    const base = slugify(input.title)
    let id = base
    for (let suffix = 2; taken.has(id); suffix += 1) id = `${base}-${suffix}`

    const act: ActItem = {
      id,
      title: input.title,
      shortDescription: input.shortDescription || 'Prestation à décrire.',
      category: input.category,
      categoryLabel: CATEGORY_LABELS[input.category] ?? input.category,
      serviceType: input.serviceType as ServiceType,
      audience: input.audience as Audience,
      deliveryMode: 'Retrait',
      delay: input.delay || 'Délai à définir',
      feeAmount: input.feeAmount,
      ...(input.feeNote ? { feeNote: input.feeNote } : {}),
      eligibilityConditions: input.eligibilityConditions.filter(Boolean),
      requiredDocuments: input.requiredDocuments.filter((document) => document.name),
      deliveryDetails:
        input.deliveryDetails ||
        'Retrait de l’acte auprès de l’administration après validation du dossier.',
      iconType: input.iconType,
      ...(input.specificFields?.length ? { specificFields: input.specificFields } : {}),
      ...(input.workflowSteps?.length ? { workflowSteps: input.workflowSteps } : {}),
      ...(input.popular ? { popular: true } : {}),
      active: input.active,
    }

    repo.upsertAct(act, repo.listActs().length)
    repo.audit({
      actorId: req.user!.id,
      actorRole: req.user!.role,
      action: 'act.create',
      entity: 'act',
      entityId: act.id,
      details: { title: act.title, category: act.category },
    })
    res.status(201).json(act)
  })

  /**
   * Supprime une prestation — refusée tant que des dossiers lui sont rattachés
   * (on masque plutôt, pour ne pas orpheliner l’historique et les statistiques).
   */
  router.delete('/acts/:id', requireAuth('admin'), (req, res) => {
    const existing = repo.findAct(req.params.id)
    if (!existing) throw notFound('Cette prestation n’existe pas.')

    const linked = repo.countRequestsForAct(existing.id)
    if (linked > 0) {
      throw conflict(
        `${linked} dossier${linked > 1 ? 's' : ''} rattaché${linked > 1 ? 's' : ''} à « ${existing.title} » : suppression impossible. Masquez-la plutôt (case « Visible dans le catalogue public »).`,
      )
    }

    repo.deleteAct(existing.id)
    repo.audit({
      actorId: req.user!.id,
      actorRole: req.user!.role,
      action: 'act.delete',
      entity: 'act',
      entityId: existing.id,
      details: { title: existing.title },
    })
    res.json({ id: existing.id, deleted: true })
  })

  router.get('/profile', requireAuth(), (req, res) => {
    const user = repo.findUserById(req.user!.id)
    if (!user) throw notFound('Compte introuvable.')
    res.json(user.role === 'admin' ? toAdminDto(user) : toStudentDto(user))
  })

  router.patch('/profile', requireAuth(), (req, res) => {
    const patch = parseBody(profileSchema, req.body)
    const user = repo.findUserById(req.user!.id)
    if (!user) throw notFound('Compte introuvable.')

    repo.updateUserProfile(user.id, {
      ...(patch.firstName !== undefined ? { first_name: patch.firstName } : {}),
      ...(patch.lastName !== undefined ? { last_name: patch.lastName } : {}),
      ...(patch.phone !== undefined ? { phone: patch.phone } : {}),
      ...(patch.matricule !== undefined ? { matricule: patch.matricule } : {}),
      ...(patch.ine !== undefined ? { ine: patch.ine } : {}),
      ...(patch.filiere !== undefined ? { filiere: patch.filiere } : {}),
      ...(patch.promotion !== undefined ? { promotion: patch.promotion } : {}),
      ...(patch.birthDate !== undefined ? { birth_date: patch.birthDate } : {}),
      ...(patch.birthPlace !== undefined ? { birth_place: patch.birthPlace } : {}),
      ...(patch.nationality !== undefined ? { nationality: patch.nationality } : {}),
      ...(patch.address !== undefined ? { address: patch.address } : {}),
      ...(patch.emergencyContact !== undefined ? { emergency_contact: patch.emergencyContact } : {}),
      ...(patch.smsAlerts !== undefined ? { sms_alerts: patch.smsAlerts } : {}),
      ...(patch.emailAlerts !== undefined ? { email_alerts: patch.emailAlerts } : {}),
    })

    const updated = repo.findUserById(user.id)!
    repo.audit({
      actorId: user.id,
      actorRole: user.role,
      action: 'profile.update',
      entity: 'user',
      entityId: user.id,
    })
    res.json(updated.role === 'admin' ? toAdminDto(updated) : toStudentDto(updated))
  })

  return router
}
