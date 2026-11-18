import { createApp } from './app'
import { loadConfig } from './config'
import { Database } from './db/database'
import { Repository } from './db/repository'
import { seedDatabase } from './db/seed'
import { createMailer } from './services/mailer'
import { createPaymentProvider } from './services/payments'

const config = loadConfig()
const db = new Database(config.databaseFile)
const repo = new Repository(db)

const seed = seedDatabase(db, config.uploadDir, {
  isProduction: config.isProduction,
  admin: config.bootAdmin,
})
const payments = createPaymentProvider(config)
const mailer = createMailer(config)

const app = createApp({ db, repo, config, payments, mailer })

const server = app.listen(config.port, () => {
  console.log(`[mes-actes] API prête sur http://localhost:${config.port}`)
  console.log(`[mes-actes] base de données : ${config.databaseFile}`)
  console.log(`[mes-actes] pièces jointes  : ${config.uploadDir}`)
  console.log(`[mes-actes] paiement        : ${payments.id} (${payments.label})`)
  console.log(`[mes-actes] e-mails        : ${mailer.id} (${mailer.label})`)
  console.log(`[mes-actes] environnement   : ${config.nodeEnv}`)
  if (seed.seeded) {
    console.log(`[mes-actes] base amorcée     : compte scolarité créé.`)
  }
  if (seed.devAdmin) {
    console.log(
      `[mes-actes] compte scolarité local : ${seed.devAdmin.email} / ${seed.devAdmin.password} (développement uniquement)`,
    )
  }
})

function shutdown(signal: string): void {
  console.log(`[mes-actes] ${signal} reçu, arrêt du serveur…`)
  server.close(() => {
    db.close()
    process.exit(0)
  })
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
