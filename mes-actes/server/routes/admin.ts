import { Router } from 'express'
import { buildQueueCsv, CSV_BOM } from '../../src/lib/csv'
import { computeAdminStatistics } from '../../src/lib/stats'
import type { AppContext } from '../context'
import { toAdminDto, toNotificationDto, toRequestDto, toSessionDto } from '../lib/dto'
import { requireAuth } from '../middleware/auth'

export function createAdminRouter(context: AppContext): Router {
  const router = Router()
  const { repo } = context

  const allRequests = () =>
    repo.listRequests({}).map((row) =>
      toRequestDto(
        row,
        repo.listTimeline(row.id),
        repo.listMessages(row.id),
        repo.listAttachments(row.id),
      ),
    )

  router.get('/admin/statistics', requireAuth('admin'), (_req, res) => {
    res.json(computeAdminStatistics(allRequests(), repo.listActs()))
  })

  router.get('/admin/queue.csv', requireAuth('admin'), (req, res) => {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined
    const query = typeof req.query.q === 'string' ? req.query.q : undefined

    const requests = repo
      .listRequests({
        ...(status && status !== 'all' ? { status } : {}),
        ...(query ? { query } : {}),
      })
      .map((row) =>
        toRequestDto(
          row,
          repo.listTimeline(row.id),
          repo.listMessages(row.id),
          repo.listAttachments(row.id),
        ),
      )

    const csv = buildQueueCsv(requests, repo.listActs())
    const filename = `file-instruction-${new Date().toISOString().slice(0, 10)}.csv`

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(CSV_BOM + csv)
  })

  router.get('/admin/audit', requireAuth('admin'), (_req, res) => {
    res.json(repo.listAudit(200))
  })

  router.get('/admin/users', requireAuth('admin'), (_req, res) => {
    res.json(repo.listUsers().map(toSessionDto))
  })

  return router
}
