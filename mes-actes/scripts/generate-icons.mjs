/**
 * Génère les PNG d’identité à partir de `public/favicon.svg` :
 * icônes de PWA (192 / 512 / apple-touch) et image de partage (1200×630).
 *
 * Usage : npm run icons   (ou CHROME_PATH=… node scripts/generate-icons.mjs)
 *
 * Le tracé est celui du SVG livré : ces images ne peuvent donc pas diverger
 * du logo en cours, il suffit de relancer la commande après une retouche.
 */
import { readFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const publicDir = path.join(root, 'public')
const chromePath = process.env.CHROME_PATH ?? '/usr/bin/google-chrome'

const favicon = await readFile(path.join(publicDir, 'favicon.svg'), 'utf8')

const browser = await chromium.launch({
  executablePath: chromePath,
  args: ['--no-sandbox'],
})

async function shot(html, width, height, file) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 })
  await page.setContent(html, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: path.join(publicDir, file) })
  await page.close()
  console.log(`✓ ${file} (${width}×${height})`)
}

/* ── Icônes carrées : la marque pleine sur fond marine ── */
for (const [size, file] of [
  [180, 'apple-touch-icon.png'],
  [192, 'icon-192.png'],
  [512, 'icon-512.png'],
]) {
  const svg = favicon.replace('<svg ', `<svg width="${size}" height="${size}" `)
  await shot(
    `<!doctype html><html><body style="margin:0;background:#0a2145">
       <div style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center">${svg}</div>
     </body></html>`,
    size,
    size,
    file,
  )
}

/* ── Image de partage (Open Graph / Twitter) ── */
const fonts = [
  'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Plus+Jakarta+Sans:wght@700;800&display=swap',
].join('&')

const svgLarge = favicon.replace('<svg ', '<svg width="200" height="200" ')

await shot(
  `<!doctype html><html><head>
     <link rel="stylesheet" href="${fonts}" />
     <style>
       body { margin: 0; width: 1200px; height: 630px; overflow: hidden;
              background: linear-gradient(135deg, #0a2145 0%, #103f94 55%, #0a2145 100%);
              font-family: 'DM Sans', system-ui, sans-serif; color: #fff; }
       .wrap { display: flex; align-items: center; gap: 56px; padding: 0 90px; height: 100%; }
       .copy h1 { margin: 0; font-family: 'Plus Jakarta Sans', 'DM Sans', sans-serif;
                  font-size: 84px; font-weight: 800; letter-spacing: -0.02em; }
       .copy p { margin: 14px 0 0; font-size: 30px; color: #bcdcff; font-weight: 500; }
       .rule { width: 96px; height: 6px; border-radius: 3px; margin-top: 30px;
               background: linear-gradient(90deg, #34d399, #f59e0b, #fb7185); }
       .org { margin-top: 22px; font-size: 19px; letter-spacing: .18em; text-transform: uppercase;
              color: #8ec6ff; font-weight: 700; }
     </style>
   </head><body>
     <div class="wrap">
       ${svgLarge}
       <div class="copy">
         <h1>MES ACTES</h1>
         <p>Le guichet numérique des actes officiels</p>
         <div class="rule"></div>
         <div class="org">IFSIO · Université de Parakou</div>
       </div>
     </div>
   </body></html>`,
  1200,
  630,
  'og-image.png',
)

await browser.close()
await mkdir(publicDir, { recursive: true })
console.log('Icônes régénérées dans public/')
