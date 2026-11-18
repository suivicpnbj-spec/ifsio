import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'node:fs';
import { createHash, randomBytes } from 'node:crypto';
import { fileURLToPath } from 'url';
import { DocumentItem, DisciplineType, DocumentType, StudyDesign, DocumentSubmissionPayload, ValidationItem, DocumentRequestRecord, AuditLogItem, UserAccountItem, UserRole } from './src/types';

const VALID_STUDY_DESIGNS: StudyDesign[] = [
  'Étude transversale',
  'Étude cas-témoins',
  'Audit clinique',
  'Étude prospective',
  'Étude expérimentale',
  'Revue systématique'
];

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { DISCIPLINES } from './src/data/mockDocuments';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// En production le serveur tourne depuis le bundle (dist/server.mjs) : les
// chemins de projet (prisma/, data/, dist/) doivent alors remonter d'un
// niveau. En développement (tsx server.ts), __dirname est déjà la racine.
const ROOT_DIR = path.basename(__dirname) === 'dist' ? path.dirname(__dirname) : __dirname;

const app = express();
const PORT = Number(process.env.PORT) || 3001;

// Derrière un reverse proxy (nginx, etc.) Express doit lire X-Forwarded-For :
// sans cela, tous les clients partagent l'IP du proxy et le rate limiting par
// IP (et les adresses du journal d'audit) deviennent faux. TRUST_PROXY="1" =
// un saut de proxy ; désactivé par défaut (développement direct).
const TRUST_PROXY = (process.env.TRUST_PROXY || '').trim();
if (TRUST_PROXY && TRUST_PROXY !== 'false') {
  const hops = Number(TRUST_PROXY);
  app.set('trust proxy', Number.isInteger(hops) && hops > 0 ? hops : true);
}

app.use(express.json());

// ---------- Production middleware ----------

const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || '').split(',').filter(Boolean);

app.use(
  cors({
    origin: ALLOWED_ORIGINS.length ? ALLOWED_ORIGINS : false,
    credentials: false
  })
);

const assistantLimiter = rateLimit({
  windowMs: 60_000,
  max: Number(process.env.ASSISTANT_MAX_REQUESTS_PER_MINUTE) || 60,
  standardHeaders: true,
  legacyHeaders: false,
  // Comptage par IP (ipKeyGenerator normalise les IPv6 pour éviter les
  // contournements). Le quota protège le service Gemini, pas un compte
  // particulier : une clé par session serait contournable en se reconnectant.
  keyGenerator: (req) => ipKeyGenerator(req.ip || 'anonymous'),
  message: { error: 'Trop de requêtes. Réessayez dans 60 secondes.' },
  skip: () => process.env.NODE_ENV === 'test'
});

// ---------- Persistence via Prisma ----------

import { getPrisma, isDbReady, markDbReady, prismaConnect, prismaPing } from './src/lib/db';
import {
  documentDbCreate,
  documentDbUpdate,
  validationDbCreate,
  validationDbUpdate,
  requestDbCreate,
  requestDbUpdate
} from './src/lib/prismaMappers';
import { dummyPasswordHash, hashPassword, verifyPassword, PASSWORD_MIN_LENGTH } from './src/lib/password';
import { structuredLog } from './src/lib/logger';
import { buildCertificatePdf, buildDocumentPdf } from './src/lib/pdfGenerator';
import {
  emailDeliveryAvailable,
  sendPartnershipEmail,
  sendPasswordResetEmail
} from './src/lib/partnerMailer';
import { DEMO_ACCOUNT_REFS, demoPassword, isDemoLoginEnabled } from './src/lib/demoAccounts';
import {
  ACCOUNT_STATUSES,
  ALL_ROLES,
  REGISTERABLE_ROLES,
  REMEMBER_TTL_MS,
  SESSION_TTL_MS,
  attachSessionCookies,
  canAccountLogin,
  clearSessionCookies,
  createSession,
  destroySession,
  loginRefusalMessage,
  loadSession,
  pruneExpiredSessions,
  requireAuth,
  requireRole,
  revokeUserSessions,
  toSessionUser,
  toUserProfile
} from './src/lib/serverAuth';
import type {
  Document as DbDocument,
  Validation as DbValidation,
  DocumentRequest as DbDocumentRequest,
  AuditLog as DbAuditLog,
  UserAccount as DbUserAccount
} from '@prisma/client';

// État initial vide : aucune donnée statique n'est affichée, la plateforme
// démarre sur un catalogue vide et les données proviennent uniquement de la
// base (repli mémoire = état vide, jamais les jeux mock).
let documents: DocumentItem[] = [];

let validationQueue: ValidationItem[] = [];

let documentRequests: DocumentRequestRecord[] = [];

let auditLogs: AuditLogItem[] = [];

async function bootPersistence() {
  try {
    await prismaConnect();
    const ok = await prismaPing();
    if (!ok) {
      throw new Error('Base de données Prisma non accessible.');
    }
    markDbReady(true);
    await seedIfEmpty();
    await syncFromDatabase();
    const pruned = await pruneExpiredSessions();
    if (pruned > 0) {
      structuredLog('info', 'sessions_pruned', { count: pruned });
    }
  } catch (err) {
    console.error('Prisma boot failed, falling back to in-memory-only mode.', err);
    markDbReady(false);
  }
}

async function seedIfEmpty() {
  try {
    // Le seed est idempotent : il ne crée que les comptes utilisateurs manquants
    // (aucune donnée d'affichage n'est plus pré-remplie).
    const seedModule = await import('./prisma/seed');
    const seedFn = (seedModule as any).seed;
    if (typeof seedFn === 'function') {
      await seedFn();
    }
  } catch (err) {
    console.error('DB seed failed:', err);
  }
}

async function syncFromDatabase() {
  if (!isDbReady()) return;
  const client = getPrisma();

  const dbDocuments = await client.document.findMany({
    orderBy: { createdAt: 'desc' }
  });
  documents = dbDocuments.map((d) => documentModelFromDb(d));

  const dbValidations = await client.validation.findMany({
    orderBy: { createdAt: 'desc' }
  });
  validationQueue = dbValidations.map((v) => validationModelFromDb(v));

  const dbRequests = await client.documentRequest.findMany({
    orderBy: { createdAt: 'desc' }
  });
  documentRequests = dbRequests.map((r) => requestModelFromDb(r));

  const dbAudit = await client.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 500
  });
  auditLogs = dbAudit.map((a) => auditModelFromDb(a));
}

function toStudyDesign(value: string | null | undefined): StudyDesign | undefined {
  if (!value) return undefined;
  return (VALID_STUDY_DESIGNS as string[]).includes(value) ? (value as StudyDesign) : undefined;
}

function documentModelFromDb(d: DbDocument): DocumentItem {
  return {
    id: String(d.id ?? ''),
    doi: String(d.doi ?? ''),
    title: String(d.title ?? ''),
    type: String(d.type ?? 'Mémoire de licence') as DocumentType,
    discipline: String(d.discipline ?? 'Santé publique') as DisciplineType,
    studyDesign: toStudyDesign(d.studyDesign),
    healthZone: d.healthZone != null ? String(d.healthZone) : undefined,
    year: Number(d.year) || 0,
    author: String(d.author ?? ''),
    supervisor: d.supervisor != null ? String(d.supervisor) : undefined,
    institution: String(d.institution ?? ''),
    keywords: parseJsonArray(d.keywords),
    meshTerms: parseJsonArray(d.meshTerms),
    abstract: String(d.abstract ?? ''),
    clinicalKeyTakeaways: parseJsonArray(d.clinicalKeyTakeaways),
    hasOpenData: Boolean(d.hasOpenData),
    citationsCount: Number(d.citationsCount) || 0,
    pages: Number(d.pages) || 0,
    downloads: Number(d.downloads) || 0,
    views: Number(d.views) || 0,
    fileName: d.fileName != null ? String(d.fileName) : undefined,
    fileMime: d.fileMime != null ? String(d.fileMime) : undefined,
    fileBytes: d.fileBytes != null ? Number(d.fileBytes) : undefined,
    hasFile: fs.existsSync(storedFilePath(String(d.id ?? ''))),
    dateAdded: String(d.dateAdded ?? ''),
    status: String(d.status ?? 'En cours de validation') as DocumentItem['status'],
    isFeatured: Boolean(d.isFeatured)
  };
}

function validationModelFromDb(v: DbValidation): ValidationItem {
  return {
    id: String(v.id ?? ''),
    title: String(v.title ?? ''),
    author: String(v.author ?? ''),
    supervisor: String(v.supervisor ?? ''),
    type: String(v.type ?? 'Mémoire de licence') as DocumentType,
    discipline: String(v.discipline ?? 'Santé publique') as DisciplineType,
    institution: String(v.institution ?? ''),
    submissionDate: String(v.submissionDate ?? ''),
    status: String(v.status ?? 'En attente') as ValidationItem['status'],
    assignedDoi: v.assignedDoi != null ? String(v.assignedDoi) : undefined,
    shelfLocation: v.shelfLocation != null ? String(v.shelfLocation) : undefined,
    reviewNotes: v.reviewNotes != null ? String(v.reviewNotes) : undefined,
    meshTerms: parseJsonArray(v.meshTerms),
    fileSize: v.fileSize != null ? String(v.fileSize) : '',
    fileName: v.fileName != null ? String(v.fileName) : undefined,
    fileMime: v.fileMime != null ? String(v.fileMime) : undefined,
    fileBytes: v.fileBytes != null ? Number(v.fileBytes) : undefined,
    hasFile: fs.existsSync(storedFilePath(String(v.id ?? '')))
  };
}

function requestModelFromDb(r: DbDocumentRequest): DocumentRequestRecord {
  return {
    id: String(r.id ?? ''),
    title: String(r.title ?? ''),
    author: r.author != null ? String(r.author) : undefined,
    requesterName: String(r.requesterName ?? ''),
    requesterEmail: String(r.requesterEmail ?? ''),
    requesterRole: String(r.requesterRole ?? 'Étudiant'),
    institution: String(r.institution ?? ''),
    date: String(r.date ?? ''),
    status: String(r.status ?? 'En cours de recherche') as DocumentRequestRecord['status'],
    priority: String(r.priority ?? 'Normale') as DocumentRequestRecord['priority'],
    notes: r.notes != null ? String(r.notes) : undefined
  };
}

