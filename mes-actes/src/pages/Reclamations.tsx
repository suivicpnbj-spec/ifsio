import { useMemo, useState } from 'react'
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  FileText,
  FileWarning,
  Info,
  ShieldAlert,
  Upload,
} from 'lucide-react'
import { navigate } from '@/lib/router'
import {
  FILIERE_LABELS,
  NIVEAUX_UE,
  UE_CATALOG,
  filiereUE,
  niveauUE,
  type FiliereUE,
  type NiveauUE,
} from '@/data/ue'
import { cn, formatAmount, formatDate, makeDossierId } from '@/lib/utils'
import { useApp } from '@/store'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Select,
  StatusBadge,
  Textarea,
} from '@/components/ui'
import type { Attachment, ReclamationMotif, UserRequest } from '@/types'

const MOTIFS: Array<{ id: ReclamationMotif; label: string }> = [
  { id: 'note_non_affichee', label: 'Note non affichée' },
  { id: 'erreur_report', label: 'Note non reportée ou omise sur le relevé' },
  { id: 'erreur_calcul', label: 'Erreur de calcul du total' },
  { id: 'credits_non_accordes', label: 'Crédits non accordés' },
  { id: 'desaccord_note', label: 'Désaccord avec la note affichée' },
  { id: 'bareme', label: 'Barème ou notation contesté(e)' },
  { id: 'autre', label: 'Autre motif (préciser)' },
]

const DOCUMENTS = [
  {
    key: 'preinscription',
    label: 'Fiche de préinscription validée',
    hint: 'Année académique en cours',
  },
  {
    key: 'carte',
    label: 'Carte d’étudiant en cours de validité',
    hint: 'Scan recto-verso',
  },
]

