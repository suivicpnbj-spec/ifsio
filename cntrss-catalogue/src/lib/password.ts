import { randomBytes, scrypt as scryptCallback, timingSafeEqual, type ScryptOptions } from 'node:crypto';
import { promisify } from 'node:util';

// Module serveur uniquement (jamais importé par le client) : il repose sur
// node:crypto. Aucune dépendance externe n'est nécessaire, scrypt est fourni
// par Node et recommandé par l'OWASP pour le stockage de mots de passe.

const scrypt = promisify(scryptCallback) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: ScryptOptions
) => Promise<Buffer>;

const KEY_LENGTH = 64;
const PARAMS = { N: 16384, r: 8, p: 1 } as const;

export const PASSWORD_MIN_LENGTH = 8;

/** Formate un mot de passe en `scrypt$N$r$p$sel$empreinte` (tout en base64). */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, KEY_LENGTH, PARAMS);
  return [
    'scrypt',
    PARAMS.N,
    PARAMS.r,
    PARAMS.p,
    salt.toString('base64'),
    derived.toString('base64')
  ].join('$');
}

/** Vérifie un mot de passe contre une empreinte stockée (comparaison à temps constant). */
export async function verifyPassword(password: string, stored: string | null | undefined): Promise<boolean> {
  if (!stored) return false;

  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;

  const N = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  if (!Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p)) return false;

  const salt = Buffer.from(parts[4], 'base64');
  const expected = Buffer.from(parts[5], 'base64');
  if (salt.length === 0 || expected.length === 0) return false;

  try {
    const derived = await scrypt(password, salt, expected.length, {
      N,
      r,
      p,
      maxmem: 128 * N * r * 2
    });
    return derived.length === expected.length && timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

let dummyHash: Promise<string> | null = null;

/**
 * Empreinte factice : elle est vérifiée quand l'e-mail est inconnu afin que le
 * temps de réponse d'un échec « compte inexistant » reste comparable à celui
 * d'un « mot de passe erroné » (limite l'énumération de comptes).
 */
export function dummyPasswordHash(): Promise<string> {
  if (!dummyHash) {
    dummyHash = hashPassword('empreinte-factice-cntrss');
  }
  return dummyHash;
}
