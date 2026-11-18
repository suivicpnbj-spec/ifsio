import { useMemo } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Layers,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { navigate } from '@/lib/router'
import { buildQueueCsv } from '@/lib/csv'
import { downloadCsv } from '@/lib/csv-download'
import { computeAdminStatistics } from '@/lib/stats'
import { formatAmount } from '@/lib/utils'
import { useApp } from '@/store'
import { Badge, Button, Card, StatCard } from '@/components/ui'

function Bar({
  label,
  value,
  max,
  suffix,
}: {
  label: string
  value: number
  max: number
  suffix?: string
}) {
  const ratio = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="truncate text-[11px] font-semibold text-slate-700">{label}</span>
        <span className="shrink-0 font-mono text-[11px] font-bold text-slate-900">
          {value}
          {suffix ? ` ${suffix}` : ''}
        </span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-700"
          style={{ width: `${ratio}%` }}
        />
      </div>
    </div>
  )
}

export function AdminStats() {
  const { requests, acts, establishment, admin, toast } = useApp()
  const stats = useMemo(() => computeAdminStatistics(requests, acts), [requests, acts])

  const maxStatus = stats.byStatus[0]?.count ?? 0
  const maxAct = stats.byAct[0]?.total ?? 0
  const maxFiliere = stats.byFiliere[0]?.count ?? 0

  const exportQueue = () => {
    const csv = buildQueueCsv(requests, acts)
    downloadCsv(`file-instruction-${establishment.shortName.toLowerCase()}.csv`, csv)
    toast(`${requests.length} dossier(s) exporté(s) au format CSV.`, 'success')
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-950 via-[#10355c] to-slate-900 p-6 text-white sm:p-8">
        <div className="pointer-events-none absolute -top-16 -right-10 h-56 w-56 rounded-full bg-brand-500/15 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="brand">Statistiques</Badge>
              <span className="text-[10px] font-semibold text-slate-300">
                {establishment.shortName} · {establishment.university}
              </span>
            </div>
            <h1 className="mt-1.5 text-xl font-extrabold sm:text-2xl">
              Tableau de bord de la scolarité
            </h1>
            <p className="mt-1 text-[11px] text-slate-300">
              {admin.firstName} {admin.lastName} · {stats.total} dossier(s) suivi(s) depuis
              l’ouverture de la plateforme.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              className="bg-white/10 text-white hover:bg-white/20"
              onClick={exportQueue}
            >
              <Download className="h-3.5 w-3.5" /> Exporter la file (CSV)
            </Button>
            <Button variant="secondary" size="sm" onClick={() => navigate('/admin')}>
              <ArrowRight className="h-3.5 w-3.5" /> File d’instruction
            </Button>
          </div>
        </div>
      </section>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Dossiers traités"
          value={stats.total}
          hint="Toutes filières confondues"
          icon={<Layers className="h-4 w-4" />}
        />
        <StatCard
          label="Dossiers finalisés"
          value={`${stats.completionRate}%`}
          hint="Validés ou clôturés"
          tone="success"
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <StatCard
          label="Recettes encaissées"
          value={formatAmount(stats.revenue, establishment.currency)}
          hint={`${stats.paidFiles} dossier(s) payant(s)`}
          tone="violet"
          icon={<Wallet className="h-4 w-4" />}
        />
        <StatCard
          label="Délai moyen d’instruction"
          value={stats.averageInstructionHours === null ? '—' : `${stats.averageInstructionHours} h`}
          hint="Du dépôt à la clôture"
          tone="warning"
          icon={<Clock className="h-4 w-4" />}
        />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="flex items-center gap-2 text-sm font-extrabold text-slate-950">
            <BarChart3 className="h-4 w-4 text-brand-700" /> Répartition par statut
          </h2>
          <div className="mt-4 space-y-3">
            {stats.byStatus.length === 0 && (
              <p className="text-xs text-slate-500">Aucun dossier enregistré.</p>
            )}
            {stats.byStatus.map((slice) => (
              <Bar
                key={slice.status}
                label={slice.status}
                value={slice.count}
                max={maxStatus}
                suffix={`dossier(s) · ${slice.share}%`}
              />
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="flex items-center gap-2 text-sm font-extrabold text-slate-950">
            <TrendingUp className="h-4 w-4 text-brand-700" /> Actes les plus demandés
          </h2>
          <div className="mt-4 space-y-3">
            {stats.byAct.slice(0, 8).map((entry) => (
              <Bar
                key={entry.actId}
                label={entry.title}
                value={entry.total}
                max={maxAct}
                suffix={`dossier(s) · ${entry.delivered} validé(s)`}
              />
            ))}
            {stats.byAct.length === 0 && (
              <p className="text-xs text-slate-500">Aucune demande enregistrée.</p>
            )}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="flex items-center gap-2 text-sm font-extrabold text-slate-950">
            <FileText className="h-4 w-4 text-brand-700" /> Répartition par filière
          </h2>
          <div className="mt-4 space-y-3">
            {stats.byFiliere.map((entry) => (
              <Bar
                key={entry.filiere}
                label={entry.filiere}
                value={entry.count}
                max={maxFiliere}
                suffix="dossier(s)"
              />
            ))}
            {stats.byFiliere.length === 0 && (
              <p className="text-xs text-slate-500">Aucune filière représentée.</p>
            )}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="flex items-center gap-2 text-sm font-extrabold text-slate-950">
            <AlertTriangle className="h-4 w-4 text-amber-600" /> Points de vigilance
          </h2>
          <dl className="mt-4 space-y-3 text-xs">
            {[
              ['Dossiers en cours d’instruction', stats.inProgress, 'text-amber-700'],
              ['En attente de complément', stats.pending, 'text-violet-700'],
              ['Litiges (réclamations)', stats.claims, 'text-rose-700'],
              ['Pièces moyennes par dossier', stats.averageAttachments, 'text-slate-900'],
            ].map(([label, value, tone]) => (
              <div
                key={String(label)}
                className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2"
              >
                <dt className="text-slate-600">{label}</dt>
                <dd className={`font-mono text-sm font-extrabold ${String(tone)}`}>{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 rounded-xl bg-slate-50 p-3 text-[10px] leading-relaxed text-slate-600">
            Indicateurs calculés en temps réel sur les dossiers enregistrés sur le serveur
            (base SQLite + journal d’audit).
          </p>
        </Card>
      </div>
    </div>
  )
}

export default AdminStats
