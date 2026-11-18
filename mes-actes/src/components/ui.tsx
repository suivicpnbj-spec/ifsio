import {
  useEffect,
  useId,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, CheckCircle2, Info, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RequestStatus } from '@/types'

/* ───────────────────────────── Button ───────────────────────────── */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'dark'
type ButtonSize = 'sm' | 'md' | 'lg'

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-800 text-white hover:bg-brand-900 shadow-sm disabled:bg-slate-300 disabled:text-slate-500',
  secondary:
    'bg-white text-slate-800 border border-slate-300 hover:border-brand-400 hover:text-brand-900 shadow-sm disabled:text-slate-400',
  ghost: 'text-slate-700 hover:bg-slate-100 hover:text-slate-950',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm',
  dark: 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm',
}

const buttonSizes: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5 rounded-lg',
  md: 'px-4 py-2.5 text-sm gap-2 rounded-xl',
  lg: 'px-6 py-3.5 text-sm gap-2.5 rounded-xl',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
}) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-bold transition-colors disabled:cursor-not-allowed',
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

/* ───────────────────────────── Badge ───────────────────────────── */

export type BadgeTone = 'brand' | 'success' | 'warning' | 'danger' | 'neutral' | 'amber' | 'violet'

const badgeTones: Record<BadgeTone, string> = {
  brand: 'bg-brand-50 text-brand-800 border-brand-200',
  success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  warning: 'bg-amber-50 text-amber-900 border-amber-200',
  danger: 'bg-rose-50 text-rose-700 border-rose-200',
  neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  amber: 'bg-amber-500 text-white border-amber-500',
  violet: 'bg-violet-50 text-violet-800 border-violet-200',
}

export function Badge({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: BadgeTone
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold leading-none',
        badgeTones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

export function statusTone(status: RequestStatus): BadgeTone {
  switch (status) {
    case 'Validé':
      return 'success'
    case 'En attente de complément':
      return 'warning'
    case 'Clôturé':
      return 'neutral'
    case 'En vérification':
      return 'violet'
    case 'Demande reçue':
    case 'En traitement':
      return 'brand'
    default:
      return 'neutral'
  }
}

export function StatusBadge({ status }: { status: RequestStatus }) {
  return <Badge tone={statusTone(status)}>{status}</Badge>
}

/* ───────────────────────────── Layout helpers ───────────────────────────── */

export function Card({
  children,
  className,
  as: Tag = 'div',
}: {
  children: ReactNode
  className?: string
  as?: 'div' | 'section' | 'article' | 'aside'
}) {
  return (
    <Tag
      className={cn(
        'rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(16,42,67,0.04)]',
        className,
      )}
    >
      {children}
    </Tag>
  )
}

export function SectionHeading({
  kicker,
  title,
  description,
  action,
  className,
  inverted,
}: {
  kicker?: string
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  className?: string
  inverted?: boolean
}) {
  return (
    <div
      className={cn(
        'flex flex-col justify-between gap-4 sm:flex-row sm:items-end',
        className,
      )}
    >
      <div className="max-w-2xl">
        {kicker && (
          <p
            className={cn(
              'mb-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em]',
              inverted ? 'text-brand-200' : 'text-brand-700',
            )}
          >
            {kicker}
          </p>
        )}
        <h2
          className={cn(
            'text-xl font-extrabold sm:text-2xl',
            inverted ? 'text-white' : 'text-slate-950',
          )}
        >
          {title}
        </h2>
        {description && (
          <p
            className={cn(
              'mt-1.5 text-sm leading-relaxed',
              inverted ? 'text-brand-100/80' : 'text-slate-600',
            )}
          >
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  )
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = 'brand',
}: {
  label: string
  value: ReactNode
  hint?: string
  icon?: ReactNode
  tone?: 'brand' | 'success' | 'warning' | 'violet'
}) {
  const tones: Record<string, string> = {
    brand: 'bg-brand-50 text-brand-700',
    success: 'bg-emerald-50 text-emerald-700',
    warning: 'bg-amber-50 text-amber-700',
    violet: 'bg-violet-50 text-violet-700',
  }
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">{label}</p>
        {icon && (
          <span className={cn('grid h-8 w-8 place-items-center rounded-lg', tones[tone])}>
            {icon}
          </span>
        )}
      </div>
      <p className="mt-2 font-mono text-2xl font-extrabold tracking-tight text-slate-950">{value}</p>
      {hint && <p className="mt-1 text-[11px] text-slate-500">{hint}</p>}
    </Card>
  )
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string
  description?: string
  action?: ReactNode
  icon?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-12 text-center">
      {icon && <div className="mb-3 text-slate-400">{icon}</div>}
      <p className="text-sm font-bold text-slate-900">{title}</p>
      {description && <p className="mt-1 max-w-md text-xs leading-relaxed text-slate-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function Progress({
  value,
  label,
  className,
}: {
  value: number
  label?: string
  className?: string
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && <p className="text-[11px] font-bold text-slate-600">{label}</p>}
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(value)}
      >
        <div
          className="h-full rounded-full bg-brand-700 transition-all duration-300"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  )
}

