import type { NextFunction, Request, RequestHandler, Response } from 'express'
import type { Config } from '../config'
import type { Repository } from '../db/repository'
import { verifyToken } from '../lib/crypto'
import { forbidden, unauthorized } from '../lib/http'
import type { UserRole } from '../../src/types'

/** Parse l'en-tête `Cookie` et expose `req.cookies`. */
export function cookieParser(): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const header = req.headers.cookie
    const cookies: Record<string, string> = {}
    if (header) {
      for (const part of header.split(';')) {
        const separator = part.indexOf('=')
        if (separator < 0) continue
        const name = part.slice(0, separator).trim()
        const value = part.slice(separator + 1).trim()
        if (!name) continue
        try {
          cookies[name] = decodeURIComponent(value)
        } catch {
          cookies[name] = value
        }
      }
    }
    req.cookies = cookies
    next()
  }
}

/** Rattache `req.user` si un jeton d'accès valide est fourni. */
export function createAuthMiddleware(repository: Repository, config: Config): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const header = req.headers.authorization
    if (!header || !header.startsWith('Bearer ')) {
      next()
      return
    }

    try {
      const payload = verifyToken(header.slice(7).trim(), config.jwtSecret, 'access')
      const user = repository.findUserById(payload.sub)
      if (user && user.status === 'active') {
        req.user = {
          id: user.id,
          role: user.role,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
        }
      }
    } catch {
      // Jeton invalide ou expiré : la requête reste anonyme.
    }

    next()
  }
}

/** Exige une session authentifiée (et éventuellement un rôle précis). */
export function requireAuth(...roles: UserRole[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      next(unauthorized())
      return
    }
    if (roles.length > 0 && !roles.includes(req.user.role)) {
      next(forbidden('Cette action est réservée à un autre profil.'))
      return
    }
    next()
  }
}
