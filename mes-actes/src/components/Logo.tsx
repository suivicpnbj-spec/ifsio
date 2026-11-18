import { useId } from 'react'
import { cn } from '@/lib/utils'

/**
 * Marque MES ACTES — « Feuille & sceau » :
 * un acte (feuille au pli) frappé du sceau doré de la direction.
 * Deux formes seulement : lisible dès 16 px, imprimable en aplat.
 *
 * `mono` place la marque en aplat `currentColor` (encre unique) pour les
 * sorties noir et blanc, filigranes et gravures.
 */
export function BrandMark({ className, mono = false }: { className?: string; mono?: boolean }) {
  const gradientId = useId()
  return (
    <svg
      viewBox="0 0 48 48"
      className={cn('h-10 w-10 shrink-0', className)}
      role="img"
      aria-label="Logo MES ACTES"
    >
      {!mono && (
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#12376f" />
            <stop offset="100%" stopColor="#0a2145" />
          </linearGradient>
        </defs>
      )}
      {/* Tuile */}
      <rect
        width="48"
        height="48"
        rx="13"
        fill={mono ? 'currentColor' : `url(#${gradientId})`}
      />
      {/* L’acte : feuille au pli d’angle */}
      <path
        d="M17 10h11l8 8v17a4 4 0 0 1-4 4H17a4 4 0 0 1-4-4V14a4 4 0 0 1 4-4z"
        fill="#ffffff"
      />
      <path d="M28 10l8 8h-8z" fill={mono ? '#ffffff' : '#bcdcff'} opacity={mono ? 0.55 : 1} />
      {/* Lignes de contenu */}
      <path
        d="M18 20h12M18 25h8"
        fill="none"
        stroke={mono ? '#ffffff' : '#8ec6ff'}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      {/* Le sceau de la direction, apposé sur l’acte */}
      <circle cx="33" cy="34" r="8" fill={mono ? '#ffffff' : '#f59e0b'} />
      <path
        d="M29.6 34.2l2.4 2.4 4.4-4.8"
        fill="none"
        stroke={mono ? 'currentColor' : '#0a2145'}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function BrandLockup({
  shortName,
  university,
  className,
  inverted,
}: {
  shortName: string
  university: string
  className?: string
  inverted?: boolean
}) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <BrandMark />
      <span className="flex min-w-0 flex-col leading-tight">
        <span className={cn('font-display text-[17px] font-extrabold tracking-tight whitespace-nowrap', inverted ? 'text-white' : 'text-brand-950')}>
          MES ACTES
        </span>
        <span className={cn('truncate text-[10px] font-bold tracking-wide', inverted ? 'text-brand-200' : 'text-slate-500')}>
          {shortName} · {university}
        </span>
      </span>
    </span>
  )
}
