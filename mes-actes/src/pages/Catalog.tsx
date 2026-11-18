import { useMemo, useState } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'
import { actCategories } from '@/lib/categories'
import { cn } from '@/lib/utils'
import { useApp } from '@/store'
import { ActCard } from '@/components/ActCard'
import { Button, Card, EmptyState, SearchInput, Select } from '@/components/ui'
import type { CategoryId, ServiceType } from '@/types'

const SERVICE_FILTERS: Array<{ id: 'all' | ServiceType; label: string }> = [
  { id: 'all', label: 'Tout le catalogue' },
  { id: 'act', label: 'Actes administratifs' },
  { id: 'procedure', label: 'Démarches' },
]

export function Catalog({
  initialQuery = '',
  initialCategory = 'all',
}: {
  initialQuery?: string
  initialCategory?: string
}) {
  const { acts, establishment } = useApp()
  const activeActs = useMemo(() => acts.filter((act) => act.active !== false), [acts])
  const categories = useMemo(() => actCategories(activeActs), [activeActs])

  const [query, setQuery] = useState(initialQuery)
  const [category, setCategory] = useState<CategoryId | 'all'>(
    categories.some((item) => item.id === initialCategory)
      ? (initialCategory as CategoryId)
      : 'all',
  )
  const [service, setService] = useState<'all' | ServiceType>('all')
  const [audience, setAudience] = useState<'all' | 'Étudiants' | 'Diplômés' | 'Tous'>('all')

  const results = useMemo(() => {
    const search = query.trim().toLowerCase()
    return activeActs.filter((act) => {
      if (category !== 'all' && act.category !== category) return false
      if (service !== 'all' && act.serviceType !== service) return false
      if (audience !== 'all' && act.audience !== audience && act.audience !== 'Tous') return false
      if (!search) return true
      return (
        act.title.toLowerCase().includes(search) ||
        act.shortDescription.toLowerCase().includes(search) ||
        act.categoryLabel.toLowerCase().includes(search) ||
        act.id.toLowerCase().includes(search)
      )
    })
  }, [activeActs, category, service, audience, query])

  const hasFilters = query.trim() !== '' || category !== 'all' || service !== 'all' || audience !== 'all'

  const reset = () => {
    setQuery('')
    setCategory('all')
    setService('all')
    setAudience('all')
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end">
        <div>
          <p className="text-[11px] font-extrabold tracking-[0.16em] text-brand-700 uppercase">
            Catalogue officiel
          </p>
          <h1 className="mt-1 text-2xl font-extrabold text-slate-950 sm:text-3xl">
            Actes, démarches et ressources
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-slate-600">
            {activeActs.length} prestations proposées par {establishment.shortName} : consultez les
            conditions, les pièces requises, les délais et les tarifs avant de déposer votre demande.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">
            {results.length} résultat{results.length > 1 ? 's' : ''}
          </span>
          {hasFilters && (
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2.5 py-1 hover:border-slate-300 hover:text-slate-800"
            >
              <X className="h-3 w-3" /> Réinitialiser
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* Filters */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Card className="p-4">
            <p className="flex items-center gap-1.5 text-[11px] font-extrabold tracking-wider text-slate-500 uppercase">
              <SlidersHorizontal className="h-3.5 w-3.5" /> Affiner
            </p>
            <div className="mt-3 space-y-3">
              <SearchInput
                value={query}
                onChange={setQuery}
                placeholder="Rechercher un acte…"
                ariaLabel="Rechercher un acte"
              />
              <div className="space-y-1.5">
                <label htmlFor="audience-filter" className="text-[11px] font-bold text-slate-600">
                  Public concerné
                </label>
                <Select
                  id="audience-filter"
                  value={audience}
                  onChange={(event) => setAudience(event.target.value as typeof audience)}
                >
                  <option value="all">Tous les publics</option>
                  <option value="Étudiants">Étudiants</option>
                  <option value="Diplômés">Diplômés</option>
                </Select>
              </div>
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-600">Type de prestation</span>
                <div className="grid gap-1">
                  {SERVICE_FILTERS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setService(item.id)}
                      className={cn(
                        'rounded-lg px-2.5 py-1.5 text-left text-[11px] font-semibold transition-colors',
                        service === item.id
                          ? 'bg-brand-50 text-brand-900'
                          : 'text-slate-600 hover:bg-slate-50',
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <p className="text-[11px] font-extrabold tracking-wider text-slate-500 uppercase">
              Catégories
            </p>
            <div className="mt-2 grid gap-0.5">
              <button
                type="button"
                onClick={() => setCategory('all')}
                className={cn(
                  'flex items-center justify-between rounded-lg px-2.5 py-2 text-left text-[11px] font-semibold transition-colors',
                  category === 'all' ? 'bg-brand-50 text-brand-900' : 'text-slate-600 hover:bg-slate-50',
                )}
              >
                Toutes les catégories
                <span className="rounded-full bg-white/70 px-1.5 text-[10px] font-bold text-slate-500">
                  {activeActs.length}
                </span>
              </button>
              {categories.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCategory(item.id)}
                  className={cn(
                    'flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-[11px] font-semibold transition-colors',
                    category === item.id
                      ? 'bg-brand-50 text-brand-900'
                      : 'text-slate-600 hover:bg-slate-50',
                  )}
                >
                  <span className="truncate">{item.label}</span>
                  <span className="rounded-full bg-white/70 px-1.5 text-[10px] font-bold text-slate-500">
                    {item.count}
                  </span>
                </button>
              ))}
            </div>
          </Card>
        </aside>

        {/* Results */}
        <div>
          {results.length === 0 ? (
            <EmptyState
              title="Aucune prestation ne correspond"
              description="Modifiez votre recherche ou réinitialisez les filtres pour parcourir l’ensemble du catalogue."
              action={<Button onClick={reset}>Réinitialiser les filtres</Button>}
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((act) => (
                <ActCard key={act.id} act={act} currency={establishment.currency} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Catalog
