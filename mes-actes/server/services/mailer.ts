import fs from 'node:fs'
import path from 'node:path'
import type { Config } from '../config'

export interface OutgoingMail {
  to: string
  subject: string
  html: string
  text: string
}

export interface Mailer {
  readonly id: string
  readonly label: string
  send(mail: OutgoingMail): Promise<void>
}

/**
 * Repli développement : l'e-mail est journalisé en console et dans un fichier
 * (`data/outbox.log`) pour rester consultable sans clé d'API.
 */
export class ConsoleMailer implements Mailer {
  readonly id = 'console'
  readonly label = 'Journal local (aucune clé configurée)'

  constructor(private readonly outboxFile: string) {}

  async send(mail: OutgoingMail): Promise<void> {
    const entry = [
      `─────────────────────────────────────────────`,
      `Date    : ${new Date().toISOString()}`,
      `À      : ${mail.to}`,
      `Objet   : ${mail.subject}`,
      ``,
      mail.text,
      ``,
    ].join('\n')

    console.log(`[mes-actes] e-mail (console) → ${mail.to} — « ${mail.subject} »`)

    try {
      await fs.promises.mkdir(path.dirname(this.outboxFile), { recursive: true })
      await fs.promises.appendFile(this.outboxFile, `${entry}\n`, 'utf8')
    } catch (error) {
      console.warn('[mes-actes] impossible d’écrire le journal des e-mails :', error)
    }
  }
}

/** Envoi via l'API Resend (https://resend.com/docs). */
export class ResendMailer implements Mailer {
  readonly id = 'resend'
  readonly label = 'Resend'

  constructor(
    private readonly apiKey: string,
    private readonly from: string,
  ) {}

  async send(mail: OutgoingMail): Promise<void> {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: this.from,
        to: [mail.to],
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
      }),
    })

    if (!response.ok) {
      const detail = await response.text().catch(() => '')
      throw new Error(`Resend a refusé l’envoi (${response.status}) ${detail}`.trim())
    }
  }
}

export function createMailer(config: Config): Mailer {
  if (config.mailer.provider === 'resend' && config.mailer.resendApiKey) {
    return new ResendMailer(config.mailer.resendApiKey, config.mailer.from)
  }
  return new ConsoleMailer(config.mailer.outboxFile)
}

/* ────────────────────────────── Gabarits ────────────────────────────── */

interface MailContext {
  establishmentName: string
  establishmentShort: string
  requestId: string
  actTitle: string
  studentName: string
  studentEmail: string
  amount?: number
  currency: string
  receiptNumber?: string
  paymentMethod?: string
  paymentDate?: string
  trackingUrl: string
}