export function Reclamations() {
  const { student, requests, establishment, acts, submitRequest, toast } = useApp()
  const [tab, setTab] = useState<'depot' | 'reprise' | 'suivi'>('depot')
  const [filiere, setFiliere] = useState<FiliereUE>(() => filiereUE(student.filiere))
  const [niveau, setNiveau] = useState<NiveauUE>(() => niveauUE(student.promotion))
  const [ueName, setUeName] = useState('')
  const [ecName, setEcName] = useState('')
  const [matiere, setMatiere] = useState('')
  const [codeUe, setCodeUe] = useState('')
  const [session, setSession] = useState<'Session Normale' | 'Session de Rattrapage' | 'Contrôle Continu'>(
    'Session Normale',
  )
  const [teacher, setTeacher] = useState('')
  const [noteInitiale, setNoteInitiale] = useState('')
  const [motif, setMotif] = useState<ReclamationMotif>('note_non_affichee')
  const [argumentaire, setArgumentaire] = useState('')
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  const fee = acts.find((act) => act.id === 'reclamation-note-matiere')?.feeAmount ?? 0

  /* Catalogue UE/EC de la filière et du niveau sélectionnés (classeurs IDE/SFE). */
  const ues = UE_CATALOG[filiere][niveau]
  const ueSelectionnee = ues.find((ue) => ue.name === ueName)
  const ecs = ueSelectionnee?.ecs ?? []
  const ecSelectionne = ecs.find((ec) => ec.name === ecName)

  const resetSelection = () => {
    setUeName('')
    setEcName('')
    setMatiere('')
    setCodeUe('')
  }

  const choisirUE = (nom: string) => {
    setUeName(nom)
    setEcName('')
    setMatiere(nom)
    setCodeUe(ues.find((ue) => ue.name === nom)?.code ?? '')
  }

  const choisirEC = (nom: string) => {
    setEcName(nom)
    setMatiere(nom && ueName ? `${nom} — ${ueName}` : nom || ueName)
  }

  const claims = useMemo(
    () =>
      requests.filter(
        (request) =>
          request.actId.startsWith('reclamation') ||
          request.actId.startsWith('correction') ||
          request.actId.startsWith('reprise') ||
          Boolean(request.reclamationDetails),
      ),
    [requests],
  )

  const addDocument = (doc: (typeof DOCUMENTS)[number], file: File) => {
    setAttachments((current) => [
      ...current.filter((attachment) => attachment.documentName !== doc.label),
      {
        name: file.name,
        size: `${Math.max(1, Math.round(file.size / 1024))} Ko`,
        uploadedAt: 'Aujourd’hui',
        verified: false,
        documentName: doc.label,
      },
    ])
  }

  const submit = () => {
    const issues: string[] = []
    if (!ueName) issues.push('Sélectionnez l’UE contestée dans le catalogue.')
    if (matiere.trim().length < 3) issues.push('Indiquez la matière ou l’UE contestée.')
    if (argumentaire.trim().length < 30)
      issues.push('L’argumentaire doit contenir au moins 30 caractères.')
    DOCUMENTS.forEach((doc) => {
      if (!attachments.some((attachment) => attachment.documentName === doc.label)) {
        issues.push(`La pièce « ${doc.label} » est obligatoire.`)
      }
    })
    setErrors(issues)
    if (issues.length > 0) return

    setSubmitting(true)
    window.setTimeout(async () => {
      const id = makeDossierId('REC')
      const request: UserRequest = {
        id,
        actId: 'reclamation-note-matiere',
        actTitle: `Réclamation de note — ${matiere.trim()}`,
        serviceType: 'procedure',
        createdAt: formatDate(),
        lastUpdated: 'À l’instant',
        status: 'En traitement',
        applicant: {
          fullName: `${student.firstName} ${student.lastName}`,
          firstName: student.firstName,
          lastName: student.lastName,
          matricule: student.matricule,
          promotion: student.promotion,
          filiere: student.filiere,
          email: student.email,
          telephone: student.phone,
          deliveryMethod: 'online',
          purpose: 'Recours gracieux auprès de la commission pédagogique',
          specificResponses: {
            matiereContestee: matiere.trim(),
            codeUe: codeUe.trim(),
            enseignantResponsable: teacher || 'Enseignant responsable de l’UE',
            motifPrecis: argumentaire,
          },
        },
        attachments,
        reclamationDetails: {
          matiere: matiere.trim(),
          ...(codeUe.trim() ? { codeUE: codeUe.trim() } : {}),
          session,
          /* Semestre et note affichée : renseignés seulement si l’étudiant les indique. */
          ...(noteInitiale.trim()
            ? { noteInitiale: Number.parseFloat(noteInitiale) || undefined }
            : {}),
          motifType: motif,
          argumentaire,
          ...(ecSelectionne ? { ecs: [ecSelectionne.code ?? ecSelectionne.name] } : {}),
        },
        messages: [
          {
            id: `msg-${Date.now()}`,
            role: 'student',
            author: `${student.firstName} ${student.lastName}`,
            text: `Dépôt d’un recours concernant « ${matiere.trim()} ». ${argumentaire}`,
            at: formatDate(),
          },
        ],
        timeline: [
          {
            title: 'Recours enregistré',
            date: formatDate(),
            description:
              'Dépôt formel transmis au secrétariat de la commission pédagogique avec les pièces requises.',
            completed: true,
            current: true,
          },
          {
            title: 'Instruction par la commission',
            date: 'En attente d’attribution',
            description:
              'Désanonymisation et récolement de la copie originale avec le barème officiel.',
            completed: false,
          },
          {
            title: 'Notification de la décision',
            date: 'Délai moyen : 5 jours ouvrés',
            description: 'Procès-verbal de délibération motivé notifié dans votre espace.',
            completed: false,
          },
        ],
      }
      try {
        const created = await submitRequest(request)
        toast('Réclamation enregistrée et transmise à la commission.', 'success')
        navigate(`/dossiers/${created.id}`)
      } catch (error) {
        setErrors([error instanceof Error ? error.message : 'Le dépôt du recours a échoué.'])
        toast('Le dépôt du recours a échoué.', 'error')
      } finally {
        setSubmitting(false)
      }
    }, 800)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#3a2a0a] via-[#4a3208] to-[#2a1e07] p-6 text-white sm:p-8">
        <div className="pointer-events-none absolute -top-16 -right-10 h-56 w-56 rounded-full bg-amber-400/10 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <Badge tone="amber" className="border-amber-300/40 bg-amber-400/20 text-amber-100">
              <ShieldAlert className="h-3 w-3" /> Guichet des recours
            </Badge>
            <h1 className="mt-2.5 text-2xl font-extrabold sm:text-3xl">Réclamations & reprises</h1>
            <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-amber-100/85">
              Contestez une note élément constitutif par élément constitutif, demandez une reprise
              d’UE ou suivez la délibération de la commission pédagogique.
            </p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-center backdrop-blur">
            <p className="font-mono text-2xl font-extrabold">{claims.length}</p>
            <p className="text-[10px] tracking-wide text-amber-100/80 uppercase">recours déposés</p>
          </div>
        </div>
      </section>

      <div className="mt-4 flex flex-wrap gap-1 rounded-xl bg-white p-1 shadow-sm ring-1 ring-slate-200 sm:inline-flex">
        {[
          { id: 'depot' as const, label: 'Déposer une réclamation' },
          { id: 'reprise' as const, label: 'Reprise d’UE' },
          { id: 'suivi' as const, label: 'Suivi des recours' },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              'rounded-lg px-3 py-2 text-[11px] font-bold transition-colors',
              tab === item.id ? 'bg-amber-600 text-white' : 'text-slate-600 hover:bg-slate-50',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'depot' && (
        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_330px]">
          <div className="space-y-4">
            {errors.length > 0 && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5" role="alert">
                <p className="flex items-center gap-1.5 text-xs font-bold text-rose-800">
                  <AlertCircle className="h-4 w-4" /> Corrigez les points suivants
                </p>
                <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-[11px] text-rose-700">
                  {errors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            <Card className="p-5">
              <h2 className="text-sm font-extrabold text-slate-950">
                UE et élément constitutif contestés
              </h2>
              <p className="mt-1 text-[11px] text-slate-500">
                {fee > 0
                  ? `Frais de recours : ${formatAmount(fee, establishment.currency)} — réglable en ligne depuis le dossier après dépôt.`
                  : 'Choisissez votre filière puis l’UE et l’élément constitutif concernés par le recours.'}
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="Filière" required htmlFor="claim-filiere">
                  <Select
                    id="claim-filiere"
                    value={filiere}
                    onChange={(event) => {
                      setFiliere(event.target.value as FiliereUE)
                      resetSelection()
                    }}
                  >
                    {(['IDE', 'SFE'] as FiliereUE[]).map((code) => (
                      <option key={code} value={code}>
                        {FILIERE_LABELS[code]}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Niveau" required htmlFor="claim-niveau">
                  <Select
                    id="claim-niveau"
                    value={niveau}
                    onChange={(event) => {
                      setNiveau(event.target.value as NiveauUE)
                      resetSelection()
                    }}
                  >
                    {NIVEAUX_UE.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Unité d’enseignement (UE)" required htmlFor="claim-ue">
                  <Select
                    id="claim-ue"
                    value={ueName}
                    onChange={(event) => choisirUE(event.target.value)}
                  >
                    <option value="">— Choisir une UE —</option>
                    {ues.map((ue) => (
                      <option key={ue.name} value={ue.name}>
                        {ue.name}
                        {ue.credits ? ` · ${ue.credits} cr` : ''}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Élément constitutif (EC)" htmlFor="claim-ec">
                  <Select
                    id="claim-ec"
                    value={ecName}
                    onChange={(event) => choisirEC(event.target.value)}
                    disabled={!ueSelectionnee}
                  >
                    <option value="">
                      {ueSelectionnee
                        ? ueSelectionnee.ecs.length > 0
                          ? '— Toute l’UE —'
                          : (ueSelectionnee.note ?? '— UE concernée au complet —')
                        : '— Choisissez d’abord une UE —'}
                    </option>
                    {ecs.map((ec) => (
                      <option key={ec.name} value={ec.name}>
                        {ec.name}
                        {ec.code ? ` (${ec.code})` : ''}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Code de l’UE (si connu)" htmlFor="claim-code">
                  <Input
                    id="claim-code"
                    value={codeUe}
                    onChange={(event) => setCodeUe(event.target.value)}
                    placeholder="Rempli automatiquement si le classeur fournit un code"
                    className="font-mono"
                  />
                </Field>
              </div>
              {ueSelectionnee && (
                <p className="mt-2 text-[11px] text-slate-500">
                  Matière retenue pour le recours :{' '}
                  <span className="font-bold text-slate-700">{matiere || ueSelectionnee.name}</span>
                  {ecSelectionne?.code ? ` · code ${ecSelectionne.code}` : ''}
                </p>
              )}
            </Card>

            <Card className="p-5">
              <h2 className="text-sm font-extrabold text-slate-950">Détails du recours</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="Session d’évaluation" required htmlFor="claim-session">
                  <Select
                    id="claim-session"
                    value={session}
                    onChange={(event) => setSession(event.target.value as typeof session)}
                  >
                    {['Session Normale', 'Session de Rattrapage', 'Contrôle Continu'].map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field
                  label="Note affichée (/20) — si connue"
                  htmlFor="claim-note"
                  hint="Facultatif : la commission retrouvera la note au relevé."
                >
                  <Input
                    id="claim-note"
                    type="number"
                    step="0.25"
                    min="0"
                    max="20"
                    value={noteInitiale}
                    onChange={(event) => setNoteInitiale(event.target.value)}
                    className="font-mono"
                  />
                </Field>
                <Field label="Motif du recours" required htmlFor="claim-motif">
                  <Select
                    id="claim-motif"
                    value={motif}
                    onChange={(event) => setMotif(event.target.value as ReclamationMotif)}
                  >
                    {MOTIFS.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Enseignant responsable (si connu)" htmlFor="claim-teacher">
                  <Input
                    id="claim-teacher"
                    value={teacher}
                    onChange={(event) => setTeacher(event.target.value)}
                    placeholder="Ex : Dr AGOSSOU"
                  />
                </Field>
                <Field
                  label="Argumentaire détaillé"
                  required
                  hint={`${argumentaire.trim().length}/30 caractères`}
                  htmlFor="claim-argument"
                  className="sm:col-span-2"
                >
                  <Textarea
                    id="claim-argument"
                    value={argumentaire}
                    onChange={(event) => setArgumentaire(event.target.value)}
                    placeholder="Décrivez précisément l’anomalie constatée (questions non comptabilisées, erreur de report, barème…)."
                    rows={4}
                  />
                </Field>
              </div>
            </Card>

            <Card className="p-5">
              <h2 className="text-sm font-extrabold text-slate-950">Pièces obligatoires</h2>
              <div className="mt-3 space-y-2">
                {DOCUMENTS.map((doc) => {
                  const uploaded = attachments.find(
                    (attachment) => attachment.documentName === doc.label,
                  )
                  return (
                    <div
                      key={doc.key}
                      className="flex flex-col justify-between gap-2 rounded-xl border border-slate-200 p-3 sm:flex-row sm:items-center"
                    >
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-slate-900">{doc.label}</p>
                        <p className="text-[10px] text-slate-500">{doc.hint}</p>
                      </div>
                      {uploaded ? (
                        <Badge tone="success">
                          <Check className="h-3 w-3" /> {uploaded.name}
                        </Badge>
                      ) : (
                        <div className="shrink-0">
                          <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-[10px] font-bold text-slate-700 hover:border-brand-400">
                            <Upload className="h-3 w-3" /> Fichier
                            <input
                              type="file"
                              className="hidden"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(event) => {
                                const file = event.target.files?.[0]
                                if (file) addDocument(doc, file)
                              }}
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  )
                })}
                <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div>
                    <p className="text-[11px] font-bold text-slate-900">Quittance de paiement</p>
                    <p className="text-[10px] text-slate-500">
                      Générée après règlement en ligne depuis le dossier.
                    </p>
                  </div>
                  <Badge tone="neutral">Après dépôt</Badge>
                </div>
              </div>
            </Card>
          </div>

          <aside className="space-y-3 lg:sticky lg:top-24 lg:self-start">
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-br from-amber-700 to-amber-900 p-4 text-white">
                <p className="text-[10px] font-extrabold tracking-wider text-amber-100 uppercase">
                  Frais de recours
                </p>
                <p className="mt-1 font-mono text-2xl font-extrabold">
                  {fee > 0 ? formatAmount(fee, establishment.currency) : 'Gratuit'}
                </p>
                <p className="text-[10px] text-amber-100/80">Réglable en ligne, sans déplacement</p>
              </div>
              <div className="space-y-3 p-4">
                <p className="text-[11px] leading-relaxed text-slate-600">
                  Déposez d’abord le recours : les frais, s’il y en a, se règlent en ligne depuis la
                  page du dossier, et la quittance y est jointe automatiquement.
                </p>
                <Button variant="dark" className="w-full" onClick={submit} disabled={submitting}>
                  {submitting ? 'Transmission…' : 'Soumettre la réclamation'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </Card>

            <Card className="p-4">
              <p className="flex items-center gap-1.5 text-xs font-extrabold text-slate-900">
                <Info className="h-3.5 w-3.5 text-amber-700" /> Règles du guichet
              </p>
              <ul className="mt-2 space-y-1.5 text-[10px] leading-relaxed text-slate-600">
                <li>• Recours formulé dans les délais suivant la proclamation des résultats.</li>
                <li>• Vérification matérielle de la copie, sans révision du barème.</li>
                <li>• Délibération notifiée sous 5 jours ouvrés en moyenne.</li>
                <li>• Décision consignée dans un procès-verbal motivé.</li>
              </ul>
            </Card>
          </aside>
        </div>
      )}

      {tab === 'reprise' && (
        <Card className="mt-4 grid gap-5 p-6 lg:grid-cols-[1fr_300px]">
          <div>
            <Badge tone="warning">
              <Clock className="h-3 w-3" /> Redoublement d’une UE
            </Badge>
            <h2 className="mt-2 text-lg font-extrabold text-slate-950">Reprise d’une UE non validée</h2>
            <p className="mt-2 max-w-xl text-xs leading-relaxed text-slate-600">
              Si votre moyenne d’UE est inférieure au seuil de compensation, vous pouvez demander une
              réinscription pédagogique pour repasser les crédits concernés. La démarche ouvre un
              dossier d’autorisation d’émargement transmis à la scolarité et à l’enseignant.
            </p>
            <ul className="mt-4 space-y-2 text-[11px] text-slate-600">
              {[
                'Relevé de notes semestriel faisant foi',
                'Frais pédagogiques de rattrapage de 3 000 FCFA',
                'Autorisation transmise sous 48 heures',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  {item}
                </li>
              ))}
            </ul>
            <Button className="mt-5" onClick={() => navigate('/demande/reprise-ue-non-validee')}>
              Ouvrir la démarche de reprise <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          <Card className="bg-slate-50 p-4">
            <p className="text-[10px] font-extrabold tracking-wider text-slate-500 uppercase">
              Bon à savoir
            </p>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-600">
              Une réclamation sur une note peut aboutir à une validation sans reprise : déposez
              d’abord un recours si vous estimez qu’une erreur matérielle a été commise.
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-3 w-full"
              onClick={() => setTab('depot')}
            >
              Déposer un recours
            </Button>
          </Card>
        </Card>
      )}

      {tab === 'suivi' && (
        <div className="mt-4 space-y-2.5">
          {claims.length === 0 && (
            <EmptyState
              icon={<FileWarning className="h-8 w-8" />}
              title="Aucun recours déposé"
              description="Vos réclamations et demandes de reprise apparaîtront ici avec leur statut."
              action={<Button onClick={() => setTab('depot')}>Déposer une réclamation</Button>}
            />
          )}
          {claims.map((claim) => (
            <button
              key={claim.id}
              type="button"
              onClick={() => navigate(`/dossiers/${claim.id}`)}
              className="group flex w-full flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-left transition-all hover:border-amber-300 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
            >
              <span className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-700">
                  <FileText className="h-5 w-5" />
                </span>
                <span>
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-extrabold text-slate-950">{claim.actTitle}</span>
                    <StatusBadge status={claim.status} />
                  </span>
                  <span className="mt-1 block text-[11px] text-slate-500">
                    <span className="font-mono font-bold text-slate-700">{claim.id}</span> ·{' '}
                    {claim.createdAt}
                    {claim.reclamationDetails?.noteInitiale !== undefined &&
                      ` · note ${claim.reclamationDetails.noteInitiale.toFixed(2)}/20`}
                  </span>
                  {claim.reclamationDetails?.commissionDecision && (
                    <span className="mt-1.5 inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      Décision :{' '}
                      {claim.reclamationDetails.commissionDecision.decision === 'rectifiee'
                        ? `note rectifiée à ${claim.reclamationDetails.commissionDecision.noteFinale?.toFixed(2)}/20`
                        : 'note maintenue'}
                    </span>
                  )}
                </span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-amber-700" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default Reclamations
