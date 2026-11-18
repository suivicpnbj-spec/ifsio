import type { Config } from '../config'

export interface PaymentSessionRequest {
  requestId: string
  amount: number
  currency: string
  customerName: string
  customerEmail: string
  customerPhone: string
  establishmentName: string
  /** Mobile Money (défaut) ou carte bancaire. */
  method?: 'mobile_money' | 'card'
  /** Opérateur Mobile Money (MTN, MOOV…). */
  operator?: string
}

export interface PaymentSession {
  provider: string
  providerRef: string
  amount: number
  currency: string
  status: 'pending' | 'confirmed'
  instructions: string
  checkoutUrl?: string
}

export interface PaymentNotification {
  providerRef: string
  transactionId: string
  status: 'confirmed' | 'failed' | 'pending'
  amount: number
  receiptNumber: string
  method: string
  raw: Record<string, unknown>
}

export interface PaymentProvider {
  readonly id: string
  readonly label: string
  createSession(request: PaymentSessionRequest): Promise<PaymentSession>
  parseNotification?(payload: Record<string, unknown>): PaymentNotification | null
  /**
   * Consulte le statut réel d'une référence auprès du prestataire.
   * Retourne `null` si le prestataire ne supporte pas la consultation.
   */
  checkStatus?(reference: string): Promise<'pending' | 'confirmed' | 'failed' | null>
}

/** Normalise un numéro béninois : « +229 01 66 00 00 00 » → « 2290166000000 ». */
function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-\.\(\)]/g, '').replace(/^(\+|00)/, '')
}

/**
 * La devise de l'établissement est une étiquette d'affichage (« FCFA ») :
 * FeeXPay attend un code ISO 4217 sur trois lettres. Tout libellé plus long
 * est ramené au franc CFA BCEAO (XOF), la devise de l'établissement.
 */
function isoCurrency(currency: string): string {
  const code = (currency || '').trim().toUpperCase()
  return code.length === 3 ? code : 'XOF'
}

/**
 * Prestataire par défaut : règlement à la caisse de l'établissement.
 * La scolarité enregistre le reçu (numéro de quittance) depuis l'espace
 * d'instruction — c'est le circuit réel des petites structures.
 */
export class ManualPaymentProvider implements PaymentProvider {
  readonly id = 'manual'
  readonly label = 'Règlement à la caisse'

  async createSession(request: PaymentSessionRequest): Promise<PaymentSession> {
    return {
      provider: this.id,
      providerRef: `MANUAL-${request.requestId}`,
      amount: request.amount,
      currency: request.currency,
      status: 'pending',
      instructions: `Versez ${request.amount} ${request.currency} au guichet de la scolarité, puis transmettez le numéro de quittance à l-agent.`,
    }
  }
}

/** Prestataire de test : confirme immédiatement le règlement. */
export class MockPaymentProvider implements PaymentProvider {
  readonly id = 'mock'
  readonly label = 'Paiement simulé'

  async createSession(request: PaymentSessionRequest): Promise<PaymentSession> {
    return {
      provider: this.id,
      providerRef: `MOCK-${request.requestId}-${Date.now()}`,
      amount: request.amount,
      currency: request.currency,
      status: 'confirmed',
      instructions: 'Paiement simulé (environnement de test).',
    }
  }
}

/**
 * Adaptateur FeeXPay — Mobile Money (MTN, Moov) et carte bancaire au Bénin.
 *
 * API v2 (`https://api-v2.feexpay.me`), authentification `Authorization: Bearer <token>` :
 * - Mobile Money : `POST /api/transactions/public/requesttopay/{réseau}` (une route par opérateur)
 * - Carte        : `POST /api/transactions/public/requesttopay/init`
 * - Statut       : `GET  /api/transactions/public/single/status/{reference}`
 *
 * Le Mobile Money béninois pousse la demande sur le téléphone : la réponse porte
 * la référence et un statut `PENDING` (ou `SUCCESSFUL` immédiat pour MTN/Moov),
 * sans `payment_url`. L'ancienne route `/requesttopay/integration` (API v1, champ
 * `reseau`) n'est plus documentée et n'est pas utilisée ici.
 *
 * La notification callback n'est jamais crue telle quelle : le statut est
 * recontrôlé auprès de l'API authentifiée avant de valider le règlement.
 */

/** Réseaux Mobile Money : segment d'URL de la route v2 correspondante. */
const MOBILE_NETWORKS: Record<string, string> = {
  MTN: 'mtn',
  MOOV: 'moov',
}

