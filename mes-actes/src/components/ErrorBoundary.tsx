import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, Home, RefreshCw } from 'lucide-react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

/**
 * Catches rendering errors so a broken page shows a recoverable message
 * instead of a blank white screen.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Erreur applicative MES ACTES :', error, info.componentStack)
  }

  private handleReset = () => {
    this.setState({ error: null })
  }

  render(): ReactNode {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="grid min-h-screen place-items-center bg-slate-50 px-4 py-16">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-rose-50 text-rose-600">
            <AlertTriangle className="h-6 w-6" />
          </span>
          <h1 className="mt-4 text-lg font-extrabold text-slate-950">
            Une page n’a pas pu s’afficher
          </h1>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
            Une erreur technique est survenue pendant le rendu. Vos données locales sont intactes :
            vous pouvez réessayer ou revenir à l’accueil.
          </p>
          <pre className="mt-4 max-h-32 overflow-auto rounded-xl bg-slate-50 p-3 text-left font-mono text-[10px] text-slate-500">
            {error.message}
          </pre>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={this.handleReset}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-brand-800"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Réessayer
            </button>
            <a
              href="#/"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50"
            >
              <Home className="h-3.5 w-3.5" /> Retour à l’accueil
            </a>
          </div>
        </div>
      </div>
    )
  }
}
