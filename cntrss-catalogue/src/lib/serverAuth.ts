import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import type { UserAccount } from '@prisma/client';
import type { UserProfile, UserRole } from '../types';
import { getPrisma, isDbReady } from './db';

// Authentification par session serveur (module serveur uniquement).
//
// - Le navigateur ne reçoit qu'un identifiant de session opaque dans un cookie
//   httpOnly : aucun jeton n'est lisible par JavaScript, donc pas de vol de
//   jeton par XSS.
// - La session est stockée en base : la déconnexion et la suspension d'un
//   compte révoquent réellement l'accès (un JWT ne le permettrait pas).
// - Toute mutation authentifiée exige un jeton anti-CSRF (double soumission
//   cookie lisible + en-tête x-csrf-token), car le cookie de session voyage
//   automatiquement avec les requêtes.

export const SESSION_COOKIE = 'cntrss_session';
export const CSRF_COOKIE = 'cntrss_csrf';
export const CSRF_HEADER = 'x-csrf-token';

/** Session courte (onglet/navigateur) et session longue si « rester connecté ». */
export const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 heures
export const REMEMBER_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 jours

/** Rôles qu'un visiteur peut s'attribuer lui-même lors de l'inscription. */
export const REGISTERABLE_ROLES: UserRole[] = [
  'Étudiant',
  'Enseignant-Chercheur',
  'Chercheur',
  'Institution'
];

export const ALL_ROLES: UserRole[] = [
  'Étudiant',
  'Enseignant-Chercheur',
  'Chercheur',
  'Bibliothécaire',
  'Administrateur',
  'Institution'
];

export const ACCOUNT_STATUSES = ['Actif', 'En attente de validation', 'Suspendu'] as const;

export interface SessionUser extends UserProfile {
  status: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: SessionUser | null;
      sessionId?: string;
    }
  }
}

// ---------- Cookies ----------

function parseCookies(header?: string | null): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!header) return cookies;
  for (const part of header.split(';')) {
    const index = part.indexOf('=');
    if (index === -1) continue;
    const name = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (!name) continue;
    cookies[name] = decodeURIComponent(value);
  }
  return cookies;
}

export function readCookie(req: Request, name: string): string | null {
  return parseCookies(req.headers.cookie)[name] || null;
}

function useSecureCookies(): boolean {
  const explicit = (process.env.COOKIE_SECURE || '').toLowerCase();
  if (explicit === 'true') return true;
  if (explicit === 'false') return false;
  return process.env.NODE_ENV === 'production';
}

function serializeCookie(
  name: string,
  value: string,
  options: { maxAgeMs: number; httpOnly: boolean }
): string {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    'SameSite=Lax',
    `Max-Age=${Math.floor(options.maxAgeMs / 1000)}`
  ];
  if (options.httpOnly) parts.push('HttpOnly');
  if (useSecureCookies()) parts.push('Secure');
  return parts.join('; ');
}

export interface CreatedSession {
  sessionId: string;
  csrfToken: string;
  ttlMs: number;
}

/** Pose le cookie de session (httpOnly) et le jeton anti-CSRF (lisible par l'API JS). */
export function attachSessionCookies(res: Response, session: CreatedSession): void {
  res.append(
    'Set-Cookie',
    serializeCookie(SESSION_COOKIE, session.sessionId, { maxAgeMs: session.ttlMs, httpOnly: true })
  );
  res.append(
    'Set-Cookie',
    serializeCookie(CSRF_COOKIE, session.csrfToken, { maxAgeMs: session.ttlMs, httpOnly: false })
  );
}

export function clearSessionCookies(res: Response): void {
  res.append('Set-Cookie', serializeCookie(SESSION_COOKIE, '', { maxAgeMs: 0, httpOnly: true }));
  res.append('Set-Cookie', serializeCookie(CSRF_COOKIE, '', { maxAgeMs: 0, httpOnly: false }));
}

// ---------- Profils ----------

const ROLE_AVATAR_COLORS: Record<string, string> = {
  'Bibliothécaire': 'bg-teal-700',
  'Administrateur': 'bg-emerald-700',
  'Enseignant-Chercheur': 'bg-sky-600',
  'Étudiant': 'bg-teal-600'
};

export function avatarColorForRole(role: UserRole): string {
  return ROLE_AVATAR_COLORS[role] || 'bg-teal-600';
}

/** « Dr. CHABI Y. Marcelline » -> « C » (cohérent avec les initiales du corpus livré). */
export function avatarLetterFor(fullName: string): string {
  const withoutTitle = fullName.replace(/^(dr|pr|m|mme|me|prof)\.?\s+/i, '').trim();
  const letter = (withoutTitle || fullName).match(/[A-Za-zÀ-ÿ0-9]/)?.[0];
  return (letter || 'U').toUpperCase();
}

export function toSessionUser(account: UserAccount): SessionUser {
  return {
    id: account.id,
    fullName: account.fullName,
    email: account.email,
    role: account.role as UserRole,
    institution: account.institution,
    discipline: account.discipline ?? undefined,
    studentId: account.studentId ?? undefined,
    avatarLetter: avatarLetterFor(account.fullName),
    avatarColor: avatarColorForRole(account.role as UserRole),
    status: account.status
  };
}

