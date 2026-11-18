import { Router } from 'express'
import { z } from 'zod'
import type { Applicant, ReclamationDetails } from '../../src/types'
import type { AppContext } from '../context'
import { toRequestDto } from '../lib/dto'
import { formatDate, formatDateTime, makeDossierId } from '../lib/format'
import { asyncHandler, badRequest, forbidden, notFound, parseBody } from '../lib/http'
import { requireAuth } from '../middleware/auth'
import { buildAcknowledgementMail, buildReceiptMail } from '../services/mailer'
import { resultatsClient } from '../services/resultatsClient'

const attachmentInputSchema = z.object({
  name: z.string().trim().min(1),
  documentName: z.string().trim().optional(),
  sizeLabel: z.string().trim().optional(),
})

const createSchema = z.object({
  actId: z.string().trim().min(2),
  purpose: z.string().trim().min(3, 'Le motif est requis.'),
  deliveryMethod: z.enum(['online', 'physical']).default('online'),
  specificResponses: z.record(z.string()).optional(),
  attachments: z.array(attachmentInputSchema).max(20).optional(),
  reclamationDetails: z
    .object({
      matiere: z.string().trim().min(2),
      codeUE: z.string().trim().optional(),
      /* Semestre et note affichée ne sont plus exigés : facultatifs. */
      semestre: z.string().trim().min(1).optional(),
      session: z.enum(['Session Normale', 'Session de Rattrapage', 'Contrôle Continu']),
      noteInitiale: z.number().min(0).max(20).optional(),
      noteEsperee: z.number().min(0).max(20).optional(),
      motifType: z.enum([
        'note_non_affichee',
        'erreur_report',
        'erreur_calcul',
        'credits_non_accordes',
        'desaccord_note',
        'bareme',
        'autre',
        /* Ancien motif conservé pour lire les dossiers déjà déposés. */
        'omission_correction',
      ]),
      argumentaire: z.string().trim().min(10),
      ecs: z.array(z.string()).optional(),
    })
    .optional(),
})

const messageSchema = z.object({
  text: z.string().trim().min(1, 'Le message est vide.'),
  attachmentName: z.string().trim().optional(),
})

const complementSchema = z.object({
  reason: z.string().trim().min(5, 'Précisez la pièce attendue.'),
})

const supplementSchema = z.object({
  name: z.string().trim().min(2),
  size: z.number().int().nonnegative().optional(),
  documentName: z.string().trim().optional(),
})

const decisionSchema = z.object({
  decision: z.enum(['rectifiee', 'maintenue', 'reprise_autorisee']),
  noteFinale: z.number().min(0).max(20),
  motif: z.string().trim().min(5, 'Le motif de la décision est requis.'),
  rapporteur: z.string().trim().min(2, 'Le rapporteur est requis.'),
})

const statusSchema = z.object({
  status: z.enum([
    'Demande reçue',
    'En traitement',
    'En vérification',
    'En attente de complément',
    'Validé',
    'Brouillon',
    'Clôturé',
  ]),
})

const paymentRecordSchema = z.object({
  receiptNumber: z.string().trim().min(3, 'Le numéro de quittance est requis.'),
  amount: z.number().int().nonnegative().optional(),
  method: z.string().trim().min(2).optional(),
})

const paymentSessionSchema = z.object({
  method: z.enum(['mobile_money', 'card']).optional(),
  operator: z.string().trim().min(2).optional(),
  phone: z.string().trim().min(6).optional(),
})

/** Convertit un libellé de taille français (« 1,2 Mo ») en octets. */
function sizeFromLabel(label?: string): number {
  if (!label) return 0
  const match = label.replace(',', '.').match(/([\d.]+)\s*(go|mo|ko|o)/i)
  if (!match) return 0
  const value = Number.parseFloat(match[1])
  const unit = match[2].toLowerCase()
  const factor = unit === 'go' ? 1024 ** 3 : unit === 'mo' ? 1024 ** 2 : unit === 'ko' ? 1024 : 1
  return Math.round(value * factor)
}