function auditModelFromDb(a: DbAuditLog): AuditLogItem {
  return {
    id: String(a.id ?? ''),
    timestamp: String(a.timestamp ?? ''),
    userName: String(a.userName ?? ''),
    role: String(a.role ?? 'Administrateur') as UserRole,
    action: String(a.action ?? ''),
    resource: String(a.resource ?? ''),
    status: String(a.status ?? 'Succès') as AuditLogItem['status'],
    ipAddress: String(a.ipAddress ?? '')
  };
}

function parseJsonArray(value: unknown): string[] {
  if (value == null) return [];
  if (Array.isArray(value)) return value.map((item: unknown) => String(item ?? ''));
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map((item: unknown) => String(item ?? ''));
      if (typeof parsed === 'string') return [parsed];
      return [];
    } catch {
      return [];
    }
  }
  return [];
}

// Écritures ciblées : une mutation ponctuelle ne doit réécrire que l'entrée
// concernée. La réécriture complète du catalogue à chaque action rendait les
// réponses plus lentes que le délai d'attente du client (constaté : > 12 s).
async function persistDocument(doc: DocumentItem): Promise<void> {
  if (!isDbReady()) return;
  await getPrisma().document.upsert({
    where: { id: doc.id },
    update: documentDbUpdate(doc),
    create: documentDbCreate(doc)
  });
}

async function persistValidation(item: ValidationItem): Promise<void> {
  if (!isDbReady()) return;
  await getPrisma().validation.upsert({
    where: { id: item.id },
    update: validationDbUpdate(item),
    create: validationDbCreate(item)
  });
}

async function persistRequest(record: DocumentRequestRecord): Promise<void> {
  if (!isDbReady()) return;
  await getPrisma().documentRequest.upsert({
    where: { id: record.id },
    update: requestDbUpdate(record),
    create: requestDbCreate(record)
  });
}

async function pushAuditDb(entry: Omit<AuditLogItem, 'id' | 'timestamp'>) {
  if (!isDbReady()) return;
  const client = getPrisma();
  const now = new Date();
  const timestamp = now.toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  const id = `log-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  await client.auditLog.create({
    data: {
      id,
      timestamp,
      userName: entry.userName,
      role: entry.role,
      action: entry.action,
      resource: entry.resource,
      status: entry.status,
      ipAddress: entry.ipAddress
    }
  });
  auditLogs.unshift({ ...entry, id, timestamp });
  if (auditLogs.length > 200) auditLogs.pop();
}


// ---------- GenAI client (optional) ----------
const apiKey = process.env.GEMINI_API_KEY || '';
let aiClient: GoogleGenAI | null = null;

if (apiKey) {
  aiClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
}

// ---------- Helpers ----------

function generateDoi(discipline: DisciplineType, year: number, sequence: string): string {
  const sigil = discipline.substring(0, 3).toLowerCase().replace(/[^a-z]/g, 'xxx').slice(0, 3);
  return `10.cntrss.bj/${sigil}.${year}.${sequence}`;
}

/**
 * Séquence persistante (modèle Counter) pour les DOI : un redémarrage du
 * serveur ne réattribue jamais un identifiant déjà utilisé.
 */
async function nextPersistentSequence(key: string): Promise<number> {
  try {
    const prisma = getPrisma();
    const counter = await prisma.counter.upsert({
      where: { key },
      update: { value: { increment: 1 } },
      create: { key, value: 1 }
    });
    return counter.value;
  } catch (err) {
    console.error('Counter fallback:', err);
    seqCounter += 1;
    return seqCounter;
  }
}

let seqCounter = 0;

/**
 * Attribution d'un DOI unique : la séquence persistante est incrémentée jusqu'à
 * obtenir un identifiant encore libre en base. Un simple compteur en mémoire
 * réattribuait un DOI déjà utilisé après un redémarrage du serveur (violation de
 * contrainte d'unicité au dépôt suivant).
 */
async function allocateDoi(discipline: DisciplineType, year: number): Promise<string> {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const sequence = await nextPersistentSequence(`doi:${year}`);
    const doi = generateDoi(discipline, year, String(sequence).padStart(3, '0'));
    if (documents.some((doc) => doc.doi === doi)) continue;
    if (isDbReady()) {
      const clash = await getPrisma().document.findUnique({ where: { doi } });
      if (clash) continue;
    }
    return doi;
  }
  // Dernier recours : une valeur dérivée du temps, toujours libre.
  seqCounter += 1;
  return generateDoi(discipline, year, `${Date.now().toString(36)}${seqCounter}`.slice(-8));
}

// ---------- Fouille du catalogue par l'assistant IA ----------
//
// L'assistant doit pouvoir « farfouiller » dans les documents indexés : la
// requête est scoreée sur le titre, les auteurs, les mots-clés / descripteurs
// MeSH, la discipline puis le résumé, et les meilleurs résultats sont fournis
// au modèle (et affichés dans la réponse du moteur académique de secours).

function normalizeForSearch(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function tokenizeForSearch(value: string): string[] {
  return normalizeForSearch(value)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2);
}

export function searchCatalogue(query: string, limit = 5): DocumentItem[] {
  const tokens = tokenizeForSearch(query);
  if (!tokens.length || documents.length === 0) return [];

  const scored = documents
    .map((doc) => {
      const heading = normalizeForSearch(
        [doc.title, doc.author, doc.supervisor || '', doc.discipline, doc.institution, (doc.keywords || []).join(' '), (doc.meshTerms || []).join(' ')].join(' ')
      );
      const body = normalizeForSearch(`${doc.abstract} ${(doc.clinicalKeyTakeaways || []).join(' ')}`);

      let score = 0;
      for (const token of tokens) {
        if (heading.includes(token)) score += 3;
        if (body.includes(token)) score += 1;
      }
      return { doc, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || b.doc.year - a.doc.year);

  return scored.slice(0, limit).map((entry) => entry.doc);
}

function buildCatalogueContext(matches: DocumentItem[]): string {
  if (!matches.length) return '';
  return matches
    .map(
      (doc, index) =>
        `${index + 1}. « ${doc.title} » — ${doc.author} (${doc.year}, ${doc.discipline}, ${doc.institution}). DOI ${doc.doi}. Résumé : ${doc.abstract.slice(0, 400).replace(/\s+/g, ' ')}`
    )
    .join('\n');
}

// ---------- Authentification : sessions serveur ----------
//
// Remplace l'ancien mode démo « x-user-token ». Le client s'authentifie avec
// e-mail + mot de passe, le serveur ouvre une session stockée en base et ne
// renvoie au navigateur qu'un cookie httpOnly (identifiant opaque). Les
// mutations authentifiées exigent en plus le jeton anti-CSRF (cookie lisible
// + en-tête x-csrf-token) : voir src/lib/serverAuth.ts.

const loginLimiter = rateLimit({
  windowMs: 15 * 60_000,
  max: Number(process.env.LOGIN_MAX_ATTEMPTS) || 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req.ip || 'anonymous'),
  message: { error: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.' },
  skip: () => process.env.NODE_ENV === 'test'
});

// Quota dédié aux demandes de réinitialisation : évite qu'un tiers fasse
// spammer la boîte d'un utilisateur depuis une même adresse IP.
const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60_000,
  max: Number(process.env.PASSWORD_RESET_MAX_ATTEMPTS) || 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req.ip || 'anonymous'),
  message: { error: 'Trop de demandes de réinitialisation. Réessayez dans 15 minutes.' },
  skip: () => process.env.NODE_ENV === 'test'
});

function formatAccountTimestamp(date: Date): string {
  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Ne jamais exposer passwordHash : ce mapper énumère explicitement les champs publics.
function userAccountModelFromDb(user: DbUserAccount): UserAccountItem {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role as UserRole,
    institution: user.institution,
    discipline: user.discipline ?? '',
    status: user.status as UserAccountItem['status'],
    joinedDate: user.joinedDate,
    lastLogin: user.lastLogin ?? 'Jamais connecté',
    thesesCount: user.thesesCount
  };
}

async function recordAuthEvent(
  req: Request,
  entry: {
    userName: string;
    role: UserRole;
    action: string;
    status: AuditLogItem['status'];
    resource?: string;
  }
): Promise<void> {
  const payload: Omit<AuditLogItem, 'id' | 'timestamp'> = {
    userName: entry.userName,
    role: entry.role,
    action: entry.action,
    resource: entry.resource || "Service d'authentification CNTRSS",
    status: entry.status,
    ipAddress: req.ip || 'inconnu'
  };
  pushAudit(payload);
  await pushAuditDb(payload);
}

// Configuration publique : indique au frontend si les boutons de connexion
// rapide sont disponibles (ENABLE_DEMO_LOGIN) et quels comptes utilisent.
app.get('/api/auth/config', async (_req: Request, res: Response) => {
  if (!isDemoLoginEnabled() || !isDbReady()) {
    res.json({ demoLoginEnabled: false, demoAccounts: [] });
    return;
  }

  try {
    const accounts = await getPrisma().userAccount.findMany({
      where: { email: { in: DEMO_ACCOUNT_REFS.map((ref) => ref.email) } }
    });
    const byEmail = new Map(accounts.map((account) => [account.email, account]));
    const password = demoPassword();

    res.json({
      demoLoginEnabled: true,
      demoAccounts: DEMO_ACCOUNT_REFS.flatMap((ref) => {
        const account = byEmail.get(ref.email);
        if (!account || !canAccountLogin(account.status)) return [];
        return [{ ...toUserProfile(toSessionUser(account)), password }];
      })
    });
  } catch (err) {
    console.error('Auth config error:', err);
    res.json({ demoLoginEnabled: false, demoAccounts: [] });
  }
});

// Session courante : 200 + user null quand personne n'est connecté (pas une
// erreur : le frontend s'en sert aussi au démarrage pour restaurer la session).
app.get('/api/auth/me', async (req: Request, res: Response) => {
  if (!isDbReady()) {
    res.json({ user: null, databaseAvailable: false });
    return;
  }
  try {
    const session = await loadSession(req);
    res.json({ user: session ? toUserProfile(session.user) : null, databaseAvailable: true });
  } catch (err) {
    console.error('Session lookup error:', err);
    res.json({ user: null, databaseAvailable: false });
  }
});

app.post('/api/auth/register', loginLimiter, async (req: Request, res: Response) => {
  if (!isDbReady()) {
    res.status(503).json({ error: "Service d'authentification indisponible : base de données hors ligne." });
    return;
  }

  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const role = (typeof body.role === 'string' ? body.role : 'Étudiant') as UserRole;
    const institution = typeof body.institution === 'string' ? body.institution.trim() : '';
    const discipline = typeof body.discipline === 'string' ? body.discipline.trim() : '';
    const studentId = typeof body.studentId === 'string' ? body.studentId.trim() : '';

    if (fullName.length < 3) {
      res.status(400).json({ error: 'Nom complet requis (3 caractères minimum).' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: 'Adresse e-mail invalide.' });
      return;
    }
    if (password.length < PASSWORD_MIN_LENGTH) {
      res.status(400).json({ error: `Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères.` });
      return;
    }
    if (!institution) {
      res.status(400).json({ error: 'Établissement de rattachement requis.' });
      return;
    }
    // Un visiteur ne peut pas s'attribuer un rôle privilégié : ces comptes sont
    // créés par la direction (gouvernance administrative), pas à l'inscription.
    if (!REGISTERABLE_ROLES.includes(role)) {
      res.status(403).json({
        error: 'Les comptes Bibliothécaire et Administrateur sont créés par la direction du CNTRSS.'
      });
      return;
    }

    const prisma = getPrisma();
    const existing = await prisma.userAccount.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: 'Un compte existe déjà avec cette adresse e-mail.' });
      return;
    }

    const account = await prisma.userAccount.create({
      data: {
        id: `usr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        fullName,
        email,
        role,
        institution,
        discipline: discipline || null,
        studentId: studentId || null,
        passwordHash: await hashPassword(password),
        status: 'Actif',
        joinedDate: new Date().toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }),
        lastLogin: null,
        thesesCount: 0
      }
    });

    const session = await createSession(account.id, SESSION_TTL_MS, {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip
    });
    attachSessionCookies(res, session);

    await recordAuthEvent(req, {
      userName: account.fullName,
      role,
      action: 'Création de compte académique',
      status: 'Succès',
      resource: email
    });

    res.status(201).json({ user: toUserProfile(toSessionUser(account)) });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: "Erreur interne lors de la création du compte." });
  }
});

