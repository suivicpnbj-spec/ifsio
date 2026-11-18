import { Router } from 'express'
import { z } from 'zod'
import type { AppContext } from '../context'
import { hashPassword, hashToken, verifyPassword } from '../lib/crypto'
import { badRequest, conflict, parseBody, unauthorized } from '../lib/http'
import { issueTokens, REFRESH_COOKIE, rotateTokens, setRefreshCookie } from '../lib/tokens'
import { toSessionDto, toStudentDto } from '../lib/dto'
import { createRateLimit } from '../lib/rateLimit'
import { requireAuth } from '../middleware/auth'

const registerSchema = z.object({
  firstName: z.string().trim().min(2, 'Le prénom est requis.'),
  lastName: z.string().trim().min(2, 'Le nom est requis.'),
  email: z.string().trim().email('Adresse e-mail invalide.'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères.'),
  matricule: z.string().trim().min(3, 'Le matricule est requis.'),
  filiere: z.string().trim().min(2, 'La filière est requise.'),
  promotion: z.string().trim().min(1, 'Le niveau est requis.'),
  phone: z.string().trim().optional(),
})

const loginSchema = z.object({
  email: z.string().trim().email('Adresse e-mail invalide.'),
  password: z.string().min(1, 'Mot de passe requis.'),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Le mot de passe actuel est requis.'),
  newPassword: z
    .string()
    .min(8, 'Le nouveau mot de passe doit contenir au moins 8 caractères.'),
})

export function createAuthRouter(context: AppContext): Router {
  const router = Router()
  const { repo, config } = context

  // Freine les attaques par force brute sur les mots de passe.
  const loginLimit = createRateLimit({ limit: 10, windowMs: 15 * 60 * 1000 })
  const registerLimit = createRateLimit({
    limit: 20,
    windowMs: 60 * 60 * 1000,
    key: (req) => `register|${req.ip ?? 'unknown'}`,
    message: 'Trop de créations de compte depuis cet appareil. Réessayez plus tard.',
  })

  router.post('/register', registerLimit.middleware, (req, res) => {
    const input = parseBody(registerSchema, req.body)

    if (repo.findUserByEmail(input.email)) {
      throw conflict('Un compte existe déjà avec cette adresse e-mail.')
    }

    const user = repo.insertUser({
      role: 'student',
      email: input.email,
      passwordHash: hashPassword(input.password),
      firstName: input.firstName,
      lastName: input.lastName.toUpperCase(),
      matricule: input.matricule,
      phone: input.phone ?? null,
      filiere: input.filiere,
      promotion: input.promotion,
      title: `Étudiant en ${input.filiere.replace('Licence Professionnelle en ', '')}`,
    })

    const tokens = issueTokens(repo, config, user)
    setRefreshCookie(res, tokens.refreshToken, config)

    repo.audit({
      actorId: user.id,
      actorRole: user.role,
      action: 'auth.register',
      entity: 'user',
      entityId: user.id,
    })

    res.status(201).json({
      user: toSessionDto(user),
      student: toStudentDto(user),
      accessToken: tokens.accessToken,
      expiresIn: config.accessTokenTtl,
    })
  })

  router.post('/login', loginLimit.middleware, (req, res) => {
    const input = parseBody(loginSchema, req.body)
    const user = repo.findUserByEmail(input.email)

    if (!user || !verifyPassword(input.password, user.password_hash)) {
      throw unauthorized('Identifiants incorrects.')
    }
    if (user.status !== 'active') {
      throw unauthorized('Ce compte est désactivé. Contactez la scolarité.')
    }

    loginLimit.reset(req)
    const tokens = issueTokens(repo, config, user)
    setRefreshCookie(res, tokens.refreshToken, config)

    repo.audit({
      actorId: user.id,
      actorRole: user.role,
      action: 'auth.login',
      entity: 'user',
      entityId: user.id,
    })

    res.json({
      user: toSessionDto(user),
      student: user.role === 'student' ? toStudentDto(user) : undefined,
      accessToken: tokens.accessToken,
      expiresIn: config.accessTokenTtl,
    })
  })

  router.post('/refresh', (req, res) => {
    const fromCookie = req.cookies?.[REFRESH_COOKIE]
    const fromBody = typeof req.body?.refreshToken === 'string' ? req.body.refreshToken : undefined
    const refreshToken = fromCookie ?? fromBody

    if (!refreshToken) {
      throw unauthorized('Session expirée, veuillez vous reconnecter.')
    }

    const rotated = rotateTokens(repo, config, refreshToken)
    if (!rotated) {
      throw unauthorized('Session expirée, veuillez vous reconnecter.')
    }

    setRefreshCookie(res, rotated.tokens.refreshToken, config)
    res.json({
      user: toSessionDto(rotated.user),
      accessToken: rotated.tokens.accessToken,
      expiresIn: config.accessTokenTtl,
    })
  })

  router.post('/logout', (req, res) => {
    const fromCookie = req.cookies?.[REFRESH_COOKIE]
    if (fromCookie) {
      const session = repo.findSessionByTokenHash(hashToken(fromCookie))
      if (session) repo.revokeSession(session.id)
    }
    res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' })
    res.status(204).end()
  })

  /** Changement de mot de passe du compte connecté. */
  router.post('/password', requireAuth(), (req, res) => {
    const input = parseBody(passwordSchema, req.body)
    const user = repo.findUserById(req.user!.id)
    if (!user) throw unauthorized('Session invalide.')

    if (!verifyPassword(input.currentPassword, user.password_hash)) {
      throw badRequest('Le mot de passe actuel est incorrect.')
    }

    repo.updateUserPassword(user.id, hashPassword(input.newPassword))
    repo.audit({
      actorId: user.id,
      actorRole: user.role,
      action: 'auth.password',
      entity: 'user',
      entityId: user.id,
    })

    res.status(204).end()
  })

  router.get('/me', requireAuth(), (req, res) => {
    const user = repo.findUserById(req.user!.id)
    if (!user) throw unauthorized('Session invalide.')
    res.json({
      user: toSessionDto(user),
      student: user.role === 'student' ? toStudentDto(user) : undefined,
    })
  })

  return router
}
