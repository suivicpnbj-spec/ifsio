/**
 * Parcours de bout en bout de l'API MES ACTES.
 *
 * Le script crée ses propres données : il lance un serveur sur une base
 * temporaire (sauf si BASE_URL est fourni), crée un compte étudiant à chaque
 * exécution et repart de zéro. Aucune donnée de démonstration n'est requise.
 *
 * Usage : node scripts/e2e-api.mjs
 *        : BASE_URL=http://127.0.0.1:4000/api node scripts/e2e-api.mjs
 */
import { spawn } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const configuredPort = Number(process.env.PORT)
const PORT = Number.isFinite(configuredPort) && configuredPort > 0 ? configuredPort : 4011
const EXTERNAL_BASE = process.env.BASE_URL ?? ''
const BASE = EXTERNAL_BASE || `http://127.0.0.1:${PORT}/api`

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@e2e.test'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'AdminE2ePassword2026!'
const STUDENT_EMAIL = `etudiant.e2e+${Date.now()}@test.local`
const STUDENT_PASSWORD = 'EtudiantE2e2026!'

let failures = 0
function check(label, condition, extra) {
  const status = condition ? '✓' : '✗'
  if (!condition) failures += 1
  console.log(`${status} ${label}${extra === undefined ? '' : ` — ${JSON.stringify(extra)}`}`)
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function call(pathname, { method = 'GET', token, body, cookie, form } = {}) {
  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`
  if (cookie) headers.Cookie = cookie

  const response = await fetch(`${BASE}${pathname}`, {
    method,
    headers,
    ...(form ? { body: form } : body !== undefined ? { body: JSON.stringify(body) } : {}),
  })
  const text = await response.text()
  let payload
  try {
    payload = text ? JSON.parse(text) : undefined
  } catch {
    payload = text
  }
  return { status: response.status, payload, headers: response.headers }
}

async function login(email, password) {
  const response = await call('/auth/login', { method: 'POST', body: { email, password } })
  const cookie = response.headers.get('set-cookie')?.split(';')[0] ?? ''
  return { token: response.payload?.accessToken, user: response.payload?.user, cookie, response }
}

/* ───────────────────── Serveur sur base temporaire ───────────────────── */

let server = null
let tmpDir = null

if (!EXTERNAL_BASE) {
  tmpDir = await mkdtemp(path.join(os.tmpdir(), 'mes-actes-e2e-'))
  const tsx = path.join(ROOT, 'node_modules', '.bin', 'tsx')
  server = spawn(tsx, ['server/index.ts'], {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      NODE_ENV: 'development',
      PORT: String(PORT),
      DATABASE_FILE: path.join(tmpDir, 'e2e.db'),
      UPLOAD_DIR: path.join(tmpDir, 'uploads'),
      ADMIN_EMAIL,
      ADMIN_PASSWORD,
      JWT_SECRET: 'mes-actes-e2e-secret-0123456789abcdef',
      PAYMENT_PROVIDER: 'mock',
      SERVE_STATIC: 'false',
    },
  })
  server.stdout.on('data', (chunk) => {
    if (process.env.VERBOSE) process.stdout.write(`[api] ${chunk}`)
  })
  server.stderr.on('data', (chunk) => process.stderr.write(`[api] ${chunk}`))

  let ready = false
  for (let attempt = 0; attempt < 80 && !ready; attempt += 1) {
    try {
      const response = await fetch(`${BASE}/health`)
      ready = response.ok
    } catch {
      await sleep(250)
    }
  }
  if (!ready) {
    console.error('✗ le serveur d’essai n’a pas démarré sur ' + BASE)
    server.kill('SIGTERM')
    process.exit(1)
  }
}

try {
  /* ───────────────────────── Authentification ───────────────────────── */

  const registered = await call('/auth/register', {
    method: 'POST',
    body: {
      firstName: 'Awa',
      lastName: 'KOFFI',
      email: STUDENT_EMAIL,
      password: STUDENT_PASSWORD,
      matricule: `E2E-${Date.now()}`,
      filiere: 'Licence Professionnelle en Soins Infirmiers',
      promotion: 'Licence 1',
    },
  })
  check(
    'inscription étudiant',
    registered.status === 201 && Boolean(registered.payload?.accessToken),
    registered.status,
  )

  const student = await login(STUDENT_EMAIL, STUDENT_PASSWORD)
  check('connexion étudiant', student.response.status === 200 && Boolean(student.token))

  const badLogin = await call('/auth/login', {
    method: 'POST',
    body: { email: STUDENT_EMAIL, password: 'mauvais' },
  })
  check('mot de passe refusé', badLogin.status === 401, badLogin.payload)

  /* ───────────────── Bootstrap sans données de démonstration ─────────── */

  const bootstrap = await call('/bootstrap', { token: student.token })
  check('bootstrap étudiant', bootstrap.status === 200 && bootstrap.payload.session === true)
  check('profil étudiant courant', bootstrap.payload.student?.id === student.user?.id)
  check(
    'aucun dossier préchargé',
    Array.isArray(bootstrap.payload.requests) && bootstrap.payload.requests.length === 0,
    bootstrap.payload.requests?.length,
  )
  check('catalogue amorcé', (bootstrap.payload.acts ?? []).length > 0)
  check(
    'aucune suite de démonstration',
    !JSON.stringify(bootstrap.payload).includes('mesactes.demo'),
  )

  const anonymous = await call('/bootstrap')
  check('bootstrap anonyme', anonymous.status === 200 && anonymous.payload.session === false)
  check('aucun dossier anonyme', anonymous.payload.requests?.length === 0)

  /* ───────────────────── Dépôt d’un dossier réel ────────────────────── */

  const created = await call('/requests', {
    method: 'POST',
    token: student.token,
    body: {
      actId: 'attestation-scolarite',
      purpose: 'Demande de test automatisé.',
      deliveryMethod: 'physical',
      specificResponses: { motif: 'Stage' },
    },
  })
  check('dépôt de dossier', created.status === 201, created.status)
  const requestId = created.payload?.id
  check('identifiant serveur', typeof requestId === 'string' && requestId.startsWith('ACTE-'), requestId)
  check('récépissé : statut initial', created.payload?.status === 'Demande reçue', created.payload?.status)
  check(
    'aucun code de vérification fabriqué',
    !created.payload?.securityCode && !created.payload?.signedBy,
  )

  /* ─────────────── Envoi réel d’une pièce jointe (multipart) ─────────── */

  const pdfBytes = Buffer.from('%PDF-1.4\n% e2e\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n')
  const form = new FormData()
  form.append('file', new Blob([pdfBytes], { type: 'application/pdf' }), 'carte_etudiant.pdf')
  form.append('documentName', "Carte d'étudiant")
  const uploaded = await call(`/requests/${requestId}/attachments`, {
    method: 'POST',
    token: student.token,
    form,
  })
  check('envoi de pièce jointe', uploaded.status === 201, uploaded.status)
  check('taille calculée par le serveur', uploaded.payload?.size > 0, uploaded.payload?.size)

  const studentRequests = await call('/requests', { token: student.token })
  check(
    'dossier visible par l’étudiant',
    studentRequests.payload.some((item) => item.id === requestId),
  )
  check('liste limitée aux dossiers de l’étudiant', studentRequests.payload.length === 1)

  const download = await fetch(
    `${BASE}/requests/${requestId}/attachments/${uploaded.payload.id}`,
    { headers: { Authorization: `Bearer ${student.token}` } },
  )
  const downloadedBytes = new Uint8Array(await download.arrayBuffer())
  check(
    'téléchargement de la pièce jointe',
    download.ok && downloadedBytes.length === pdfBytes.length,
    downloadedBytes.length,
  )

  /* ─────────────────── Messagerie, compléments ──────────────────────── */

  const message = await call(`/requests/${requestId}/messages`, {
    method: 'POST',
    token: student.token,
    body: { text: 'Bonjour, je souhaite confirmer le délai.' },
  })
  check('message étudiant', message.status === 201 && message.payload.messages.length > 0)

  const admin = await login(ADMIN_EMAIL, ADMIN_PASSWORD)
  check('connexion scolarité', admin.response.status === 200 && admin.user?.role === 'admin')

  const adminBootstrap = await call('/bootstrap', { token: admin.token })
  check('bootstrap scolarité', adminBootstrap.payload.admin?.id === admin.user?.id)
  check(
    'file d’instruction = dossiers réels',
    adminBootstrap.payload.requests.length === 1,
    adminBootstrap.payload.requests.length,
  )
  check(
    'notification admin du dépôt',
    adminBootstrap.payload.notifications.some((item) => item.requestId === requestId),
  )

  /* ─────────────── Catalogue : création et suppression de prestation ─────────────── */

  const newAct = await call('/acts', {
    method: 'POST',
    token: admin.token,
    body: {
      title: 'Attestation de test e2e',
      category: 'scolarite',
      serviceType: 'act',
      shortDescription: 'Prestation créée par le test de bout en bout.',
      delay: '3 jours ouvrés',
      feeAmount: 1500,
      requiredDocuments: [{ name: 'Reçu de paiement', mandatory: true }],
    },
  })
  check('création de prestation', newAct.status === 201, newAct.status)
  check(
    'identifiant dérivé du nom',
    newAct.payload?.id === 'attestation-de-test-e2e',
    newAct.payload?.id,
  )
  check(
    'catégorie labellisée par le serveur',
    newAct.payload?.categoryLabel === 'Scolarité',
    newAct.payload?.categoryLabel,
  )

  const actsAfterCreate = await call('/acts')
  check(
    'prestation présente au catalogue',
    actsAfterCreate.payload.some((act) => act.id === newAct.payload?.id),
  )

  // Le dossier du test est déposé sur « attestation-scolarite » : suppression interdite.
  const blockedDelete = await call('/acts/attestation-scolarite', {
    method: 'DELETE',
    token: admin.token,
  })
  check('suppression refusée si dossier rattaché', blockedDelete.status === 409, blockedDelete.status)

  const studentDelete = await call(`/acts/${newAct.payload?.id}`, {
    method: 'DELETE',
    token: student.token,
  })
  check('suppression refusée à un étudiant', studentDelete.status === 403, studentDelete.status)

  const freeDelete = await call(`/acts/${newAct.payload?.id}`, {
    method: 'DELETE',
    token: admin.token,
  })
  check('suppression sans dossier rattaché', freeDelete.status === 200, freeDelete.status)

  const actsAfterDelete = await call('/acts')
  check(
    'prestation retirée du catalogue',
    !actsAfterDelete.payload.some((act) => act.id === newAct.payload?.id),
  )

  const complement = await call(`/requests/${requestId}/complement`, {
    method: 'POST',
    token: admin.token,
    body: { reason: 'Merci de joindre le reçu de paiement.' },
  })
  check(
    'demande de complément',
    complement.status === 200 && complement.payload.status === 'En attente de complément',
  )

  const studentNotifications = await call('/notifications', { token: student.token })
  const complementNotif = studentNotifications.payload.find(
    (item) => item.requestId === requestId && item.type === 'warning',
  )
  check('notification étudiant', Boolean(complementNotif))

  const readOne = await call(`/notifications/${complementNotif.id}/read`, {
    method: 'PATCH',
    token: student.token,
  })
  check('marquage lu unitaire', readOne.status === 200 && readOne.payload.read === true)

  const readAll = await call('/notifications/read-all', { method: 'POST', token: student.token })
  check('marquage lu global', readAll.status === 200 && readAll.payload.every((item) => item.read))

  // Complément : le fichier part d'abord, la trace d'instruction ensuite.
  const supplementForm = new FormData()
  supplementForm.append(
    'file',
    new Blob([pdfBytes], { type: 'application/pdf' }),
    'recu_paiement.pdf',
  )
  supplementForm.append('documentName', 'Quittance de paiement')
  const supplementUpload = await call(`/requests/${requestId}/attachments`, {
    method: 'POST',
    token: student.token,
    form: supplementForm,
  })
  check('pièce complémentaire envoyée', supplementUpload.status === 201)

  const supplement = await call(`/requests/${requestId}/supplement`, {
    method: 'POST',
    token: student.token,
    body: { name: 'recu_paiement.pdf', documentName: 'Quittance de paiement' },
  })
  check(
    'trace du complément',
    supplement.status === 201 && supplement.payload.status === 'En traitement',
    supplement.payload?.status,
  )
  check('deux pièces jointes au dossier', supplement.payload.attachments.length === 2)

  const verified = await call(
    `/requests/${requestId}/attachments/${uploaded.payload.id}`,
    { method: 'PATCH', token: admin.token, body: { verified: true } },
  )
  check(
    'vérification de pièce',
    verified.status === 200 && verified.payload.attachments[0].verified === true,
  )

  /* ─────────────────── Paiement en ligne (mock) ─────────────────────── */

  const paidAct = 'duplicata-diplome'
  const paidDossier = await call('/requests', {
    method: 'POST',
    token: student.token,
    body: { actId: paidAct, purpose: 'Remplacement du diplôme égaré.', deliveryMethod: 'physical' },
  })
  check('dossier tarifé déposé', paidDossier.status === 201, paidDossier.status)

  const session = await call(`/requests/${paidDossier.payload.id}/payment/session`, {
    method: 'POST',
    token: student.token,
  })
  check('session de paiement ouverte', session.status === 201, session.status)
  check(
    'paiement confirmé par le prestataire',
    session.payload?.session?.status === 'confirmed',
    session.payload?.session,
  )
  check('quittance rattachée au dossier', Boolean(session.payload?.request?.payment))

  /* ─────────────────────── Validation du dossier ────────────────────── */

  const approved = await call(`/requests/${requestId}/approve`, {
    method: 'POST',
    token: admin.token,
  })
  check(
    'validation du dossier',
    approved.status === 200 && approved.payload.status === 'Validé',
    approved.payload?.status,
  )
  check('aucune signature fabriquée', !approved.payload?.signedBy && !approved.payload?.securityCode)

  /* ──────── Fonctions retirées : vérification, signature, démo ──────── */

  const signatureRoute = await call(`/requests/${requestId}/signature`, { token: student.token })
  check('route de signature retirée', signatureRoute.status === 404, signatureRoute.status)

  const publicVerify = await call('/public/verify/CODE-QUELCONQUE')
  check('vérification publique code inconnu retourne 404', publicVerify.status === 404, publicVerify.status)

  const publicVerifyValid = await call(`/public/verify/${requestId}`)
  check('vérification publique d’un acte validé', publicVerifyValid.status === 200 && publicVerifyValid.payload?.verified === true, publicVerifyValid.payload?.document?.id)

  const resetDemo = await call('/admin/reset-demo', { method: 'POST', token: admin.token })
  check('réinitialisation de démonstration retirée', resetDemo.status === 404, resetDemo.status)

  const forgedStatus = await call(`/requests/${requestId}/status`, {
    method: 'PATCH',
    token: admin.token,
    body: { status: 'Délivré' },
  })
  check('statut « Délivré » refusé', forgedStatus.status === 400, forgedStatus.status)

  /* ─────────────────────── Droits et sessions ───────────────────────── */

  const forbidden = await call('/admin/statistics', { token: student.token })
  check('statistiques réservées à la scolarité', forbidden.status === 403, forbidden.status)

  const refreshed = await call('/auth/refresh', { method: 'POST', cookie: student.cookie })
  check('rafraîchissement de session', refreshed.status === 200 && Boolean(refreshed.payload.accessToken))

  const me = await call('/auth/me', { token: refreshed.payload.accessToken })
  check('session restaurée', me.status === 200 && me.payload.user.id === student.user.id)

  const unknownNotification = await call('/notifications/unused', {
    method: 'PATCH',
    token: student.token,
  })
  check('notification inconnue refusée', unknownNotification.status === 404, unknownNotification.status)

  /* ─────────────────────────── Mots de passe ────────────────────────── */

  const wrongPassword = await call('/auth/password', {
    method: 'POST',
    token: student.token,
    body: { currentPassword: 'incorrect', newPassword: 'Nouveau2026!' },
  })
  check('mot de passe actuel vérifié', wrongPassword.status === 400, wrongPassword.status)

  const changed = await call('/auth/password', {
    method: 'POST',
    token: student.token,
    body: { currentPassword: STUDENT_PASSWORD, newPassword: 'Nouveau2026!' },
  })
  check('changement de mot de passe', changed.status === 204, changed.status)

  const relogin = await login(STUDENT_EMAIL, 'Nouveau2026!')
  check('nouveau mot de passe actif', relogin.response.status === 200)

  const oldRejected = await call('/auth/login', {
    method: 'POST',
    body: { email: STUDENT_EMAIL, password: STUDENT_PASSWORD },
  })
  check('ancien mot de passe refusé', oldRejected.status === 401, oldRejected.status)

  const logout = await call('/auth/logout', { method: 'POST', cookie: student.cookie })
  check('déconnexion', logout.status === 204, logout.status)
} finally {
  if (server) {
    server.kill('SIGTERM')
    await sleep(400)
    if (!server.killed) server.kill('SIGKILL')
  }
  if (tmpDir) await rm(tmpDir, { recursive: true, force: true })
}

console.log(failures === 0 ? '\nTous les contrôles sont passés.' : `\n${failures} contrôle(s) en échec.`)
process.exit(failures === 0 ? 0 : 1)