app.post('/api/auth/login', loginLimiter, async (req: Request, res: Response) => {
  if (!isDbReady()) {
    res.status(503).json({ error: "Service d'authentification indisponible : base de données hors ligne." });
    return;
  }

  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const rememberMe = Boolean(body.rememberMe);

    if (!email || !password) {
      res.status(400).json({ error: 'Adresse e-mail et mot de passe requis.' });
      return;
    }

    const prisma = getPrisma();
    const account = await prisma.userAccount.findUnique({ where: { email } });
    // Vérification systématique : une empreinte factice est comparée quand le
    // compte n'existe pas, afin de ne pas révéler son existence par le temps
    // de réponse (énumération de comptes).
    const passwordOk = await verifyPassword(password, account?.passwordHash ?? (await dummyPasswordHash()));

    if (!account || !passwordOk) {
      await recordAuthEvent(req, {
        userName: account?.fullName || email,
        role: (account?.role as UserRole) || 'Étudiant',
        action: 'Tentative de connexion refusée (identifiants invalides)',
        status: 'Refusé',
        resource: email
      });
      res.status(401).json({ error: 'Adresse e-mail ou mot de passe incorrect.' });
      return;
    }

    if (!canAccountLogin(account.status)) {
      await recordAuthEvent(req, {
        userName: account.fullName,
        role: account.role as UserRole,
        action: `Connexion refusée (compte ${account.status.toLowerCase()})`,
        status: 'Alerte',
        resource: email
      });
      res.status(403).json({ error: loginRefusalMessage(account.status) });
      return;
    }

    const ttlMs = rememberMe ? REMEMBER_TTL_MS : SESSION_TTL_MS;
    const session = await createSession(account.id, ttlMs, {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip
    });
    attachSessionCookies(res, session);

    const updated = await prisma.userAccount.update({
      where: { id: account.id },
      data: { lastLogin: formatAccountTimestamp(new Date()) }
    });

    await recordAuthEvent(req, {
      userName: account.fullName,
      role: account.role as UserRole,
      action: 'Connexion réussie',
      status: 'Succès',
      resource: email
    });

    res.json({
      user: toUserProfile(toSessionUser(updated)),
      expiresAt: new Date(Date.now() + ttlMs).toISOString()
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Erreur interne lors de la connexion.' });
  }
});

app.post('/api/auth/logout', requireAuth({ csrf: true }), async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (req.sessionId) {
      await destroySession(req.sessionId);
    }
    clearSessionCookies(res);

    if (user) {
      await recordAuthEvent(req, {
        userName: user.fullName,
        role: user.role,
        action: 'Déconnexion',
        status: 'Succès',
        resource: user.email
      });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'Erreur interne lors de la déconnexion.' });
  }
});

// ---------- Réinitialisation du mot de passe ----------
//
// Le jeton est un secret aléatoire de 32 octets envoyé par e-mail ; la base ne
// conserve que son empreinte SHA-256 (usage unique, 30 minutes). La réponse de
// « mot de passe oublié » est identique que le compte existe ou non : elle ne
// permet donc pas d'énumérer les comptes du catalogue.

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;

function hashResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** Origine publique utilisée dans le lien envoyé par e-mail. */
function appOrigin(req: Request): string {
  const configured = process.env.APP_ORIGIN || process.env.APP_BASE_URL;
  if (configured) return configured.replace(/\/+$/, '');
  return `${req.protocol}://${req.get('host')}`;
}

app.post('/api/auth/forgot-password', passwordResetLimiter, async (req: Request, res: Response) => {
  if (!isDbReady()) {
    res.status(503).json({ error: "Service d'authentification indisponible : base de données hors ligne." });
    return;
  }

  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: 'Adresse e-mail invalide.' });
      return;
    }

    // Indépendant de l'existence du compte : la réponse est donc la même dans
    // tous les cas (protection contre l'énumération de comptes).
    const deliveryAvailable = emailDeliveryAvailable();
    const prisma = getPrisma();
    const account = await prisma.userAccount.findUnique({ where: { email } });

    if (account) {
      await prisma.passwordResetToken.deleteMany({ where: { userId: account.id, usedAt: null } });
      const token = randomBytes(32).toString('base64url');
      await prisma.passwordResetToken.create({
        data: {
          tokenHash: hashResetToken(token),
          userId: account.id,
          expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS)
        }
      });

      const result = await sendPasswordResetEmail(
        account.email,
        `${appOrigin(req)}/#reset=${token}`
      );

      await recordAuthEvent(req, {
        userName: account.fullName,
        role: account.role as UserRole,
        action: result.sent
          ? 'Demande de réinitialisation de mot de passe envoyée'
          : 'Demande de réinitialisation de mot de passe (e-mail non envoyé)',
        status: result.sent ? 'Succès' : 'Alerte',
        resource: email
      });
    }

    res.status(202).json({
      ok: true,
      emailDeliveryAvailable: deliveryAvailable,
      message: deliveryAvailable
        ? "Si un compte correspond à cette adresse, un lien de réinitialisation vient d'être envoyé. Il est valable 30 minutes."
        : "Demande enregistrée. L'envoi d'e-mails n'est pas configuré sur ce serveur (RESEND_API_KEY absente) : le lien ne peut pas être transmis pour le moment."
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Erreur interne lors de la demande de réinitialisation.' });
  }
});

app.post('/api/auth/reset-password', passwordResetLimiter, async (req: Request, res: Response) => {
  if (!isDbReady()) {
    res.status(503).json({ error: "Service d'authentification indisponible : base de données hors ligne." });
    return;
  }

  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const token = typeof body.token === 'string' ? body.token.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!token) {
      res.status(400).json({ error: 'Lien de réinitialisation incomplet : demandez un nouveau lien.' });
      return;
    }
    if (password.length < PASSWORD_MIN_LENGTH) {
      res.status(400).json({ error: `Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères.` });
      return;
    }

    const prisma = getPrisma();
    const record = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashResetToken(token) },
      include: { user: true }
    });

    if (!record || record.usedAt || record.expiresAt.getTime() <= Date.now()) {
      await recordAuthEvent(req, {
        userName: record?.user.fullName || 'Visiteur',
        role: (record?.user.role as UserRole) || 'Étudiant',
        action: 'Réinitialisation de mot de passe refusée (lien invalide ou expiré)',
        status: 'Refusé',
        resource: record?.user.email || 'inconnu'
      });
      res.status(400).json({
        error: 'Ce lien de réinitialisation est invalide ou a expiré. Demandez un nouveau lien.'
      });
      return;
    }

    const passwordHash = await hashPassword(password);
    await prisma.$transaction([
      prisma.userAccount.update({ where: { id: record.userId }, data: { passwordHash } }),
      prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
      // Toutes les sessions ouvertes sont révoquées : un mot de passe volé ne
      // laisse aucune session active derrière lui.
      prisma.session.deleteMany({ where: { userId: record.userId } })
    ]);

    await recordAuthEvent(req, {
      userName: record.user.fullName,
      role: record.user.role as UserRole,
      action: 'Mot de passe réinitialisé par lien sécurisé',
      status: 'Succès',
      resource: record.user.email
    });

    clearSessionCookies(res);
    res.json({ ok: true, email: record.user.email });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Erreur interne lors de la réinitialisation du mot de passe.' });
  }
});

// ---------- Gouvernance des comptes (administration) ----------

app.get('/api/users', requireRole('Administrateur'), async (_req: Request, res: Response) => {
  try {
    const users = await getPrisma().userAccount.findMany({ orderBy: { createdAt: 'asc' } });
    res.json({ items: users.map(userAccountModelFromDb), total: users.length });
  } catch (err) {
    console.error('Users list error:', err);
    res.status(500).json({ error: 'Erreur interne du répertoire des comptes.' });
  }
});