/* ───────────────────────────── Form fields ───────────────────────────── */

const fieldBase =
  'w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none disabled:bg-slate-50'

export function Field({
  label,
  hint,
  required,
  error,
  children,
  className,
  htmlFor,
}: {
  label: string
  hint?: string
  required?: boolean
  error?: string
  children: ReactNode
  className?: string
  htmlFor?: string
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={htmlFor} className="flex items-baseline justify-between gap-2 text-xs font-bold text-slate-700">
        <span>
          {label}
          {required && <span className="ml-0.5 text-rose-600">*</span>}
        </span>
        {hint && <span className="text-[10px] font-medium text-slate-400">{hint}</span>}
      </label>
      {children}
      {error && <p className="text-[11px] font-semibold text-rose-600">{error}</p>}
    </div>
  )
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldBase, className)} {...props} />
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(fieldBase, 'cursor-pointer pr-8', className)} {...props}>
      {children}
    </select>
  )
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldBase, 'min-h-24 resize-y', className)} {...props} />
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Rechercher…',
  className,
  onKeyDown,
  ariaLabel,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  onKeyDown?: InputHTMLAttributes<HTMLInputElement>['onKeyDown']
  ariaLabel?: string
}) {
  const id = useId()
  return (
    <div className={cn('relative', className)}>
      <label htmlFor={id} className="sr-only">
        {ariaLabel ?? placeholder}
      </label>
      <Search className="pointer-events-none absolute top-3 left-3.5 h-4 w-4 text-slate-400" />
      <Input
        id={id}
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
        className="pl-10"
      />
    </div>
  )
}

/* ───────────────────────────── Modal ───────────────────────────── */

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'lg',
  headerTone = 'light',
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  subtitle?: ReactNode
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  headerTone?: 'light' | 'dark'
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl',
    full: 'max-w-6xl',
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : 'Fenêtre de dialogue'}
        className={cn(
          'animate-fade-up my-auto w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl',
          sizes[size],
        )}
      >
        <div
          className={cn(
            'flex items-start justify-between gap-4 border-b px-5 py-4 sm:px-6',
            headerTone === 'dark'
              ? 'border-slate-800 bg-slate-900 text-white'
              : 'border-slate-200 bg-white text-slate-950',
          )}
        >
          <div className="min-w-0">
            <div
              className={cn(
                'text-base font-extrabold sm:text-lg',
                headerTone === 'dark' ? 'text-white' : 'text-slate-950',
              )}
            >
              {title}
            </div>
            {subtitle && (
              <p
                className={cn(
                  'mt-0.5 text-xs',
                  headerTone === 'dark' ? 'text-slate-400' : 'text-slate-500',
                )}
              >
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className={cn(
              'grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-colors',
              headerTone === 'dark'
                ? 'text-slate-400 hover:bg-slate-800 hover:text-white'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900',
            )}
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>
        <div className="max-h-[calc(100vh-12rem)] overflow-y-auto">{children}</div>
        {footer && (
          <div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}

/* ───────────────────────────── Toasts ───────────────────────────── */

export function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: Array<{ id: number; message: string; tone: 'success' | 'info' | 'warning' | 'error' }>
  onDismiss: (id: number) => void
}) {
  if (!toasts.length) return null
  const icons = {
    success: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
    info: <Info className="h-4 w-4 text-brand-600" />,
    warning: <AlertTriangle className="h-4 w-4 text-amber-600" />,
    error: <AlertTriangle className="h-4 w-4 text-rose-600" />,
  }
  return createPortal(
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-[60] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 space-y-2">
      {toasts.map((item) => (
        <div
          key={item.id}
          role="status"
          className="animate-fade-up pointer-events-auto flex items-start gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 py-3 shadow-lg"
        >
          <span className="mt-0.5 shrink-0">{icons[item.tone]}</span>
          <p className="flex-1 text-xs font-semibold text-slate-800">{item.message}</p>
          <button
            type="button"
            onClick={() => onDismiss(item.id)}
            aria-label="Fermer la notification"
            className="text-slate-400 hover:text-slate-700"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>,
    document.body,
  )
}