export function toUserProfile(user: SessionUser): UserProfile {
  const { status: _status, ...profile } = user;
  return profile;
}

/** Seuls les comptes « Actif » peuvent ouvrir une session. */
export function canAccountLogin(status: string | null | undefined): boolean {
  return status === 'Actif';
}

export function loginRefusalMessage(status: string): string {
  if (status === 'Suspendu') {
    return "Ce compte est suspendu. Contactez l'administration du CNTRSS.";
  }
  if (status === 'En attente de validation') {
    return "Ce compte est en attente de validation par l'administration du CNTRSS.";
  }
  return "Ce compte n'est pas autorisé à se connecter.";
}

// ---------- Sessions ----------

export async function createSession(
  userId: string,
  ttlMs: number,
  meta: { userAgent?: string; ipAddress?: string } = {}
): Promise<CreatedSession> {
  const sessionId = randomBytes(32).toString('base64url');
  const csrfToken = randomBytes(32).toString('base64url');

  await getPrisma().session.create({
    data: {
      id: sessionId,
      csrfToken,
      userId,
      userAgent: meta.userAgent ? meta.userAgent.slice(0, 200) : null,
      ipAddress: meta.ipAddress ?? null,
      expiresAt: new Date(Date.now() + ttlMs)
    }
  });

  return { sessionId, csrfToken, ttlMs };
}

export interface ResolvedSession {
  sessionId: string;
  csrfToken: string;
  user: SessionUser;
}

/**
 * Résout la session à partir du cookie. Une session expirée est supprimée, et
 * un compte suspendu perd immédiatement l'accès même si sa session est valide.
 */
export async function loadSession(req: Request): Promise<ResolvedSession | null> {
  if (!isDbReady()) return null;

  const sessionId = readCookie(req, SESSION_COOKIE);
  if (!sessionId) return null;

  const prisma = getPrisma();
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { user: true }
  });
  if (!session) return null;

  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.session.delete({ where: { id: sessionId } }).catch(() => undefined);
    return null;
  }

  if (!canAccountLogin(session.user.status)) return null;

  return {
    sessionId: session.id,
    csrfToken: session.csrfToken,
    user: toSessionUser(session.user)
  };
}

export async function destroySession(sessionId: string): Promise<void> {
  if (!isDbReady()) return;
  await getPrisma().session.deleteMany({ where: { id: sessionId } });
}

export async function revokeUserSessions(userId: string): Promise<void> {
  if (!isDbReady()) return;
  await getPrisma().session.deleteMany({ where: { userId } });
}

/** Purge des sessions expirées (appelée au démarrage du serveur). */
export async function pruneExpiredSessions(): Promise<number> {
  if (!isDbReady()) return 0;
  const result = await getPrisma().session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  return result.count;
}

// ---------- Anti-CSRF ----------

function isStateChanging(method: string): boolean {
  return !['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase());
}

function safeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}

/** Comparaison en-tête x-csrf-token <-> cookie csrf (double soumission). */
export function csrfHeaderMatchesCookie(req: Request): boolean {
  const header = req.headers[CSRF_HEADER];
  const tokenFromHeader = Array.isArray(header) ? header[0] : header;
  const tokenFromCookie = readCookie(req, CSRF_COOKIE);
  if (!tokenFromHeader || !tokenFromCookie) return false;
  return safeEqual(tokenFromHeader, tokenFromCookie);
}

// ---------- Middlewares ----------

function authenticate(roles: UserRole[] | null, requireCsrf: boolean): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!isDbReady()) {
      res.status(503).json({
        error: "Service d'authentification indisponible : base de données hors ligne."
      });
      return;
    }

    let session: ResolvedSession | null = null;
    try {
      session = await loadSession(req);
    } catch (err) {
      console.error('Session lookup failed:', err);
      res.status(503).json({ error: "Service d'authentification momentanément indisponible." });
      return;
    }

    if (!session) {
      res.status(401).json({ error: 'Authentification requise.' });
      return;
    }

    if (roles && !roles.includes(session.user.role)) {
      res.status(403).json({ error: 'Rôle insuffisant pour cette action.' });
      return;
    }

    if (requireCsrf && isStateChanging(req.method) && !csrfHeaderMatchesCookie(req)) {
      res.status(403).json({ error: 'Jeton anti-CSRF manquant ou invalide.' });
      return;
    }

    req.user = session.user;
    req.sessionId = session.sessionId;
    next();
  };
}

/** Exige une session valide (et, pour les mutations, le jeton anti-CSRF). */
export function requireAuth(options: { csrf?: boolean } = {}): RequestHandler {
  return authenticate(null, options.csrf ?? false);
}

/** Exige une session valide avec l'un des rôles donnés et un jeton anti-CSRF sur les mutations. */
export function requireRole(...roles: UserRole[]): RequestHandler {
  return authenticate(roles, true);
}