// Création de compte par l'administration : c'est ainsi que sont ouverts les
// comptes Bibliothécaire et Administrateur (le public ne peut pas s'inscrire
// avec ces rôles — voir REGISTERABLE_ROLES).
app.post('/api/users', requireRole('Administrateur'), async (req: Request, res: Response) => {
  if (!isDbReady()) {
    res.status(503).json({ error: "Service indisponible : base de données hors ligne." });
    return;
  }
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const str = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

    const fullName = str(body.fullName);
    const email = str(body.email).toLowerCase();
    const password = typeof body.password === 'string' ? body.password : '';
    const role = str(body.role);
    const institution = str(body.institution);
    const discipline = str(body.discipline);
    const studentId = str(body.studentId);

    if (fullName.length < 3) {
      res.status(400).json({ error: 'Nom complet requis (3 caractères minimum).' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: 'Adresse e-mail invalide.' });
      return;
    }
    if (password.length < PASSWORD_MIN_LENGTH) {
      res.status(400).json({ error: `Mot de passe : ${PASSWORD_MIN_LENGTH} caractères minimum.` });
      return;
    }
    if (!(ALL_ROLES as readonly string[]).includes(role)) {
      res.status(400).json({ error: 'Rôle inconnu.' });
      return;
    }
    if (institution.length < 2) {
      res.status(400).json({ error: 'Établissement requis.' });
      return;
    }

    const prisma = getPrisma();
    const existing = await prisma.userAccount.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: 'Un compte existe déjà avec cette adresse e-mail.' });
      return;
    }

    const account = await prisma.userAccount.create({
      data: {
        fullName,
        email,
        role,
        institution,
        discipline: discipline || null,
        studentId: studentId || null,
        passwordHash: await hashPassword(password),
        status: 'Actif',
        joinedDate: new Date().toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }),
        lastLogin: null,
        thesesCount: 0
      }
    });

    pushAudit({
      userName: req.user?.fullName || 'Administration CNTRSS',
      role: req.user?.role || 'Administrateur',
      action: 'Création de compte par l\'administration',
      resource: `${role} — ${email}`,
      status: 'Succès',
      ipAddress: req.ip || 'inconnu'
    });
    await pushAuditDb({
      userName: req.user?.fullName || 'Administration CNTRSS',
      role: req.user?.role || 'Administrateur',
      action: 'Création de compte par l\'administration',
      resource: `${role} — ${email}`,
      status: 'Succès',
      ipAddress: req.ip || 'inconnu'
    });

    res.status(201).json({ ok: true, item: userAccountModelFromDb(account) });
  } catch (err) {
    console.error('User creation error:', err);
    res.status(500).json({ error: 'Impossible de créer le compte.' });
  }
});

app.patch('/api/users/:id', requireRole('Administrateur'), async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const target = await prisma.userAccount.findUnique({ where: { id: req.params.id } });
    if (!target) {
      res.status(404).json({ error: 'Compte introuvable.' });
      return;
    }

    const body = (req.body ?? {}) as Record<string, unknown>;
    const data: { role?: string; status?: string } = {};

    if (body.role !== undefined) {
      const role = String(body.role) as UserRole;
      if (!ALL_ROLES.includes(role)) {
        res.status(400).json({ error: 'Rôle inconnu.' });
        return;
      }
      data.role = role;
    }

    if (body.status !== undefined) {
      const status = String(body.status);
      if (!(ACCOUNT_STATUSES as readonly string[]).includes(status)) {
        res.status(400).json({ error: 'Statut de compte inconnu.' });
        return;
      }
      data.status = status;
    }

    if (!Object.keys(data).length) {
      res.status(400).json({ error: 'Aucune modification fournie.' });
      return;
    }

    // Garde-fou : un administrateur ne peut pas se supprimer lui-même ses
    // propres droits (dernier administrateur actif d'une instance).
    if (target.id === req.user?.id && (data.status === 'Suspendu' || (data.role && data.role !== 'Administrateur'))) {
      res.status(409).json({ error: 'Un administrateur ne peut pas révoquer son propre accès.' });
      return;
    }

    const updated = await prisma.userAccount.update({ where: { id: target.id }, data });

    // Un compte qui n'est plus actif perd immédiatement ses sessions ouvertes :
    // c'est tout l'intérêt d'une session serveur plutôt qu'un jeton autonome.
    if (!canAccountLogin(updated.status)) {
      await revokeUserSessions(updated.id);
    }

    await recordAuthEvent(req, {
      userName: req.user?.fullName || 'Administrateur CNTRSS',
      role: 'Administrateur',
      action: 'Modification de compte (rôle / statut)',
      status: 'Succès',
      resource: `${updated.email} -> ${updated.role} / ${updated.status}`
    });

    res.json({ ok: true, item: userAccountModelFromDb(updated) });
  } catch (err) {
    console.error('User update error:', err);
    res.status(500).json({ error: 'Erreur interne lors de la mise à jour du compte.' });
  }
});

app.get('/api/audit-logs', requireRole('Administrateur', 'Bibliothécaire'), (_req: Request, res: Response) => {
  res.json({ items: auditLogs.slice(0, 200), total: auditLogs.length });
});

// ---------- Demandes de partenariat (formulaire « Devenir partenaire ») ----------
// Chaque demande est enregistrée en base (suivable par l'administrateur) et
// notifiée par e-mail à l'administration (src/lib/partnerMailer.ts).

const PARTNERSHIP_TYPES = ['École', 'Faculté', 'Hôpital', 'Institut', 'Autre'];

const partnershipLimiter = rateLimit({
  windowMs: 60 * 60_000,
  max: Number(process.env.PARTNERSHIP_MAX_PER_HOUR) || 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req.ip || 'anonymous'),
  message: { error: 'Trop de demandes envoyées. Réessayez dans une heure.' },
  skip: () => process.env.NODE_ENV === 'test'
});

app.post('/api/partnerships', partnershipLimiter, async (req: Request, res: Response) => {
  if (!isDbReady()) {
    res.status(503).json({ error: "Service momentanément indisponible : base de données hors ligne." });
    return;
  }

  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const str = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

    const institution = str(body.institution);
    const institutionType = str(body.institutionType);
    const contactName = str(body.contactName);
    const email = str(body.email).toLowerCase();
    const phone = str(body.phone);
    const website = str(body.website);
    const message = str(body.message);

    if (institution.length < 3) {
      res.status(400).json({ error: 'Nom de l’établissement requis.' });
      return;
    }
    if (!PARTNERSHIP_TYPES.includes(institutionType)) {
      res.status(400).json({ error: `Type d’établissement invalide (${PARTNERSHIP_TYPES.join(', ')}).` });
      return;
    }
    if (contactName.length < 3) {
      res.status(400).json({ error: 'Nom du contact requis.' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: 'Adresse e-mail invalide.' });
      return;
    }
    if (message.length < 10) {
      res.status(400).json({ error: 'Message trop court (10 caractères minimum).' });
      return;
    }

    const prisma = getPrisma();
    const record = await prisma.partnershipRequest.create({
      data: {
        institution,
        institutionType,
        contactName,
        email,
        phone: phone || null,
        website: website || null,
        message
      }
    });

    // Notification à l'administration : n'échoue jamais la demande elle-même.
    const mail = await sendPartnershipEmail({
      institution,
      institutionType,
      contactName,
      email,
      phone: phone || null,
      website: website || null,
      message
    });

    const updated = await prisma.partnershipRequest.update({
      where: { id: record.id },
      data: { emailSent: mail.sent, emailError: mail.error ?? null }
    });

    await recordAuthEvent(req, {
      userName: contactName,
      role: 'Institution',
      action: 'Demande de partenariat',
      status: 'Succès',
      resource: `${institution} (${institutionType}) — notification: ${mail.sent ? 'envoyée' : 'non envoyée'}`
    });

    res.status(201).json({ ok: true, id: updated.id, emailSent: mail.sent });
  } catch (err) {
    console.error('Partnership error:', err);
    res.status(500).json({ error: 'Impossible d’enregistrer la demande de partenariat.' });
  }
});

app.get('/api/partnerships', requireRole('Administrateur'), async (_req: Request, res: Response) => {
  if (!isDbReady()) {
    res.status(503).json({ error: "Service indisponible : base de données hors ligne." });
    return;
  }
  try {
    const items = await getPrisma().partnershipRequest.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    res.json({ items, total: items.length });
  } catch (err) {
    console.error('Partnership list error:', err);
    res.status(500).json({ error: 'Erreur interne des demandes de partenariat.' });
  }
});

// ---------- Traitement d'une demande de partenariat (administration) ----------
// L'admin reçoit la demande (GET) puis la traite : mise en cours, clôture
// (« Traité ») ou refus, avec un éventuel motif/réponse conservé en base.

const PARTNERSHIP_STATUSES = ['Nouvelle', 'En cours de traitement', 'Traité', 'Refusé'] as const;

app.patch('/api/partnerships/:id', requireRole('Administrateur'), async (req: Request, res: Response) => {
  if (!isDbReady()) {
    res.status(503).json({ error: "Service indisponible : base de données hors ligne." });
    return;
  }
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const status = typeof body.status === 'string' ? body.status.trim() : '';
    if (!(PARTNERSHIP_STATUSES as readonly string[]).includes(status)) {
      res.status(400).json({ error: `Statut invalide (${PARTNERSHIP_STATUSES.join(', ')}).` });
      return;
    }
    const notes = typeof body.notes === 'string' ? body.notes.trim().slice(0, 2000) : null;

    const prisma = getPrisma();
    const existing = await prisma.partnershipRequest.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404).json({ error: 'Demande de partenariat introuvable.' });
      return;
    }

    const item = await prisma.partnershipRequest.update({
      where: { id: existing.id },
      data: { status, ...(notes !== null ? { notes } : {}) }
    });

    await pushAuditDb({
      userName: req.user?.fullName || 'Administration CNTRSS',
      role: req.user?.role || 'Administrateur',
      action: 'Traitement d\'une demande de partenariat',
      resource: `${existing.institution} — statut: ${status}`,
      status: 'Succès',
      ipAddress: req.ip || 'inconnu'
    });

    res.json({ ok: true, item });
  } catch (err) {
    console.error('Partnership update error:', err);
    res.status(500).json({ error: 'Impossible de mettre à jour la demande de partenariat.' });
  }
});

