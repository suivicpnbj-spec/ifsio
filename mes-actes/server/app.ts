import { existsSync } from 'node:fs'
import path from 'node:path'
import express, { Router } from 'express'
import type { AppContext } from './context'
import { errorHandler } from './lib/http'
import { cookieParser, createAuthMiddleware } from './middleware/auth'
import { createAdminRouter } from './routes/admin'
import { createAttachmentsRouter } from './routes/attachments'
import { createAuthRouter } from './routes/auth'
import { createCatalogRouter } from './routes/catalog'
import { createNotificationsRouter } from './routes/notifications'
import { createPublicRouter } from './routes/public'
import { createRequestsRouter } from './routes/requests'

export function createApp(context: AppContext) {
  const { config } = context
  const app = express()

  app.disable('x-powered-by')
  if (config.trustProxy !== false) app.set('trust proxy', config.trustProxy)

  // En-têtes de sécurité minimaux, sans dépendance supplémentaire.
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('X-Frame-Options', 'SAMEORIGIN')
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
    if (config.isProduction) {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
    }
    next()
  })

  app.use(express.json({ limit: '2mb' }))
  app.use(express.urlencoded({ extended: true, limit: '2mb' }))
  app.use(cookieParser())
  app.use(createAuthMiddleware(context.repo, config))

  const api = Router()
  api.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'mes-actes-api',
      time: new Date().toISOString(),
    })
  })
  api.use('/auth', createAuthRouter(context))
  api.use(createCatalogRouter(context))
  api.use(createRequestsRouter(context))
  api.use(createAttachmentsRouter(context))
  api.use(createNotificationsRouter(context))
  api.use(createAdminRouter(context))
  api.use(createPublicRouter(context))

  app.use('/api', api)
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Route API inconnue.' })
  })

  // Le front compilé est servi par le même serveur (déploiement mono-processus).
  if (config.serveStatic && existsSync(config.staticDir)) {
    app.use(
      express.static(config.staticDir, {
        index: false,
        setHeaders: (res, filePath) => {
          // Les fichiers de `assets/` sont versionnés par Vite : cache long.
          if (filePath.includes(`${path.sep}assets${path.sep}`)) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
          } else {
            res.setHeader('Cache-Control', 'public, max-age=300')
          }
        },
      }),
    )
    app.get('*', (_req, res) => {
      res.setHeader('Cache-Control', 'no-cache')
      res.sendFile(path.join(config.staticDir, 'index.html'))
    })
  }

  app.use(errorHandler)

  return app
}
