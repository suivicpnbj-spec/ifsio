import type { UserRole } from '../../src/types'

declare global {
  namespace Express {
    interface Request {
      cookies?: Record<string, string>
      user?: {
        id: string
        role: UserRole
        email: string
        firstName: string
        lastName: string
      }
    }
  }
}

export {}
