import { useMemo, useState } from 'react'
import {
  Archive,
  ArrowRight,
  BookOpen,
  Clock,
  FileText,
  FileWarning,
  Plus,
  Wallet,
} from 'lucide-react'
import { navigate } from '@/lib/router'
import { cn } from '@/lib/utils'
import { useApp } from '@/store'
import { ActIcon } from '@/components/ActCard'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  SearchInput,
  StatCard,
  StatusBadge,
} from '@/components/ui'
import type { RequestStatus } from '@/types'

const FILTERS: Array<{ id: 'all' | 'progress' | 'pending' | 'delivered'; label: string }> = [
  { id: 'all', label: 'Tous les dossiers' },
  { id: 'progress', label: 'En cours' },
  { id: 'pending', label: 'Attente de pièces' },
  { id: 'delivered', label: 'Validés' },
]

const IN_PROGRESS: RequestStatus[] = ['Demande reçue', 'En traitement', 'En vérification']

export function Dashboard() {
  const { student, requests, acts, establishment } = useApp()
  const [filter, setFilter] = useState<'all' | 'progress' | 'pending' | 'delivered'>('all')
  const [query, setQuery] = useState('')

  const myRequests = useMemo(() => requests, [requests])
  const inProgress = myRequests.filter((request) => IN_PROGRESS.includes(request.status))
  const pending = myRequests.filter((request) => request.status === 'En attente de complément')
  const delivered = myRequests.filter((request) => request.status === 'Validé')

  const visible = useMemo(() => {
    const search = query.trim().toLowerCase()
    return myRequests.filter((request) => {
      if (filter === 'progress' && !IN_PROGRESS.includes(request.status)) return false
      if (filter === 'pending' && request.status !== 'En attente de complément') return false
      if (filter === 'delivered' && request.status !== 'Validé') return false
      if (!search) return true
      return (
        request.id.toLowerCase().includes(search) ||
        request.actTitle.toLowerCase().includes(search)
      )
    })
  }, [myRequests, filter, query])

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Welcome banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-950 via-[#10355c] to-[#0a2145] p-6 text-white sm:p-8">
        <div className="pointer-events-none absolute -top-16 -right-10 h-56 w-56 rounded-full bg-brand-500/15 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-[10px] font-extrabold tracking-[0.16em] text-brand-200 uppercase">
              Espace étudiant · {establishment.shortName}
            </p>
            <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">
              Bonjour, {student.firstName}
            </h1>
            <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-brand-100/80">
              {student.filiere} · {student.promotion} — matricule{' '}
              <span className="font-mono font-bold text-white">{student.matricule}</span>. Retrouvez
              ici tous vos dossiers déposés et leur avancement.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => navigate('/catalogue')}>
              <Plus className="h-4 w-4" /> Nouvelle demande
            </Button>
          </div>
        </div>
      </section>

      {/* KPIs */}
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="En cours"
          value={inProgress.length}
          hint="Dossiers en instruction"
          icon={<Clock className="h-4 w-4" />}
        />
        <StatCard
          label="Attente de pièces"
          value={pending.length}
          hint="Action requise"
          tone="warning"
          icon={<FileWarning className="h-4 w-4" />}
        />
        <StatCard
          label="Dossiers validés"
          value={delivered.length}
          hint="Acte à retirer à l’administration"
          tone="success"
          icon={<FileText className="h-4 w-4" />}
        />
        <StatCard
          label="Total dossiers"
          value={myRequests.length}
          hint="Depuis la création du compte"
          tone="violet"
          icon={<Archive className="h-4 w-4" />}
        />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_300px]">
        <div>
          {/* Filters */}
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">
              {FILTERS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFilter(item.id)}
                  className={cn(
                    'rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-colors',
                    filter === item.id
                      ? 'bg-white text-slate-950 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800',
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Rechercher un dossier…"
              className="sm:w-64"
            />
          </div>

          <div className="mt-3 space-y-2.5">
            {visible.length === 0 && (
              <EmptyState
                icon={<FileText className="h-8 w-8" />}
                title="Aucun dossier dans cette vue"
                description="Déposez une nouvelle demande ou modifiez vos filtres."
                action={<Button onClick={() => navigate('/catalogue')}>Parcourir le catalogue</Button>}
              />
            )}
            {visible.map((request) => {
              const act = acts.find((item) => item.id === request.actId)
              return (
                <button
                  key={request.id}
                  type="button"
                  onClick={() => navigate(`/dossiers/${request.id}`)}
                  className="group flex w-full flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left transition-all hover:border-brand-300 hover:shadow-md sm:flex-row sm:items-center"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
                    {act ? <ActIcon type={act.iconType} /> : <FileText className="h-5 w-5" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-extrabold text-slate-950 group-hover:text-brand-900">
                        {request.actTitle}
                      </span>
                      <StatusBadge status={request.status} />
                    </span>
                    <span className="mt-1 block text-[11px] text-slate-500">
                      <span className="font-mono font-bold text-slate-700">{request.id}</span> · déposé
                      le {request.createdAt} · {request.attachments.length} pièce(s)
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-3">
                    <span className="text-[10px] font-semibold text-slate-400">
                      MAJ {request.lastUpdated}
                    </span>
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-slate-500 transition-colors group-hover:bg-brand-800 group-hover:text-white">
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Quick access */}
        <aside className="space-y-2.5">
          <p className="text-[10px] font-extrabold tracking-[0.14em] text-slate-500 uppercase">
            Accès rapides
          </p>
          {[
            {
              icon: BookOpen,
              title: 'Catalogue',
              text: 'Déposer une nouvelle demande',
              path: '/catalogue',
            },
            {
              icon: FileWarning,
              title: 'Réclamations',
              text: 'Contester une note',
              path: '/reclamations',
            },
            {
              icon: Archive,
              title: 'Aide & contact',
              text: 'FAQ et scolarité',
              path: '/aide',
            },
          ].map((item) => (
            <button
              key={item.path}
              type="button"
              onClick={() => navigate(item.path)}
              className="group flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition-colors hover:border-brand-300"
            >
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-50 text-brand-700">
                <item.icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-bold text-slate-900">{item.title}</span>
                <span className="block text-[10px] text-slate-500">{item.text}</span>
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-brand-700" />
            </button>
          ))}

          {pending.length > 0 && (
            <Card className="border-amber-200 bg-amber-50/70 p-4">
              <Badge tone="warning">
                <FileWarning className="h-3 w-3" /> Action requise
              </Badge>
              <p className="mt-2 text-xs font-bold text-amber-950">
                {pending.length} dossier{pending.length > 1 ? 's' : ''} en attente de pièces
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-amber-800">
                Consultez le dossier pour téléverser le complément demandé par la scolarité.
              </p>
              <button
                type="button"
                onClick={() => setFilter('pending')}
                className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 underline"
              >
                Voir les dossiers <ArrowRight className="h-3 w-3" />
              </button>
            </Card>
          )}
        </aside>
      </div>
    </div>
  )
}

export default Dashboard
