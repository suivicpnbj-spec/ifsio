import { createHash, createHmac, randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto'

/* ────────────────────────────── Mots de passe ────────────────────────────── */

const SCRYPT_COST = 16384
const SCRYPT_BLOCK_SIZE = 8
const SCRYPT_PARALLELISM = 1
const KEY_LENGTH = 64
const MAX_MEMORY = 96 * 1024 * 1024

/**
 * Hache un mot de passe avec scrypt (sel aléatoire, 16 octets).
 * Format stocké : `scrypt$N$r$p$sel$hash` (base64).
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16)
  const hash = scryptSync(password, salt, KEY_LENGTH, {
    N: SCRYPT_COST,
    r: SCRYPT_BLOCK_SIZE,
    p: SCRYPT_PARALLELISM,
    maxmem: MAX_MEMORY,
  })
  return [
    'scrypt',
    SCRYPT_COST,
    SCRYPT_BLOCK_SIZE,
    SCRYPT_PARALLELISM,
    salt.toString('base64'),
    hash.toString('base64'),
  ].join('$')
}

/** Vérifie un mot de passe en temps constant. */
export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split('$')
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false

  const cost = Number(parts[1])
  const blockSize = Number(parts[2])
  const parallelism = Number(parts[3])
  if (!cost || !blockSize || !parallelism) return false

  let salt: Buffer
  let expected: Buffer
  try {
    salt = Buffer.from(parts[4], 'base64')
    expected = Buffer.from(parts[5], 'base64')
  } catch {
    return false
  }
  if (expected.length === 0) return false

  const actual = scryptSync(password, salt, expected.length, {
    N: cost,
    r: blockSize,
    p: parallelism,
    maxmem: MAX_MEMORY,
  })
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

/* ──────────────────────────────── JWT (HS256) ─────────────────────────────── */

export type TokenType = 'access' | 'refresh'

export interface TokenPayload {
  sub: string
  role: 'student' | 'admin'
  email: string
  typ: TokenType
  iat: number
  exp: number
  jti: string
}

function base64UrlEncode(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function base64UrlDecode(input: string): Buffer {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/')
  return Buffer.from(padded.padEnd(padded.length + ((4 - (padded.length % 4)) % 4), '='), 'base64')
}

/** Signe un JWT HS256 (aucune dépendance externe). */
export function signToken(
  payload: Omit<TokenPayload, 'iat' | 'exp' | 'jti'>,
  secret: string,
  ttlSeconds: number,
): string {
  const issuedAt = Math.floor(Date.now() / 1000)
  const body: TokenPayload = {
    ...payload,
    iat: issuedAt,
    exp: issuedAt + ttlSeconds,
    jti: randomUUID(),
  }
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const claims = base64UrlEncode(JSON.stringify(body))
  const signature = base64UrlEncode(
    createHmac('sha256', secret).update(`${header}.${claims}`).digest(),
  )
  return `${header}.${claims}.${signature}`
}

/** Vérifie la signature et l'expiration d'un JWT HS256. */
export function verifyToken(token: string, secret: string, expected?: TokenType): TokenPayload {
  const parts = token.split('.')
  if (parts.length !== 3) {
    throw new Error('Jeton mal formé')
  }

  const [header, claims, signature] = parts
  const expectedSignature = base64UrlEncode(
    createHmac('sha256', secret).update(`${header}.${claims}`).digest(),
  )
  const provided = Buffer.from(signature)
  const computed = Buffer.from(expectedSignature)
  if (provided.length !== computed.length || !timingSafeEqual(provided, computed)) {
    throw new Error('Signature de jeton invalide')
  }

  const payload = JSON.parse(base64UrlDecode(claims).toString('utf8')) as TokenPayload
  if (payload.exp * 1000 < Date.now()) {
    throw new Error('Jeton expiré')
  }
  if (expected && payload.typ !== expected) {
    throw new Error('Type de jeton inattendu')
  }
  return payload
}

/* ───────────────────────────────── Utilitaires ──────────────────────────────── */

export function sha256(input: string | Buffer): string {
  return createHash('sha256').update(input).digest('hex')
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url')
}

/** Empreinte d'un secret, utilisée pour indexer les sessions sans le stocker en clair. */
export function hashToken(token: string): string {
  return sha256(token)
}
