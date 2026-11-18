import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  Info,
  MapPin,
  Settings,
  ShieldCheck,
  Users,
  Wallet,
} from 'lucide-react'
import { navigate } from '@/lib/router'
import { formatAmount } from '@/lib/utils'
import { useApp } from '@/store'
import { ActCard, ActIcon, serviceLabel } from '@/components/ActCard'
import { Badge, Button, Card, EmptyState, SectionHeading } from '@/components/ui'

export function ActDetail({ actId }: { actId: string }) {
  const { acts, establishment, role, session } = useApp()
  const act = acts.find((item) => item.id === actId)

  if (!act) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <EmptyState
          title="Cette prestation n’existe pas ou n’est plus disponible"
          description="Le catalogue a peut-être été mis à jour par la scolarité."
          action={<Button onClick={() => navigate('/catalogue')}>Retour au catalogue</Button>}
        />
      </div>
    )
  }

  const related = acts
    .filter((item) => item.category === act.category && item.id !== act.id && item.active !== false)
    .slice(0, 3)
  const workflow =
    act.workflowSteps && act.workflowSteps.length > 0
      ? act.workflowSteps
      : ['Dépôt en ligne', 'Instruction par la scolarité', 'Validation du dossier', 'Retrait de l’acte']

  const primaryAction = () => {
    navigate(`/demande/${act.id}`)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={() => navigate('/catalogue')}
        className="mb-5 inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 transition-colors hover:text-brand-800"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Retour au catalogue
      </button>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          {/* Header */}
          <Card className="p-6 sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700">
                <ActIcon type={act.iconType} className="h-6 w-6" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge tone="brand">{act.categoryLabel}</Badge>
                  <Badge tone={act.serviceType === 'procedure' ? 'warning' : 'neutral'}>
                    {serviceLabel(act)}
                  </Badge>
                  <Badge tone="neutral">
                    <Users className="h-3 w-3" /> {act.audience}
                  </Badge>
                </div>
                <h1 className="mt-2.5 text-2xl font-extrabold text-slate-950 sm:text-3xl">
                  {act.title}
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{act.shortDescription}</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 border-t border-slate-100 pt-5 sm:grid-cols-4">
              {[
                { label: 'Délai indicatif', value: act.delay, icon: Clock },
                {
                  label: 'Frais',
                  value: formatAmount(act.feeAmount, establishment.currency),
                  icon: Wallet,
                },
                {
                  label: 'Pièces',
                  value:
                    act.requiredDocuments.length === 0
                      ? 'Aucune'
                      : `${act.requiredDocuments.length} document(s)`,
                  icon: FileText,
                },
                { label: 'Retrait', value: 'Auprès de l’administration', icon: MapPin },
              ].map((item) => (
                <div key={item.label} className="rounded-xl bg-slate-50 p-3">
                  <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-wide text-slate-500 uppercase">
                    <item.icon className="h-3.5 w-3.5 text-brand-700" /> {item.label}
                  </span>
                  <p className="mt-1 text-xs font-bold text-slate-900">{item.value}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Eligibility */}
          <Card className="p-6">
            <h2 className="flex items-center gap-2 text-sm font-extrabold text-slate-950">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Conditions d’éligibilité
            </h2>
            <ul className="mt-3 space-y-2">
              {act.eligibilityConditions.map((condition) => (
                <li key={condition} className="flex items-start gap-2 text-xs leading-relaxed text-slate-600">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" />
                  {condition}
                </li>
              ))}
            </ul>
          </Card>

          {/* Required documents */}
          <Card className="p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-sm font-extrabold text-slate-950">
                <FileText className="h-4 w-4 text-brand-700" /> Pièces justificatives requises
              </h2>
              <span className="text-[10px] font-semibold text-slate-400">
                {act.requiredDocuments.length === 0
                  ? 'Aucune pièce'
                  : `${act.requiredDocuments.filter((doc) => doc.mandatory).length} obligatoire(s)`}
              </span>
            </div>
            {act.requiredDocuments.length === 0 ? (
              <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800">
                Aucune pièce n’est requise pour cette prestation.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-slate-100">
                {act.requiredDocuments.map((doc, index) => (
                  <li key={doc.name} className="flex items-start gap-3 py-2.5">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-slate-100 font-mono text-[10px] font-bold text-slate-600">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900">
                        {doc.name}{' '}
                        {doc.mandatory ? (
                          <span className="ml-1 text-[10px] font-semibold text-rose-600">obligatoire</span>
                        ) : (
                          <span className="ml-1 text-[10px] font-semibold text-slate-400">facultatif</span>
                        )}
                      </p>
                      {doc.details && <p className="mt-0.5 text-[11px] text-slate-500">{doc.details}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 flex items-start gap-2 rounded-xl bg-brand-50/70 p-3 text-[11px] leading-relaxed text-brand-900">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Formats acceptés : PDF, JPG ou PNG. Un document illisible entraîne une demande de
              complément et allonge le délai d’instruction.
            </div>
          </Card>

          {/* Delivery + workflow */}
          <Card className="p-6">
            <h2 className="flex items-center gap-2 text-sm font-extrabold text-slate-950">
              <ShieldCheck className="h-4 w-4 text-brand-700" /> Modalités et instruction
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">{act.deliveryDetails}</p>
            <ol className="mt-5 grid gap-2 sm:grid-cols-2">
              {workflow.map((step, index) => (
                <li
                  key={step}
                  className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5"
                >
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-800 font-mono text-[10px] font-bold text-white">
                    {index + 1}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-700">{step}</span>
                </li>
              ))}
            </ol>
          </Card>

          {related.length > 0 && (
            <div>
              <SectionHeading title="Prestations associées" kicker="À découvrir aussi" />
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {related.map((item) => (
                  <ActCard key={item.id} act={item} currency={establishment.currency} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sticky action panel */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-br from-brand-950 to-[#0e3560] p-5 text-white">
              <p className="text-[10px] font-extrabold tracking-wider text-brand-200 uppercase">
                Demande en ligne
              </p>
              <p className="mt-1.5 font-mono text-2xl font-extrabold">
                {formatAmount(act.feeAmount, establishment.currency)}
              </p>
              {act.feeNote && <p className="mt-0.5 text-[11px] text-brand-100/80">{act.feeNote}</p>}
            </div>
            <div className="space-y-4 p-5">
              <dl className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-slate-500">Délai</dt>
                  <dd className="text-right font-bold text-slate-900">{act.delay}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-slate-500">Retrait</dt>
                  <dd className="text-right font-bold text-slate-900">Administration</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-slate-500">Public</dt>
                  <dd className="text-right font-bold text-slate-900">{act.audience}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-slate-500">Retrait</dt>
                  <dd className="text-right font-bold text-slate-900">Administration</dd>
                </div>
              </dl>

              {session && role === 'admin' ? (
                <Button variant="dark" className="w-full" onClick={() => navigate('/admin/catalogue')}>
                  <Settings className="h-4 w-4" /> Paramétrer cette prestation
                </Button>
              ) : (
                <Button className="w-full" onClick={primaryAction}>
                  <>
                    Déposer ma demande <ArrowRight className="h-4 w-4" />
                  </>
                </Button>
              )}

              {!session && (
                <p className="text-center text-[10px] leading-relaxed text-slate-500">
                  Vous serez invité à vous connecter ou à créer un compte pour suivre votre dossier.
                </p>
              )}
            </div>
          </Card>

          <Card className="mt-3 p-4">
            <p className="flex items-center gap-1.5 text-[11px] font-extrabold text-slate-900">
              <MapPin className="h-3.5 w-3.5 text-brand-700" /> Guichet de scolarité
            </p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-slate-600">
              {establishment.address}
              <br />
              {establishment.phone}
            </p>
          </Card>
        </aside>
      </div>

    </div>
  )
}

export default ActDetail
