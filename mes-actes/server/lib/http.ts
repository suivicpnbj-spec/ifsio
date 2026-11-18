import type { NextFunction, Request, RequestHandler, Response } from 'express'
import { ZodError, type TypeOf, type ZodTypeAny } from 'zod'

/** Erreur applicative portant un code HTTP. */
export class HttpError extends Error {
  readonly status: number
  readonly details?: unknown

  constructor(status: number, message: string, details?: unknown) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.details = details
  }
}

export const badRequest = (message: string, details?: unknown) => new HttpError(400, message, details)
export const unauthorized = (message = 'Authentification requise.') => new HttpError(401, message)
export const forbidden = (message = 'Accès refusé.') => new HttpError(403, message)
export const notFound = (message = 'Ressource introuvable.') => new HttpError(404, message)
export const conflict = (message: string) => new HttpError(409, message)

/** Enveloppe les handlers asynchrones pour propager les rejets à Express. */
export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => unknown | Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next)
  }
}

/** Valide le corps d'une requête avec Zod et renvoie un objet typé. */
export function parseBody<T extends ZodTypeAny>(schema: T, body: unknown): TypeOf<T> {
  const result = schema.safeParse(body)
  if (!result.success) {
    throw badRequest('Données invalides.', formatZodError(result.error))
  }
  return result.data
}

export function formatZodError(error: ZodError): Array<{ path: string; message: string }> {
  return error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }))
}

/** Middleware d'erreur : renvoie une réponse JSON homogène. */
export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof HttpError) {
    res.status(error.status).json({ error: error.message, details: error.details })
    return
  }

  if (error instanceof ZodError) {
    res.status(400).json({ error: 'Données invalides.', details: formatZodError(error) })
    return
  }

  const message = error instanceof Error ? error.message : 'Erreur interne du serveur.'
  console.error('[api] erreur non gérée :', error)
  res.status(500).json({ error: message })
}
