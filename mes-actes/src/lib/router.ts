import { useEffect, useState } from 'react'

export function currentPath(): string {
  const hash = window.location.hash.replace(/^#/, '')
  return hash === '' ? '/' : hash
}

export function navigate(path: string): void {
  if (currentPath() === path) {
    window.scrollTo(0, 0)
    return
  }
  window.location.hash = path
}

export function useRoutePath(): string {
  const [path, setPath] = useState(currentPath)

  useEffect(() => {
    const onChange = () => {
      setPath(currentPath())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  return path
}

export function segmentsOf(path: string): string[] {
  return path.split('/').filter(Boolean)
}