// ---------- Structured logs ----------
// Implémentation partagée : src/lib/logger.ts (aussi utilisée par
// src/lib/partnerMailer.ts et l'authentification).

function pushAudit(entry: Omit<AuditLogItem, 'id' | 'timestamp'>) {
  const now = new Date();
  const timestamp = now.toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  const id = `log-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  auditLogs.unshift({ ...entry, id, timestamp });
  if (auditLogs.length > 200) auditLogs.pop();
  structuredLog('info', 'audit', { event: entry.action, resource: entry.resource, status: entry.status, ip: entry.ipAddress });
}

// ---------- Health ----------

app.get('/api/health', async (_req: Request, res: Response) => {
  let accounts = 0;
  let sessions = 0;
  let auditEntries = 0;

  if (isDbReady()) {
    try {
      const prisma = getPrisma();
      const counts = await Promise.all([
        prisma.userAccount.count(),
        prisma.session.count(),
        prisma.auditLog.count()
      ]);
      accounts = counts[0];
      sessions = counts[1];
      auditEntries = counts[2];
    } catch (err) {
      console.error('Health check: database counts failed:', err);
    }
  }

  res.json({
    status: 'ok',
    service: 'CNTRSS Backend Service',
    hasGeminiKey: Boolean(apiKey),
    databaseAvailable: isDbReady(),
    documentCount: documents.length,
    validatedDocuments: documents.filter((doc) => doc.status === 'Validé & Publié').length,
    pendingValidations: validationQueue.filter((v) => v.status === 'En attente').length,
    openRequests: documentRequests.filter((r) => r.status === 'En cours de recherche').length,
    accounts,
    sessions,
    auditEntries,
    partnerships: await partnershipCount(),
    uptimeSeconds: Math.round(process.uptime()),
    storageBytes: databaseStorageBytes()
  });
});

/** Taille du fichier SQLite (ou 0 si base distante / absente) : métrique réelle du tableau admin. */
function databaseStorageBytes(): number {
  try {
    const url = process.env.DATABASE_URL || 'file:./dev.db';
    if (!url.startsWith('file:')) return 0;
    const file = url.slice('file:'.length);
    const resolved = path.isAbsolute(file) ? file : path.join(ROOT_DIR, 'prisma', file);
    return fs.statSync(resolved).size;
  } catch {
    return 0;
  }
}

async function partnershipCount(): Promise<number> {
  if (!isDbReady()) return 0;
  try {
    return await getPrisma().partnershipRequest.count();
  } catch {
    return 0;
  }
}

// ---------- Catalogue ----------

app.get('/api/catalog', (req: Request, res: Response) => {
  try {
    const { query, discipline, type, status, page = '1', limit = '24' } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 24));
    const offset = (pageNum - 1) * limitNum;

    let list = documents.filter((doc) => {
      if (status && doc.status && doc.status !== status) return false;
      if (discipline && doc.discipline !== discipline) return false;
      if (type && doc.type !== type) return false;
      if (query) {
        const q = query.toLowerCase();
        const match =
          doc.title.toLowerCase().includes(q) ||
          doc.author.toLowerCase().includes(q) ||
          doc.institution.toLowerCase().includes(q) ||
          doc.keywords.some((k) => k.toLowerCase().includes(q)) ||
          doc.meshTerms?.some((m) => m.toLowerCase().includes(q)) ||
          doc.abstract.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });

    const total = list.length;
    const pageItems = list.slice(offset, offset + limitNum);

    // Compteurs réels par filière (sur l'ensemble du catalogue) : les sélecteurs
    // de filière n'affichent plus de chiffres figés.
    const disciplineCounts = documents.reduce<Record<string, number>>((acc, doc) => {
      acc[doc.discipline] = (acc[doc.discipline] || 0) + 1;
      return acc;
    }, {});

    res.json({
      items: pageItems,
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.max(1, Math.ceil(total / limitNum)),
      disciplineCounts
    });
  } catch (err) {
    console.error('Catalog error:', err);
    res.status(500).json({ error: 'Erreur interne du catalogue' });
  }
});

app.get('/api/catalog/:id', (req: Request, res: Response) => {
  const doc = documents.find((d) => d.id === req.params.id);
  if (!doc) {
    res.status(404).json({ error: 'Document introuvable' });
    return;
  }
  res.json(doc);
});

app.post('/api/catalog/:id/bookmark', (req: Request, res: Response) => {
  // Bookmark is frontend-managed in the current app, but we keep the endpoint
  // for future sync. No-op here, returns OK.
  res.json({ ok: true });
});

// ---------- Dépôt de mémoire ----------

// Rôle dépositaire : seul le bibliothécaire importe un travail dans la
// plateforme (l'étudiant et l'enseignant-chercheur consultent et utilisent
// l'assistant IA ; l'administration supervise sans déposer).
app.post('/api/submissions', requireRole('Bibliothécaire'), async (req: Request, res: Response) => {
  try {
    const payload = req.body as DocumentSubmissionPayload;

    if (!payload.title || !payload.author || !payload.institution || !payload.year) {
      res.status(400).json({ error: 'Champs obligatoires manquants pour le dépôt.' });
      return;
    }

    const id = `doc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
    const submissionYear = Number(payload.year) || new Date().getFullYear();
    const doi = await allocateDoi((payload.discipline || 'Santé publique') as DisciplineType, submissionYear);
    const now = new Date().toISOString().split('T')[0];

    const newDoc: DocumentItem = {
      id,
      doi,
      title: payload.title,
      type: payload.type || 'Mémoire de licence',
      discipline: payload.discipline || 'Santé publique',
      studyDesign: payload.studyDesign,
      healthZone: payload.healthZone,
      year: Number(payload.year) || new Date().getFullYear(),
      author: payload.author,
      supervisor: payload.supervisor || 'Comité scientifique CNTRSS',
      institution: payload.institution,
      keywords: Array.isArray(payload.keywords) && payload.keywords.length ? payload.keywords : ['Santé publique', 'Recherche clinique', 'Bénin'],
      meshTerms: [
        `${(payload.discipline || 'Santé publique').toLowerCase()} / epidemiology`,
        'Health Services Research',
        'Benin'
      ],
      abstract: payload.abstract || 'Travail de recherche déposé et archivé auprès du CNTRSS. Ce document est soumis à validation et indexation par le comité de lecture académique.',
      clinicalKeyTakeaways: [
        'Données probantes recueillies en milieu hospitalier ou communautaire béninois.',
        'Protocole soumis au respect des normes déontologiques et éthiques locales.',
        'Recommandations opérationnelles destinées à la direction de la zone sanitaire.'
      ],
      hasOpenData: Boolean(payload.hasOpenData),
      citationsCount: 0,
      pages: Number(payload.pagesCount) || 50,
      downloads: 0,
      views: 0,
      dateAdded: now,
      status: 'En cours de validation',
      isFeatured: false
    };

    documents.unshift(newDoc);

    const validationItem: ValidationItem = {
      id: `val-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 4)}`,
      title: newDoc.title,
      author: newDoc.author,
      supervisor: newDoc.supervisor || '',
      type: newDoc.type,
      discipline: newDoc.discipline,
      institution: newDoc.institution,
      submissionDate: now,
      status: 'En attente',
      assignedDoi: newDoc.doi,
      shelfLocation: `COTE: CNTRSS-${now.slice(2).replace(/[^0-9]/g, '')}-ATT`,
      reviewNotes: 'Nouveau dépôt en attente de comité académique.',
      meshTerms: newDoc.keywords.map((k) => `${k} / epidemiology`),
      fileSize: payload.fileSize || 'non communiqué'
    };

    validationQueue.unshift(validationItem);
    await persistDocument(newDoc);
    await persistValidation(validationItem);

    pushAudit({
      userName: 'Système CNTRSS',
      role: 'Administrateur',
      action: 'Nouveau dépôt en file de validation',
      resource: `${newDoc.doi} - ${newDoc.title}`,
      status: 'Succès',
      ipAddress: req.ip || 'inconnu'
    });
    await pushAuditDb({
      userName: 'Système CNTRSS',
      role: 'Administrateur',
      action: 'Nouveau dépôt en file de validation',
      resource: `${newDoc.doi} - ${newDoc.title}`,
      status: 'Succès',
      ipAddress: req.ip || 'inconnu'
    });


    res.status(201).json({ doc: newDoc, validationId: validationItem.id });
  } catch (err) {
    console.error('Submission error:', err);
    res.status(500).json({ error: 'Erreur interne du dépôt' });
  }
});

// ---------- Fichiers PDF : dépôt réel, consultation, attestation ----------
//
// Le PDF déposé par l'auteur est écrit sur disque après vérification de sa
// signature de fichier (%PDF-). Les compteurs « consultations » et
// « téléchargements » du catalogue ne sont plus décoratifs : ils sont mis à jour
// par ces routes, donc le tri « les plus téléchargés » reflète l'usage réel.

const UPLOADS_DIR = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.join(ROOT_DIR, 'data', 'uploads');
const MAX_UPLOAD_BYTES = Number(process.env.MAX_UPLOAD_BYTES) || 15 * 1024 * 1024;

function ensureUploadsDir(): void {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/** Un identifiant d'application sûr pour un nom de fichier sur disque. */
function storedFilePath(id: string): string {
  return path.join(UPLOADS_DIR, `${id.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`);
}

function formatBytesFr(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} Mo`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${bytes} octets`;
}

function findDocumentById(id: string): DocumentItem | undefined {
  return documents.find((d) => d.id === id || d.doi === id);
}

/** Renvoie le PDF du document : fichier déposé, sinon généré depuis ses métadonnées. */
async function documentPdfBytes(doc: DocumentItem): Promise<Uint8Array> {
  const stored = storedFilePath(doc.id);
  try {
    if (fs.existsSync(stored)) return await fs.promises.readFile(stored);
  } catch (err) {
    console.error('Stored PDF read failed:', err);
  }
  return buildDocumentPdf(doc);
}

function sendPdf(res: Response, bytes: Uint8Array, fileName: string, disposition: 'inline' | 'attachment'): void {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `${disposition}; filename="${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}"`
  );
  res.setHeader('Content-Length', String(bytes.length));
  res.setHeader('Cache-Control', 'private, max-age=0, must-revalidate');
  res.status(200).end(Buffer.from(bytes));
}

