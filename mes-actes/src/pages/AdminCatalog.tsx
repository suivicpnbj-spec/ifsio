import { useMemo, useState } from 'react'
import {
  ArrowLeft,
  Check,
  FileText,
  Pencil,
  Plus,
  Search,
  Settings2,
  Trash2,
} from 'lucide-react'
import { navigate } from '@/lib/router'
import { CATEGORY_LABELS } from '@/data/establishment'
import { formatAmount } from '@/lib/utils'
import { useApp } from '@/store'
import { ActIcon, serviceLabel } from '@/components/ActCard'
import {
  Badge,
  Button,
  Card,
  Field,
  Input,
  Modal,
  Select,
  Textarea,
} from '@/components/ui'
import type {
  ActItem,
  Audience,
  CategoryId,
  DynamicFormField,
  RequiredDocument,
  ServiceType,
} from '@/types'

const AUDIENCES: Audience[] = ['Étudiants', 'Diplômés', 'Tous']

/** Brouillon d'une prestation à créer (l'identifiant est généré côté serveur). */
function blankAct(): ActItem {
  return {
    id: '',
    title: '',
    shortDescription: '',
    category: 'scolarite',
    categoryLabel: CATEGORY_LABELS.scolarite,
    serviceType: 'act',
    audience: 'Étudiants',
    deliveryMode: 'Retrait',
    delay: '',
    feeAmount: 0,
    eligibilityConditions: [],
    requiredDocuments: [],
    deliveryDetails: '',
    iconType: 'certificate',
    specificFields: [],
    popular: false,
    active: true,
  }
}

