import type { Config } from '../config'
import type { Repository } from '../db/repository'
import type { UserRow } from '../lib/dto'
import { hashToken, randomToken, signToken } from './crypto'

export const REFRESH_COOKIE = 'mes_actes_rt'

export interface IssuedTokens {
  accessToken: string
  refreshToken: string
  refreshExpiresAt: string
}

/** Émet un couple access token / refresh token et enregistre la session. */
export function issueTokens(
  repository: Repository,
  config: Config,
  user: UserRow,
): IssuedTokens {
  const refreshToken = randomToken(48)
  const refreshExpiresAt = new Date(Date.now() + config.refreshTokenTtl * 1000)

  repository.insertSession({
    userId: user.id,
    tokenHash: hashToken(refreshToken),
    expiresAt: refreshExpiresAt.toISOString(),
  })

  const accessToken = signToken(
    { sub: user.id, role: user.role, email: user.email, typ: 'access' },
    config.jwtSecret,
    config.accessTokenTtl,
  )

  return { accessToken, refreshToken, refreshExpiresAt: refreshExpiresAt.toISOString() }
}

/** Émet un nouveau couple de jetons à partir d'un refresh token valide. */
export function rotateTokens(
  repository: Repository,
  config: Config,
  refreshToken: string,
): { tokens: IssuedTokens; user: UserRow } | null {
  const session = repository.findSessionByTokenHash(hashToken(refreshToken))
  if (!session || session.revoked_at) return null
  if (new Date(session.expires_at).getTime() < Date.now()) return null

  const user = repository.findUserById(session.user_id)
  if (!user || user.status !== 'active') return null

  repository.revokeSession(session.id)
  return { tokens: issueTokens(repository, config, user), user }
}

/** Pose le cookie httpOnly qui transporte le refresh token. */
export function setRefreshCookie(
  res: { cookie: (name: string, value: string, options: Record<string, unknown>) => unknown },
  token: string,
  config: Config,
): void {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: config.refreshTokenTtl * 1000,
    path: '/api/auth',
  })
}
