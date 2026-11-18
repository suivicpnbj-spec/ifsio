import { Router } from 'express'
import type { AppContext } from '../context'
import { toNotificationDto } from '../lib/dto'
import { notFound } from '../lib/http'
import { requireAuth } from '../middleware/auth'

/** Notifications de l'appelant : lecture, marquage global. */
export function createNotificationsRouter(context: AppContext): Router {
  const router = Router()
  const { repo } = context

  router.get('/notifications', requireAuth(), (req, res) => {
    res.json(repo.listNotifications(req.user!.id).map(toNotificationDto))
  })

  router.patch('/notifications/:id/read', requireAuth(), (req, res) => {
    const notification = repo
      .listNotifications(req.user!.id)
      .find((item) => item.id === req.params.id)
    if (!notification) throw notFound('Cette notification n’existe pas.')

    repo.markNotificationRead(req.user!.id, notification.id)
    res.json(toNotificationDto({ ...notification, read: 1 }))
  })

  router.post('/notifications/read-all', requireAuth(), (req, res) => {
    repo.markAllNotificationsRead(req.user!.id)
    res.json(repo.listNotifications(req.user!.id).map(toNotificationDto))
  })

  return router
}
