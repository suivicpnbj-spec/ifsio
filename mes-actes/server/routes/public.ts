import { Router } from 'express'
import type { AppContext } from '../context'

export function createPublicRouter(context: AppContext): Router {
  const router = Router()
  const { repo } = context

  /** Webhook de confirmation de paiement (CinetPay). */
  router.post('/public/payments/notify', (req, res) => {
    const payload = (req.body ?? {}) as Record<string, unknown>
    const notification = context.payments.parseNotification?.(payload)

    if (!notification) {
      res.status(202).json({ received: true, handled: false })
      return
    }

    const request = repo.listRequests({}).find((item) => item.id === notification.providerRef)
    if (!request) {
      res.status(202).json({ received: true, handled: false })
      return
    }

    if (notification.status === 'confirmed') {
      const payment = repo.insertPayment({
        requestId: request.id,
        provider: 'cinetpay',
        providerRef: notification.receiptNumber,
        amount: notification.amount,
        currency: repo.getEstablishment().currency,
        status: 'confirmed',
        method: notification.method,
        receiptNumber: notification.receiptNumber,
        raw: notification.raw,
      })
      repo.confirmPayment(payment.id, {
        receiptNumber: notification.receiptNumber,
        method: notification.method,
        raw: notification.raw,
      })
      repo.updateRequest(request.id, {
        payment: {
          receiptNumber: notification.receiptNumber,
          amount: notification.amount,
          method: notification.method,
          date: new Date().toISOString(),
        },
      })
    }

    res.status(202).json({ received: true, handled: true })
  })

  /**
   * Consultation publique anti-fraude d'un acte officiel (QR Code / URL de vérification).
   * Accessible sans authentification pour les employeurs, ambassades et universités.
   */
  router.get('/public/verify/:code', (req, res) => {
    const rawCode = String(req.params.code || '').trim()
    if (!rawCode) {
      res.status(400).json({ verified: false, message: 'Le code de vérification est requis.' })
      return
    }

    const normalized = rawCode.toLowerCase()
    const allRequests = repo.listRequests({})

    const match = allRequests.find((r) => {
      if (r.id.toLowerCase() === normalized) return true
      try {
        const applicant = JSON.parse(r.applicant)
        const scelle = applicant?.academicDeliberation?.scelle_hmac
        if (scelle && scelle.toLowerCase().startsWith(normalized)) return true
      } catch (_e) {}
      return false
    })

    const establishment = repo.getEstablishment()

    if (!match) {
      res.status(404).json({
        verified: false,
        code: rawCode,
        message: 'Aucun acte ou dossier officiel ne correspond à ce code sur le registre de l’IFSIO.',
        establishment: {
          shortName: establishment.shortName,
          university: establishment.university,
          country: establishment.country,
        },
      })
      return
    }

    let applicantData: any = {}
    try {
      applicantData = JSON.parse(match.applicant)
    } catch (_e) {}

    const isDelivered = match.status === 'Validé' || match.status === 'Clôturé'
    const deliberation = applicantData?.academicDeliberation

    res.json({
      verified: true,
      delivered: isDelivered,
      status: match.status,
      document: {
        id: match.id,
        actId: match.act_id,
        actTitle: match.act_title,
        recipient: applicantData.fullName || 'Étudiant certifié',
        matricule: applicantData.matricule || 'Régulier',
        filiere: applicantData.filiere || 'Sciences Infirmières et Obstétricales',
        promotion: applicantData.promotion || '',
        createdAt: match.created_label,
        issuedAt: match.updated_label || match.created_label,
        decisionJury: deliberation?.decision_jury ? deliberation.decision_jury.toUpperCase() : (isDelivered ? 'ADMIS(E)' : 'EN COURS'),
        creditsEcts: deliberation?.credits_ects_valides || (isDelivered ? 180 : 0),
        mention: deliberation?.mention || (isDelivered ? 'Bien' : 'Non définie'),
        securityHash: deliberation?.scelle_hmac ? deliberation.scelle_hmac.slice(0, 16).toUpperCase() : match.id,
      },
      establishment: {
        name: establishment.name,
        shortName: establishment.shortName,
        university: establishment.university,
        ministry: establishment.ministry,
        country: establishment.country,
        registrarTitle: establishment.registrarTitle,
        verificationBaseUrl: establishment.verificationBaseUrl,
      },
      audit: {
        source: 'Registre National des Actes Académiques — IFSIO Parakou',
        timestamp: new Date().toISOString(),
      },
    })
  })

  return router
}
