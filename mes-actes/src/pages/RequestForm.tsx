import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  Info,
  Lock,
  ShieldCheck,
  Trash2,
  Upload,
} from 'lucide-react'
import { navigate } from '@/lib/router'
import { formatAmount, formatDate, makeDossierId } from '@/lib/utils'
import { api, errorMessage, type PaymentSession } from '@/lib/api'
import { useApp } from '@/store'
import { ReceiptModal } from '@/components/Receipt'
import { OfficialDocumentModal } from '@/components/OfficialDocumentSheet'
import { ActIcon } from '@/components/ActCard'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Modal,
  Progress,
  Select,
  Textarea,
} from '@/components/ui'
import type { Attachment, UserRequest } from '@/types'

const PURPOSES = [
  'Démarche administrative officielle',
  'Dossier de candidature de stage',
  'Renouvellement de bourse ou allocation',
  'Dossier consulaire ou visa d’études',
  'Couverture sociale / mutuelle santé',
  'Autre motif légitime',
]

const STEPS = [
  { number: 1, label: 'Informations' },
  { number: 2, label: 'Pièces jointes' },
  { number: 3, label: 'Vérification' },
  { number: 4, label: 'Paiement' },
  { number: 5, label: 'Confirmation' },
]

/** Étapes communes à toutes les démarches (numérotées de 1 à 3). */
const BASE_STEPS = STEPS.slice(0, 3)

