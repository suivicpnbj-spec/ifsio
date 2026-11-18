import type { Config } from './config'
import type { Database } from './db/database'
import type { Repository } from './db/repository'
import type { Mailer } from './services/mailer'
import type { PaymentProvider } from './services/payments'

export interface AppContext {
  db: Database
  repo: Repository
  config: Config
  payments: PaymentProvider
  mailer: Mailer
}
