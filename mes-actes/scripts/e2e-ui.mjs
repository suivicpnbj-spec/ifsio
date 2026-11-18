/**
 * Parcours navigateur de bout en bout (dépôt réel, validation par la scolarité).
 *
 * Le script crée ses propres données : il lance un serveur sur une base
 * temporaire qui sert le front compilé, crée un compte étudiant via
 * l'interface, dépose un dossier avec de vraies pièces, puis instruit ce
 * dossier depuis l'espace scolarité.
 *
 * Prérequis : npm run build (le serveur sert dist/) et Google Chrome.
 * Usage :     node scripts/e2e-ui.mjs
 */
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const require = createRequire(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'package.json'))
const { chromium } = require('playwright-core')

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const configuredPort = Number(process.env.PORT)
const PORT = Number.isFinite(configuredPort) && configuredPort > 0 ? configuredPort : 5199
const EXTERNAL = process.env.APP_URL ?? ''
const APP = EXTERNAL || `http://127.0.0.1:${PORT}`

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@e2e.test'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'AdminE2ePassword2026!'

let failures = 0
function check(label, condition, extra) {
  if (!condition) failures += 1
  console.log(`${condition ? '✓' : '✗'} ${label}${extra === undefined ? '' : ` — ${JSON.stringify(extra)}`}`)
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const route = (pathname) => `${APP}/#${pathname}`

async function step(name, fn) {
  try {
    await fn()
  } catch (error) {
    failures += 1
    console.log(`✗ ${name} — exception : ${error?.message ?? error}`)
  }
}

if (!EXTERNAL && !existsSync(path.join(ROOT, 'dist', 'index.html'))) {
  console.error('✗ dist/index.html introuvable : lancez `npm run build` avant test:e2e:ui.')
  process.exit(1)
}

/* ───────────────────── Serveur sur base temporaire ───────────────────── */

let server = null
let tmpDir = null

if (!EXTERNAL) {
  tmpDir = await mkdtemp(path.join(os.tmpdir(), 'mes-actes-e2e-ui-'))
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
      JWT_SECRET: 'mes-actes-e2e-ui-secret-0123456789abcdef',
      PAYMENT_PROVIDER: 'mock',
      SERVE_STATIC: 'true',
      STATIC_DIR: path.join(ROOT, 'dist'),
    },
  })
  server.stderr.on('data', (chunk) => process.stderr.write(`[api] ${chunk}`))

  let ready = false
  for (let attempt = 0; attempt < 80 && !ready; attempt += 1) {
    try {
      const response = await fetch(`${APP}/api/health`)
      ready = response.ok
    } catch {
      await sleep(250)
    }
  }
  if (!ready) {
    console.error(`✗ le serveur d’essai n’a pas démarré sur ${APP}`)
    server.kill('SIGTERM')
    process.exit(1)
  }
}

const workDir = tmpDir ?? (await mkdtemp(path.join(os.tmpdir(), 'mes-actes-e2e-ui-files-')))
const piecePath = path.join(workDir, 'carte_etudiant.pdf')
await writeFile(
  piecePath,
  '%PDF-1.4\n% e2e-ui\n1 0 obj<< /Type /Catalog >>endobj\ntrailer<<>>\n%%EOF\n',
)

const consoleErrors = []
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH ?? '/usr/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
})
const page = await browser.newPage({ viewport: { width: 1360, height: 900 } })
page.setDefaultTimeout(15000)
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text())
})
page.on('pageerror', (error) => consoleErrors.push(String(error)))

async function waitForLoader() {
  const loader = page.getByText('Chargement de la page…')
  await loader.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {})
  await loader.waitFor({ state: 'detached', timeout: 15000 }).catch(() => {})
}

let dossierId = ''

