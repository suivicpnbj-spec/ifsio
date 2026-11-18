import { existsSync, mkdirSync, unlinkSync } from 'node:fs'
import path from 'node:path'
import { Router } from 'express'
import multer from 'multer'
import { z } from 'zod'
import type { AppContext } from '../context'
import { formatDateTime } from '../lib/format'
import { badRequest, forbidden, notFound, parseBody } from '../lib/http'
import { requireAuth } from '../middleware/auth'

const ALLOWED_MIME = new Set([
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
])

const MAX_FILE_SIZE = 10 * 1024 * 1024

const metadataSchema = z.object({
  documentName: z.string().trim().optional(),
})

export function createAttachmentsRouter(context: AppContext): Router {
  const router = Router()
  const { repo, config } = context

  mkdirSync(config.uploadDir, { recursive: true })

  const storage = multer.diskStorage({
    destination: (_req, _file, callback) => {
      callback(null, config.uploadDir)
    },
    filename: (req, file, callback) => {
      const safe = file.originalname.replace(/[^A-Za-z0-9._-]/g, '_')
      callback(null, `${req.params.id}-${Date.now()}-${safe}`)
    },
  })

  const upload = multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE, files: 1 },
    fileFilter: (_req, file, callback) => {
      if (!ALLOWED_MIME.has(file.mimetype)) {
        callback(new Error('Format non accepté : PDF, JPG, PNG ou WEBP uniquement.'))
        return
      }
      callback(null, true)
    },
  })

  router.post(
    '/requests/:id/attachments',
    requireAuth(),
    upload.single('file'),
    (req, res) => {
      const user = req.user!
      const request = repo.findRequest(req.params.id)
      if (!request) throw notFound('Ce dossier n’existe pas.')
      if (user.role === 'student' && request.student_id !== user.id) {
        throw forbidden('Ce dossier ne vous appartient pas.')
      }
      if (!req.file) throw badRequest('Aucun fichier reçu.')

      const metadata = parseBody(metadataSchema, {
        documentName: req.body?.documentName,
      })

      const attachment = repo.insertAttachment({
        requestId: request.id,
        ownerId: user.id,
        name: req.file.originalname,
        storedName: req.file.filename,
        documentName: metadata.documentName ?? null,
        size: req.file.size,
        mime: req.file.mimetype,
        uploadedAt: formatDateTime(new Date()),
      })

      repo.audit({
        actorId: user.id,
        actorRole: user.role,
        action: 'attachment.upload',
        entity: 'request',
        entityId: request.id,
        details: { name: attachment.name, size: attachment.size },
      })

      res.status(201).json({
        id: attachment.id,
        name: attachment.name,
        size: attachment.size,
        uploadedAt: attachment.uploaded_at,
        verified: attachment.verified === 1,
        documentName: attachment.document_name ?? undefined,
      })
    },
  )

  router.get('/requests/:id/attachments/:attachmentId', requireAuth(), (req, res) => {
    const user = req.user!
    const request = repo.findRequest(req.params.id)
    if (!request) throw notFound('Ce dossier n’existe pas.')
    if (user.role === 'student' && request.student_id !== user.id) {
      throw forbidden('Ce dossier ne vous appartient pas.')
    }

    const attachment = repo.findAttachment(req.params.attachmentId)
    if (!attachment || attachment.request_id !== request.id) {
      throw notFound('Cette pièce jointe n’existe pas.')
    }

    const filePath = path.join(config.uploadDir, attachment.stored_name)
    if (!existsSync(filePath)) {
      throw notFound('Le fichier de cette pièce jointe est introuvable sur le serveur.')
    }

    res.download(filePath, attachment.name)
  })

  router.delete('/requests/:id/attachments/:attachmentId', requireAuth('student'), (req, res) => {
    const user = req.user!
    const request = repo.findRequest(req.params.id)
    if (!request) throw notFound('Ce dossier n’existe pas.')
    if (request.student_id !== user.id) {
      throw forbidden('Ce dossier ne vous appartient pas.')
    }
    if (request.status === 'Validé') {
      throw badRequest('Ce dossier est délivré : les pièces ne sont plus modifiables.')
    }

    const attachment = repo.findAttachment(req.params.attachmentId)
    if (!attachment || attachment.request_id !== request.id) {
      throw notFound('Cette pièce jointe n’existe pas.')
    }

    const filePath = path.join(config.uploadDir, attachment.stored_name)
    if (existsSync(filePath) && attachment.stored_name.startsWith(request.id)) {
      unlinkSync(filePath)
    }
    repo.deleteAttachment(attachment.id)

    res.status(204).end()
  })

  return router
}
