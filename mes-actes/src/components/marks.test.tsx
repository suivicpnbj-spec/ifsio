// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { act, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { BrandMark } from '@/components/Logo'
import { InstitutionalEmblem } from '@/components/InstitutionalEmblem'
import { DEFAULT_ESTABLISHMENT } from '@/data/establishment'
import type { Establishment } from '@/types'

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true

async function render(node: ReactNode): Promise<{ html: string; cleanup: () => Promise<void> }> {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root: Root = createRoot(container)
  await act(async () => root.render(node))
  const html = container.innerHTML
  return {
    html,
    cleanup: () => act(async () => root.unmount()),
  }
}

describe('BrandMark (marque produit)', () => {
  it('garde l’identité colorée par défaut', async () => {
    const { html, cleanup } = await render(<BrandMark />)
    expect(html).toContain('Logo MES ACTES')
    expect(html).toContain('#f59e0b') // sceau doré
    expect(html).toMatch(/url\(#/) // dégradé de la tuile
    expect(html).not.toContain('NaN')
    await cleanup()
  })

  it('s’aplatit en une seule encre en variante mono', async () => {
    const { html, cleanup } = await render(<BrandMark mono />)
    expect(html).toContain('currentColor') // tuile en encre courante
    expect(html).not.toContain('#f59e0b')
    expect(html).not.toMatch(/url\(#/)
    expect(html).not.toContain('NaN')
    await cleanup()
  })
})

describe('InstitutionalEmblem (emblème institutionnel)', () => {
  it('compose les deux couronnes et le sigle à partir des données', async () => {
    const { html, cleanup } = await render(
      <InstitutionalEmblem establishment={DEFAULT_ESTABLISHMENT} />,
    )
    expect(html).toContain('Emblème institutionnel IFSIO')
    expect(html).toContain(DEFAULT_ESTABLISHMENT.name.toUpperCase())
    expect(html).toContain(DEFAULT_ESTABLISHMENT.university.toUpperCase())
    expect(html).toContain('IFSIO')
    expect(html).toContain('#f59e0b') // étoile et séparateurs
    expect(html).not.toContain('NaN')
    await cleanup()
  })

  it('branche chaque texte de couronne sur un tracé réellement déclaré', async () => {
    const { html, cleanup } = await render(
      <InstitutionalEmblem establishment={DEFAULT_ESTABLISHMENT} />,
    )
    const document_ = new DOMParser().parseFromString(html, 'image/svg+xml')
    const hrefs = [...document_.querySelectorAll('textPath')].map((node) =>
      node.getAttribute('href'),
    )
    expect(hrefs.length).toBe(2)
    for (const href of hrefs) {
      expect(href).toMatch(/^#.+$/)
      expect(document_.querySelector(href as string)).not.toBeNull()
    }
    await cleanup()
  })

  it('limite le corps de texte quand le nom de l’établissement est très long', async () => {
    const establishment: Establishment = {
      ...DEFAULT_ESTABLISHMENT,
      name: "Institut National Supérieur de Formation et de Recherche en Sciences de la Santé et du Soin",
    }
    const { html, cleanup } = await render(<InstitutionalEmblem establishment={establishment} />)
    const document_ = new DOMParser().parseFromString(html, 'image/svg+xml')
    const sizes = [...document_.querySelectorAll('text')]
      .map((node) => Number(node.getAttribute('font-size') ?? node.getAttribute('fontSize')))
      .filter((size) => Number.isFinite(size) && size > 0)
    expect(sizes.length).toBe(4)
    for (const size of sizes) {
      expect(size).toBeGreaterThanOrEqual(3.1)
      expect(size).toBeLessThanOrEqual(17)
    }
    expect(html).toContain('INSTITUT NATIONAL SUPÉRIEUR')
    expect(html).not.toContain('NaN')
    await cleanup()
  })

  it('s’aplatit en une seule encre en variante mono', async () => {
    const { html, cleanup } = await render(
      <InstitutionalEmblem establishment={DEFAULT_ESTABLISHMENT} mono />,
    )
    expect(html).toContain('currentColor')
    expect(html).not.toContain('#f59e0b')
    expect(html).not.toContain('#eef6ff')
    expect(html).not.toMatch(/url\(#/)
    expect(html).not.toContain('NaN')
    await cleanup()
  })
})
