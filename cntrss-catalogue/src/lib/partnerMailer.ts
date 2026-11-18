import { structuredLog } from './logger';

// Module serveur uniquement.
//
// Envoi d'un e-mail de notification à l'administrateur du système à chaque
// demande de partenariat. L'API **Resend** est appelée en direct via fetch
// (aucune dépendance supplémentaire) ; sans clé RESEND_API_KEY, la demande
// reste enregistrée en base et l'absence d'envoi est journalisée clairement.

export interface PartnershipEmailPayload {
  institution: string;
  institutionType: string;
  contactName: string;
  email: string;
  phone?: string | null;
  website?: string | null;
  message: string;
}

export function partnerAdminEmail(): string {
  return process.env.PARTNER_ADMIN_EMAIL || 'admin@cntrss.bj';
}

function resendApiKey(): string {
  return process.env.RESEND_API_KEY || '';
}

function fromAddress(): string {
  // Resend autorise temporairement son adresse d'accueil ; en production,
  // PARTNER_EMAIL_FROM doit pointer vers une adresse de domaine vérifié.
  return process.env.PARTNER_EMAIL_FROM || 'CNTRSS <onboarding@resend.dev>';
}

function buildText(payload: PartnershipEmailPayload): string {
  const lines = [
    'Nouvelle demande de partenariat reçue sur le catalogue CNTRSS.',
    '',
    `Établissement : ${payload.institution}`,
    `Type : ${payload.institutionType}`,
    `Contact : ${payload.contactName}`,
    `E-mail : ${payload.email}`,
    `Téléphone : ${payload.phone || 'non renseigné'}`,
    `Site web : ${payload.website || 'non renseigné'}`,
    '',
    'Message :',
    payload.message
  ];
  return lines.join('\n');
}

export interface SendResult {
  sent: boolean;
  error?: string;
}

export interface OutgoingEmail {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
  /** Étiquette de journalisation (ex. « partnership_email »). */
  logTag: string;
}

/**
 * Envoi générique via l'API Resend. Ne lève jamais : l'appelant décide de la
 * suite (l'enregistrement en base prime toujours sur la notification).
 */
export async function sendEmail(email: OutgoingEmail): Promise<SendResult> {
  const apiKey = resendApiKey();
  if (!apiKey) {
    structuredLog('warn', `${email.logTag}_skipped`, { reason: 'missing_api_key' });
    return {
      sent: false,
      error: 'RESEND_API_KEY absente : e-mail non envoyé (les données restent enregistrées).'
    };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromAddress(),
        to: [email.to],
        ...(email.replyTo ? { reply_to: email.replyTo } : {}),
        subject: email.subject,
        text: email.text
      })
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      const error = `Resend HTTP ${response.status}${body ? ` : ${body.slice(0, 300)}` : ''}`;
      structuredLog('error', `${email.logTag}_failed`, { status: response.status });
      return { sent: false, error };
    }

    structuredLog('info', `${email.logTag}_sent`, { to: email.to });
    return { sent: true };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    structuredLog('error', `${email.logTag}_failed`, { error });
    return { sent: false, error };
  }
}

/** Notifie l'administrateur. Ne lève jamais : l'enregistrement en base prime. */
export async function sendPartnershipEmail(payload: PartnershipEmailPayload): Promise<SendResult> {
  return sendEmail({
    to: partnerAdminEmail(),
    replyTo: payload.email,
    subject: `[CNTRSS] Demande de partenariat — ${payload.institution}`,
    text: buildText(payload),
    logTag: 'partnership_email'
  });
}

/** Un e-mail transactionnel peut être envoyé (clé présente) ou non. */
export function emailDeliveryAvailable(): boolean {
  return Boolean(resendApiKey());
}

/**
 * Lien de réinitialisation envoyé à l'utilisateur. Le jeton n'est présent que
 * dans ce message : il n'est jamais renvoyé par l'API (seule son empreinte est
 * stockée côté serveur).
 */
export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<SendResult> {
  const lines = [
    'Bonjour,',
    '',
    'Une réinitialisation du mot de passe de votre compte académique CNTRSS a été demandée.',
    'Ouvrez le lien ci-dessous pour choisir un nouveau mot de passe :',
    '',
    resetUrl,
    '',
    'Ce lien est valable 30 minutes et ne peut être utilisé qu’une seule fois.',
    'Si vous n’êtes pas à l’origine de cette demande, ignorez ce message : votre mot de passe reste inchangé.',
    '',
    '— Le service documentaire du CNTRSS'
  ];

  return sendEmail({
    to,
    subject: '[CNTRSS] Réinitialisation de votre mot de passe',
    text: lines.join('\n'),
    logTag: 'password_reset_email'
  });
}
