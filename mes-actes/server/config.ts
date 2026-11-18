import path from 'node:path'

const DEV_JWT_SECRET = 'mes-actes-development-secret-change-me'

function env(name: string, fallback: string): string {
  const value = process.env[name]
  return value && value.trim() !== '' ? value.trim() : fallback
}

function envInt(name: string, fallback: number): number {
  const value = Number(process.env[name])
  return Number.isFinite(value) ? value : fallback
}

const root = process.cwd()

export interface Config {
  nodeEnv: string
  isProduction: boolean
  port: number
  databaseFile: string
  uploadDir: string
  publicBaseUrl: string
  jwtSecret: string
  accessTokenTtl: number
  refreshTokenTtl: number
  paymentProvider: 'manual' | 'cinetpay' | 'mock' | 'feexpay'
  cinetpay: {
    apiKey: string
    siteId: string
    secret: string
    baseUrl: string
    notifyUrl: string
    returnUrl: string
  }
  feexpay: {
    apiToken: string
    shopId: string
    baseUrl: string
    returnUrl: string
    cancelUrl: string
  }
  /** E-mails transactionnels (accusé de réception, quittance). */
  mailer: {
    provider: 'console' | 'resend'
    resendApiKey: string
    from: string
    /** Journal des e-mails en mode console (développement). */
    outboxFile: string
  }
  serveStatic: boolean
  staticDir: string
  /** Compte administrateur créé au premier démarrage d'une base vide. */
  bootAdmin: { email: string; password: string; firstName: string; lastName: string } | null
  /** Valeur passée à `app.set('trust proxy')` ; `false` si non configurée. */
  trustProxy: number | false
  /** Passerelle inter-services eRésultats IFSIO */
  resultatsApiUrl: string
  campusInternalSecret: string
}

export function loadConfig(overrides: Partial<Config> = {}): Config {
  const nodeEnv = env('NODE_ENV', 'development')
  const isProduction = nodeEnv === 'production'
  const configuredPort = envInt('PORT', 4000)
  // Un PORT=0 (variable héritée d'un autre environnement) désignerait un port
  // aléatoire : on retombe sur la valeur par défaut.
  const port = configuredPort > 0 ? configuredPort : 4000
  const bootAdminEmail = env('ADMIN_EMAIL', '')
  const bootAdminPassword = env('ADMIN_PASSWORD', '')
  const resendApiKey = env('RESEND_API_KEY', '')

  const config: Config = {
    nodeEnv,
    isProduction,
    port,
    databaseFile: env('DATABASE_FILE', path.join(root, 'data', 'mes-actes.db')),
    uploadDir: env('UPLOAD_DIR', path.join(root, 'data', 'uploads')),
    publicBaseUrl: env('PUBLIC_BASE_URL', `http://localhost:${port}`),
    jwtSecret: env('JWT_SECRET', isProduction ? '' : DEV_JWT_SECRET),
    accessTokenTtl: envInt('ACCESS_TOKEN_TTL', 60 * 30),
    refreshTokenTtl: envInt('REFRESH_TOKEN_TTL', 60 * 60 * 24 * 14),
    paymentProvider: (env('PAYMENT_PROVIDER', 'manual') as Config['paymentProvider']) ?? 'manual',
    cinetpay: {
      apiKey: env('CINETPAY_API_KEY', ''),
      siteId: env('CINETPAY_SITE_ID', ''),
      secret: env('CINETPAY_SECRET', ''),
      baseUrl: env('CINETPAY_BASE_URL', 'https://api.cinetpay.com'),
      notifyUrl: env('CINETPAY_NOTIFY_URL', ''),
      returnUrl: env('CINETPAY_RETURN_URL', ''),
    },
    feexpay: {
      apiToken: env('FEXPAY_API_TOKEN', ''),
      shopId: env('FEXPAY_SHOP_ID', ''),
      baseUrl: env('FEXPAY_BASE_URL', 'https://api-v2.feexpay.me'),
      returnUrl: env('FEXPAY_RETURN_URL', ''),
      cancelUrl: env('FEXPAY_CANCEL_URL', ''),
    },
    mailer: {
      // Sans clé Resend, les e-mails sont journalisés (mode console).
      provider: (env('EMAIL_PROVIDER', resendApiKey ? 'resend' : 'console') as
        | 'console'
        | 'resend') ?? 'console',
      resendApiKey,
      from: env('EMAIL_FROM', 'MES ACTES <onboarding@resend.dev>'),
      outboxFile: path.join(path.dirname(env('DATABASE_FILE', path.join(root, 'data', 'mes-actes.db'))), 'outbox.log'),
    },
    serveStatic: env('SERVE_STATIC', 'true') !== 'false',
    staticDir: env('STATIC_DIR', path.join(root, 'dist')),
    bootAdmin:
      bootAdminEmail && bootAdminPassword
        ? {
            email: bootAdminEmail,
            password: bootAdminPassword,
            firstName: env('ADMIN_FIRST_NAME', 'Direction'),
            lastName: env('ADMIN_LAST_NAME', 'SCOLARITÉ'),
          }
        : null,
    trustProxy: envInt('TRUST_PROXY', 0) > 0 ? envInt('TRUST_PROXY', 0) : false,
    resultatsApiUrl: env('RESULTATS_API_URL', 'http://localhost:3000'),
    campusInternalSecret: env('CAMPUS_INTERNAL_SECRET', 'ifsio-campus-secret-key-parakou-2026'),
    ...overrides,
  }

  if (config.isProduction) {
    if (!config.jwtSecret || config.jwtSecret === DEV_JWT_SECRET) {
      throw new Error(
        'JWT_SECRET doit être défini avec une valeur aléatoire longue (ex. `openssl rand -hex 32`) en production.',
      )
    }
  }

  return config
}

export const config = loadConfig()
