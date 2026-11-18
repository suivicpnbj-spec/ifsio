import type { Request, RequestHandler, Response } from 'express'
import { HttpError } from './http'

interface Bucket {
  count: number
  resetAt: number
}

export interface RateLimitOptions {
  /** Nombre de tentatives autorisées sur la fenêtre. */
  limit: number
  /** Durée de la fenêtre en millisecondes. */
  windowMs: number
  /** Clé de comptage (par défaut : IP + e-mail visé). */
  key?: (req: Request) => string
  message?: string
}

/**
 * Limitation en mémoire, adaptée à un déploiement mono-processus.
 * Le compteur est remis à zéro par `resetRateLimit` après une connexion réussie.
 */
export function createRateLimit(options: RateLimitOptions) {
  const buckets = new Map<string, Bucket>()

  const keyOf = (req: Request): string => {
    if (options.key) return options.key(req)
    const email = typeof req.body?.email === 'string' ? req.body.email.toLowerCase() : ''
    return `${req.ip ?? 'unknown'}|${email}`
  }

  const middleware: RequestHandler = (req: Request, res: Response, next) => {
    const now = Date.now()
    const key = keyOf(req)
    const bucket = buckets.get(key)

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + options.windowMs })
      next()
      return
    }

    bucket.count += 1
    if (bucket.count > options.limit) {
      const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))
      res.setHeader('Retry-After', String(retryAfter))
      next(
        new HttpError(
          429,
          options.message ??
            'Trop de tentatives. Patientez quelques minutes avant de réessayer.',
        ),
      )
      return
    }

    next()
  }

  const reset = (req: Request): void => {
    buckets.delete(keyOf(req))
  }

  // Évite de conserver indéfiniment les compteurs inactifs.
  const timer = setInterval(() => {
    const now = Date.now()
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(key)
    }
  }, options.windowMs)
  timer.unref()

  return { middleware, reset }
}
