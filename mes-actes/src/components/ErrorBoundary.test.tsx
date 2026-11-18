// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from '@/components/ErrorBoundary'

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true

function Broken(): never {
  throw new Error('panne simulée du rendu')
}

describe('ErrorBoundary', () => {
  it('affiche un écran de secours quand un composant lève une erreur', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    await act(async () => {
      root.render(
        <ErrorBoundary>
          <Broken />
        </ErrorBoundary>,
      )
    })

    expect(container.textContent).toContain('Une page n’a pas pu s’afficher')
    expect(container.textContent).toContain('panne simulée du rendu')
    expect(container.textContent).toContain('Réessayer')

    consoleError.mockRestore()
    await act(async () => root.unmount())
  })

  it('laisse passer les enfants quand aucune erreur ne survient', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    await act(async () => {
      root.render(
        <ErrorBoundary>
          <p>Contenu nominal</p>
        </ErrorBoundary>,
      )
    })

    expect(container.textContent).toBe('Contenu nominal')

    await act(async () => root.unmount())
  })
})