// Dépôt du PDF de l'auteur : corps brut (application/pdf) + nom d'origine en
// en-tête x-file-name. Le fichier est refusé s'il n'est pas un vrai PDF.
app.post(
  '/api/submissions/:id/file',
  requireRole('Bibliothécaire'),
  express.raw({ type: ['application/pdf', 'application/octet-stream'], limit: MAX_UPLOAD_BYTES }),
  async (req: Request, res: Response) => {
    if (!isDbReady()) {
      res.status(503).json({ error: 'Service de dépôt indisponible : base de données hors ligne.' });
      return;
    }

    try {
      const item = validationQueue.find((v) => v.id === req.params.id);
      if (!item) {
        res.status(404).json({ error: 'Dossier de dépôt introuvable.' });
        return;
      }

      const bytes = Buffer.isBuffer(req.body) ? req.body : Buffer.from([]);
      if (!bytes.length) {
        res.status(400).json({ error: 'Aucun contenu PDF reçu.' });
        return;
      }
      if (bytes.subarray(0, 5).toString('latin1') !== '%PDF-') {
        res.status(415).json({
          error: "Ce fichier n'est pas un PDF valide (signature %PDF- absente)."
        });
        return;
      }

      const rawName = decodeURIComponent(String(req.header('x-file-name') || ''));
      const fileName = (rawName || `${item.id}.pdf`).slice(0, 200);

      ensureUploadsDir();
      await fs.promises.writeFile(storedFilePath(item.id), bytes);

      item.fileName = fileName;
      item.fileMime = 'application/pdf';
      item.fileBytes = bytes.length;
      item.fileSize = formatBytesFr(bytes.length);
      item.hasFile = true;
      await persistValidation(item);

      await pushAuditDb({
        userName: req.user?.fullName || 'Auteur CNTRSS',
        role: req.user?.role || 'Étudiant',
        action: 'Fichier PDF du dépôt enregistré',
        resource: `${item.id} - ${fileName}`,
        status: 'Succès',
        ipAddress: req.ip || 'inconnu'
      });

      res.status(201).json({
        ok: true,
        fileName,
        fileBytes: bytes.length,
        fileSize: item.fileSize,
        hasFile: true
      });
    } catch (err) {
      console.error('Submission file upload error:', err);
      res.status(500).json({ error: "Erreur interne lors de l'enregistrement du fichier PDF." });
    }
  }
);

// Le corps brut dépassant la limite est signalé explicitement (et non en 500).
app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
  if (err?.type === 'entity.too.large') {
    res.status(413).json({
      error: `Fichier trop volumineux : ${Math.round(MAX_UPLOAD_BYTES / (1024 * 1024))} Mo maximum.`
    });
    return;
  }
  next(err);
});

// Consultation : compteur « vues » réel du catalogue.
app.post('/api/documents/:id/view', requireAuth({ csrf: true }), async (req: Request, res: Response) => {
  const doc = findDocumentById(req.params.id);
  if (!doc) {
    res.status(404).json({ error: 'Document introuvable dans le catalogue.' });
    return;
  }
  doc.views += 1;
  await persistDocument(doc);
  res.json({ ok: true, id: doc.id, views: doc.views });
});

// Lecture du PDF dans le navigateur (le document déposé, sinon le PDF généré).
app.get('/api/documents/:id/file', requireAuth(), async (req: Request, res: Response) => {
  const doc = findDocumentById(req.params.id);
  if (!doc) {
    res.status(404).json({ error: 'Document introuvable dans le catalogue.' });
    return;
  }
  try {
    const bytes = await documentPdfBytes(doc);
    sendPdf(res, bytes, doc.fileName || `${doc.doi.replace(/[^a-zA-Z0-9.]/g, '_')}_CNTRSS.pdf`, 'inline');
  } catch (err) {
    console.error('Document file error:', err);
    res.status(500).json({ error: 'Erreur interne lors de la lecture du fichier.' });
  }
});

// Téléchargement : compteur « téléchargements » réel du catalogue.
app.get('/api/documents/:id/download', requireAuth(), async (req: Request, res: Response) => {
  const doc = findDocumentById(req.params.id);
  if (!doc) {
    res.status(404).json({ error: 'Document introuvable dans le catalogue.' });
    return;
  }

  try {
    const bytes = await documentPdfBytes(doc);
    doc.downloads += 1;
    await persistDocument(doc);

    await pushAuditDb({
      userName: req.user?.fullName || 'Membre CNTRSS',
      role: req.user?.role || 'Étudiant',
      action: 'Téléchargement du document PDF',
      resource: `${doc.doi} - ${doc.title}`,
      status: 'Succès',
      ipAddress: req.ip || 'inconnu'
    });

    res.setHeader('x-cntrss-downloads', String(doc.downloads));
    sendPdf(
      res,
      bytes,
      doc.fileName || `${doc.doi.replace(/[^a-zA-Z0-9.]/g, '_')}_CNTRSS.pdf`,
      'attachment'
    );
  } catch (err) {
    console.error('Document download error:', err);
    res.status(500).json({ error: 'Erreur interne lors du téléchargement.' });
  }
});

// Attestation officielle : véritable PDF (et non plus un message d'alerte).
app.get('/api/documents/:id/certificate', requireAuth(), async (req: Request, res: Response) => {
  const doc = findDocumentById(req.params.id);
  if (!doc) {
    res.status(404).json({ error: 'Document introuvable dans le catalogue.' });
    return;
  }

  try {
    const bytes = await buildCertificatePdf(doc);
    await pushAuditDb({
      userName: req.user?.fullName || 'Membre CNTRSS',
      role: req.user?.role || 'Étudiant',
      action: "Attestation d'indexation téléchargée",
      resource: `${doc.doi} - ${doc.title}`,
      status: 'Succès',
      ipAddress: req.ip || 'inconnu'
    });
    sendPdf(res, bytes, `Attestation_CNTRSS_${doc.id}.pdf`, 'attachment');
  } catch (err) {
    console.error('Certificate error:', err);
    res.status(500).json({ error: "Erreur interne lors de la génération de l'attestation." });
  }
});

// ---------- Validation queue (bibliothèque / admin) ----------

app.get('/api/validation', requireRole('Bibliothécaire', 'Administrateur'), (req: Request, res: Response) => {
  try {
    const { status } = req.query as Record<string, string>;
    let list = validationQueue;
    if (status && status !== 'all') {
      list = list.filter((v) => v.status === status);
    }
    res.json({ items: list, total: list.length });
  } catch (err) {
    console.error('Validation queue error:', err);
    res.status(500).json({ error: 'Erreur interne de la file de validation' });
  }
});

app.get('/api/validation/:id', requireRole('Bibliothécaire', 'Administrateur'), (req: Request, res: Response) => {
  const item = validationQueue.find((v) => v.id === req.params.id);
  if (!item) {
    res.status(404).json({ error: 'Dossier de validation introuvable.' });
    return;
  }
  res.json(item);
});

app.post('/api/validation/:id/approve', requireRole('Bibliothécaire', 'Administrateur'), async (req: Request, res: Response) => {
  try {
    const item = validationQueue.find((v) => v.id === req.params.id);
    if (!item) {
      res.status(404).json({ error: 'Dossier introuvable.' });
      return;
    }

    const now = new Date().toISOString().split('T')[0];
    const newStatus: ValidationItem['status'] = 'Validé & Publié';
    const shelfLocation = (req.body?.shelfLocation as string) || item.shelfLocation || `COTE: CNTRSS-${now.slice(2)}-VAL`;
    const reviewNotes = (req.body?.reviewNotes as string) || 'Validé par le comité académique CNTRSS.';

    item.status = newStatus;
    item.shelfLocation = shelfLocation;
    item.reviewNotes = reviewNotes;

    // Un dépôt validé est « classé et répertorié » : le document apparaît dans
    // le catalogue (statut, DOI, compteurs de l'observatoire à jour) même s'il
    // n'existait pas encore en base.
    let doc = documents.find((d) => d.doi === item.assignedDoi || d.id === item.id);

    if (!doc) {
      const year = Number(item.submissionDate.slice(0, 4)) || new Date().getFullYear();
      const doi = await allocateDoi(item.discipline, year);

      doc = {
        id: `doc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        doi,
        title: item.title,
        type: item.type,
        discipline: item.discipline,
        year,
        author: item.author,
        supervisor: item.supervisor,
        institution: item.institution,
        keywords: item.meshTerms.length ? item.meshTerms : [item.discipline],
        meshTerms: item.meshTerms,
        abstract: `Travail de recherche « ${item.title} » déposé par ${item.author} (${item.institution}) et validé par le comité académique CNTRSS le ${now}. Résumé détaillé à compléter par l'auteur lors de la mise en ligne.`,
        pages: 0,
        downloads: 0,
        views: 0,
        dateAdded: now,
        status: newStatus,
        isFeatured: false
      };
      documents.unshift(doc);
      if (!item.assignedDoi) {
        item.assignedDoi = doi;
      }
    } else {
      doc.status = newStatus;
    }

    // Le PDF réellement déposé par l'auteur suit le dossier dans le catalogue :
    // c'est ce fichier qui est servi en consultation et en téléchargement.
    if (item.fileName) {
      doc.fileName = item.fileName;
      doc.fileMime = item.fileMime || 'application/pdf';
      doc.fileBytes = item.fileBytes;
      doc.hasFile = true;
      const source = storedFilePath(item.id);
      if (fs.existsSync(source)) {
        ensureUploadsDir();
        fs.copyFileSync(source, storedFilePath(doc.id));
      }
    }

    await persistDocument(doc);
    await persistValidation(item);

    pushAudit({
      userName: req.user?.fullName || 'Bibliothécaire CNTRSS',
      role: req.user?.role || 'Bibliothécaire',
      action: 'Validation académique & attribution DOI pérenne',
      resource: `${item.assignedDoi} - ${item.title}`,
      status: 'Succès',
      ipAddress: req.ip || 'inconnu'
    });
    await pushAuditDb({
      userName: req.user?.fullName || 'Bibliothécaire CNTRSS',
      role: req.user?.role || 'Bibliothécaire',
      action: 'Validation académique & attribution DOI pérenne',
      resource: `${item.assignedDoi} - ${item.title}`,
      status: 'Succès',
      ipAddress: req.ip || 'inconnu'
    });

    res.json({ ok: true, item: { ...item } });
  } catch (err) {
    console.error('Approve error:', err);
    res.status(500).json({ error: 'Erreur interne de validation' });
  }
});
// ---------- Demande de corrections ----------