function fileSizeLabel(size: number): string {
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1).replace('.', ',')} Mo`
  return `${Math.max(1, Math.round(size / 1024))} Ko`
}

export function RequestForm({ actId }: { actId: string }) {
  const {
    acts,
    student,
    establishment,
    submitRequest,
    reloadRequest,
    toast,
    session,
    role,
  } = useApp()
  const act = acts.find((item) => item.id === actId)

  const [step, setStep] = useState(1)
  const [firstName, setFirstName] = useState(student.firstName)
  const [lastName, setLastName] = useState(student.lastName)
  const [matricule, setMatricule] = useState(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash
      const qIdx = hash.indexOf('?')
      if (qIdx !== -1) {
        const searchParams = new URLSearchParams(hash.slice(qIdx))
        const m = searchParams.get('matricule')
        if (m) return m.trim()
      }
    }
    return student.matricule
  })
  const [filiere, setFiliere] = useState(student.filiere)
  const [promotion, setPromotion] = useState(student.promotion)
  const [email, setEmail] = useState(student.email)
  const [phone, setPhone] = useState(student.phone)
  const [purpose, setPurpose] = useState(PURPOSES[0])
  const [specific, setSpecific] = useState<Record<string, string>>(() => {
    const values: Record<string, string> = {}
    act?.specificFields?.forEach((field) => {
      if (field.defaultValue) values[field.id] = field.defaultValue
      else if (field.options?.length) values[field.id] = field.options[0]
    })
    return values
  })
  const [attachments, setAttachments] = useState<Attachment[]>([])
  /** Fichiers réellement sélectionnés, envoyés au serveur après la création du dossier. */
  const [files, setFiles] = useState<Record<string, File>>({})
  const [honor, setHonor] = useState(false)
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [documentOpen, setDocumentOpen] = useState(false)
  const [created, setCreated] = useState<UserRequest | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [docPickerFor, setDocPickerFor] = useState<string | null>(null)
  const [payMethod, setPayMethod] = useState<'mobile_money' | 'card'>('mobile_money')
  const [payPhone, setPayPhone] = useState(student.phone ?? '')
  const [payOperator, setPayOperator] = useState<'MTN' | 'MOOV'>('MTN')
  const [checkout, setCheckout] = useState<PaymentSession | null>(null)
  /** Session sans page de paiement : Mobile Money poussé sur le téléphone, ou caisse. */
  const [pendingSession, setPendingSession] = useState<PaymentSession | null>(null)
  const [paymentNote, setPaymentNote] = useState<string | null>(null)
  const [paying, setPaying] = useState(false)
  const [eligibilityCheck, setEligibilityCheck] = useState<{
    loading: boolean
    checked: boolean
    eligible?: boolean
    message?: string
    deliberation?: any
  }>({ loading: false, checked: false })

  useEffect(() => {
    if (!act || !matricule || matricule.trim().length < 3) return
    let cancel = false
    setEligibilityCheck((prev) => ({ ...prev, loading: true }))
    api.checkEligibility(act.id, matricule.trim())
      .then((res) => {
        if (!cancel) {
          setEligibilityCheck({
            loading: false,
            checked: true,
            eligible: res.eligible,
            message: res.message,
            deliberation: res.deliberation,
          })
        }
      })
      .catch(() => {
        if (!cancel) setEligibilityCheck({ loading: false, checked: false })
      })
    return () => { cancel = true }
  }, [act?.id, matricule])

  const paid = Boolean(act && act.feeAmount > 0)

  /** Sans frais : le paiement saute, la confirmation suit directement la vérification. */
  const steps = useMemo(() => {
    const items = [...BASE_STEPS]
    if (paid) items.push(STEPS[3])
    items.push({ number: items.length + 1, label: 'Confirmation' })
    return items
  }, [paid])
  const verificationStep = 3
  const paymentStep = paid ? 4 : null
  const finalStep = steps.length
  const missingDocuments = useMemo(() => {
    if (!act) return []
    return act.requiredDocuments.filter(
      (doc) => doc.mandatory && !attachments.some((attachment) => attachment.documentName === doc.name),
    )
  }, [act, attachments])

  if (!act) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <EmptyState
          title="Prestation introuvable"
          description="Cette démarche n’est plus disponible dans le catalogue."
          action={<Button onClick={() => navigate('/catalogue')}>Retour au catalogue</Button>}
        />
      </div>
    )
  }

  if (!session || role !== 'student') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <EmptyState
          icon={<Lock className="h-8 w-8" />}
          title="Connexion requise"
          description="Connectez-vous avec un compte étudiant pour déposer une demande d’acte."
          action={<Button onClick={() => navigate('/connexion')}>Se connecter</Button>}
        />
      </div>
    )
  }


  const setSpecificValue = (fieldId: string, value: string) => {
    setSpecific((current) => ({ ...current, [fieldId]: value }))
  }

  const validateStep = (target: number): boolean => {
    const issues: string[] = []
    if (target === 1) {
      if (!lastName.trim()) issues.push('Le nom est obligatoire.')
      if (!firstName.trim()) issues.push('Le prénom est obligatoire.')
      if (!matricule.trim()) issues.push('Le matricule est obligatoire.')
      if (!email.includes('@')) issues.push('Une adresse e-mail valide est requise.')
      if (!phone.trim()) issues.push('Le numéro de téléphone est obligatoire.')
      act.specificFields?.forEach((field) => {
        if (field.required && !specific[field.id]?.trim()) {
          issues.push(`Le champ « ${field.label} » est obligatoire.`)
        }
      })
    }
    if (target === 2) {
      missingDocuments.forEach((doc) => issues.push(`La pièce « ${doc.name} » est obligatoire.`))
    }
    if (target === 3 && !honor) {
      issues.push('Vous devez certifier l’exactitude des informations.')
    }
    setErrors(issues)
    return issues.length === 0
  }

  const goNext = () => {
    if (step === paymentStep) {
      void startPayment()
      return
    }
    if (!validateStep(step)) return
    if (step < verificationStep) {
      setStep(step + 1)
      setErrors([])
      window.scrollTo(0, 0)
      return
    }
    setSubmitting(true)
    window.setTimeout(async () => {
      const request: UserRequest = {
        id: makeDossierId('ACTE'),
        actId: act.id,
        actTitle: act.title,
        serviceType: act.serviceType,
        createdAt: formatDate(),
        lastUpdated: 'À l’instant',
        status: 'En traitement',
        applicant: {
          fullName: `${firstName} ${lastName}`,
          firstName,
          lastName,
          matricule,
          promotion,
          filiere,
          email,
          telephone: phone,
          deliveryMethod: 'physical',
          purpose,
          specificResponses: specific,
        },
        attachments,
        messages: [],
        timeline: [],
      }
      try {
        const created = await submitRequest(request)

        // Envoi réel des pièces au serveur (métadonnées créées ci-dessus).
        const pendingUploads = Object.entries(files)
        let uploadedCount = 0
        const failed: string[] = []
        for (const [documentName, file] of pendingUploads) {
          try {
            await api.uploadAttachment(created.id, file, documentName)
            uploadedCount += 1
          } catch {
            failed.push(documentName)
          }
        }

        const refreshed = await reloadRequest(created.id)
        setCreated(refreshed)
        // Prestation payante : le règlement est la dernière étape du dépôt.
        // Le numéro saisi à l'étape 1 sert de numéro à débiter.
        if (paymentStep) setPayPhone(phone.trim())
        setStep(paymentStep ?? finalStep)
        setErrors([])
        window.scrollTo(0, 0)
        if (failed.length > 0) {
          toast(
            `Dossier ${created.id} créé, mais ${failed.length} pièce(s) n’ont pas pu être envoyée(s) : ${failed.join(', ')}.`,
            'warning',
          )
        } else {
          toast(
            uploadedCount > 0
              ? `Dossier ${created.id} créé avec ${uploadedCount} pièce(s) jointe(s). Votre récépissé est disponible.`
              : 'Demande enregistrée. Votre récépissé est disponible.',
            'success',
          )
        }
      } catch (error) {
        setErrors([errorMessage(error, 'Le dépôt a échoué.')])
        toast('Le dépôt de la demande a échoué.', 'error')
      } finally {
        setSubmitting(false)
      }
    }, 700)
  }

  /** Ouvre la session de paiement (FeeXPay, mock ou caisse) à la dernière étape du dépôt. */
  const startPayment = async () => {
    if (!created) return
    if (payMethod === 'mobile_money' && payPhone.trim().length < 6) {
      setErrors(['Le numéro de téléphone est requis pour régler par Mobile Money.'])
      return
    }
    setErrors([])
    setCheckout(null)
    setPendingSession(null)
    setPaymentNote(null)
    setPaying(true)
    try {
      const { session, request: updated } = await api.createPaymentSession(created.id, {
        method: payMethod,
        phone: payPhone.trim(),
        ...(payMethod === 'mobile_money' ? { operator: payOperator } : {}),
      })
      setCreated(updated)
      if (session.status === 'confirmed') {
        setStep(finalStep)
        window.scrollTo(0, 0)
        toast('Règlement confirmé. La quittance est jointe à votre dossier.', 'success')
        return
      }
      if (session.checkoutUrl) {
        setCheckout(session)
        return
      }
      setPendingSession(session)
      setPaymentNote(
        session.instructions ?? 'Réglez le montant au guichet, la scolarité enregistrera la quittance.',
      )
    } catch (error) {
      setErrors([errorMessage(error, 'Impossible d’ouvrir le paiement en ligne.')])
    } finally {
      setPaying(false)
    }
  }

  /** Retour du checkout : le serveur recontrôle le statut avant de valider le dépôt. */
  const confirmOnlinePayment = async () => {
    if (!created) return
    setPaying(true)
    try {
      const updated = await api.confirmPayment(
        created.id,
        checkout?.providerRef ?? pendingSession?.providerRef,
      )
      setCreated(updated)
      setStep(finalStep)
      window.scrollTo(0, 0)
      toast('Règlement confirmé. La quittance a été jointe à votre dossier.', 'success')
    } catch (error) {
      toast(
        errorMessage(error, 'Le règlement n’est pas encore confirmé, réessayez dans un instant.'),
        'warning',
      )
    } finally {
      setPaying(false)
    }
  }

  const addUpload = (documentName: string, file: File) => {
    setAttachments((current) => [
      ...current.filter((attachment) => attachment.documentName !== documentName),
      {
        name: file.name,
        size: fileSizeLabel(file.size),
        uploadedAt: 'Aujourd’hui',
        verified: false,
        documentName,
      },
    ])
    setFiles((current) => ({ ...current, [documentName]: file }))
    setDocPickerFor(null)
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={() => navigate(`/acte/${act.id}`)}
        className="mb-5 inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-brand-800"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Retour à la fiche
      </button>

      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
            <ActIcon type={act.iconType} />
          </span>
          <div>
            <p className="text-[11px] font-extrabold tracking-wider text-brand-700 uppercase">
              Formulaire officiel de demande
            </p>
            <h1 className="mt-0.5 text-xl font-extrabold text-slate-950 sm:text-2xl">{act.title}</h1>
            <p className="mt-1 text-xs text-slate-500">
              {establishment.shortName} · Délai indicatif : {act.delay}
            </p>
          </div>
        </div>
        <Badge tone={paid ? 'warning' : 'success'}>
          {formatAmount(act.feeAmount, establishment.currency)}
        </Badge>
      </div>

      {/* Stepper */}
      <div className="mt-6 space-y-3">
        <Progress
          value={(step / steps.length) * 100}
          label={`Étape ${step} sur ${steps.length} — ${steps[step - 1].label}`}
        />
        <div
          className={`grid grid-cols-2 gap-2 ${
            steps.length > 4 ? 'sm:grid-cols-5' : 'sm:grid-cols-4'
          }`}
        >
          {steps.map((item) => {
            const done = step > item.number
            const active = step === item.number
            return (
              <div
                key={item.number}
                className={`flex items-center gap-2 rounded-xl p-2.5 text-[11px] font-bold ${
                  active
                    ? 'bg-brand-900 text-white'
                    : done
                      ? 'bg-brand-50 text-brand-900'
                      : 'bg-slate-100 text-slate-400'
                }`}
              >
                <span
                  className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] ${
                    active
                      ? 'bg-white text-brand-900'
                      : done
                        ? 'bg-brand-700 text-white'
                        : 'bg-slate-300 text-slate-600'
                  }`}
                >
                  {done ? <Check className="h-3 w-3 stroke-3" /> : item.number}
                </span>
                <span className="truncate">{item.label}</span>
              </div>
            )
          })}
        </div>
      </div>

      {errors.length > 0 && (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3.5" role="alert">
          <p className="flex items-center gap-1.5 text-xs font-bold text-rose-800">
            <AlertCircle className="h-4 w-4" /> Veuillez corriger les points suivants :
          </p>
          <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-[11px] text-rose-700">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Step 1 */}
      {step === 1 && (
        <Card className="mt-4 p-5 sm:p-6">
          <h2 className="text-sm font-extrabold text-slate-950">Informations du demandeur</h2>
          <p className="mt-1 text-xs text-slate-500">
            Vérifiez les informations issues de votre compte avant de poursuivre.
          </p>

          {/* Badge de synchronisation eRésultats */}
          {eligibilityCheck.checked && (
            <div
              className={`mt-4 flex items-start gap-2.5 rounded-xl border p-3 text-xs ${
                eligibilityCheck.eligible
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                  : 'border-amber-200 bg-amber-50 text-amber-900'
              }`}
            >
              <ShieldCheck className={`h-4 w-4 shrink-0 mt-0.5 ${eligibilityCheck.eligible ? 'text-emerald-600' : 'text-amber-600'}`} />
              <div>
                <p className="font-bold">
                  {eligibilityCheck.eligible
                    ? 'Dossier académique synchronisé avec eRésultats'
                    : 'Avis du jury ou pré-requis d’admissibilité'}
                </p>
                <p className="mt-0.5 text-[11px] leading-relaxed opacity-90">
                  {eligibilityCheck.message ||
                    (eligibilityCheck.eligible
                      ? `Délibération validée (${eligibilityCheck.deliberation?.credits_ects_valides ?? 180} crédits ECTS acquis).`
                      : 'Votre demande sera soumise à vérification de la scolarité.')}
                </p>
              </div>
            </div>
          )}

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Nom" required htmlFor="last-name">
              <Input id="last-name" value={lastName} onChange={(event) => setLastName(event.target.value)} />
            </Field>
            <Field label="Prénom" required htmlFor="first-name">
              <Input id="first-name" value={firstName} onChange={(event) => setFirstName(event.target.value)} />
            </Field>
            <Field label="Matricule" required hint="Attribué par l’établissement" htmlFor="matricule">
              <Input
                id="matricule"
                value={matricule}
                onChange={(event) => setMatricule(event.target.value)}
                className="font-mono"
              />
            </Field>
            <Field label="Promotion / niveau" required htmlFor="promotion">
              <Select id="promotion" value={promotion} onChange={(event) => setPromotion(event.target.value)}>
                {['Licence 1', 'Licence 2', 'Licence 3', 'Master 1', 'Master 2', 'Diplômé'].map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Filière" required htmlFor="filiere">
              <Select id="filiere" value={filiere} onChange={(event) => setFiliere(event.target.value)}>
                {establishment.filieres.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="E-mail" required htmlFor="email">
              <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </Field>
            <Field label="Téléphone" required htmlFor="phone">
              <Input id="phone" value={phone} onChange={(event) => setPhone(event.target.value)} />
            </Field>
            <Field label="Motif de la demande" required htmlFor="purpose">
              <Select id="purpose" value={purpose} onChange={(event) => setPurpose(event.target.value)}>
                {PURPOSES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          {act.specificFields && act.specificFields.length > 0 && (
            <div className="mt-5 rounded-2xl border border-brand-200 bg-brand-50/50 p-4">
              <p className="text-[10px] font-extrabold tracking-wider text-brand-900 uppercase">
                Précisions requises pour cet acte
              </p>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                {act.specificFields.map((field) => (
                  <Field
                    key={field.id}
                    label={field.label}
                    required={field.required}
                    hint={field.help}
                    htmlFor={`specific-${field.id}`}
                    className={field.type === 'textarea' ? 'sm:col-span-2' : undefined}
                  >
                    {field.type === 'select' ? (
                      <Select
                        id={`specific-${field.id}`}
                        value={specific[field.id] ?? ''}
                        onChange={(event) => setSpecificValue(field.id, event.target.value)}
                      >
                        {field.options?.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </Select>
                    ) : field.type === 'textarea' ? (
                      <Textarea
                        id={`specific-${field.id}`}
                        value={specific[field.id] ?? ''}
                        onChange={(event) => setSpecificValue(field.id, event.target.value)}
                        placeholder={field.placeholder}
                      />
                    ) : (
                      <Input
                        id={`specific-${field.id}`}
                        type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'}
                        value={specific[field.id] ?? ''}
                        onChange={(event) => setSpecificValue(field.id, event.target.value)}
                        placeholder={field.placeholder}
                      />
                    )}
                  </Field>
                ))}
              </div>
            </div>
          )}

          <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-brand-200 bg-brand-50/60 p-3.5">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" />
            <div>
              <p className="text-xs font-bold text-slate-900">Retrait de l’acte</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-slate-600">
                L’acte est retiré auprès de l’administration de l’établissement après instruction du
                dossier. Vous n’avez aucun déplacement à faire pour le dépôt : tout se fait ici,
                à toute heure.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <Card className="mt-4 p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
            <div>
              <h2 className="text-sm font-extrabold text-slate-950">Pièces justificatives</h2>
              <p className="mt-1 text-xs text-slate-500">
                Joignez des copies lisibles (PDF, JPG ou PNG) : elles sont envoyées au serveur de
                l’établissement et rattachées à votre dossier.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {act.requiredDocuments.length === 0 && (
              <p className="rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800">
                Aucune pièce n’est requise pour cet acte.
              </p>
            )}
            {act.requiredDocuments.map((doc, index) => {
              const uploaded = attachments.find((item) => item.documentName === doc.name)
              return (
                <div key={doc.name} className="rounded-xl border border-slate-200 p-3.5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900">
                        {index + 1}. {doc.name}{' '}
                        {doc.mandatory ? (
                          <span className="text-rose-600">*</span>
                        ) : (
                          <span className="text-[10px] font-medium text-slate-400">(facultatif)</span>
                        )}
                      </p>
                      {doc.details && <p className="mt-0.5 text-[11px] text-slate-500">{doc.details}</p>}
                    </div>
                    {uploaded ? (
                      <Badge tone="success">
                        <CheckCircle2 className="h-3 w-3" /> Prêt
                      </Badge>
                    ) : (
                      <Badge tone="neutral">En attente</Badge>
                    )}
                  </div>

                  {uploaded ? (
                    <div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-brand-50/60 p-2.5">
                      <span className="flex min-w-0 items-center gap-2 text-xs">
                        <FileText className="h-4 w-4 shrink-0 text-brand-700" />
                        <span className="truncate font-bold text-slate-900">{uploaded.name}</span>
                        <span className="shrink-0 font-mono text-[10px] text-slate-500">
                          {uploaded.size}
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setAttachments((current) =>
                            current.filter((item) => item.name !== uploaded.name),
                          )
                          setFiles((current) => {
                            if (!uploaded.documentName) return current
                            const next = { ...current }
                            delete next[uploaded.documentName]
                            return next
                          })
                        }}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-rose-600"
                        aria-label={`Supprimer ${uploaded.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button variant="secondary" size="sm" onClick={() => setDocPickerFor(doc.name)}>
                        <Upload className="h-3.5 w-3.5" /> Choisir un fichier
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {paid && (
            <div className="mt-5 rounded-xl border border-amber-300 bg-amber-50/60 p-4">
              <div className="flex items-start gap-2.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700">
                  <Info className="h-4.5 w-4.5" />
                </span>
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    Frais officiels : {formatAmount(act.feeAmount, establishment.currency)}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-600">
                    {act.feeNote ?? 'Réglable en ligne'} — le règlement est la dernière étape du
                    dépôt : la quittance vous est jointe automatiquement, sans rien téléverser.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-5 flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-600">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-700" />
            Les fichiers sélectionnés sont transmis au serveur de l’établissement et rattachés à
            votre dossier : ils ne sont pas conservés sur votre appareil.
          </div>
        </Card>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <Card className="mt-4 p-5 sm:p-6">
          <h2 className="text-sm font-extrabold text-slate-950">Récapitulatif</h2>
          <p className="mt-1 text-xs text-slate-500">
            Vérifiez attentivement les informations avant la transmission définitive.
          </p>

          <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
            {[
              ['Acte demandé', act.title],
              ['Demandeur', `${firstName} ${lastName}`],
              ['Matricule', matricule],
              ['Filière / niveau', `${filiere} · ${promotion}`],
              ['Contact', `${email} · ${phone}`],
              ['Retrait de l’acte', 'Auprès de l’administration de l’établissement'],
              ['Motif', purpose],
              [
                'Frais',
                act.feeAmount > 0
                  ? `${formatAmount(act.feeAmount, establishment.currency)} — règlement à l’étape suivante`
                  : 'Aucun frais',
              ],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                <p className="text-[10px] font-bold tracking-wide text-slate-500 uppercase">{label}</p>
                <p className="mt-0.5 text-xs font-bold text-slate-900">{value}</p>
              </div>
            ))}
          </div>

          {Object.keys(specific).length > 0 && (
            <div className="mt-4 rounded-xl border border-brand-200 bg-brand-50/50 p-3.5">
              <p className="text-[10px] font-bold tracking-wide text-brand-900 uppercase">
                Précisions fournies
              </p>
              <dl className="mt-2 space-y-1.5">
                {act.specificFields?.map((field) => (
                  <div key={field.id} className="flex flex-wrap justify-between gap-2 text-[11px]">
                    <dt className="text-slate-500">{field.label}</dt>
                    <dd className="max-w-[60%] text-right font-semibold text-slate-800">
                      {specific[field.id] || '—'}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          <div className="mt-4">
            <p className="text-[11px] font-bold text-slate-700">
              Pièces jointes ({attachments.length})
            </p>
            <ul className="mt-1.5 divide-y divide-slate-100 rounded-xl border border-slate-200">
              {attachments.length === 0 && (
                <li className="p-3 text-[11px] text-slate-500">Aucune pièce jointes.</li>
              )}
              {attachments.map((attachment) => (
                <li
                  key={attachment.name}
                  className="flex items-center justify-between gap-2 p-2.5 text-[11px]"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <FileText className="h-3.5 w-3.5 shrink-0 text-brand-700" />
                    <span className="truncate font-semibold text-slate-800">{attachment.name}</span>
                  </span>
                  <span className="shrink-0 font-mono text-[10px] text-slate-400">{attachment.size}</span>
                </li>
              ))}
            </ul>
          </div>

          <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-brand-200 bg-brand-50/50 p-3.5">
            <input
              type="checkbox"
              checked={honor}
              onChange={(event) => setHonor(event.target.checked)}
              className="mt-0.5 h-4 w-4 accent-brand-700"
            />
            <span className="text-[11px] leading-relaxed text-slate-700">
              Je certifie sur l’honneur l’exactitude des informations fournies ainsi que
              l’authenticité des pièces jointes à cette demande.
            </span>
          </label>
        </Card>
      )}

      {/* Step 4 — Paiement : la dernière étape du dépôt */}
      {step === paymentStep && created && (
        <Card className="mt-4 p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 text-[11px] font-extrabold tracking-[0.16em] text-brand-700 uppercase">
                <CreditCard className="h-4 w-4" /> Dernière étape — règlement
              </p>
              <h2 className="mt-1.5 text-lg font-extrabold text-slate-950">
                Payer les frais de la prestation
              </h2>
              <p className="mt-1 max-w-xl text-xs leading-relaxed text-slate-500">
                Le règlement conclut votre part du dépôt : dès confirmation, la quittance est jointe
                au dossier automatiquement. Le dossier reste ensuite à instruire par la scolarité.
              </p>
            </div>
            <Badge tone="warning">{formatAmount(act.feeAmount, establishment.currency)}</Badge>
          </div>

          {!checkout && !paymentNote && (
            <div className="mt-5 space-y-4">
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  { id: 'mobile_money' as const, title: 'Mobile Money', hint: 'MTN MoMo ou Moov Money' },
                  { id: 'card' as const, title: 'Carte bancaire', hint: 'Visa / Mastercard' },
                ].map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPayMethod(method.id)}
                    className={`rounded-xl border p-3.5 text-left transition-colors ${
                      payMethod === method.id
                        ? 'border-brand-400 bg-brand-50 ring-2 ring-brand-200'
                        : 'border-slate-200 bg-white hover:border-brand-200'
                    }`}
                  >
                    <span className="flex items-center gap-2 text-xs font-extrabold text-slate-900">
                      <CreditCard className="h-4 w-4 text-brand-700" /> {method.title}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-slate-500">{method.hint}</span>
                  </button>
                ))}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Numéro à débiter" required htmlFor="pay-phone">
                  <Input
                    id="pay-phone"
                    inputMode="tel"
                    value={payPhone}
                    onChange={(event) => setPayPhone(event.target.value)}
                    placeholder="229 01 66 00 00 00"
                  />
                </Field>
                {payMethod === 'mobile_money' && (
                  <Field label="Opérateur" required htmlFor="pay-operator">
                    <Select
                      id="pay-operator"
                      value={payOperator}
                      onChange={(event) => setPayOperator(event.target.value as 'MTN' | 'MOOV')}
                    >
                      <option value="MTN">MTN MoMo</option>
                      <option value="MOOV">Moov Money</option>
                    </Select>
                  </Field>
                )}
              </div>
            </div>
          )}

          {checkout && (
            <div className="mt-5 rounded-xl border border-brand-200 bg-brand-50/60 p-4">
              <p className="text-xs font-bold text-brand-900">
                Paiement en cours — référence {checkout.providerRef}
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-600">{checkout.instructions}</p>
              <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                Validez le règlement, puis revenez sur cette page : le statut est recontrôlé auprès
                de l’opérateur avant la confirmation du règlement.
              </p>
            </div>
          )}

          {paymentNote && (
            <div className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-4">
              <p className="text-xs font-bold text-amber-950">
                {pendingSession?.provider === 'manual'
                  ? 'Règlement au guichet'
                  : 'Validation Mobile Money sur votre téléphone'}
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-amber-800">{paymentNote}</p>
              {pendingSession?.provider !== 'manual' && (
                <p className="mt-2 text-[11px] leading-relaxed text-amber-700">
                  Confirmez la demande sur votre téléphone, puis cliquez sur « J’ai terminé le
                  paiement » : le statut est recontrôlé auprès de l’opérateur avant la confirmation.
                </p>
              )}
            </div>
          )}

          <div className="mt-5 flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-600">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-700" />
            Un accusé de réception et la quittance vous seront envoyés par e-mail à{' '}
            <span className="font-semibold text-slate-700">{email}</span> dès la confirmation du
            règlement.
          </div>
        </Card>
      )}

      {/* Step 5 — Confirmation */}
      {step === finalStep && created && (
        <Card className="mt-4 p-6 text-center sm:p-9">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-9 w-9" />
          </span>
          <p className="mt-4 text-[10px] font-extrabold tracking-[0.16em] text-emerald-700 uppercase">
            {paid
              ? created.payment
                ? 'Règlement confirmé'
                : 'Dépôt transmis — règlement attendu'
              : 'Demande enregistrée'}
          </p>
          <h2 className="mt-1 text-2xl font-extrabold text-slate-950">
            {paid && !created.payment ? 'Votre dossier vous attend' : 'Votre dossier a été transmis'}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-slate-500">
            Le service de scolarité vérifie vos pièces. Vous êtes notifié à chaque étape depuis votre
            espace, et l’acte est retiré auprès de l’administration une fois le dossier validé.
          </p>

          <div className="mx-auto mt-5 max-w-md rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <span className="text-[11px] font-semibold text-slate-500">Numéro de dossier</span>
              <span className="font-mono text-sm font-extrabold text-brand-900">{created.id}</span>
            </div>
            <dl className="mt-3 space-y-2 text-[11px]">
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Acte</dt>
                <dd className="text-right font-bold text-slate-900">{created.actTitle}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Délai indicatif</dt>
                <dd className="font-bold text-slate-900">{act.delay}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Retrait</dt>
                <dd className="font-bold text-slate-900">Auprès de l’administration</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Pièces</dt>
                <dd className="font-bold text-slate-900">{created.attachments.length}</dd>
              </div>
              {created.payment && (
                <div className="flex justify-between gap-3 border-t border-slate-200 pt-2">
                  <dt className="text-slate-500">Quittance</dt>
                  <dd className="font-mono text-right font-bold text-emerald-700">
                    {created.payment.receiptNumber}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <p className="mx-auto mt-4 max-w-md text-[11px] leading-relaxed text-slate-500">
            {paid && !created.payment ? (
              <>
                Un accusé de réception et la quittance vous seront envoyés par e-mail à{' '}
                <span className="font-semibold text-slate-700">{created.applicant.email}</span> dès
                la confirmation du règlement.
              </>
            ) : (
              <>
                Un accusé de réception
                {created.payment ? ' et la quittance de paiement' : ''} vous ont été envoyés par
                e-mail à{' '}
                <span className="font-semibold text-slate-700">{created.applicant.email}</span>.
              </>
            )}
          </p>

          <div className="mx-auto mt-5 flex max-w-md flex-col gap-2 sm:flex-row sm:justify-center">
            <Button variant="success" onClick={() => setReceiptOpen(true)}>
              <FileText className="h-4 w-4" /> Afficher le récépissé
            </Button>
            <Button onClick={() => setDocumentOpen(true)} className="bg-[#0e3150] text-white hover:bg-[#15466e]">
              <ShieldCheck className="h-4 w-4 text-[#e5c477]" /> Voir l’Acte Certifié
            </Button>
            <Button onClick={() => navigate(`/dossiers/${created.id}`)}>
              Suivre mon dossier <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          <button
            type="button"
            onClick={() => navigate('/catalogue')}
            className="mt-4 text-[11px] font-semibold text-slate-500 underline hover:text-brand-800"
          >
            Retour au catalogue
          </button>
        </Card>
      )}

      {/* Navigation */}
      {step < finalStep && (
        <div className="mt-4 flex flex-col-reverse items-center justify-between gap-3 border-t border-slate-200 pt-4 sm:flex-row">
          <button
            type="button"
            onClick={() =>
              step === 1
                ? navigate(`/acte/${act.id}`)
                : step === paymentStep && created
                  ? navigate(`/dossiers/${created.id}`)
                  : setStep(step - 1)
            }
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="h-3.5 w-3.5" />{' '}
            {step === 1 ? 'Quitter' : step === paymentStep ? 'Retour à mon dossier' : 'Précédent'}
          </button>
          <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
            {step === paymentStep && checkout ? (
              <>
                <Button
                  variant="secondary"
                  onClick={() =>
                    checkout.checkoutUrl && window.open(checkout.checkoutUrl, '_blank', 'noopener')
                  }
                >
                  Ouvrir la page de paiement <ArrowRight className="h-4 w-4" />
                </Button>
                <Button onClick={() => void confirmOnlinePayment()} disabled={paying}>
                  {paying ? (
                    <Clock className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}{' '}
                  {paying ? 'Vérification…' : 'J’ai terminé le paiement'}
                </Button>
              </>
            ) : step === paymentStep && paymentNote ? (
              pendingSession && pendingSession.provider !== 'manual' ? (
                <Button onClick={() => void confirmOnlinePayment()} disabled={paying}>
                  {paying ? (
                    <Clock className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  {paying ? 'Vérification…' : 'J’ai terminé le paiement'}
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    setStep(finalStep)
                    window.scrollTo(0, 0)
                  }}
                >
                  <ShieldCheck className="h-4 w-4" /> Terminer le dépôt
                </Button>
              )
            ) : (
              <Button
                onClick={goNext}
                disabled={submitting || paying}
                className="w-full sm:w-auto"
              >
                {submitting || paying ? (
                  <>
                    <Clock className="h-4 w-4 animate-spin" />{' '}
                    {paying ? 'Paiement…' : 'Transmission…'}
                  </>
                ) : step === verificationStep ? (
                  <>
                    <ShieldCheck className="h-4 w-4" /> Confirmer et soumettre
                  </>
                ) : step === paymentStep ? (
                  <>
                    <CreditCard className="h-4 w-4" /> Payer{' '}
                    {formatAmount(act.feeAmount, establishment.currency)}
                  </>
                ) : (
                  <>
                    Continuer <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Hidden file input simulation */}
      <Modal
        open={Boolean(docPickerFor)}
        onClose={() => setDocPickerFor(null)}
        title="Ajouter une pièce"
        subtitle={docPickerFor ?? ''}
        size="sm"
      >
        <div className="space-y-3 p-5">
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center transition-colors hover:border-brand-400 hover:bg-brand-50/40">
            <Upload className="h-6 w-6 text-slate-400" />
            <span className="mt-2 text-xs font-bold text-slate-800">
              Sélectionner un fichier sur votre appareil
            </span>
            <span className="mt-1 text-[10px] text-slate-500">PDF, JPG ou PNG</span>
            <input
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file && docPickerFor) addUpload(docPickerFor, file)
              }}
            />
          </label>
        </div>
      </Modal>

      {receiptOpen && created && (
        <ReceiptModal request={created} onClose={() => setReceiptOpen(false)} />
      )}

      {documentOpen && created && (
        <OfficialDocumentModal request={created} onClose={() => setDocumentOpen(false)} />
      )}

    </div>
  )
}

export default RequestForm