export class FeeXPayProvider implements PaymentProvider {
  readonly id = 'feexpay'
  readonly label = 'Mobile Money & Carte (FeeXPay)'

  constructor(private readonly config: Config['feexpay']) {}

  private get headers(): Record<string, string> {
    return {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.config.apiToken}`,
    }
  }

  async createSession(request: PaymentSessionRequest): Promise<PaymentSession> {
    // `return_url` / `cancel_url` ne sont acceptés ni par la carte ni par MTN/Moov
    // (routes Wave/Orange uniquement) : ils restent configurés pour ces canaux-là.
    const { apiToken, shopId, baseUrl } = this.config
    if (!apiToken || !shopId) {
      throw new Error(
        'FeeXPay n’est pas configuré : renseignez FEXPAY_API_TOKEN et FEXPAY_SHOP_ID.',
      )
    }

    const phone = normalizePhone(request.customerPhone)
    if (!phone) {
      throw new Error('Un numéro de téléphone est requis pour effectuer ce règlement.')
    }

    const [firstName, ...rest] = request.customerName.trim().split(/\s+/)
    const lastName = rest.join(' ') || firstName

    const isCard = request.method === 'card'
    const network = MOBILE_NETWORKS[(request.operator ?? 'MTN').toUpperCase()]
    if (!isCard && !network) {
      throw new Error(`Opérateur Mobile Money inconnu : ${request.operator ?? '—'}.`)
    }
    const endpoint = isCard
      ? '/api/transactions/public/requesttopay/init'
      : `/api/transactions/public/requesttopay/${network}`

    const body = isCard
      ? {
          shop: shopId,
          amount: request.amount,
          currency: isoCurrency(request.currency),
          first_name: firstName ?? '',
          last_name: lastName,
          email: request.customerEmail,
          phoneNumber: phone,
          city: 'Parakou',
          zip: '00000',
          country: 'BJ',
        }
      : {
          shop: shopId,
          amount: request.amount,
          phoneNumber: phone,
          first_name: firstName ?? '',
          last_name: lastName,
          email: request.customerEmail,
          // Renvoyé tel quel dans la notification : rattache la transaction au dossier.
          callback_info: request.requestId,
        }

    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(body),
    })

    const payload = (await response.json().catch(() => null)) as {
      message?: string
      error?: string
      status?: string
      payment_url?: string
      reference?: string
      order_id?: string
      errors?: { property?: string; constraints?: string[] }[]
      response_operator?: { description?: string[] }
    } | null

    // Une erreur de validation est générique (« Validation failed ») : le détail
    // utile pour l'étudiant se trouve dans `errors[].constraints[]`.
    const failure =
      payload?.errors?.[0]?.constraints?.[0] ??
      payload?.message ??
      payload?.error ??
      payload?.response_operator?.description?.[0]
    const outcome = String(payload?.status ?? '').toUpperCase()
    if (!response.ok || !payload || outcome === 'FAILED') {
      throw new Error(
        failure ?? `FeeXPay a refusé la création du paiement (${response.status}).`,
      )
    }

    const reference = payload.reference || payload.order_id || request.requestId

    return {
      provider: this.id,
      providerRef: reference,
      amount: request.amount,
      currency: request.currency,
      // MTN/Moov renvoient le statut final dans la réponse : rien à re-consulter.
      status: outcome === 'SUCCESSFUL' ? 'confirmed' : 'pending',
      instructions: isCard
        ? 'Réglez depuis la page sécurisée FeeXPay (carte Visa/Mastercard).'
        : 'Validez le paiement dans votre application Mobile Money (MTN ou Moov).',
      ...(payload.payment_url ? { checkoutUrl: payload.payment_url } : {}),
    }
  }

  async checkStatus(reference: string): Promise<'pending' | 'confirmed' | 'failed' | null> {
    if (!reference) return null
    const response = await fetch(
      `${this.config.baseUrl}/api/transactions/public/single/status/${encodeURIComponent(reference)}`,
      { headers: this.headers },
    )
    if (!response.ok) {
      throw new Error(`FeeXPay n’a pas pu consulter la référence ${reference} (${response.status}).`)
    }

    const payload = (await response.json().catch(() => null)) as
      | { status?: string; amount?: number }
      | null
    const status = String(payload?.status ?? '').toUpperCase()
    if (status === 'SUCCESSFUL') return 'confirmed'
    if (status === 'FAILED') return 'failed'
    return 'pending'
  }

  parseNotification(payload: Record<string, unknown>): PaymentNotification | null {
    const reference = String(payload.reference ?? payload.order_id ?? payload.transaction_id ?? '')
    if (!reference) return null
    const status = String(payload.status ?? '').toUpperCase()

    return {
      providerRef: reference,
      transactionId: String(payload.transaction_id ?? reference),
      status: status === 'SUCCESSFUL' ? 'confirmed' : status === 'FAILED' ? 'failed' : 'pending',
      amount: Number(payload.amount ?? 0),
      receiptNumber: reference,
      method: String(payload.payment_method ?? 'mobile_money'),
      raw: payload,
    }
  }
}

/**
 * Adaptateur CinetPay — Mobile Money (MTN MoMo, Moov Money, Moov) au Bénin.
 *
 * L'API publique de CinetPay est appelée sur `POST {baseUrl}/cinetpay.ens/charge`
 * (paramètres form-urlencés) ; la plateforme notifie ensuite le merchant via
 * `notify_url` avec `status`, `trans_id`, `transaction_id`, `amount`…
 *
 * Les identifiants se configurent par variables d'environnement :
 * CINETPAY_API_KEY, CINETPAY_SITE_ID, CINETPAY_SECRET.
 */
export class CinetPayProvider implements PaymentProvider {
  readonly id = 'cinetpay'
  readonly label = 'Mobile Money (MTN MoMo / Moov Money)'

  constructor(private readonly config: Config['cinetpay']) {}

  async createSession(request: PaymentSessionRequest): Promise<PaymentSession> {
    const { apiKey, siteId, secret, baseUrl, notifyUrl, returnUrl } = this.config
    if (!apiKey || !siteId || !secret) {
      throw new Error(
        'CinetPay n’est pas configuré : renseignez CINETPAY_API_KEY, CINETPAY_SITE_ID et CINETPAY_SECRET.',
      )
    }

    const body = new URLSearchParams({
      apikey: apiKey,
      amount: String(request.amount),
      currency: 'XOF',
      transaction_id: request.requestId,
      merchant_id: siteId,
      merchant_password: secret,
      notify_url: notifyUrl,
      return_url: returnUrl,
      customer_name: request.customerName,
      customer_email: request.customerEmail,
      customer_phone: request.customerPhone,
      payment_method: 'mobile_money',
      metadata: JSON.stringify({
        order_id: request.requestId,
        establishment: request.establishmentName,
        amount: request.amount,
        currency: request.currency,
      }),
    })

    const response = await fetch(`${baseUrl}/cinetpay.ens/charge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })

    const payload = (await response.json()) as {
      code?: number
      message?: string
      data?: { payment_url?: string; payment_id?: string }
    }

    if (!response.ok || payload.code !== 201) {
      throw new Error(payload.message ?? `CinetPay a refusé la création du paiement (${response.status}).`)
    }

    return {
      provider: this.id,
      providerRef: payload.data?.payment_id ?? request.requestId,
      amount: request.amount,
      currency: request.currency,
      status: 'pending',
      instructions: 'Validez le paiement dans votre application Mobile Money (MTN MoMo ou Moov Money).',
      ...(payload.data?.payment_url ? { checkoutUrl: payload.data.payment_url } : {}),
    }
  }

  parseNotification(payload: Record<string, unknown>): PaymentNotification | null {
    const status = String(payload.status ?? '').toLowerCase()
    if (!status) return null

    const transactionId = String(payload.transaction_id ?? payload.order_id ?? '')
    const receiptNumber = String(payload.trans_id ?? payload.transaction_id ?? '')

    return {
      providerRef: receiptNumber || transactionId,
      transactionId,
      status: status === 'success' ? 'confirmed' : 'failed',
      amount: Number(payload.amount ?? 0),
      receiptNumber: receiptNumber || transactionId,
      method: String(payload.payment_method ?? 'mobile_money'),
      raw: payload,
    }
  }
}

export function createPaymentProvider(config: Config): PaymentProvider {
  switch (config.paymentProvider) {
    case 'mock':
      return new MockPaymentProvider()
    case 'feexpay':
      return new FeeXPayProvider(config.feexpay)
    case 'cinetpay':
      return new CinetPayProvider(config.cinetpay)
    case 'manual':
    default:
      return new ManualPaymentProvider()
  }
}