function shell(establishmentShort: string, body: string, footerNote?: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f1f5f9;padding:24px;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">
      <tr><td style="background:#0e2a52;padding:20px 28px;">
        <span style="color:#ffffff;font-size:16px;font-weight:bold;letter-spacing:0.5px;">MES ACTES</span>
        <span style="color:#93c5fd;font-size:12px;"> — ${establishmentShort}</span>
      </td></tr>
      <tr><td style="padding:28px;">${body}</td></tr>
      <tr><td style="padding:16px 28px;border-top:1px solid #e2e8f0;">
        <p style="margin:0;color:#94a3b8;font-size:11px;">${footerNote ?? 'Cet e-mail a été généré automatiquement par la plateforme MES ACTES.'}</p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`
}

/** Accusé de réception : envoyé dès la validation du dépôt. */
export function buildAcknowledgementMail(ctx: MailContext): OutgoingMail {
  const subject = `Accusé de réception — dossier ${ctx.requestId}`
  const text = [
    `Bonjour ${ctx.studentName},`,
    ``,
    `Votre demande a bien été enregistrée auprès de ${ctx.establishmentName}.`,
    ``,
    `Dossier    : ${ctx.requestId}`,
    `Prestation : ${ctx.actTitle}`,
    ctx.amount ? `Frais réglés : ${ctx.amount} ${ctx.currency}` : `Frais : aucuns`,
    ``,
    `Suivez l’instruction de votre dossier à tout moment : ${ctx.trackingUrl}`,
    ``,
    `Cordialement,`,
    `Le service de la scolarité.`,
  ].join('\n')

  const html = shell(
    ctx.establishmentShort,
    `<p style="margin:0 0 16px;color:#334155;font-size:14px;">Bonjour <strong>${ctx.studentName}</strong>,</p>
     <p style="margin:0 0 20px;color:#334155;font-size:14px;">Votre demande a bien été enregistrée auprès de <strong>${ctx.establishmentName}</strong>.</p>
     <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
       <tr><td style="padding:14px 16px;border-bottom:1px solid #e2e8f0;"><span style="color:#64748b;font-size:12px;">Dossier</span><br><span style="font-family:monospace;font-size:13px;font-weight:bold;color:#0e2a52;">${ctx.requestId}</span></td></tr>
       <tr><td style="padding:14px 16px;"><span style="color:#64748b;font-size:12px;">Prestation</span><br><span style="font-size:13px;font-weight:bold;color:#0f172a;">${ctx.actTitle}</span></td></tr>
     </table>
     <p style="margin:20px 0 0;"><a href="${ctx.trackingUrl}" style="background:#0e2a52;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:8px;font-size:13px;font-weight:bold;">Suivre mon dossier</a></p>`,
  )

  return { to: ctx.studentEmail, subject, html, text }
}

/** Quittance de paiement : envoyée dès la confirmation du règlement. */
export function buildReceiptMail(ctx: MailContext): OutgoingMail {
  const subject = `Quittance de paiement — dossier ${ctx.requestId}`
  const text = [
    `Bonjour ${ctx.studentName},`,
    ``,
    `Votre règlement a été confirmé. La quittance ci-dessous est jointe à votre dossier.`,
    ``,
    `Dossier    : ${ctx.requestId}`,
    `Prestation : ${ctx.actTitle}`,
    `Montant    : ${ctx.amount} ${ctx.currency}`,
    `Quittance  : ${ctx.receiptNumber ?? '—'}`,
    `Mode       : ${ctx.paymentMethod ?? '—'}`,
    `Date       : ${ctx.paymentDate ?? new Date().toLocaleDateString('fr-FR')}`,
    ``,
    `Vous pouvez retrouver ces informations dans votre espace : ${ctx.trackingUrl}`,
    ``,
    `Cordialement,`,
    `Le service de la scolarité.`,
  ].join('\n')

  const html = shell(
    ctx.establishmentShort,
    `<p style="margin:0 0 16px;color:#334155;font-size:14px;">Bonjour <strong>${ctx.studentName}</strong>,</p>
     <p style="margin:0 0 20px;color:#334155;font-size:14px;">Votre règlement a été confirmé. La quittance ci-dessous est jointe à votre dossier.</p>
     <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;">
       <tr><td style="padding:12px 16px;border-bottom:1px solid #bbf7d0;"><span style="color:#166534;font-size:12px;">Montant</span><br><span style="font-size:16px;font-weight:bold;color:#14532d;">${ctx.amount} ${ctx.currency}</span></td></tr>
       <tr><td style="padding:12px 16px;border-bottom:1px solid #bbf7d0;"><span style="color:#166534;font-size:12px;">N° de quittance</span><br><span style="font-family:monospace;font-size:13px;font-weight:bold;color:#14532d;">${ctx.receiptNumber ?? '—'}</span></td></tr>
       <tr><td style="padding:12px 16px;"><span style="color:#166534;font-size:12px;">Mode · Date</span><br><span style="font-size:13px;color:#14532d;">${ctx.paymentMethod ?? '—'} · ${ctx.paymentDate ?? new Date().toLocaleDateString('fr-FR')}</span></td></tr>
     </table>
     <p style="margin:20px 0 0;"><a href="${ctx.trackingUrl}" style="background:#14532d;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:8px;font-size:13px;font-weight:bold;">Voir mon dossier</a></p>`,
  )

  return { to: ctx.studentEmail, subject, html, text }
}