export function AdminCatalog() {
  const { acts, establishment, updateAct, createAct, deleteAct, toast } = useApp()
  const [query, setQuery] = useState('')
  const [type, setType] = useState<'all' | ServiceType>('all')
  const [mode, setMode] = useState<'edit' | 'create'>('edit')
  const [editing, setEditing] = useState<ActItem | null>(null)
  const [draft, setDraft] = useState<ActItem | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [busy, setBusy] = useState(false)

  const visible = useMemo(() => {
    const search = query.trim().toLowerCase()
    return acts.filter((act) => {
      if (type !== 'all' && act.serviceType !== type) return false
      if (!search) return true
      return (
        act.title.toLowerCase().includes(search) ||
        act.id.toLowerCase().includes(search) ||
        act.categoryLabel.toLowerCase().includes(search)
      )
    })
  }, [acts, type, query])

  const openEditor = (act: ActItem) => {
    setMode('edit')
    setConfirmDelete(false)
    setEditing(act)
    setDraft({ ...act })
  }

  const startCreate = () => {
    setMode('create')
    setConfirmDelete(false)
    setEditing(null)
    setDraft(blankAct())
  }

  const closeEditor = () => {
    setEditing(null)
    setDraft(null)
    setConfirmDelete(false)
  }

  const save = async () => {
    if (!draft || busy) return
    if (!draft.title.trim()) {
      toast('Le nom de la prestation est obligatoire.', 'warning')
      return
    }

    const payload: ActItem = {
      ...draft,
      title: draft.title.trim(),
      shortDescription: draft.shortDescription.trim(),
      feeAmount: Number(draft.feeAmount) || 0,
      deliveryDetails: draft.deliveryDetails.trim(),
      eligibilityConditions: draft.eligibilityConditions
        .map((condition) => condition.trim())
        .filter(Boolean),
      requiredDocuments: draft.requiredDocuments
        .map((document) => ({
          ...document,
          name: document.name.trim(),
          details: document.details?.trim() || undefined,
        }))
        .filter((document) => document.name),
      specificFields: draft.specificFields
        ?.map((field) => ({
          ...field,
          label: field.label.trim(),
          options: field.options?.map((option) => option.trim()).filter(Boolean),
        }))
        .filter((field) => field.label),
    }

    setBusy(true)
    try {
      if (mode === 'create') {
        await createAct(payload)
      } else {
        await updateAct(payload)
      }
      closeEditor()
    } catch {
      /* Le store a déjà notifié l'erreur : on garde le modal ouvert. */
    } finally {
      setBusy(false)
    }
  }

  /* Suppression à deux clics : le premier arme la confirmation. */
  const remove = async () => {
    if (!editing || busy) return
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }

    setBusy(true)
    try {
      await deleteAct(editing.id)
      closeEditor()
    } catch {
      /* 409 (dossiers rattachés) déjà notifié par le store. */
    } finally {
      setBusy(false)
      setConfirmDelete(false)
    }
  }

  /* ── Édition libre des tableaux (pièces, conditions, champs) ── */

  const updateDocument = (index: number, patch: Partial<RequiredDocument>) => {
    if (!draft) return
    setDraft({
      ...draft,
      requiredDocuments: draft.requiredDocuments.map((document, position) =>
        position === index ? { ...document, ...patch } : document,
      ),
    })
  }

  const updateCondition = (index: number, value: string) => {
    if (!draft) return
    setDraft({
      ...draft,
      eligibilityConditions: draft.eligibilityConditions.map((condition, position) =>
        position === index ? value : condition,
      ),
    })
  }

  const updateSpecificField = (index: number, patch: Partial<DynamicFormField>) => {
    if (!draft) return
    setDraft({
      ...draft,
      specificFields: (draft.specificFields ?? []).map((field, position) =>
        position === index ? { ...field, ...patch } : field,
      ),
    })
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={() => navigate('/admin')}
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-brand-800"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Retour à la file d’instruction
      </button>

      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-[11px] font-extrabold tracking-[0.16em] text-brand-700 uppercase">
            Administration
          </p>
          <h1 className="mt-1 text-2xl font-extrabold text-slate-950 sm:text-3xl">
            Catalogue & tarifs
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-slate-600">
            {acts.length} prestations configurées pour {establishment.shortName}. Tout est modifiable
            à tout moment : libellés, pièces à fournir, conditions, frais, champs du formulaire et
            visibilité.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={startCreate}>
            <Plus className="h-3.5 w-3.5" /> Nouvelle prestation
          </Button>
          <Badge tone="brand">
            <Settings2 className="h-3 w-3" /> Édition en direct
          </Badge>
          <Button variant="secondary" size="sm" onClick={() => navigate('/admin/parametres')}>
            Paramètres
          </Button>
        </div>
      </div>

      <Card className="mt-5 overflow-hidden">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute top-3.5 left-3.5 h-4 w-4 text-slate-400" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher une prestation…"
              className="pl-10"
              aria-label="Rechercher une prestation"
            />
          </div>
          <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">
            {[
              { id: 'all' as const, label: `Tous (${acts.length})` },
              { id: 'act' as const, label: `Actes (${acts.filter((act) => act.serviceType === 'act').length})` },
              {
                id: 'procedure' as const,
                label: `Démarches (${acts.filter((act) => act.serviceType === 'procedure').length})`,
              },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setType(item.id)}
                className={`rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition-colors ${
                  type === item.id ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-3">Prestation</th>
                <th className="px-4 py-3">Catégorie</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Délai</th>
                <th className="px-4 py-3">Frais</th>
                <th className="px-4 py-3">Pièces</th>
                <th className="px-4 py-3">Visibilité</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visible.map((act) => (
                <tr key={act.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700">
                        <ActIcon type={act.iconType} className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="max-w-[260px] truncate font-bold text-slate-900">{act.title}</p>
                        <p className="font-mono text-[9px] text-slate-400">{act.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{act.categoryLabel}</td>
                  <td className="px-4 py-3">
                    <Badge tone={act.serviceType === 'procedure' ? 'warning' : 'brand'}>
                      {serviceLabel(act)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-800">{act.delay}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        act.feeAmount > 0 ? 'font-bold text-amber-700' : 'font-bold text-emerald-700'
                      }
                    >
                      {formatAmount(act.feeAmount, establishment.currency)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{act.requiredDocuments.length}</td>
                  <td className="px-4 py-3">
                    {act.active === false ? (
                      <Badge tone="neutral">Masquée</Badge>
                    ) : (
                      <Badge tone="success">
                        <Check className="h-3 w-3" /> Active
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="secondary" onClick={() => openEditor(act)}>
                      <Pencil className="h-3 w-3" /> Paramétrer
                    </Button>
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-[11px] text-slate-400">
                    Aucune prestation ne correspond à cette recherche.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={Boolean(draft)}
        onClose={closeEditor}
        title={mode === 'create' ? 'Nouvelle prestation' : 'Paramétrer la prestation'}
        subtitle={
          mode === 'create'
            ? 'Renseignez la fiche puis enregistrez — elle apparaîtra au catalogue.'
            : editing
              ? `${editing.title} · ${editing.id}`
              : ''
        }
        size="lg"
        footer={
          <>
            {mode === 'edit' && editing && (
              <div className="flex w-full flex-col gap-2 sm:mr-auto sm:w-auto sm:flex-row sm:items-center">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={remove}
                  disabled={busy}
                  className="w-full sm:w-auto"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {confirmDelete ? 'Confirmer la suppression' : 'Supprimer'}
                </Button>
                {confirmDelete && (
                  <span className="text-[10px] font-semibold text-rose-600">
                    Aucun dossier ne doit être rattaché à cette prestation.
                  </span>
                )}
              </div>
            )}
            <Button variant="secondary" size="sm" onClick={closeEditor}>
              Annuler
            </Button>
            <Button size="sm" onClick={save} disabled={busy}>
              <FileText className="h-3.5 w-3.5" />
              {mode === 'create' ? 'Ajouter au catalogue' : 'Enregistrer'}
            </Button>
          </>
        }
      >
        {draft && (
          <div className="grid gap-3.5 p-5 sm:grid-cols-2">
            <Field label="Nom de la prestation" required htmlFor="act-title" className="sm:col-span-2">
              <Input
                id="act-title"
                value={draft.title}
                onChange={(event) => setDraft({ ...draft, title: event.target.value })}
              />
            </Field>
            <Field label="Description" htmlFor="act-description" className="sm:col-span-2">
              <Textarea
                id="act-description"
                rows={2}
                value={draft.shortDescription}
                onChange={(event) => setDraft({ ...draft, shortDescription: event.target.value })}
              />
            </Field>
            <Field label="Délai indicatif" htmlFor="act-delay">
              <Input
                id="act-delay"
                value={draft.delay}
                onChange={(event) => setDraft({ ...draft, delay: event.target.value })}
              />
            </Field>
            <Field label={`Frais (${establishment.currency})`} htmlFor="act-fee">
              <Input
                id="act-fee"
                type="number"
                min="0"
                step="500"
                value={draft.feeAmount}
                onChange={(event) =>
                  setDraft({ ...draft, feeAmount: Number(event.target.value) })
                }
                className="font-mono"
              />
            </Field>
            <Field label="Note de frais" htmlFor="act-feenote">
              <Input
                id="act-feenote"
                value={draft.feeNote ?? ''}
                onChange={(event) => setDraft({ ...draft, feeNote: event.target.value })}
                placeholder="Ex : frais de chancellerie académique"
              />
            </Field>
            <Field label="Catégorie" htmlFor="act-category">
              <Select
                id="act-category"
                value={draft.category}
                onChange={(event) => {
                  const category = event.target.value as CategoryId
                  setDraft({ ...draft, category, categoryLabel: CATEGORY_LABELS[category] })
                }}
              >
                {(Object.keys(CATEGORY_LABELS) as CategoryId[]).map((categoryId) => (
                  <option key={categoryId} value={categoryId}>
                    {CATEGORY_LABELS[categoryId]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Type de service" htmlFor="act-service">
              <Select
                id="act-service"
                value={draft.serviceType}
                onChange={(event) =>
                  setDraft({ ...draft, serviceType: event.target.value as ServiceType })
                }
              >
                <option value="act">Acte administratif</option>
                <option value="procedure">Démarche</option>
              </Select>
            </Field>
            <Field label="Public concerné" htmlFor="act-audience">
              <Select
                id="act-audience"
                value={draft.audience}
                onChange={(event) => setDraft({ ...draft, audience: event.target.value as Audience })}
              >
                {AUDIENCES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Remise de l’acte (texte affiché sur la fiche)" htmlFor="act-delivery" className="sm:col-span-2">
              <Textarea
                id="act-delivery"
                rows={2}
                value={draft.deliveryDetails}
                onChange={(event) => setDraft({ ...draft, deliveryDetails: event.target.value })}
              />
            </Field>

            <div className="space-y-2 sm:col-span-2">
              <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-slate-200 p-3 text-[11px]">
                <input
                  type="checkbox"
                  checked={draft.active !== false}
                  onChange={(event) => setDraft({ ...draft, active: event.target.checked })}
                  className="mt-0.5 h-4 w-4 accent-brand-700"
                />
                <span>
                  <span className="block font-bold text-slate-900">Visible dans le catalogue public</span>
                  <span className="block text-[10px] text-slate-500">
                    Décochez pour masquer temporairement cette prestation aux usagers.
                  </span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-slate-200 p-3 text-[11px]">
                <input
                  type="checkbox"
                  checked={draft.popular === true}
                  onChange={(event) => setDraft({ ...draft, popular: event.target.checked })}
                  className="mt-0.5 h-4 w-4 accent-brand-700"
                />
                <span>
                  <span className="block font-bold text-slate-900">
                    Mis en avant (« Démarches fréquentes »)
                  </span>
                  <span className="block text-[10px] text-slate-500">
                    Jusqu’à 4 prestations mises en avant sur la page d’accueil.
                  </span>
                </span>
              </label>
            </div>

            {/* Conditions d’éligibilité */}
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-bold text-slate-700">
                  Conditions d’éligibilité ({draft.eligibilityConditions.length})
                </p>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      eligibilityConditions: [...draft.eligibilityConditions, ''],
                    })
                  }
                >
                  <Plus className="h-3.5 w-3.5" /> Ajouter une condition
                </Button>
              </div>
              {draft.eligibilityConditions.length === 0 && (
                <p className="mt-1.5 text-[10px] text-slate-500">
                  Aucune condition affichée sur la fiche publique.
                </p>
              )}
              {draft.eligibilityConditions.map((condition, index) => (
                <div key={`condition-${index}`} className="mt-2 flex items-center gap-2">
                  <Input
                    value={condition}
                    placeholder="Ex : Être inscrit régulièrement pour l’année en cours"
                    aria-label={`Condition ${index + 1}`}
                    onChange={(event) => updateCondition(index, event.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setDraft({
                        ...draft,
                        eligibilityConditions: draft.eligibilityConditions.filter(
                          (_, position) => position !== index,
                        ),
                      })
                    }
                    className="shrink-0 rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                    aria-label={`Supprimer la condition ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Pièces à fournir */}
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-bold text-slate-700">
                  Pièces à fournir ({draft.requiredDocuments.length})
                </p>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      requiredDocuments: [
                        ...draft.requiredDocuments,
                        { name: '', details: '', mandatory: true },
                      ],
                    })
                  }
                >
                  <Plus className="h-3.5 w-3.5" /> Ajouter une pièce
                </Button>
              </div>
              {draft.requiredDocuments.length === 0 && (
                <p className="mt-1.5 text-[10px] text-slate-500">
                  Aucune pièce demandée : l’usager dépose son dossier sans justificatif.
                </p>
              )}
              {draft.requiredDocuments.map((document, index) => (
                <div
                  key={`piece-${index}`}
                  className="mt-2 rounded-xl border border-slate-200 p-2.5"
                >
                  <div className="grid gap-2 sm:grid-cols-[1fr_1fr_2rem]">
                    <Input
                      value={document.name}
                      placeholder="Nom de la pièce"
                      aria-label={`Pièce ${index + 1}`}
                      onChange={(event) => updateDocument(index, { name: event.target.value })}
                    />
                    <Input
                      value={document.details ?? ''}
                      placeholder="Précision (ex. : moins de 3 mois)"
                      onChange={(event) => updateDocument(index, { details: event.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setDraft({
                          ...draft,
                          requiredDocuments: draft.requiredDocuments.filter(
                            (_, position) => position !== index,
                          ),
                        })
                      }
                      className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                      aria-label={`Supprimer la pièce ${index + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <label className="mt-2 flex cursor-pointer items-center gap-2 text-[10px] font-bold text-slate-600">
                    <input
                      type="checkbox"
                      checked={document.mandatory}
                      onChange={(event) =>
                        updateDocument(index, { mandatory: event.target.checked })
                      }
                      className="h-3.5 w-3.5 accent-brand-700"
                    />
                    Pièce obligatoire (bloque le dépôt tant qu’elle manque)
                  </label>
                </div>
              ))}
            </div>

            {/* Champs spécifiques du formulaire */}
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-bold text-slate-700">
                  Champs spécifiques du formulaire (
                  {(draft.specificFields ?? []).length})
                </p>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      specificFields: [
                        ...(draft.specificFields ?? []),
                        {
                          id: `champ-${Date.now().toString(36)}`,
                          label: '',
                          type: 'text',
                          required: true,
                          placeholder: '',
                        },
                      ],
                    })
                  }
                >
                  <Plus className="h-3.5 w-3.5" /> Ajouter un champ
                </Button>
              </div>
              {(draft.specificFields ?? []).length === 0 && (
                <p className="mt-1.5 text-[10px] text-slate-500">
                  Aucun champ supplémentaire demandé au dépôt.
                </p>
              )}
              {(draft.specificFields ?? []).map((field, index) => (
                <div key={field.id} className="mt-2 rounded-xl border border-slate-200 p-2.5">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input
                      value={field.label}
                      placeholder="Libellé du champ"
                      aria-label={`Champ ${index + 1}`}
                      onChange={(event) => updateSpecificField(index, { label: event.target.value })}
                    />
                    <Select
                      value={field.type}
                      aria-label={`Type du champ ${index + 1}`}
                      onChange={(event) =>
                        updateSpecificField(index, {
                          type: event.target.value as DynamicFormField['type'],
                        })
                      }
                    >
                      <option value="text">Texte court</option>
                      <option value="textarea">Texte long</option>
                      <option value="select">Liste déroulante</option>
                      <option value="date">Date</option>
                      <option value="number">Nombre</option>
                    </Select>
                    <Input
                      value={field.placeholder ?? ''}
                      placeholder="Texte d’exemple"
                      onChange={(event) =>
                        updateSpecificField(index, { placeholder: event.target.value })
                      }
                    />
                    <Input
                      value={field.options?.join(', ') ?? ''}
                      placeholder="Options si liste (séparées par des virgules)"
                      disabled={field.type !== 'select'}
                      onChange={(event) =>
                        updateSpecificField(index, {
                          options: event.target.value
                            .split(',')
                            .map((option) => option.trim())
                            .filter(Boolean),
                        })
                      }
                    />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <label className="flex cursor-pointer items-center gap-2 text-[10px] font-bold text-slate-600">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(event) =>
                          updateSpecificField(index, { required: event.target.checked })
                        }
                        className="h-3.5 w-3.5 accent-brand-700"
                      />
                      Champ obligatoire
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setDraft({
                          ...draft,
                          specificFields: (draft.specificFields ?? []).filter(
                            (_, position) => position !== index,
                          ),
                        })
                      }
                      className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                      aria-label={`Supprimer le champ ${index + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default AdminCatalog
