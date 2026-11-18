import { useRef, useState } from 'react'
import { CheckCircle2, Clock, ExternalLink, FileText, Printer, ShieldCheck } from 'lucide-react'
import { api, errorMessage, type PaymentSession } from '@/lib/api'
import { cn, formatAmount, printNode, qrMatrix } from '@/lib/utils'
import { useApp } from '@/store'
import type { Establishment, PaymentInfo, UserRequest } from '@/types'
import { InstitutionalEmblem } from '@/components/InstitutionalEmblem'
import { Button, Field, Input, Modal, Select } from '@/components/ui'

/* ───────────────────────── Éléments visuels (QR, sceau) ───────────────────── */

export function QrGlyph({
  code,
  size = 84,
  className,
  dark = '#0f172a',
}: {
  code: string
  size?: number
  className?: string
  dark?: string
}) {
  const matrix = qrMatrix(code || 'MES-ACTES')
  const cells = matrix.length
  const unit = 100 / cells
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={`QR code du dossier ${code}`}
      shapeRendering="crispEdges"
    >
      <rect width="100" height="100" fill="#ffffff" />
      {matrix.map((row, rowIndex) =>
        row.map((filled, colIndex) =>
          filled ? (
            <rect
              key={`${rowIndex}-${colIndex}`}
              x={colIndex * unit}
              y={rowIndex * unit}
              width={unit}
              height={unit}
              fill={dark}
            />
          ) : null,
        ),
      )}
    </svg>
  )
}

export function OfficialSeal({
  shortName,
  size = 92,
  className,
}: {
  shortName: string
  size?: number
  className?: string
}) {
  const label = `${shortName} · SCOLARITÉ`.toUpperCase()
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={`Sceau de la scolarité ${shortName}`}
    >
      <circle cx="60" cy="60" r="57" fill="none" stroke="#0f4fbd" strokeWidth="2.2" />
      <circle cx="60" cy="60" r="50" fill="none" stroke="#0f4fbd" strokeWidth="0.9" strokeDasharray="3 2.5" />
      <circle cx="60" cy="60" r="34" fill="none" stroke="#0f4fbd" strokeWidth="0.9" />
      <defs>
        <path id="seal-arc-receipt" d="M60,60 m-43,0 a43,43 0 1,1 86,0" fill="none" />
      </defs>
      <text fill="#0f4fbd" fontSize="8.4" fontWeight="700" letterSpacing="1.1">
        <textPath href="#seal-arc-receipt" startOffset="50%" textAnchor="middle">
          {label}
        </textPath>
      </text>
      <text
        x="60"
        y="56"
        textAnchor="middle"
        fontSize="10"
        fontWeight="800"
        fill="#0f4fbd"
        fontFamily="Plus Jakarta Sans, sans-serif"
      >
        DÉPÔT
      </text>
      <text x="60" y="69" textAnchor="middle" fontSize="8.5" fontWeight="700" letterSpacing="1.6" fill="#0f4fbd">
        ENREGISTRÉ
      </text>
      <path
        d="M60 74.5 61.6 78.4 65.8 78.7 62.6 81.3 63.6 85.4 60 83.2 56.4 85.4 57.4 81.3 54.2 78.7 58.4 78.4Z"
        fill="#0f4fbd"
      />
    </svg>
  )
}

/* ─────────────────────────── Récépissé de dépôt ──────────────────────────── */