app.post('/api/validation/:id/request-corrections', requireRole('Bibliothécaire', 'Administrateur'), async (req: Request, res: Response) => {
  try {
    const item = validationQueue.find((v) => v.id === req.params.id);
    if (!item) {
      res.status(404).json({ error: 'Dossier introuvable.' });
      return;
    }

    const reviewNotes = (req.body?.reviewNotes as string) || 'Corrections demandées par le comité académique.';
    item.status = 'Corrections requises';
    item.reviewNotes = reviewNotes;

    await persistValidation(item);

    pushAudit({
      userName: req.user?.fullName || 'Bibliothécaire CNTRSS',
      role: req.user?.role || 'Bibliothécaire',
      action: 'Demande de corrections transmise à l\'auteur',
      resource: `${item.assignedDoi} - ${item.title}`,
      status: 'Succès',
      ipAddress: req.ip || 'inconnu'
    });
    await pushAuditDb({
      userName: req.user?.fullName || 'Bibliothécaire CNTRSS',
      role: req.user?.role || 'Bibliothécaire',
      action: 'Demande de corrections transmise à l\'auteur',
      resource: `${item.assignedDoi} - ${item.title}`,
      status: 'Succès',
      ipAddress: req.ip || 'inconnu'
    });

    res.json({ ok: true, item: { ...item } });
  } catch (err) {
    console.error('Corrections error:', err);
    res.status(500).json({ error: 'Erreur interne de validation' });
  }
});

// ---------- Refus d'un dépôt ----------
// Un dépôt peut être refusé par le comité (motif obligatoire transmis à
// l'auteur) : il ne crée aucun document, aucun DOI n'est attribué.

app.post('/api/validation/:id/reject', requireRole('Bibliothécaire', 'Administrateur'), async (req: Request, res: Response) => {
  try {
    const item = validationQueue.find((v) => v.id === req.params.id);
    if (!item) {
      res.status(404).json({ error: 'Dossier introuvable.' });
      return;
    }

    const reviewNotes = typeof req.body?.reviewNotes === 'string' ? req.body.reviewNotes.trim() : '';
    if (reviewNotes.length < 5) {
      res.status(400).json({ error: 'Motif du refus requis (5 caractères minimum).' });
      return;
    }

    item.status = 'Refusé';
    item.reviewNotes = reviewNotes;

    await persistValidation(item);

    pushAudit({
      userName: req.user?.fullName || 'Bibliothécaire CNTRSS',
      role: req.user?.role || 'Bibliothécaire',
      action: 'Refus de dépôt par le comité académique',
      resource: `${item.assignedDoi || item.id} - ${item.title}`,
      status: 'Succès',
      ipAddress: req.ip || 'inconnu'
    });
    await pushAuditDb({
      userName: req.user?.fullName || 'Bibliothécaire CNTRSS',
      role: req.user?.role || 'Bibliothécaire',
      action: 'Refus de dépôt par le comité académique',
      resource: `${item.assignedDoi || item.id} - ${item.title}`,
      status: 'Succès',
      ipAddress: req.ip || 'inconnu'
    });

    res.json({ ok: true, item: { ...item } });
  } catch (err) {
    console.error('Reject error:', err);
    res.status(500).json({ error: 'Erreur interne de refus du dépôt' });
  }
});

app.post('/api/validation/:id/mesh', requireRole('Bibliothécaire', 'Administrateur'), async (req: Request, res: Response) => {
  try {
    const item = validationQueue.find((v) => v.id === req.params.id);
    if (!item) {
      res.status(404).json({ error: 'Dossier introuvable.' });
      return;
    }

    const term = (req.body?.term as string)?.trim();
    if (!term) {
      res.status(400).json({ error: 'Descripteur MeSH manquant.' });
      return;
    }
    if (item.meshTerms.includes(term)) {
      res.status(409).json({ error: 'Descripteur déjà indexé.' });
      return;
    }

    item.meshTerms = [...item.meshTerms, term];
    await persistValidation(item);
    res.json({ ok: true, item: { ...item } });
  } catch (err) {
    console.error('Mesh error:', err);
    res.status(500).json({ error: 'Erreur interne d\'indexation MeSH' });
  }
});

// ---------- Demandes de document ----------

app.get('/api/requests', requireRole('Bibliothécaire', 'Administrateur'), (req: Request, res: Response) => {
  try {
    const { status, priority } = req.query as Record<string, string>;
    let list = documentRequests;
    if (status && status !== 'all') list = list.filter((r) => r.status === status);
    if (priority && priority !== 'all') list = list.filter((r) => r.priority === priority);
    res.json({ items: list, total: list.length });
  } catch (err) {
    console.error('Requests error:', err);
    res.status(500).json({ error: 'Erreur interne des demandes documentaires' });
  }
});