try {
  await step('accueil public', async () => {
    await page.goto(route('/'), { waitUntil: 'networkidle' })
    await waitForLoader()
    const body = await page.locator('body').innerText()
    check('accueil affiché', /sans file d’attente/i.test(body))
    check(
      'aucun compte de démonstration annoncé',
      !/compte[s]? de démonstration|mesactes\.demo/i.test(body),
      body.match(/démonstration[^\n]*/i)?.[0],
    )
    check('dépôt présenté comme service principal', /24\s*h\/24/i.test(body))
  })

  await step('catalogue public', async () => {
    await page.goto(route('/catalogue'), { waitUntil: 'networkidle' })
    await waitForLoader()
    const body = await page.locator('body').innerText()
    check('catalogue rendu', /prestations? proposées|prestations?/i.test(body))
    check('aucune ressource en téléchargement direct', !/Téléchargement direct/i.test(body))
  })

  await step('inscription étudiante via l’interface', async () => {
    await page.goto(route('/inscription'), { waitUntil: 'networkidle' })
    await waitForLoader()
    await page.locator('#register-first').fill('Awa')
    await page.locator('#register-last').fill('KOFFI')
    await page.locator('#register-matricule').fill(`UI-${Date.now()}`)
    await page.locator('#register-email').fill(`awa.e2e+${Date.now()}@test.local`)
    await page.locator('#register-password').fill('EtudiantE2e2026!')
    await page.locator('input[type="checkbox"]').first().check()
    await page.getByRole('button', { name: /Créer mon compte/i }).click()
    await page.waitForFunction(() => window.location.hash.startsWith('#/dossiers'), null, {
      timeout: 15000,
    })
    await waitForLoader()
    check('espace étudiant atteint', page.url().includes('#/dossiers'))
  })

  await step('dépôt d’un dossier avec pièce réelle', async () => {
    await page.goto(route('/demande/attestation-scolarite'), { waitUntil: 'networkidle' })
    await waitForLoader()
    await page.locator('#phone').fill('+229 97 00 11 22')
    await page.getByRole('button', { name: /^Continuer/i }).click()
    await sleep(400)

    // Étape 2 : joindre chaque pièce obligatoire (fichier réel).
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const picker = page.getByRole('button', { name: /Choisir un fichier/i }).first()
      if ((await picker.count()) === 0) break
      await picker.click()
      await page.locator('input[type="file"]').last().setInputFiles(piecePath)
      await sleep(500)
    }
    const step2Body = await page.locator('body').innerText()
    check('pièces réellement transmises (pas de fichier de démo)', !/fichier de démo/i.test(step2Body))
    await page.getByRole('button', { name: /^Continuer/i }).click()
    await sleep(400)

    await page.locator('input[type="checkbox"]').last().check()
    await page.getByRole('button', { name: /Confirmer et soumettre/i }).click()
    await page.waitForFunction(() => /Votre dossier a été transmis/.test(document.body.innerText), null, {
      timeout: 20000,
    })
    const body = await page.locator('body').innerText()
    dossierId = body.match(/ACTE-\d{4}-\d{4}/)?.[0] ?? ''
    check('numéro de dossier attribué', /^ACTE-\d{4}-\d{4}$/.test(dossierId), dossierId)
    check('récépissé proposé immédiatement', /Afficher le récépissé/i.test(body))
  })

  await step('récépissé de dépôt imprimable', async () => {
    await page.getByRole('button', { name: /Afficher le récépissé/i }).click()
    await sleep(600)
    const body = await page.locator('body').innerText()
    check('récépissé affiché', /Récépissé de dépôt/i.test(body))
    check(
      'mention honnête du récépissé',
      /ne constitue pas l’acte administratif/i.test(body),
    )
    await page.keyboard.press('Escape')
    await sleep(300)
  })

  await step('suivi depuis l’accueil', async () => {
    await page.goto(route('/'), { waitUntil: 'networkidle' })
    await waitForLoader()
    await page.getByLabel('Numéro de dossier ou matricule').fill(dossierId)
    await page.getByRole('button', { name: 'Consulter', exact: true }).click()
    await page.waitForFunction(
      () => window.location.hash.startsWith('#/dossiers/'),
      null,
      { timeout: 15000 },
    )
    const body = await page.locator('body').innerText()
    check('dossier ouvert depuis le suivi', body.includes(dossierId))
    check('aucun acte téléchargeable (retrait administration)', !/Voir mon acte/i.test(body))
  })

  await step('changement vers l’espace scolarité', async () => {
    await page.getByRole('button', { name: /Changer de compte/i }).first().click()
    await page.waitForFunction(() => window.location.hash.startsWith('#/connexion'), null, {
      timeout: 15000,
    })
    await waitForLoader()
    await page.locator('#login-email').fill(ADMIN_EMAIL)
    await page.locator('#login-password').fill(ADMIN_PASSWORD)
    await page.getByRole('button', { name: /^Se connecter/i }).first().click()
    await page.waitForFunction(() => window.location.hash.startsWith('#/admin'), null, {
      timeout: 15000,
    })
    await waitForLoader()
    check('espace scolarité accessible', page.url().includes('#/admin'))
  })

  await step('instruction et validation du dossier', async () => {
    await sleep(800)
    const body = await page.locator('body').innerText()
    check('dossier de l’étudiant visible', body.includes(dossierId), dossierId)
    await page.getByRole('button', { name: 'Instruire', exact: true }).first().click()
    await sleep(600)
    await page.getByRole('button', { name: 'Valider le dossier' }).first().click()
    await sleep(400)
    await page.getByRole('button', { name: /Confirmer la validation/i }).click()
    await sleep(1500)
    const after = await page.locator('body').innerText()
    check('le dossier apparaît comme validé', /Validés/.test(after))
    check('aucune signature affichée', !/Signé &|signée électroniquement/i.test(after))
  })

  await step('aucune erreur console', () => {
    check('aucune erreur console', consoleErrors.length === 0, consoleErrors.slice(0, 3))
  })
} finally {
  await browser.close()
  if (server) {
    server.kill('SIGTERM')
    await sleep(400)
    if (!server.killed) server.kill('SIGKILL')
  }
  if (tmpDir) await rm(tmpDir, { recursive: true, force: true })
}

console.log(failures === 0 ? '\nParcours navigateur validé.' : `\n${failures} contrôle(s) en échec.`)
process.exit(failures === 0 ? 0 : 1)
