import { useId } from 'react'
import { cn } from '@/lib/utils'
import type { Establishment } from '@/types'

/** Largeur moyenne d’une capitale, en fraction de corps (police sans serif). */
const CAP_RATIO = 0.66

/** Ajuste un corps de texte pour tenir dans un arc de la couronne. */
function fitFontSize(text: string, budget: number, min: number, max: number): number {
  const width = text.length * CAP_RATIO
  return Math.max(min, Math.min(max, budget / width))
}

/**
 * Emblème institutionnel de l’établissement — l’écu circulaire qui figure sur
 * les actes officiels (en-tête et filigrane), distinct de la marque produit
 * MES ACTES (`BrandMark`) réservée à l’interface.
 *
 * Toutes les mentions sont tirées des données de l’établissement : le composant
 * reste valable pour un autre tenant.
 */
export function InstitutionalEmblem({
  establishment,
  className,
  size = 56,
  mono = false,
}: {
  establishment: Establishment
  className?: string
  size?: number
  /** Aplat d’encre unique (`currentColor`) pour les sorties noir et blanc. */
  mono?: boolean
}) {
  const arcId = useId()
  const name = establishment.name.toUpperCase()
  const university = establishment.university.toUpperCase()
  const shortName = establishment.shortName.toUpperCase()
  const country = establishment.country.toUpperCase()

  const nameSize = fitFontSize(name, 124, 3.1, 7.2)
  const universitySize = fitFontSize(university, 124, 3.4, 7.2)
  const shortNameSize = fitFontSize(shortName, 58, 9, 17)
  const countrySize = fitFontSize(country, 44, 3.2, 5)

  const ink = mono ? 'currentColor' : '#0a2145'
  const inkSoft = mono ? 'currentColor' : '#12376f'
  const accent = mono ? 'currentColor' : '#f59e0b'

  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={`Emblème institutionnel ${establishment.shortName}`}
    >
      <defs>
        {/* Couronne supérieure : nom de l’institut */}
        <path id={`${arcId}-top`} d="M16,60 A44,44 0 0 1 104,60" fill="none" />
        {/* Couronne inférieure : université de rattachement */}
        <path id={`${arcId}-bottom`} d="M10.5,60 A49.5,49.5 0 0 0 109.5,60" fill="none" />
      </defs>

      {/* Double anneau */}
      <circle
        cx="60"
        cy="60"
        r="57.5"
        fill={mono ? 'none' : '#ffffff'}
        stroke={ink}
        strokeWidth="1.8"
      />
      <circle cx="60" cy="60" r="52.5" fill="none" stroke={ink} strokeWidth="0.9" />

      {/* Disque central */}
      <circle
        cx="60"
        cy="60"
        r="42"
        fill={mono ? 'none' : '#eef6ff'}
        stroke={inkSoft}
        strokeWidth="0.9"
      />

      {/* Couronnes de texte */}
      <text
        fill={ink}
        fontSize={nameSize}
        fontWeight="800"
        letterSpacing="0.4"
        fontFamily="Plus Jakarta Sans, sans-serif"
      >
        <textPath href={`#${arcId}-top`} startOffset="50%" textAnchor="middle">
          {name}
        </textPath>
      </text>
      <text
        fill={inkSoft}
        fontSize={universitySize}
        fontWeight="700"
        letterSpacing="0.4"
        fontFamily="Plus Jakarta Sans, sans-serif"
      >
        <textPath href={`#${arcId}-bottom`} startOffset="50%" textAnchor="middle">
          {university}
        </textPath>
      </text>

      {/* Séparateurs de couronne */}
      <path d="M13 58.4l1.6 1.6-1.6 1.6-1.6-1.6z" fill={accent} />
      <path d="M107 58.4l1.6 1.6-1.6 1.6-1.6-1.6z" fill={accent} />

      {/* Centre : étoile, sigle, filet, pays */}
      <path
        d="M60 40.5l1.9 4.6 5 .4-3.8 3.3 1.2 4.9L60 50.9l-4.3 2.8 1.2-4.9-3.8-3.3 5-.4z"
        fill={accent}
      />
      <text
        x="60"
        y="68"
        textAnchor="middle"
        fontSize={shortNameSize}
        fontWeight="800"
        fill={ink}
        letterSpacing="0.5"
        fontFamily="Plus Jakarta Sans, sans-serif"
      >
        {shortName}
      </text>
      <path d="M46 74h28" stroke={inkSoft} strokeWidth="1" strokeLinecap="round" />
      <text
        x="60"
        y="83"
        textAnchor="middle"
        fontSize={countrySize}
        fontWeight="700"
        fill={inkSoft}
        letterSpacing="0.6"
        fontFamily="Plus Jakarta Sans, sans-serif"
      >
        {country}
      </text>
    </svg>
  )
}