app.post('/api/requests', requireAuth({ csrf: true }), async (req: Request, res: Response) => {
  try {
    const body = req.body as {
      title: string;
      author?: string;
      requesterName: string;
      requesterEmail: string;
      requesterRole: string;
      institution: string;
      priority?: 'Normale' | 'Haute' | 'Urgente (Soutenance)';
      notes?: string;
    };

    if (!body.title || !body.requesterName || !body.requesterEmail || !body.institution) {
      res.status(400).json({ error: 'Champs obligatoires manquants pour la demande.' });
      return;
    }

    const id = `req-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
    const now = new Date().toISOString().split('T')[0];

    const record: DocumentRequestRecord = {
      id,
      title: body.title,
      author: body.author,
      requesterName: body.requesterName,
      requesterEmail: body.requesterEmail,
      requesterRole: body.requesterRole || 'Étudiant',
      institution: body.institution,
      date: now,
      status: 'En cours de recherche',
      priority: body.priority || 'Normale',
      notes: body.notes
    };

    documentRequests.unshift(record);
    await persistRequest(record);
    pushAudit({
      userName: body.requesterName,
      role: (body.requesterRole || 'Étudiant') as UserRole,
      action: 'Nouvelle demande de document',
      resource: `${record.title} (${record.priority})`,
      status: 'Succès',
      ipAddress: req.ip || 'inconnu'
    });
    await pushAuditDb({
      userName: body.requesterName,
      role: (body.requesterRole || 'Étudiant') as UserRole,
      action: 'Nouvelle demande de document',
      resource: `${record.title} (${record.priority})`,
      status: 'Succès',
      ipAddress: req.ip || 'inconnu'
    });

    res.status(201).json({ ok: true, record });
  } catch (err) {
    console.error('Request create error:', err);
    res.status(500).json({ error: 'Erreur interne de la demande documentaire' });
  }
});

app.post('/api/requests/:id/status', requireRole('Bibliothécaire', 'Administrateur'), async (req: Request, res: Response) => {
  try {
    const record = documentRequests.find((r) => r.id === req.params.id);
    if (!record) {
      res.status(404).json({ error: 'Demande introuvable.' });
      return;
    }

    const newStatus = (req.body?.status as DocumentRequestRecord['status']) || record.status;
    record.status = newStatus;

    await persistRequest(record);

    pushAudit({
      userName: req.user?.fullName || 'Bibliothécaire CNTRSS',
      role: req.user?.role || 'Bibliothécaire',
      action: 'Mise à jour du statut de demande documentaire',
      resource: `${record.title} -> ${newStatus}`,
      status: 'Succès',
      ipAddress: req.ip || 'inconnu'
    });
    await pushAuditDb({
      userName: req.user?.fullName || 'Bibliothécaire CNTRSS',
      role: req.user?.role || 'Bibliothécaire',
      action: 'Mise à jour du statut de demande documentaire',
      resource: `${record.title} -> ${newStatus}`,
      status: 'Succès',
      ipAddress: req.ip || 'inconnu'
    });

    res.json({ ok: true, record: { ...record } });
  } catch (err) {
    console.error('Request status error:', err);
    res.status(500).json({ error: 'Erreur interne de la demande documentaire' });
  }
});

// ---------- Observatoire ----------

app.get('/api/observatory', (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const thisYear = now.getFullYear();

    const byDiscipline = DISCIPLINES.reduce<Record<string, number>>((acc, d) => {
      acc[d.id] = documents.filter((doc) => doc.discipline === d.id).length;
      return acc;
    }, {});

    const byInstitution = documents.reduce<Record<string, number>>((acc, doc) => {
      acc[doc.institution] = (acc[doc.institution] || 0) + 1;
      return acc;
    }, {});

    const totalDownloads = documents.reduce((acc, doc) => acc + (doc.downloads || 0), 0);
    const totalViews = documents.reduce((acc, doc) => acc + (doc.views || 0), 0);
    const totalCitations = documents.reduce((acc, doc) => acc + (doc.citationsCount || 0), 0);
    const validatedCount = documents.filter((doc) => doc.status === 'Validé & Publié').length;
    const pendingCount = validationQueue.filter((v) => v.status === 'En attente').length;

    const topInstitutions = Object.entries(byInstitution)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count]) => ({ name, count }));

    const topDisciplines = Object.entries(byDiscipline)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count]) => ({ name, count }));

    res.json({
      totalDocuments: documents.length,
      validatedDocuments: validatedCount,
      pendingValidations: pendingCount,
      totalDownloads,
      totalViews,
      totalCitations,
      recentSubmissions: validationQueue.slice(0, 10),
      openRequests: documentRequests.filter((r) => r.status === 'En cours de recherche').length,
      topInstitutions,
      topDisciplines,
      byDiscipline,
      byInstitution,
      insertedAt: now.toISOString()
    });
  } catch (err) {
    console.error('Observatory error:', err);
    res.status(500).json({ error: 'Erreur interne de l\'observatoire' });
  }
});

// ---------- Assistant IA (existant, inchangé sauf hook d'audit) ----------

// L'assistant est un outil de travail pour les comptes académiques (étude et
// enseignement) : une session est exigée, comme pour la lecture du catalogue.
app.post('/api/assistant/chat', requireAuth(), assistantLimiter, async (req: Request, res: Response) => {
  try {
    const { message, history, mode = 'general', contextDoc } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message requis' });
      return;
    }

    // Fouille dans le catalogue indexé avant toute génération.
    const catalogueMatches = searchCatalogue(message, 5);
    const catalogueContext = buildCatalogueContext(catalogueMatches);

    const systemInstruction = `Tu es l'Assistant IA de Recherche Médicale et Scientifique du CNTRSS (Catalogue Numérique des Travaux de Recherches en Sciences de Santé au Bénin), en partenariat avec l'Université de Parakou et la Faculté des Sciences de la Santé.

Ton rôle est d'accompagner les étudiants en médecine, soins infirmiers, pharmacie, santé publique et biologie dans :
1. La formulation et l'affinement de leurs thèmes de mémoires et thèses (pertinence épidémiologique au Bénin, faisabilité, originalité).
2. Le cadrage méthodologique (critères PICO/PECO, études transversales, études cas-témoins, audits cliniques, calcul d'échantillon de Schwartz/Daniel, considérations éthiques au Bénin avec le CER-IS).
3. La revue de la littérature et l'indexation de mots-clés MeSH.
4. Le plan type et la structure IMRAD (Introduction, Matériel et Méthodes, Résultats, Discussion, Conclusion & Recommandations).
5. La pertinence contextuelle au Bénin : pathologies locales prioritaires (paludisme, drépanocytose, HTA, diabète, malnutrition infantile, santé maternelle, infections néonatales, hygiène hospitalière au CHUD-Borgou, CHU-MEL, CNHU-HKM).

Consignes de réponse :
- Rédige en français avec rigueur académique, clarté pédagogique et bienveillance.
- Utilise des puces et des titres clairs lorsque pertinent.
- Cite les devis méthodologiques adaptés aux contextes hospitaliers et communautaires béninois.
${contextDoc ? `Contextualise ton analyse par rapport au document en cours d'examen : \"${contextDoc.title}\" de ${contextDoc.author} (${contextDoc.discipline}, ${contextDoc.institution}).` : ''}
${catalogueContext ? `Documents trouvés dans le catalogue national CNTRSS (appuie-toi dessus quand ils sont pertinents, cite systématiquement le titre, l'auteur, l'année et le DOI) :\n${catalogueContext}` : ''}`;

    if (aiClient) {
      try {
        const contents: any[] = [];
        if (Array.isArray(history)) {
          for (const msg of history) {
            contents.push({
              role: msg.role === 'user' ? 'user' : 'model',
              parts: [{ text: msg.content }]
            });
          }
        }
        contents.push({
          role: 'user',
          parts: [{ text: message }]
        });

        const response = await aiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents,
          config: {
            systemInstruction,
            temperature: 0.7
          }
        });

        const reply = response.text || "Désolé, aucune réponse n'a pu être générée.";
        pushAudit({
          userName: 'Assistant IA CNTRSS',
          role: 'Administrateur',
          action: 'Requête Assistant IA (Gemini)',
          resource: `Module Gemini 3.8 Flash /api/assistant/chat`,
          status: 'Succès',
          ipAddress: req.ip || 'inconnu'
        });
        res.json({ reply, source: 'gemini' });
        return;
      } catch (err: any) {
        console.error('Gemini API call failed, falling back to expert academic engine:', err);
      }
    }

    // Expert Fallback Engine with domain-authentic Beninese health research knowledge
    let fallbackReply = '';
    const lower = message.toLowerCase();

    if (lower.includes('paludisme') || lower.includes('malaria')) {
      fallbackReply = `### Recommandations méthodologiques pour l'étude du Paludisme au Bénin

Pour un mémoire ou une thèse sur le paludisme (zone soudano-guinéenne ou nord-béninoise comme Parakou) :

1. **Axes de recherche prioritaires :**
   - Évaluation de l'efficacité de la chimio-prévention du paludisme saisonnier (CPS).
   - Observance de l'utilisation des Moustiquaires Imprégnées d'Insecticide à Longue Durée d'Action (MILDA) en milieu périurbain.
   - Prévalence du paludisme gestationnel et issue de la grossesse au niveau des maternités périphériques.
   - Surveillance de la chimiorésistance aux dérivés d'artémisinine (ACT).

2. **Devis d'étude recommandé :**
   - **Étude transversale descriptive et analytique** avec échantillonnage en grappes à deux degrés (norme OMS).
   - Pour le volet biologique : Frottis sanguin / Goutte épaisse (GE/FS) doublé d'un Test de Diagnostic Rapide (TDR).

3. **Variables clés à recueillir :**
   - Densité parasitaire, taux d'hémoglobine (anémie associée), statut vaccinal et statut nutritionnel des enfants.

Souhaitez-vous un modèle de fiche de dépouillement ou une proposition de plan de mémoire adapté aux normes de votre faculté ?`;
    } else if (lower.includes('hta') || lower.includes('hypertension') || lower.includes('coeur') || lower.includes('cardiaque')) {
      fallbackReply = `### Cadrage de recherche : Hypertension Artérielle (HTA) en milieu béninois

1. **Problématique locale :**
   - Faible niveau de dépistage en soins de santé primaires (l'HTA reste souvent asymptomatique jusqu'aux complications neuro-vasculaires).
   - Problématique de l'observance thérapeutique liée au coût des molécules et au recours concomitant à la tradithérapie.

2. **Structure méthodologique recommandée :**
   - **Type d'étude :** Étude transversale menée en consultation externe ou en stratégie avancée communautaire.
   - **Critères d'inclusion :** Adultes $\\ge$ 18 ans résidant dans la zone sanitaire depuis plus de 6 mois, avec mesure de pression artérielle standardisée (2 mesures à 5 minutes d'intervalle au tensiomètre électronique validé OMS).

3. **Axes de résultats recommandés :**
   - Profil sociodémographique, facteurs de risque comportementaux (tabagisme, sédentarité, surconsommation de sel/bouillons industriels), taux de contrôle tensionnel sous monothérapie ou bithérapie.

Voulez-vous que nous élaborions ensemble la grille d'entretien pour les patients ?`;
    } else if (lower.includes('plan') || lower.includes('sommaire') || lower.includes('structure')) {
      fallbackReply = `### Structure type d'un Mémoire / Thèse de Santé (Normes CNTRSS / FSS / Universités)

Voici le canevas académique recommandé au Bénin :

- **PARTIE PRÉLIMINAIRE :** Page de garde réglementaire, Dédicaces, Remerciements, Hommage aux membres du jury, Liste des abréviations, Liste des tableaux et figures, Résumé (Français & Anglais) avec mots-clés MeSH.
- **CHAPITRE I : INTRODUCTION & JUSTIFICATION**
  - Énoncé du problème & ampleur épidémiologique
  - Questions de recherche, Hypothèses
  - Objectifs de recherche (1 objectif général + 3 à 4 objectifs spécifiques)
- **CHAPITRE II : REVUE DE LA LITTÉRATURE**
  - Cadre théorique et conceptuel
  - État des connaissances actuelles au Bénin et en Afrique subsaharienne
- **CHAPITRE III : CADRE ET MÉTHODES DE L'ÉTUDE**
  - Cadre d'étude (description de la formation sanitaire ou commune)
  - Type et période d'étude, Population cible
  - Critères d'inclusion et de non-inclusion
  - Échantillonnage et taille de l'échantillon (formule de Schwartz)
  - Outils de collecte et variables d'étude
  - Plan d'analyse des données (logiciels Epi Info, SPSS ou R)
  - Considérations éthiques et déontologiques (accord d'autorité et consentement éclairé)
- **CHAPITRE IV : RÉSULTATS** (présentation objective sous forme de tableaux et graphiques commentés)
- **CHAPITRE V : DISCUSSION** (confrontation avec la littérature, limites et biais de l'étude)
- **CONCLUSION ET RECOMMANDATIONS** (orientées décideurs, agents de santé et communauté)
- **RÉFÉRENCES BIBLIOGRAPHIQUES** (style Vancouver ou APA 7e)

Sur quelle section souhaitez-vous que nous travaillions en priorité ?`;
    } else {
      fallbackReply = `Bonjour ! Je suis l'Assistant IA de Recherche du CNTRSS.

Voici les domaines dans lesquels je peux vous apporter une assistance immédiate pour votre travail scientifique :

1. **Choix et affinement de thème** : Trouver un sujet pertinent, actuel et faisable dans votre établissement (Parakou, INMeS, FSS Cotonou, CHUD-Borgou...).
2. **Méthodologie d'étude** : Calcul de taille d'échantillon (formule de Schwartz/Daniel), choix du devis (transversale, cas-témoins, cohorte), critères d'inclusion et biais.
3. **Revue de la littérature** : Identifier les axes documentaires et formuler les mots-clés selon le thésaurus MeSH.
4. **Rédaction & Discussion** : Structuration de votre plan de mémoire (IMRAD), formulation des hypothèses et valorisation de vos résultats de terrain.

Quelle est votre filière et sur quel sujet travaillez-vous actuellement ?`;
    }

    // Fouille du catalogue jointe à la réponse du moteur académique.
    fallbackReply += catalogueContext
      ? `\n\n---\n### Documents trouvés dans le catalogue CNTRSS\n${catalogueContext}`
      : "\n\n---\n_Aucun document du catalogue ne correspond encore à cette requête (catalogue en cours d'alimentation)._";

    res.json({ reply: fallbackReply, source: 'academic_engine' });
  } catch (err: any) {
    console.error('Server error in assistant chat:', err);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// ---------- Configure Vite in development ----------

async function startServer() {
  await bootPersistence();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(ROOT_DIR, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(ROOT_DIR, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', async () => {
    structuredLog('info', 'server_started', { port: PORT, nodeEnv: process.env.NODE_ENV });
  });
}

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled server error:', err?.message || err);
  structuredLog('error', 'unhandled_error', { error: err?.message || String(err) });
  const status = Number.isInteger(err?.status) ? err.status : 500;
  res.status(status).json({ error: status === 500 ? 'Erreur interne du serveur' : String(err?.message || 'Erreur') });
});

startServer().catch((err) => {
  structuredLog('error', 'server_start_failed', { error: err?.message || String(err) });
  process.exit(1);
});
