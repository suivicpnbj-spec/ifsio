import { useState } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  FileCheck,
  FileText,
  FileWarning,
  MessageSquare,
  Receipt,
  Send,
  ShieldCheck,
  Upload,
  User,
} from 'lucide-react'
import { navigate } from '@/lib/router'
import { api } from '@/lib/api'
import { errorMessage } from '@/lib/api'
import { formatAmount } from '@/lib/utils'
import { useApp } from '@/store'
import { ActIcon } from '@/components/ActCard'
import { ReceiptModal } from '@/components/Receipt'
import { PaymentModal } from '@/components/Receipt'
import { OfficialDocumentModal } from '@/components/OfficialDocumentSheet'
import { Badge, Button, Card, EmptyState, StatusBadge } from '@/components/ui'

function attachmentSize(size: number): string {
  return size >= 1024 * 1024
    ? `${(size / (1024 * 1024)).toFixed(1).replace('.', ',')} Mo`
    : `${Math.max(1, Math.round(size / 1024))} Ko`
}

export function Dossier({ requestId }: { requestId: string }) {
  const {
    requests,
    acts,
    role,
    session,
    establishment,
    addMessage,
    addSupplement,
    toast,
  } = useApp()
  const [message, setMessage] = useState('')
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [documentOpen, setDocumentOpen] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)

  const request = requests.find((item) => item.id === requestId)

  if (!request) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <EmptyState
          icon={<FileWarning className="h-8 w-8" />}
          title="Dossier introuvable"
          description="Ce dossier n’existe pas ou a été supprimé du registre."
          action={<Button onClick={() => navigate('/dossiers')}>Retour à mes dossiers</Button>}
        />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <EmptyState
          title="Connexion requise"
          description="Connectez-vous pour consulter ce dossier."
          action={<Button onClick={() => navigate('/connexion')}>Se connecter</Button>}
        />
      </div>
    )
  }

  const act = acts.find((item) => item.id === request.actId)
  const isAdmin = role === 'admin'
  const needsComplement = request.status === 'En attente de complément'
  const isDelivered = request.status === 'Validé'
  const details = request.reclamationDetails
  const decision = details?.commissionDecision
  const author = `${request.applicant.firstName} ${request.applicant.lastName}`

  const sendMessage = () => {
    if (!message.trim()) return
    addMessage(request.id, {
      role: 'student',
      author,
      text: message.trim(),
    })
    setMessage('')
    toast('Message envoyé à la scolarité.', 'success')
  }

  const uploadComplement = async (file: File) => {
    setUploadOpen(false)
    try {
      await addSupplement(request.id, file, 'Complément demandé')
      toast('Complément transmis. Le dossier repasse en traitement.', 'success')
    } catch {
      // Le store affiche déjà l’erreur.
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={() => navigate(isAdmin ? '/admin' : '/dossiers')}
        className="mb-5 inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-brand-800"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {isAdmin ? 'Retour à la file d’instruction' : 'Retour à mes dossiers'}
      </button>

      {isAdmin && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[11px] font-semibold text-amber-900">
          <ShieldCheck className="h-4 w-4" /> Vue administration — les actions d’instruction se font
          depuis la file de traitement.
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="ml-auto font-bold underline"
          >
            Ouvrir la file
          </button>
        </div>
      )}

      {/* Header */}
      <Card className="p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
          <div className="flex items-start gap-3.5">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700">
              {act ? <ActIcon type={act.iconType} className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-slate-900 px-2 py-0.5 font-mono text-[10px] font-bold text-white">
                  {request.id}
                </span>
                <StatusBadge status={request.status} />
                {request.payment && (
                  <Badge tone="success">
                    <Check className="h-3 w-3" /> Payé
                  </Badge>
                )}
              </div>
              <h1 className="mt-1.5 text-xl font-extrabold text-slate-950 sm:text-2xl">
                {request.actTitle}
              </h1>
              <p className="mt-1 text-[11px] text-slate-500">
                Déposé le {request.createdAt} · dernière mise à jour {request.lastUpdated} ·{' '}
                {request.attachments.length} pièce(s)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => setReceiptOpen(true)}>
              <Receipt className="h-3.5 w-3.5" /> Récépissé
            </Button>
            <Button size="sm" onClick={() => setDocumentOpen(true)} className="bg-[#0e3150] hover:bg-[#15466e] text-white">
              <FileCheck className="h-3.5 w-3.5 text-[#e5c477]" /> Voir l’Acte Certifié
            </Button>
            {isDelivered ? (
              <Badge tone="success" className="px-3 py-2">
                <CheckCircle2 className="h-3 w-3" /> Acte à retirer à l’administration
              </Badge>
            ) : (
              <Badge tone="neutral" className="px-3 py-2">
                <Clock className="h-3 w-3" /> En cours d’instruction
              </Badge>
            )}
          </div>
        </div>

        {needsComplement && (
          <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3.5">
            <p className="flex items-center gap-1.5 text-xs font-bold text-amber-950">
              <AlertCircle className="h-4 w-4" /> Une pièce complémentaire est requise
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-amber-800">
              {request.adminNote ??
                'La scolarité a demandé un complément. Consultez les messages ci-dessous.'}
            </p>
            {!isAdmin && (
              <Button size="sm" className="mt-2.5" onClick={() => setUploadOpen(true)}>
                <Upload className="h-3.5 w-3.5" /> Téléverser le complément
              </Button>
            )}
          </div>
        )}
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {/* Timeline */}
          <Card className="p-5">
            <h2 className="text-sm font-extrabold text-slate-950">Suivi du dossier</h2>
            <ol className="mt-4 space-y-4">
              {request.timeline.map((event, index) => (
                <li key={`${event.title}-${index}`} className="relative flex gap-3 pb-1">
                  {index < request.timeline.length - 1 && (
                    <span className="absolute top-7 left-[11px] h-full w-px bg-slate-200" />
                  )}
                  <span
                    className={`relative z-10 grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 ${
                      event.completed
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : event.current
                          ? 'border-brand-600 bg-white text-brand-700'
                          : 'border-slate-200 bg-white text-slate-300'
                    }`}
                  >
                    {event.completed ? (
                      <Check className="h-3 w-3 stroke-3" />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-xs font-bold text-slate-900">{event.title}</p>
                      <span className="text-[10px] font-medium text-slate-400">{event.date}</span>
                    </div>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-slate-600">
                      {event.description}
                    </p>
                    {event.author && (
                      <p className="mt-0.5 text-[10px] text-slate-400">Par {event.author}</p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </Card>

          {/* Applicant */}
          <Card className="p-5">
            <h2 className="text-sm font-extrabold text-slate-950">Informations du dossier</h2>
            <dl className="mt-3 grid gap-x-4 gap-y-2.5 text-[11px] sm:grid-cols-2">
              {[
                ['Demandeur', request.applicant.fullName],
                ['Matricule', request.applicant.matricule],
                ['Filière', request.applicant.filiere],
                ['Promotion', request.applicant.promotion],
                ['E-mail', request.applicant.email],
                ['Téléphone', request.applicant.telephone],
                [
                  'Retrait',
                  'Auprès de l’administration de l’établissement',
                ],
                ['Motif', request.applicant.purpose],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-slate-50 px-2.5 py-2">
                  <dt className="text-[10px] font-semibold tracking-wide text-slate-500 uppercase">
                    {label}
                  </dt>
                  <dd className="mt-0.5 font-semibold break-words text-slate-900">{value}</dd>
                </div>
              ))}
            </dl>

            {request.applicant.specificResponses &&
              Object.keys(request.applicant.specificResponses).length > 0 && (
                <div className="mt-3 rounded-xl border border-brand-200 bg-brand-50/50 p-3">
                  <p className="text-[10px] font-bold tracking-wide text-brand-900 uppercase">
                    Précisions de la demande
                  </p>
                  <dl className="mt-2 space-y-1.5">
                    {Object.entries(request.applicant.specificResponses).map(([key, value]) => {
                      const field = act?.specificFields?.find((item) => item.id === key)
                      return (
                        <div key={key} className="flex flex-wrap justify-between gap-2 text-[11px]">
                          <dt className="text-slate-500">{field?.label ?? key}</dt>
                          <dd className="max-w-[62%] text-right font-semibold text-slate-800">
                            {value}
                          </dd>
                        </div>
                      )
                    })}
                  </dl>
                </div>
              )}
          </Card>

          {/* Attachments */}
          <Card className="p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-extrabold text-slate-950">Pièces justificatives</h2>
              <span className="text-[10px] text-slate-400">{request.attachments.length} fichier(s)</span>
            </div>
            <ul className="mt-3 divide-y divide-slate-100">
              {request.attachments.length === 0 && (
                <li className="py-2 text-[11px] text-slate-500">Aucune pièce jointe.</li>
              )}
              {request.attachments.map((attachment) => (
                <li key={attachment.name} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-brand-700">
                      <FileText className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[11px] font-bold text-slate-900">
                        {attachment.name}
                      </span>
                      <span className="block text-[10px] text-slate-500">
                        {attachment.size} · {attachment.uploadedAt}
                      </span>
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    {attachment.verified ? (
                      <Badge tone="success">
                        <Check className="h-3 w-3" /> Vérifiée
                      </Badge>
                    ) : (
                      <Badge tone="neutral">En attente</Badge>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (!attachment.id) {
                          toast('Cette pièce n’est pas encore enregistrée sur le serveur.', 'warning')
                          return
                        }
                        api
                          .downloadAttachment(request.id, attachment.id, attachment.name)
                          .catch((error) =>
                            toast(errorMessage(error, 'Le téléchargement a échoué.'), 'error'),
                          )
                      }}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-800"
                      aria-label={`Télécharger ${attachment.name}`}
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                  </span>
                </li>
              ))}
            </ul>

            {request.payment && (
              <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-[11px]">
                <p className="flex items-center gap-1.5 font-bold text-emerald-900">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Quittance {request.payment.receiptNumber}
                </p>
                <p className="mt-0.5 text-emerald-800">
                  {formatAmount(request.payment.amount, establishment.currency)} ·{' '}
                  {request.payment.method} · {request.payment.date}
                </p>
              </div>
            )}

            {!request.payment && act && act.feeAmount > 0 && !isAdmin && (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-[11px]">
                <p className="flex items-center gap-1.5 font-bold text-amber-950">
                  <CreditCard className="h-3.5 w-3.5" /> Frais :{' '}
                  {formatAmount(act.feeAmount, establishment.currency)}
                </p>
                <p className="mt-1 leading-relaxed text-amber-800">
                  Réglez en ligne, sans vous déplacer : la quittance vient se joindre au dossier
                  automatiquement.
                </p>
                <Button size="sm" className="mt-2" onClick={() => setPaymentOpen(true)}>
                  <CreditCard className="h-3.5 w-3.5" /> Payer en ligne
                </Button>
              </div>
            )}
          </Card>

          {/* Reclamation */}
          {details && (
            <Card className="border-amber-200 bg-amber-50/40 p-5">
              <h2 className="text-sm font-extrabold text-amber-950">Réclamation & délibération</h2>
              <dl className="mt-3 grid gap-2 text-[11px] sm:grid-cols-2">
                {[
                  ['Matière', details.matiere],
                  ['UE', details.codeUE ?? '—'],
                  ['Semestre', details.semestre ?? '—'],
                  ['Session', details.session],
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
                  <div key={label} className="rounded-lg border border-amber-200 bg-white px-2.5 py-2">
                    <dt className="text-[10px] font-semibold text-amber-700 uppercase">{label}</dt>
                    <dd className="mt-0.5 font-bold text-slate-900">{value}</dd>
                  </div>
                ))}
              </dl>
              {details.argumentaire && (
                <p className="mt-3 rounded-lg border border-amber-200 bg-white p-3 text-[11px] leading-relaxed text-slate-700 italic">
                  « {details.argumentaire} »
                </p>
              )}
              {decision ? (
                <div className="mt-3 rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-[11px] text-emerald-950">
                  <p className="flex flex-wrap items-center justify-between gap-2 font-bold">
                    <span>
                      {decision.decision === 'rectifiee'
                        ? 'Recours favorable — note rectifiée'
                        : decision.decision === 'reprise_autorisee'
                          ? 'Reprise autorisée'
                          : 'Note initiale maintenue'}
                    </span>
                    <span className="font-mono text-[10px]">{decision.pvReference}</span>
                  </p>
                  {decision.noteFinale !== undefined && (
                    <p className="mt-1 font-bold">
                      Note finale : {decision.noteFinale.toFixed(2)}/20
                    </p>
                  )}
                  <p className="mt-1 text-emerald-900/90">{decision.motif}</p>
                  <p className="mt-1 text-[10px] text-emerald-800/70">
                    Rapporteur : {decision.rapporteur} · {decision.date}
                  </p>
                </div>
              ) : (
                <p className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-amber-800">
                  <Clock className="h-3.5 w-3.5" /> En attente de délibération de la commission
                  pédagogique.
                </p>
              )}
            </Card>
          )}
        </div>

        {/* Messages */}
        <Card className="flex h-fit flex-col p-0">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <h2 className="flex items-center gap-1.5 text-sm font-extrabold text-slate-950">
              <MessageSquare className="h-4 w-4 text-brand-700" /> Messages
            </h2>
            <span className="text-[10px] text-slate-400">{request.messages.length}</span>
          </div>

          <div className="max-h-[420px] space-y-3 overflow-y-auto p-4">
            {request.messages.length === 0 && (
              <p className="rounded-xl bg-slate-50 p-3 text-[11px] text-slate-500">
                Aucun message. Posez votre question à la scolarité ci-dessous.
              </p>
            )}
            {request.messages.map((item) => {
              const mine = item.role === 'student'
              return (
                <div key={item.id} className={mine ? 'flex justify-end' : 'flex justify-start'}>
                  <div
                    className={`max-w-[85%] rounded-xl px-3 py-2 text-[11px] leading-relaxed ${
                      mine
                        ? 'rounded-br-sm bg-brand-800 text-white'
                        : 'rounded-bl-sm border border-slate-200 bg-slate-50 text-slate-800'
                    }`}
                  >
                    <p className={`text-[9px] font-bold ${mine ? 'text-brand-200' : 'text-slate-500'}`}>
                      {item.author}
                    </p>
                    <p className="mt-0.5">{item.text}</p>
                    {item.attachmentName && (
                      <p
                        className={`mt-1 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] ${
                          mine ? 'bg-white/15' : 'bg-white'
                        }`}
                      >
                        <FileText className="h-2.5 w-2.5" /> {item.attachmentName}
                      </p>
                    )}
                    <p className={`mt-1 text-[9px] ${mine ? 'text-brand-200/80' : 'text-slate-400'}`}>
                      {item.at}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="border-t border-slate-200 p-3">
            {isAdmin ? (
              <p className="rounded-lg bg-amber-50 p-2.5 text-[10px] text-amber-800">
                Répondez depuis la fiche d’instruction pour engager une action officielle.
              </p>
            ) : (
              <div className="flex items-end gap-2">
                <label htmlFor="dossier-message" className="sr-only">
                  Votre message
                </label>
                <textarea
                  id="dossier-message"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault()
                      sendMessage()
                    }
                  }}
                  rows={2}
                  placeholder="Écrire à la scolarité…"
                  className="min-h-[42px] w-full resize-none rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none"
                />
                <Button size="sm" onClick={sendMessage} disabled={!message.trim()} aria-label="Envoyer">
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>

      {receiptOpen && <ReceiptModal request={request} onClose={() => setReceiptOpen(false)} />}
      {documentOpen && <OfficialDocumentModal request={request} onClose={() => setDocumentOpen(false)} />}

      {paymentOpen && (
        <PaymentModal
          request={request}
          onClose={() => setPaymentOpen(false)}
          onSuccess={() => {
            setPaymentOpen(false)
          }}
        />
      )}

      {uploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="animate-fade-up w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <p className="text-sm font-extrabold text-slate-950">Transmettre une pièce complémentaire</p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
              Formats PDF, JPG ou PNG. La pièce sera horodatée et ajoutée au dossier.
            </p>
            <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-5 text-center hover:border-brand-400 hover:bg-brand-50/40">
              <Upload className="h-6 w-6 text-slate-400" />
              <span className="mt-2 text-xs font-bold text-slate-800">Sélectionner un fichier</span>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) uploadComplement(file)
                }}
              />
            </label>
            <div className="mt-2.5 flex gap-2">
              <Button variant="secondary" size="sm" className="flex-1" onClick={() => setUploadOpen(false)}>
                Annuler
              </Button>
            </div>
          </div>
        </div>
      )}

      <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[10px] text-slate-400">
        <User className="h-3 w-3" /> Dossier traité par le service de scolarité de{' '}
        {establishment.shortName}.
      </p>
    </div>
  )
}

export default Dossier