export function createRequestsRouter(context: AppContext): Router {
  const router = Router()
  const { repo, payments, mailer, config } = context

  const notifyAdmins = (payload: {
    title: string
    message: string
    requestId: string
    type: 'info' | 'success' | 'warning'
  }) => {
    for (const admin of repo.listUsers().filter((user) => user.role === 'admin')) {
      repo.insertNotification({
        userId: admin.id,
        title: payload.title,
        message: payload.message,
        label: 'À l’instant',
        type: payload.type,
        requestId: payload.requestId,
      })
    }
  }

  const notifyStudent = (studentId: string, payload: {
    title: string
    message: string
    requestId: string
    type: 'info' | 'success' | 'warning'
  }) => {
    repo.insertNotification({
      userId: studentId,
      title: payload.title,
      message: payload.message,
      label: 'À l’instant',
      type: payload.type,
      requestId: payload.requestId,
    })
  }

  const loadRequest = (id: string) => {
    const row = repo.findRequest(id)
    if (!row) throw notFound('Ce dossier n’existe pas.')
    return row
  }

  const assertAccess = (requestId: string, studentId?: string) => {
    const row = loadRequest(requestId)
    if (studentId && row.student_id !== studentId) {
      throw forbidden('Ce dossier ne vous appartient pas.')
    }
    return row
  }

  const buildDto = (id: string) => {
    const row = loadRequest(id)
    return toRequestDto(
      row,
      repo.listTimeline(row.id),
      repo.listMessages(row.id),
      repo.listAttachments(row.id),
    )
  }

  /**
   * E-mails automatiques envoyés à la validation du dépôt :
   * accusé de réception, et quittance si le règlement est confirmé.
   */
  const sendDepositEmails = async (requestId: string, withReceipt: boolean) => {
    try {
      const row = repo.findRequest(requestId)
      const user = row ? repo.findUserById(row.student_id) : undefined
      const act = row ? repo.findAct(row.act_id) : undefined
      if (!row || !user?.email) return

      const establishment = repo.getEstablishment()
      const mailContext = {
        establishmentName: establishment.name,
        establishmentShort: establishment.shortName,
        requestId: row.id,
        actTitle: row.act_title,
        studentName: `${user.first_name} ${user.last_name}`,
        studentEmail: user.email,
        currency: establishment.currency,
        trackingUrl: `${config.publicBaseUrl}/dossiers/${row.id}`,
        ...(act?.feeAmount ? { amount: act.feeAmount } : {}),
      }

      await mailer.send(buildAcknowledgementMail(mailContext))

      if (withReceipt) {
        const payment = repo
          .listPaymentsForRequest(row.id)
          .find((item) => item.status === 'confirmed')
        await mailer.send(
          buildReceiptMail({
            ...mailContext,
            amount: payment?.amount ?? act?.feeAmount ?? 0,
            receiptNumber: payment?.receipt_number ?? payment?.provider_ref ?? '',
            ...(payment?.method ? { paymentMethod: payment.method } : {}),
            ...(payment?.confirmed_at
              ? { paymentDate: formatDate(new Date(payment.confirmed_at)) }
              : {}),
          }),
        )
      }
    } catch (error) {
      // Un échec d'e-mail ne doit jamais faire échouer le dépôt.
      console.warn(`[mes-actes] e-mails non envoyés pour ${requestId} :`, error)
    }
  }

  /* ──────────────────────────── Liste et dépôt ──────────────────────────── */

  router.get(
    '/requests/eligibility/:actId',
    requireAuth(),
    asyncHandler(async (req, res) => {
      const user = repo.findUserById(req.user!.id)!
      const matricule =
        typeof req.query.matricule === 'string' && req.query.matricule.trim()
          ? req.query.matricule.trim()
          : user.matricule ?? ''
      const result = await resultatsClient.verifierEligibilite(req.params.actId, matricule)
      res.json(result)
    }),
  )

  router.get('/requests', requireAuth(), (req, res) => {
    const user = req.user!
    const status = typeof req.query.status === 'string' ? req.query.status : undefined
    const query = typeof req.query.q === 'string' ? req.query.q : undefined

    const rows = repo.listRequests({
      ...(user.role === 'student' ? { studentId: user.id } : {}),
      ...(status ? { status } : {}),
      ...(query ? { query } : {}),
    })

    res.json(
      rows.map((row) =>
        toRequestDto(
          row,
          repo.listTimeline(row.id),
          repo.listMessages(row.id),
          repo.listAttachments(row.id),
        ),
      ),
    )
  })

  router.post(
    '/requests',
    requireAuth('student'),
    asyncHandler(async (req, res) => {
    const input = parseBody(createSchema, req.body)
    const act = repo.findAct(input.actId)
    if (!act) throw notFound('Cette prestation n’existe pas.')

    const user = repo.findUserById(req.user!.id)!
    const isReclamation = Boolean(input.reclamationDetails)
    const prefix = isReclamation ? 'REC' : 'ACTE'
    const sequence = repo.nextSequence(`dossier-${prefix.toLowerCase()}`)
    const id = makeDossierId(sequence, prefix)

    const applicant: Applicant = {
      fullName: `${user.first_name} ${user.last_name}`,
      firstName: user.first_name,
      lastName: user.last_name,
      matricule: user.matricule ?? '',
      promotion: user.promotion ?? '',
      filiere: user.filiere ?? '',
      email: user.email,
      telephone: user.phone ?? '',
      deliveryMethod: input.deliveryMethod,
      purpose: input.purpose,
      ...(input.specificResponses ? { specificResponses: input.specificResponses } : {}),
    }

    if (user.matricule) {
      try {
        const verification = await resultatsClient.verifierEligibilite(act.id, user.matricule)
        if (verification.deliberation) {
          applicant.academicDeliberation = {
            admissible: verification.deliberation.admissible,
            decision_jury: verification.deliberation.decision_jury,
            moyenne_generale: verification.deliberation.moyenne_generale,
            mention: verification.deliberation.mention,
            credits_ects_valides: verification.deliberation.credits_ects_valides,
            credits_ects_requis: verification.deliberation.credits_ects_requis,
            date_deliberation: verification.deliberation.date_deliberation,
            ...(verification.securite?.scelle_hmac ? { scelle_hmac: verification.securite.scelle_hmac } : {}),
          }
        }
      } catch (err) {
        console.warn(`[requests] Délibération non synchronisée pour ${user.matricule} :`, err)
      }
    }

    const now = new Date()

    repo.insertRequest({
      id,
      studentId: user.id,
      actId: act.id,
      actTitle: act.title,
      serviceType: act.serviceType,
      status: 'Demande reçue',
      applicant,
      reclamation: (input.reclamationDetails as ReclamationDetails | undefined) ?? null,
      createdAt: now.toISOString(),
      createdLabel: formatDate(now),
      updatedAt: now.toISOString(),
      updatedLabel: formatDateTime(now),
    })

    for (const file of input.attachments ?? []) {
      repo.insertAttachment({
        requestId: id,
        ownerId: user.id,
        name: file.name,
        storedName: `pending-${id}-${Date.now()}-${file.name.replace(/[^A-Za-z0-9._-]/g, '_')}`,
        documentName: file.documentName ?? null,
        size: sizeFromLabel(file.sizeLabel),
        mime: null,
        uploadedAt: formatDate(now),
      })
    }

    repo.insertTimelineEvent({
      requestId: id,
      title: isReclamation ? 'Recours enregistré' : 'Demande enregistrée',
      label: formatDateTime(now),
      description: isReclamation
        ? 'Dépôt formel transmis au secrétariat de la commission d’examen.'
        : 'Votre dossier a été transmis au secrétariat académique.',
      completed: true,
      current: true,
    })

    repo.audit({
      actorId: user.id,
      actorRole: user.role,
      action: 'request.create',
      entity: 'request',
      entityId: id,
      details: { actId: act.id },
    })

    notifyAdmins({
      title: `Nouveau dossier (${id})`,
      message: `${applicant.fullName} a déposé une demande « ${act.title} ».`,
      requestId: id,
      type: 'info',
    })

    // Prestation gratuite : le dépôt est validé tout de suite — accusé de réception.
    if (!act.feeAmount) {
      await sendDepositEmails(id, false)
    }    res.status(201).json(buildDto(id))
    }),
  )




  router.get('/requests/:id', requireAuth(), (req, res) => {
    const user = req.user!
    assertAccess(req.params.id, user.role === 'student' ? user.id : undefined)
    res.json(buildDto(req.params.id))
  })

  /* ─────────────────────────────── Messagerie ───────────────────────────── */

  router.post('/requests/:id/messages', requireAuth(), (req, res) => {
    const input = parseBody(messageSchema, req.body)
    const user = req.user!
    const row = assertAccess(req.params.id, user.role === 'student' ? user.id : undefined)

    repo.insertMessage({
      requestId: row.id,
      role: user.role,
      author: `${user.firstName} ${user.lastName}`,
      text: input.text,
      label: formatDateTime(new Date()),
      attachmentName: input.attachmentName ?? null,
    })
    repo.updateRequest(row.id, {})

    if (user.role === 'student') {
      notifyAdmins({
        title: `Message sur ${row.id}`,
        message: input.text.slice(0, 160),
        requestId: row.id,
        type: 'info',
      })
    } else {
      notifyStudent(row.student_id, {
        title: `Message de la scolarité (${row.id})`,
        message: input.text.slice(0, 160),
        requestId: row.id,
        type: 'info',
      })
    }

    res.status(201).json(buildDto(row.id))
  })

  /* ─────────────────────── Demande de complément (scolarité) ─────────────── */

  router.post('/requests/:id/complement', requireAuth('admin'), (req, res) => {
    const input = parseBody(complementSchema, req.body)
    const row = loadRequest(req.params.id)
    const now = new Date()

    repo.updateRequest(row.id, {
      status: 'En attente de complément',
      admin_note: input.reason,
    })
    repo.insertTimelineEvent({
      requestId: row.id,
      title: 'Pièce complémentaire requise par la scolarité',
      label: formatDateTime(now),
      description: input.reason,
      completed: false,
      current: true,
      author: 'Scolarité',
    })
    repo.insertMessage({
      requestId: row.id,
      role: 'admin',
      author: 'Scolarité',
      text: input.reason,
      label: formatDateTime(now),
    })

    notifyStudent(row.student_id, {
      title: `Complément requis (${row.id})`,
      message: input.reason,
      requestId: row.id,
      type: 'warning',
    })

    res.json(buildDto(row.id))
  })

  /* ─────────────────────── Pièce complémentaire (étudiant) ────────────────── */

  router.post('/requests/:id/supplement', requireAuth('student'), (req, res) => {
    const input = parseBody(supplementSchema, req.body)
    const row = assertAccess(req.params.id, req.user!.id)
    const now = new Date()

    // Le fichier a déjà été envoyé via POST /requests/:id/attachments :
    // on enregistre ici la trace d’instruction (statut, fil, message, notification).
    repo.updateRequest(row.id, { status: 'En traitement', admin_note: null })
    repo.insertTimelineEvent({
      requestId: row.id,
      title: 'Pièce complémentaire transmise',
      label: formatDateTime(now),
      description: `Le document « ${input.name} » a été ajouté au dossier.`,
      completed: true,
    })
    repo.insertMessage({
      requestId: row.id,
      role: 'student',
      author: `${req.user!.firstName} ${req.user!.lastName}`,
      text: 'Pièce complémentaire transmise pour instruction du dossier.',
      label: formatDateTime(now),
      attachmentName: input.name,
    })

    notifyAdmins({
      title: `Complément reçu (${row.id})`,
      message: 'Le dossier est de nouveau en cours de traitement.',
      requestId: row.id,
      type: 'info',
    })

    res.status(201).json(buildDto(row.id))
  })

  /* ─────────────────── Validation du dossier (scolarité) ─────────────── */

  router.post('/requests/:id/approve', requireAuth('admin'), (req, res) => {
    const row = loadRequest(req.params.id)
    const now = new Date()

    repo.completeTimeline(row.id)
    repo.updateRequest(row.id, {
      status: 'Validé',
      admin_note: null,
    })
    repo.insertTimelineEvent({
      requestId: row.id,
      title: 'Dossier validé par la scolarité',
      label: `Le ${formatDate(now)}`,
      description:
        'Instruction terminée. Le retrait de l’acte se fait auprès de l’administration de l’établissement.',
      completed: true,
      author: `${req.user!.firstName} ${req.user!.lastName}`,
    })

    repo.audit({
      actorId: req.user!.id,
      actorRole: req.user!.role,
      action: 'request.approve',
      entity: 'request',
      entityId: row.id,
      details: { status: 'Validé' },
    })

    notifyStudent(row.student_id, {
      title: 'Votre dossier est validé',
      message: `Le dossier ${row.id} a été validé par la scolarité. L’acte est à retirer auprès de l’administration.`,
      requestId: row.id,
      type: 'success',
    })

    res.json(buildDto(row.id))
  })

  /* ───────────────────────── Décision de réclamation ─────────────────────── */

  router.post('/requests/:id/decision', requireAuth('admin'), (req, res) => {
    const input = parseBody(decisionSchema, req.body)
    const row = loadRequest(req.params.id)
    const now = new Date()
    const favorable = input.decision === 'rectifiee'
    const pvReference = `PV-REC-${now.getFullYear()}-${String(repo.nextSequence('pv')).padStart(4, '0')}`
    const reclamation = row.reclamation ? (JSON.parse(row.reclamation) as ReclamationDetails) : undefined

    const details: ReclamationDetails = {
      matiere: reclamation?.matiere ?? 'Matière contestée',
      ...(reclamation?.codeUE ? { codeUE: reclamation.codeUE } : {}),
      ...(reclamation?.semestre ? { semestre: reclamation.semestre } : {}),
      session: reclamation?.session ?? 'Session Normale',
      ...(reclamation?.noteInitiale !== undefined ? { noteInitiale: reclamation.noteInitiale } : {}),
      ...(reclamation?.noteEsperee !== undefined ? { noteEsperee: reclamation.noteEsperee } : {}),
      motifType: reclamation?.motifType ?? 'autre',
      argumentaire: reclamation?.argumentaire ?? '',
      ...(reclamation?.ecs ? { ecs: reclamation.ecs } : {}),
      commissionDecision: {
        date: formatDate(now),
        decision: input.decision,
        noteFinale: favorable ? input.noteFinale : reclamation?.noteInitiale,
        rapporteur: input.rapporteur,
        motif: input.motif,
        pvReference,
      },
    }

    repo.updateRequest(row.id, {
      status: favorable ? 'Validé' : 'Clôturé',
      reclamation: details,
    })

    repo.insertTimelineEvent({
      requestId: row.id,
      title: favorable
        ? 'Délibération favorable : note rectifiée'
        : 'Délibération du jury : note maintenue',
      label: `Le ${formatDate(now)}`,
      description: `Rapporteur : ${input.rapporteur}. Décision ${pvReference} : « ${input.motif} »${
        favorable ? ` (Nouvelle note : ${input.noteFinale.toFixed(2)}/20)` : ''
      }.`,
      completed: true,
      author: input.rapporteur,
    })

    notifyStudent(row.student_id, {
      title: favorable ? 'Recours accepté — note rectifiée' : 'Décision de la commission pédagogique',
      message: favorable
        ? `Votre réclamation ${row.id} a été délibérée : note rectifiée à ${input.noteFinale.toFixed(2)}/20.`
        : `Votre réclamation ${row.id} a été délibérée : note initiale maintenue.`,
      requestId: row.id,
      type: favorable ? 'success' : 'info',
    })

    res.json(buildDto(row.id))
  })

  router.patch('/requests/:id/status', requireAuth('admin'), (req, res) => {
    const input = parseBody(statusSchema, req.body)
    const row = loadRequest(req.params.id)
    repo.updateRequest(row.id, { status: input.status })
    repo.audit({
      actorId: req.user!.id,
      actorRole: req.user!.role,
      action: 'request.status',
      entity: 'request',
      entityId: row.id,
      details: { status: input.status },
    })
    res.json(buildDto(row.id))
  })

  router.patch('/requests/:id/attachments/:attachmentId', requireAuth('admin'), (req, res) => {
    const row = loadRequest(req.params.id)
    const attachment = repo.findAttachment(req.params.attachmentId)
    if (!attachment || attachment.request_id !== row.id) {
      throw notFound('Cette pièce jointe n’existe pas.')
    }

    const verified = typeof req.body?.verified === 'boolean' ? req.body.verified : !attachment.verified
    repo.setAttachmentVerified(attachment.id, verified)

    res.json(buildDto(row.id))
  })

  /* ────────────────────────────────── Paiements ─────────────────────────── */

  router.post(
    '/requests/:id/payment/session',
    requireAuth('student'),
    asyncHandler(async (req, res) => {
    const row = assertAccess(req.params.id, req.user!.id)
    const act = repo.findAct(row.act_id)
    const amount = act?.feeAmount ?? 0

    if (!amount) {
      throw badRequest('Cette prestation est gratuite : aucun règlement n’est nécessaire.')
    }

    const user = repo.findUserById(req.user!.id)!
    const establishment = repo.getEstablishment()

    const parsed = paymentSessionSchema.safeParse(req.body ?? {})
    const options = parsed.success ? parsed.data : {}

    // Un refus du prestataire (solde insuffisant, KYC carte, numéro invalide) est
    // une erreur métier : il est remonté en 400, pas comme une panne du serveur.
    const session = await payments
      .createSession({
        requestId: row.id,
        amount,
        currency: establishment.currency,
        customerName: `${user.first_name} ${user.last_name}`,
        customerEmail: user.email,
        customerPhone: options.phone ?? user.phone ?? '',
        establishmentName: establishment.name,
        ...(options.method ? { method: options.method } : {}),
        ...(options.operator ? { operator: options.operator } : {}),
      })
      .catch((error: unknown) => {
        throw badRequest(error instanceof Error ? error.message : 'Le règlement n’a pas pu être ouvert.')
      })

    const payment = repo.insertPayment({
      requestId: row.id,
      provider: session.provider,
      providerRef: session.providerRef,
      amount: session.amount,
      currency: session.currency,
      status: session.status,
      instructions: session.instructions,
      checkoutUrl: session.checkoutUrl ?? null,
    })

    if (session.status === 'confirmed') {
      repo.confirmPayment(payment.id, { method: session.provider })
      repo.updateRequest(row.id, {
        payment: {
          receiptNumber: session.providerRef,
          amount: session.amount,
          method: session.provider,
          date: formatDate(new Date()),
        },
      })
      await sendDepositEmails(row.id, true)
    }

    res.status(201).json({
      session: {
        provider: session.provider,
        providerRef: session.providerRef,
        amount: session.amount,
        currency: session.currency,
        status: session.status,
        instructions: session.instructions,
        checkoutUrl: session.checkoutUrl ?? null,
      },
      request: buildDto(row.id),
      })
    }),
  )

  /**
   * Retour du checkout : le serveur recontrôle le statut auprès du prestataire
   * avant de valider le dépôt (la seule parole du navigateur ne suffit pas).
   */
  router.post(
    '/requests/:id/payment/confirm',
    requireAuth('student'),
    asyncHandler(async (req, res) => {
    const row = assertAccess(req.params.id, req.user!.id)
    const paymentsForRequest = repo.listPaymentsForRequest(row.id)
    const asked = typeof req.body?.reference === 'string' ? req.body.reference.trim() : ''
    const payment =
      paymentsForRequest.find((item) => item.provider_ref === asked) ?? paymentsForRequest[0]

    if (!payment) throw badRequest('Aucun règlement n’est en cours pour ce dossier.')
    if (payment.status === 'confirmed') return res.json(buildDto(row.id))
    if (!payments.checkStatus) {
      throw badRequest('Le prestataire en place ne permet pas de vérifier le statut d’un paiement.')
    }

    const status = await payments.checkStatus(payment.provider_ref ?? '')
    if (status === 'pending') {
      throw badRequest(
        'Le règlement n’est pas encore confirmé par l’opérateur. Patientez quelques instants puis réessayez.',
      )
    }
    if (status === 'failed') {
      throw badRequest('Le règlement a échoué. Vous pouvez relancer un paiement depuis votre dossier.')
    }

    const receiptNumber = payment.receipt_number ?? payment.provider_ref ?? ''
    repo.confirmPayment(payment.id, { receiptNumber, method: payment.method ?? payments.id })
    repo.updateRequest(row.id, {
      payment: {
        receiptNumber,
        amount: payment.amount,
        method: payment.method ?? payments.label,
        date: formatDate(new Date()),
      },
    })
    repo.insertTimelineEvent({
      requestId: row.id,
      title: 'Paiement confirmé',
      label: formatDateTime(new Date()),
      description: `Règlement de ${payment.amount} ${payment.currency} reçu — quittance ${receiptNumber}.`,
      completed: true,
      current: true,
    })
    notifyStudent(row.student_id, {
      title: `Paiement confirmé (${row.id})`,
      message: `Votre règlement de ${payment.amount} ${payment.currency} a été confirmé (quittance ${receiptNumber}).`,
      requestId: row.id,
      type: 'success',
    })
    await sendDepositEmails(row.id, true)

    res.json(buildDto(row.id))
    }),
  )

  /**
   * Notification serveur à serveur du prestataire (FeeXPay) : le statut est
   * systématiquement recontrôlé auprès de l’API authentifiée avant de valider.
   */
  router.post(
    '/payments/notify/:provider',
    asyncHandler(async (req, res) => {
    const parsedNotification = payments.parseNotification?.(req.body ?? {})
    const reference = parsedNotification?.providerRef
    if (!reference) {
      return res.status(400).json({ error: 'Référence de paiement absente.' })
    }

    const payment = repo.findPaymentByProviderRef(reference)
    if (!payment) throw notFound('Aucun règlement ne correspond à cette référence.')
    if (payment.status === 'confirmed') return res.json({ received: true })

    const status = await payments.checkStatus?.(reference)
    if (status === 'confirmed') {
      const receiptNumber = payment.receipt_number ?? payment.provider_ref ?? reference
      const requestRow = repo.findRequest(payment.request_id)
      repo.confirmPayment(payment.id, { receiptNumber, method: payment.method ?? payments.id })
      repo.updateRequest(payment.request_id, {
        payment: {
          receiptNumber,
          amount: payment.amount,
          method: payment.method ?? payments.label,
          date: formatDate(new Date()),
        },
      })
      if (requestRow) {
        notifyStudent(requestRow.student_id, {
          title: `Paiement confirmé (${payment.request_id})`,
          message: `Votre règlement de ${payment.amount} ${payment.currency} a été confirmé (quittance ${receiptNumber}).`,
          requestId: payment.request_id,
          type: 'success',
        })
      }
      await sendDepositEmails(payment.request_id, true)
    }

    res.json({ received: true, status: status ?? 'unknown' })
    }),
  )

  router.post(
    '/requests/:id/payment/record',
    requireAuth('admin'),
    asyncHandler(async (req, res) => {
    const input = parseBody(paymentRecordSchema, req.body)
    const row = loadRequest(req.params.id)
    const act = repo.findAct(row.act_id)
    const amount = input.amount ?? act?.feeAmount ?? 0
    const method = input.method ?? 'Espèces (guichet)'

    const payment = repo.insertPayment({
      requestId: row.id,
      provider: 'manual',
      providerRef: input.receiptNumber,
      amount,
      currency: repo.getEstablishment().currency,
      status: 'confirmed',
      method,
      receiptNumber: input.receiptNumber,
    })
    repo.confirmPayment(payment.id, { receiptNumber: input.receiptNumber, method })

    repo.updateRequest(row.id, {
      payment: {
        receiptNumber: input.receiptNumber,
        amount,
        method,
        date: formatDate(new Date()),
      },
    })

    repo.audit({
      actorId: req.user!.id,
      actorRole: req.user!.role,
      action: 'payment.record',
      entity: 'request',
      entityId: row.id,
      details: { amount, receiptNumber: input.receiptNumber },
    })

    notifyStudent(row.student_id, {
      title: `Règlement enregistré (${row.id})`,
      message: `Votre règlement de ${amount} FCFA a été enregistré (quittance ${input.receiptNumber}).`,
      requestId: row.id,
      type: 'success',
    })

    await sendDepositEmails(row.id, true)

    res.json(buildDto(row.id))
    }),
  )

  /* Consultation et téléchargement de l'Acte officiel certifié */
  router.get(
    '/requests/:id/official-document',
    requireAuth(),
    asyncHandler(async (req, res) => {
      const row = loadRequest(req.params.id)
      const user = req.user!
      if (user.role === 'student' && row.student_id !== user.id) {
        throw forbidden('Accès non autorisé à ce document officiel.')
      }
      const dto = buildDto(row.id)
      res.json({
        document: dto,
        establishment: repo.getEstablishment(),
        timestamp: new Date().toISOString(),
      })
    }),
  )

  return router
}