export function ReceiptSheet({
  request,
  establishment,
  sheetRef,
}: {
  request: UserRequest
  establishment: Establishment
  sheetRef?: React.RefObject<HTMLDivElement | null>
}) {
  return (
    <div
      ref={sheetRef}
      className="guilloche doc-sheet relative w-full max-w-[720px] bg-white px-7 py-8 text-slate-900 sm:px-10"
    >
      <div className="flex items-start justify-between gap-4 border-b-2 border-slate-900 pb-4">
        <div>
          <p className="text-[9px] font-black tracking-[0.16em] text-slate-700 uppercase">
            {establishment.country}
          </p>
          <p className="mt-0.5 text-[8px] font-semibold text-slate-500">{establishment.university}</p>
          <h2 className="mt-2 max-w-[300px] text-[11px] leading-tight font-black text-brand-950 uppercase">
            {establishment.name}
          </h2>
          <p className="mt-1 text-[8px] font-bold text-slate-600">{establishment.registrarTitle}</p>
        </div>
        <InstitutionalEmblem establishment={establishment} className="doc-mark h-11 w-11" />
      </div>

      <div className="mt-5 text-center">
        <span className="inline-block rounded bg-emerald-700 px-4 py-1 text-[10px] font-black tracking-[0.14em] text-white uppercase">
          Récépissé de dépôt
        </span>
        <p className="mt-2 font-mono text-xs font-bold text-brand-950">{request.id}</p>
      </div>

      <div className="mt-4 grid gap-1.5 rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-[10px]">
        {[
          ['Demandeur', request.applicant.fullName],
          ['Matricule', request.applicant.matricule],
          ['Filière / niveau', `${request.applicant.filiere} · ${request.applicant.promotion}`],
          ['Prestation demandée', request.actTitle],
          ['Date de dépôt', request.createdAt],
          ['Retrait de l’acte', 'Auprès de l’administration de l’établissement'],
          ['Pièces jointes', `${request.attachments.length} document(s)`],
          [
            'Frais',
            request.payment
              ? `${formatAmount(request.payment.amount, establishment.currency)} — quittance ${request.payment.receiptNumber}`
              : 'À régler en ligne depuis le dossier',
          ],
        ].map(([label, value]) => (
          <div key={label} className="grid grid-cols-3 gap-2">
            <span className="text-slate-500">{label} :</span>
            <span className="col-span-2 font-bold text-slate-900">{value}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-1.5">
        <p className="text-[9px] font-bold text-slate-800 uppercase">Pièces réceptionnées</p>
        <ul className="space-y-1">
          {request.attachments.length === 0 && (
            <li className="text-[9px] text-slate-500">Aucune pièce jointe à ce dossier.</li>
          )}
          {request.attachments.map((attachment) => (
            <li key={attachment.name} className="flex items-center justify-between text-[9px]">
              <span className="flex items-center gap-1.5">
                <FileText className="h-3 w-3 text-brand-700" />
                {attachment.name}
              </span>
              <span className="font-mono text-slate-400">{attachment.size}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 rounded-lg border border-brand-200 bg-brand-50/70 p-3 text-[8.5px] leading-relaxed text-brand-900">
        <strong>Mention :</strong> le présent récépissé atteste uniquement du dépôt et de
        l’enregistrement de la demande. Il ne constitue pas l’acte administratif sollicité, qui est
        délivré par l’établissement après instruction. Conservez ce numéro de dossier pour suivre
        l’avancement depuis votre espace.
      </div>

      <div className="mt-5 flex items-end justify-between border-t border-slate-300 pt-4">
        <div className="flex items-center gap-2">
          <div className="rounded border-2 border-slate-900 bg-white p-1">
            <QrGlyph code={request.id} size={62} />
          </div>
          <div className="text-[8px]">
            <p className="font-bold">Suivi du dossier</p>
            <p className="font-mono text-slate-600">{request.id}</p>
            <p className="text-brand-800 underline">{establishment.verificationBaseUrl}</p>
          </div>
        </div>
        <div className="space-y-1 text-right">
          <p className="text-[9px] text-slate-600">Déposé le {request.createdAt}</p>
          <p className="text-[9px] font-black text-brand-950">Le service de scolarité</p>
          <OfficialSeal shortName={establishment.shortName} size={56} />
        </div>
      </div>
    </div>
  )
}

export function ReceiptModal({ request, onClose }: { request: UserRequest | null; onClose: () => void }) {
  const { establishment, toast } = useApp()
  const sheetRef = useRef<HTMLDivElement | null>(null)
  if (!request) return null

  return (
    <Modal
      open
      onClose={onClose}
      size="xl"
      title="Récépissé de dépôt"
      subtitle={`${request.id} · ${request.actTitle}`}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Fermer
          </Button>
          <Button
            size="sm"
            onClick={() => {
              const ok = printNode(sheetRef.current, `Récépissé ${request.id}`)
              if (!ok) toast('Autorisez les fenêtres pop-up pour imprimer le récépissé.', 'warning')
            }}
          >
            <Printer className="h-3.5 w-3.5" /> Imprimer / PDF
          </Button>
        </>
      }
    >
      <div className="flex justify-center bg-slate-200/70 p-3 sm:p-6">
        <ReceiptSheet request={request} establishment={establishment} sheetRef={sheetRef} />
      </div>
    </Modal>
  )
}

/* ───────────────────────────── Paiement en ligne ─────────────────────────── */

/**
 * Ouvre réellement une session de paiement auprès du prestataire configuré
 * sur le serveur (CinetPay, mock, ou « règlement à la caisse » en attendant).
 * Aucune donnée bancaire n'est saisie ici : la saisie se fait sur la page du
 * prestataire.
 */
export function PaymentModal({
  request,
  onClose,
  onSuccess,
}: {
  request: UserRequest
  onClose: () => void
  onSuccess?: (payment: PaymentInfo) => void
}) {
  const { toast, establishment, acts } = useApp()
  const [session, setSession] = useState<PaymentSession | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [method, setMethod] = useState<'mobile_money' | 'card'>('mobile_money')
  const [operator, setOperator] = useState<'MTN' | 'MOOV'>('MTN')
  const [phone, setPhone] = useState(request.applicant.telephone ?? '')

  const act = acts.find((item) => item.id === request.actId)
  const amount = session?.amount ?? act?.feeAmount ?? 0
  const currency = session?.currency ?? establishment.currency

  /**
   * Ouvre une session de règlement. Une seule tentative à la fois : chaque
   * ouverture déclenche une vraie demande auprès de l'opérateur.
   */
  const open = async () => {
    if (busy) return
    if (method === 'mobile_money' && phone.trim().length < 6) {
      setError('Le numéro de téléphone est requis pour régler par Mobile Money.')
      return
    }
    setError(null)
    setSession(null)
    setBusy(true)
    try {
      const payload = await api.createPaymentSession(request.id, {
        method,
        ...(method === 'mobile_money' ? { operator, phone: phone.trim() } : {}),
      })
      setSession(payload.session)
      if (payload.request.payment && onSuccess) onSuccess(payload.request.payment)
    } catch (err) {
      setError(errorMessage(err, 'La session de paiement n’a pas pu être ouverte.'))
    } finally {
      setBusy(false)
    }
  }

  /** Recontrôle le statut auprès du prestataire avant de valider le règlement. */
  const confirm = async () => {
    if (confirming || !session) return
    setError(null)
    setConfirming(true)
    try {
      const updated = await api.confirmPayment(request.id, session.providerRef)
      setSession({ ...session, status: 'confirmed' })
      if (updated.payment) onSuccess?.(updated.payment)
      toast('Règlement confirmé. La quittance est jointe au dossier.', 'success')
    } catch (err) {
      setError(
        errorMessage(err, 'Le règlement n’est pas encore confirmé, réessayez dans un instant.'),
      )
    } finally {
      setConfirming(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="md"
      title="Paiement des frais"
      subtitle={`${request.id} · ${request.actTitle}`}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Fermer
          </Button>
          {!session ? (
            <Button size="sm" onClick={() => void open()} disabled={busy}>
              {busy ? (
                <Clock className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ShieldCheck className="h-3.5 w-3.5" />
              )}
              {busy ? 'Ouverture…' : `Payer ${formatAmount(amount, currency)}`}
            </Button>
          ) : session.status === 'confirmed' ? null : (
            <>
              {session.checkoutUrl ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    window.open(session.checkoutUrl ?? '', '_blank', 'noopener')
                    toast('Page de paiement ouverte. Revenez ici après le règlement.', 'info')
                  }}
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Ouvrir la page de paiement
                </Button>
              ) : null}
              <Button size="sm" onClick={() => void confirm()} disabled={confirming}>
                {confirming ? (
                  <Clock className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
                {confirming ? 'Vérification…' : 'J’ai terminé le paiement'}
              </Button>
            </>
          )}
        </>
      }
    >
      <div className="space-y-4 p-5 sm:p-6">
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3.5">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase">Montant à régler</p>
            <p className="font-mono text-xl font-black text-brand-950">
              {formatAmount(amount, currency)}
            </p>
          </div>
          <ShieldCheck className="h-8 w-8 text-emerald-600" />
        </div>

        {busy && <p className="text-sm text-slate-600">Ouverture de la session de paiement…</p>}

        {error && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-3.5 text-xs leading-relaxed text-amber-900">
            {error}
          </div>
        )}

        {!session && !busy && (
          <div className="space-y-3">
            <Field label="Moyen de paiement" htmlFor="pay-method">
              <Select
                id="pay-method"
                value={method}
                onChange={(event) => setMethod(event.target.value as 'mobile_money' | 'card')}
              >
                <option value="mobile_money">Mobile Money (MTN ou Moov)</option>
                <option value="card">Carte bancaire</option>
              </Select>
            </Field>
            {method === 'mobile_money' && (
              <>
                <Field label="Opérateur" htmlFor="pay-operator">
                  <Select
                    id="pay-operator"
                    value={operator}
                    onChange={(event) => setOperator(event.target.value as 'MTN' | 'MOOV')}
                  >
                    <option value="MTN">MTN MoMo</option>
                    <option value="MOOV">Moov Money</option>
                  </Select>
                </Field>
                <Field label="Numéro à débiter" required htmlFor="pay-phone">
                  <Input
                    id="pay-phone"
                    inputMode="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="229 01 66 00 00 00"
                  />
                </Field>
              </>
            )}
          </div>
        )}

        {session && (
          <div className="space-y-3">
            {session.checkoutUrl ? (
              <p className="text-xs leading-relaxed text-slate-600">
                Ouvrez la page sécurisée du prestataire pour régler, puis revenez ici : le statut est
                recontrôlé auprès de l’opérateur avant la confirmation.
              </p>
            ) : null}

            {session.instructions ? (
              <div className="rounded-lg border border-brand-200 bg-brand-50/60 p-3.5 text-xs leading-relaxed text-brand-900">
                {session.instructions}
              </div>
            ) : null}

            {session.status === 'confirmed' ? (
              <div
                className={cn(
                  'rounded-lg border border-emerald-300 bg-emerald-50 p-3.5 text-xs font-bold text-emerald-800',
                )}
              >
                Règlement confirmé. La quittance est jointe au dossier ; il reste à instruire.
              </div>
            ) : (
              <p className="text-[11px] leading-relaxed text-slate-500">
                {session.checkoutUrl
                  ? 'Après le règlement, cliquez sur « J’ai terminé le paiement ».'
                  : 'Validez la demande sur votre téléphone, puis cliquez sur « J’ai terminé le paiement ».'}
              </p>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}
