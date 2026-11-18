import { useState } from 'react'
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock,
  FileText,
  PenTool,
  Send,
  ShieldCheck,
  X,
} from 'lucide-react'
import { useApp } from '@/store'
import { formatAmount } from '@/lib/utils'
import { Badge, Button, Modal, StatusBadge } from '@/components/ui'
import type { UserRequest } from '@/types'

export function AdminDossierModal({
  request,
  onClose,
  onViewDocument,
}: {
  request: UserRequest
  onClose: () => void
  onViewDocument: (request: UserRequest) => void
}) {
  const {
    admin,
    establishment,
    requests,
    verifyAttachment,
    requestComplement,
    approve,
    decideReclamation,
    toast,
  } = useApp()
  const [panel, setPanel] = useState<'none' | 'complement' | 'validate' | 'commission'>('none')
  const [reason, setReason] = useState(
    'Merci de fournir une copie plus lisible de votre pièce justificative.',
  )
  const [decision, setDecision] = useState<'rectifiee' | 'maintenue' | 'reprise_autorisee'>('rectifiee')
  const [finalNote, setFinalNote] = useState(
    String(request.reclamationDetails?.noteEsperee ?? 14.5),
  )
  const [motif, setMotif] = useState(
    'Après récolement de la copie d’examen, omission matérielle confirmée. Note rectifiée et homologuée par la commission.',
  )
  const [processing, setProcessing] = useState(false)

  // Keep the freshest version of the dossier while the modal stays open.
  const current = requests.find((item) => item.id === request.id) ?? request
  const details = current.reclamationDetails
  const isClaim = Boolean(details)
  const verifiedCount = current.attachments.filter((attachment) => attachment.verified).length

  return (
    <Modal
      open
      onClose={onClose}
      size="xl"
      headerTone="dark"
      title={
        <span className="flex flex-wrap items-center gap-2">
          <span className="rounded border border-brand-700/60 bg-brand-900/60 px-2 py-0.5 font-mono text-[10px] text-brand-200">
            {current.id}
          </span>
          Instruction du dossier
        </span>
      }
      subtitle={`${current.actTitle} · déposé le ${current.createdAt}`}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Fermer
          </Button>
          {current.status === 'Validé' ? (
            <Button size="sm" onClick={() => onViewDocument(current)}>
              <FileText className="h-3.5 w-3.5" /> Voir le récépissé
            </Button>
          ) : (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPanel(panel === 'complement' ? 'none' : 'complement')}
              >
                <AlertTriangle className="h-3.5 w-3.5" /> Demander un complément
              </Button>
              <Button size="sm" onClick={() => setPanel(panel === 'validate' ? 'none' : 'validate')}>
                <ShieldCheck className="h-3.5 w-3.5" /> Valider le dossier
              </Button>
            </>
          )}
        </>
      }
    >
      <div className="space-y-5 p-5 sm:p-6">
        {/* Status */}
        <div className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5 sm:flex-row sm:items-center">
          <div>
            <p className="text-[10px] font-bold tracking-wide text-slate-500 uppercase">État du dossier</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <StatusBadge status={current.status} />
              <span className="text-[10px] text-slate-500">
                {verifiedCount}/{current.attachments.length} pièces vérifiées
              </span>
            </div>
          </div>
          <div className="text-right text-[10px] text-slate-500">
            <p>Agent instructeur</p>
            <p className="font-bold text-slate-900">
              {admin.firstName} {admin.lastName}
            </p>
          </div>
        </div>

        {/* Applicant */}
        <div className="grid gap-2 rounded-xl border border-slate-200 p-3.5 text-[11px] sm:grid-cols-3">
          {[
            ['Étudiant', current.applicant.fullName],
            ['Matricule', current.applicant.matricule],
            ['Filière', current.applicant.filiere],
            ['Promotion', current.applicant.promotion],
            ['E-mail', current.applicant.email],
            ['Téléphone', current.applicant.telephone],
            ['Mode', current.applicant.deliveryMethod === 'online' ? 'Numérique' : 'Retrait physique'],
            ['Motif', current.applicant.purpose],
            [
              'Frais',
              current.payment
                ? `${formatAmount(current.payment.amount, establishment.currency)} (${current.payment.receiptNumber})`
                : 'Aucun',
            ],
          ].map(([label, value]) => (
            <div key={label}>
              <p className="text-[10px] text-slate-500">{label}</p>
              <p className="font-semibold break-words text-slate-900">{value}</p>
            </div>
          ))}
        </div>

        {/* Immutable reclamation briefing */}
        {isClaim && details && (
          <div className="rounded-xl border border-amber-300 bg-amber-50/70 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xs font-extrabold tracking-wide text-amber-950 uppercase">
                Commission pédagogique
              </h3>
              {details.commissionDecision ? (
                <Badge tone="success">Décision prononcée</Badge>
              ) : (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setPanel(panel === 'commission' ? 'none' : 'commission')}
                >
                  <PenTool className="h-3.5 w-3.5" /> Prononcer la délibération
                </Button>
              )}
            </div>
            <dl className="mt-2.5 grid gap-2 text-[11px] sm:grid-cols-4">
              {[
                ['Matière', details.matiere],
                ['UE', details.codeUE ?? '—'],
                [
                  'Note affichée',
                  details.noteInitiale !== undefined
                    ? `${details.noteInitiale.toFixed(2)}/20`
                    : '—',
                ],
                [
                  'Note espérée',
                  details.noteEsperee ? `${details.noteEsperee.toFixed(2)}/20` : '—',
                ],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-amber-200 bg-white p-2">
                  <dt className="text-[9px] text-amber-700 uppercase">{label}</dt>
                  <dd className="mt-0.5 font-bold text-slate-900">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-2 rounded-lg bg-white p-2.5 text-[11px] leading-relaxed text-slate-700 italic">
              « {details.argumentaire} »
            </p>

            {details.commissionDecision && (
              <div className="mt-2 rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-[11px] text-emerald-950">
                <p className="font-bold">
                  {details.commissionDecision.decision === 'rectifiee'
                    ? `Note rectifiée à ${details.commissionDecision.noteFinale?.toFixed(2)}/20`
                    : 'Note initiale maintenue'}{' '}
                  · {details.commissionDecision.pvReference}
                </p>
                <p className="mt-0.5 text-emerald-800">{details.commissionDecision.motif}</p>
              </div>
            )}

            {panel === 'commission' && !details.commissionDecision && (
              <div className="mt-3 space-y-2.5 rounded-lg border border-amber-300 bg-white p-3">
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="text-[10px] font-bold text-slate-700">
                    Sens de la décision
                    <select
                      value={decision}
                      onChange={(event) => setDecision(event.target.value as typeof decision)}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-[11px] font-semibold"
                    >
                      <option value="rectifiee">Favorable — note rectifiée</option>
                      <option value="maintenue">Défavorable — note maintenue</option>
                      <option value="reprise_autorisee">Session de reprise autorisée</option>
                    </select>
                  </label>
                  {decision === 'rectifiee' && (
                    <label className="text-[10px] font-bold text-slate-700">
                      Nouvelle note (/20)
                      <input
                        type="number"
                        min="0"
                        max="20"
                        step="0.25"
                        value={finalNote}
                        onChange={(event) => setFinalNote(event.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 font-mono text-[11px] font-bold"
                      />
                    </label>
                  )}
                </div>
                <label className="block text-[10px] font-bold text-slate-700">
                  Motif de la commission
                  <textarea
                    rows={2}
                    value={motif}
                    onChange={(event) => setMotif(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-[11px]"
                  />
                </label>
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    variant="success"
                    onClick={() => {
                      decideReclamation(
                        current.id,
                        decision,
                        Number.parseFloat(finalNote) || 14.5,
                        motif,
                        `${admin.firstName} ${admin.lastName}`,
                      )
                      toast('Délibération enregistrée et notifiée à l’étudiant.', 'success')
                      onClose()
                    }}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Homologuer la décision
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Attachments */}
        <div>
          <h3 className="text-xs font-extrabold tracking-wide text-slate-500 uppercase">
            Contrôle des pièces ({current.attachments.length})
          </h3>
          <div className="mt-2 space-y-2">
            {current.attachments.length === 0 && (
              <p className="rounded-lg bg-slate-50 p-3 text-[11px] text-slate-500">
                Aucune pièce jointe à ce dossier.
              </p>
            )}
            {current.attachments.map((attachment) => (
              <div
                key={attachment.name}
                className={`flex items-center justify-between gap-3 rounded-xl border p-3 ${
                  attachment.verified
                    ? 'border-emerald-200 bg-emerald-50/50'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-brand-700">
                    <FileText className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-bold text-slate-900">{attachment.name}</p>
                    <p className="text-[10px] text-slate-500">
                      {attachment.size} · {attachment.uploadedAt}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {attachment.documentName && (
                    <span className="hidden text-[9px] text-slate-400 sm:inline">
                      {attachment.documentName}
                    </span>
                  )}
                  <Button
                    size="sm"
                    variant={attachment.verified ? 'success' : 'secondary'}
                    onClick={() => verifyAttachment(current.id, attachment.name)}
                  >
                    <Check className="h-3 w-3 stroke-3" />
                    {attachment.verified ? 'Conforme' : 'Valider'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Views / history */}
        <div>
          <h3 className="text-xs font-extrabold tracking-wide text-slate-500 uppercase">
            Historique du dossier
          </h3>
          <ol className="mt-2 space-y-2">
            {current.timeline.map((event, index) => (
              <li key={`${event.title}-${index}`} className="flex items-start gap-2 text-[11px]">
                <span
                  className={`mt-1 grid h-4 w-4 shrink-0 place-items-center rounded-full ${
                    event.completed ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {event.completed ? <Check className="h-2.5 w-2.5 stroke-3" /> : <Clock className="h-2.5 w-2.5" />}
                </span>
                <span>
                  <span className="font-bold text-slate-900">{event.title}</span>
                  <span className="ml-1.5 text-[10px] text-slate-400">{event.date}</span>
                  <span className="mt-0.5 block text-slate-600">{event.description}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>

        {/* Complement panel */}
        {panel === 'complement' && (
          <div className="animate-fade-in rounded-xl border border-amber-300 bg-amber-50 p-4">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-xs font-extrabold text-amber-950">
                <AlertTriangle className="h-4 w-4" /> Demande de complément
              </p>
              <button
                type="button"
                onClick={() => setPanel('none')}
                className="text-amber-700 hover:text-amber-950"
                aria-label="Fermer le panneau"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1 text-[10px] text-amber-800">
              Le motif est notifié à l’étudiant et le dossier passe « En attente de complément ».
            </p>
            <textarea
              rows={3}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="mt-2 w-full rounded-lg border border-amber-300 bg-white p-2.5 text-[11px] text-slate-800"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {[
                'Pièce d’identité illisible ou expirée. Merci de fournir un scan net.',
                'Quitus de scolarité manquant pour l’année en cours.',
                'Photo d’identité non conforme (fond blanc requis).',
              ].map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => setReason(sample)}
                  className="rounded-full border border-amber-300 bg-white px-2 py-1 text-[9px] font-semibold text-amber-900"
                >
                  {sample.slice(0, 28)}…
                </button>
              ))}
            </div>
            <div className="mt-3 flex justify-end">
              <Button
                size="sm"
                disabled={processing || !reason.trim()}
                onClick={() => {
                  setProcessing(true)
                  window.setTimeout(() => {
                    requestComplement(current.id, reason.trim())
                    setProcessing(false)
                    toast('Complément demandé et étudiant notifié.', 'info')
                    onClose()
                  }, 500)
                }}
              >
                <Send className="h-3.5 w-3.5" /> Notifier & mettre en attente
              </Button>
            </div>
          </div>
        )}

        {/* Validation panel */}
        {panel === 'validate' && (
          <div className="animate-fade-in rounded-xl border border-brand-300 bg-brand-50 p-4">
            <p className="flex items-center gap-1.5 text-xs font-extrabold text-brand-950">
              <ShieldCheck className="h-4 w-4" /> Validation du dossier
            </p>
            <p className="mt-1 text-[10px] leading-relaxed text-brand-800">
              L’instruction est terminée : le dossier passe au statut « Validé ». L’étudiant est
              notifié et retire l’acte auprès de l’administration.
            </p>
            <div className="mt-2.5 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white p-2.5 text-[10px]">
                <span className="text-slate-600">
                  Agent : <strong>{admin.firstName} {admin.lastName}</strong>
                </span>
                <Badge tone="brand">
                  <ShieldCheck className="h-3 w-3" /> Scolarité
                </Badge>
              </div>
              <div className="flex justify-end">
                <Button
                  size="sm"
                  disabled={processing}
                  onClick={() => {
                    setProcessing(true)
                    window.setTimeout(() => {
                      void approve(current.id)
                      setProcessing(false)
                      onClose()
                    }, 600)
                  }}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> Confirmer la validation
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
