import { useMemo, useState } from 'react'
import {
  AlertCircle,
  ArrowRightLeft,
  BarChart3,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileText,
  FileWarning,
  Layers,
  PenTool,
  Search,
  Settings,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react'
import { navigate } from '@/lib/router'
import { buildQueueCsv } from '@/lib/csv'
import { downloadCsv } from '@/lib/csv-download'
import { cn } from '@/lib/utils'
import { useApp } from '@/store'
import { AdminDossierModal } from '@/components/AdminDossierModal'
import { ReceiptModal } from '@/components/Receipt'
import { OfficialDocumentModal } from '@/components/OfficialDocumentSheet'
import {
  Badge,
  Button,
  Card,
  SearchInput,
  StatCard,
  StatusBadge,
} from '@/components/ui'
import type { UserRequest } from '@/types'

type Filter = 'all' | 'todo' | 'pending' | 'delivered' | 'claims'

const IN_PROGRESS = ['Demande reçue', 'En traitement', 'En vérification']

export function AdminQueue() {
  const { admin, establishment, requests, acts, logout, toast } = useApp()
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [documentRequest, setDocumentRequest] = useState<UserRequest | null>(null)

  const todo = requests.filter((request) => IN_PROGRESS.includes(request.status))
  const pending = requests.filter((request) => request.status === 'En attente de complément')
  const delivered = requests.filter((request) => request.status === 'Validé')
  const claims = requests.filter((request) => Boolean(request.reclamationDetails))

  const visible = useMemo(() => {
    const search = query.trim().toLowerCase()
    return requests.filter((request) => {
      if (filter === 'todo' && !IN_PROGRESS.includes(request.status)) return false
      if (filter === 'pending' && request.status !== 'En attente de complément') return false
      if (filter === 'delivered' && request.status !== 'Validé') return false
      if (filter === 'claims' && !request.reclamationDetails) return false
      if (!search) return true
      return (
        request.id.toLowerCase().includes(search) ||
        request.actTitle.toLowerCase().includes(search) ||
        request.applicant.fullName.toLowerCase().includes(search) ||
        request.applicant.matricule.toLowerCase().includes(search)
      )
    })
  }, [requests, filter, query])

  const selected = requests.find((request) => request.id === selectedId) ?? null

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 p-6 text-white sm:p-8">
        <div className="pointer-events-none absolute -top-16 -right-10 h-56 w-56 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div className="flex items-center gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-amber-400/30 bg-amber-600 text-lg font-extrabold text-white">
              {admin.firstName.charAt(0)}
              {admin.lastName.charAt(0)}
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="amber">Portail scolarité</Badge>
                <span className="text-[10px] font-semibold text-slate-400">
                  {establishment.shortName} · {establishment.university}
                </span>
              </div>
              <h1 className="mt-1.5 text-xl font-extrabold sm:text-2xl">
                {admin.firstName} {admin.lastName}
              </h1>
              <p className="text-[11px] text-slate-400">
                {admin.role} · {admin.department}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => navigate('/admin/statistiques')}>
              <BarChart3 className="h-3.5 w-3.5" /> Statistiques
            </Button>
            <Button variant="secondary" size="sm" onClick={() => navigate('/admin/catalogue')}>
              <Settings className="h-3.5 w-3.5" /> Catalogue & tarifs
            </Button>
            <Button
              size="sm"
              className="bg-white/10 text-white hover:bg-white/20"
              onClick={() => {
                void logout()
                navigate('/connexion')
                toast('Connectez-vous avec un compte étudiant pour la vue étudiante.', 'info')
              }}
            >
              <ArrowRightLeft className="h-3.5 w-3.5" /> Vue étudiante
            </Button>
          </div>
        </div>
      </section>

      {/* KPIs */}
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Total dossiers"
          value={requests.length}
          hint="Toutes filières"
          icon={<Layers className="h-4 w-4" />}
        />
        <StatCard
          label="À instruire"
          value={todo.length}
          hint="Pièces en attente d’audit"
          tone="warning"
          icon={<Clock className="h-4 w-4" />}
        />
        <StatCard
          label="Attente de pièces"
          value={pending.length}
          hint="Relances à suivre"
          tone="violet"
          icon={<FileWarning className="h-4 w-4" />}
        />
        <StatCard
          label="Dossiers validés"
          value={delivered.length}
          hint="Instruction terminée"
          tone="success"
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
      </div>

      {/* Queue */}
      <Card className="mt-5 overflow-hidden">
        <div className="space-y-3 border-b border-slate-200 p-4 sm:p-5">
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-base font-extrabold text-slate-950">
                File d’instruction des actes
              </h2>
              <p className="text-[11px] text-slate-500">
                Examinez les pièces, demandez un complément ou validez le dossier une fois
                l’instruction terminée.
              </p>
            </div>
            <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">
              {[
                { id: 'all' as const, label: 'Tous', count: requests.length },
                { id: 'todo' as const, label: 'À instruire', count: todo.length },
                { id: 'pending' as const, label: 'Pièces', count: pending.length },
                { id: 'delivered' as const, label: 'Validés', count: delivered.length },
                { id: 'claims' as const, label: 'Litiges', count: claims.length },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFilter(item.id)}
                  className={cn(
                    'rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition-colors',
                    filter === item.id
                      ? 'bg-white text-slate-950 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800',
                  )}
                >
                  {item.label} ({item.count})
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Rechercher par dossier, nom, matricule ou acte…"
              ariaLabel="Rechercher un dossier"
              className="max-w-xl"
            />
            <Button
              variant="secondary"
              size="sm"
              className="self-start"
              onClick={() => {
                const csv = buildQueueCsv(visible, acts)
                downloadCsv(
                  `file-instruction-${establishment.shortName.toLowerCase()}.csv`,
                  csv,
                )
                toast(`${visible.length} dossier(s) exporté(s) au format CSV.`, 'success')
              }}
            >
              <Download className="h-3.5 w-3.5" /> Exporter en CSV ({visible.length})
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-3">Dossier</th>
                <th className="px-4 py-3">Étudiant</th>
                <th className="px-4 py-3">Acte demandé</th>
                <th className="px-4 py-3">Pièces</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visible.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-[11px] text-slate-400">
                    Aucun dossier ne correspond à ces critères.
                  </td>
                </tr>
              )}
              {visible.map((request) => {
                const verified = request.attachments.filter((item) => item.verified).length
                const allVerified =
                  request.attachments.length > 0 && verified === request.attachments.length
                return (
                  <tr
                    key={request.id}
                    onClick={() => setSelectedId(request.id)}
                    className="cursor-pointer transition-colors hover:bg-brand-50/30"
                  >
                    <td className="px-4 py-3.5">
                      <span className="rounded border border-brand-200 bg-brand-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-brand-900">
                        {request.id}
                      </span>
                      <p className="mt-1 text-[10px] text-slate-400">{request.createdAt}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-bold text-slate-900">{request.applicant.fullName}</p>
                      <p className="text-[10px] text-slate-500">
                        <span className="font-mono">{request.applicant.matricule}</span> ·{' '}
                        {request.applicant.filiere.replace('Licence Professionnelle en ', '')}
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-slate-900">{request.actTitle}</p>
                      <p className="text-[10px] text-slate-500">
                        {request.applicant.deliveryMethod === 'online' ? 'Numérique' : 'Retrait'}
                        {request.reclamationDetails ? ' · Réclamation' : ''}
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      {request.attachments.length === 0 ? (
                        <span className="text-[10px] text-slate-400">Aucune</span>
                      ) : allVerified ? (
                        <Badge tone="success">
                          <CheckCircle2 className="h-3 w-3" /> {verified} validées
                        </Badge>
                      ) : (
                        <Badge tone="warning">
                          <AlertCircle className="h-3 w-3" /> {verified}/{request.attachments.length}
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={request.status} />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex justify-end" onClick={(event) => event.stopPropagation()}>
                        {request.status === 'Validé' ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setDocumentRequest(request)}
                          >
                            <Eye className="h-3 w-3" /> Voir le récépissé
                          </Button>
                        ) : (
                          <Button size="sm" onClick={() => setSelectedId(request.id)}>
                            <PenTool className="h-3 w-3" /> Instruire
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="h-3 w-3" />{' '}
          Actions horodatées et journalisées côté serveur.
        </span>
        <button
          type="button"
          onClick={() => navigate('/admin/parametres')}
          className="flex items-center gap-1 font-semibold hover:text-brand-800"
        >
          <TrendingUp className="h-3 w-3" /> Paramètres de l’établissement
        </button>
      </div>

      {selected && (
        <AdminDossierModal
          request={selected}
          onClose={() => setSelectedId(null)}
          onViewDocument={(request) => setDocumentRequest(request)}
        />
      )}

      {documentRequest && (
        documentRequest.serviceType === 'act' ? (
          <OfficialDocumentModal request={documentRequest} onClose={() => setDocumentRequest(null)} />
        ) : (
          <ReceiptModal request={documentRequest} onClose={() => setDocumentRequest(null)} />
        )
      )}
    </div>
  )
}

export default AdminQueue
