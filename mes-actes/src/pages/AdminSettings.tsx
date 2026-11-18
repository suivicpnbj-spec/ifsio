import { useState } from 'react'
import {
  ArrowLeft,
  Building2,
  Download,
  Info,
  RotateCcw,
  Save,
  ShieldCheck,
} from 'lucide-react'
import { navigate } from '@/lib/router'
import { downloadJson } from '@/lib/utils'
import { useApp } from '@/store'
import {
  Badge,
  Button,
  Card,
  Field,
  Input,
  Textarea,
} from '@/components/ui'
import type { Establishment } from '@/types'

export function AdminSettings() {
  const {
    establishment,
    acts,
    requests,
    notifications,
    student,
    admin,
    updateEstablishment,
    changePassword,
    toast,
  } = useApp()
  const [form, setForm] = useState<Establishment>({ ...establishment })
  const [filieres, setFilieres] = useState(establishment.filieres.join('\n'))
  const [signatories, setSignatories] = useState(establishment.signatories.join('\n'))
  const [currentPassword, setCurrentPassword] = useState('')
  const [nextPassword, setNextPassword] = useState('')

  const submitPassword = async () => {
    if (nextPassword.length < 8) {
      toast('Le nouveau mot de passe doit contenir au moins 8 caractères.', 'warning')
      return
    }
    const updated = await changePassword(currentPassword, nextPassword)
    if (updated) {
      setCurrentPassword('')
      setNextPassword('')
    }
  }

  const update = <K extends keyof Establishment>(key: K, value: Establishment[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const save = () => {
    if (!form.name.trim() || !form.shortName.trim()) {
      toast('Le nom et le sigle de l’établissement sont obligatoires.', 'warning')
      return
    }
    const filiereList = filieres
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean)
    const signatoryList = signatories
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean)
    if (filiereList.length === 0 || signatoryList.length === 0) {
      toast('Renseignez au moins une filière et un signataire.', 'warning')
      return
    }
    updateEstablishment({ ...form, filieres: filiereList, signatories: signatoryList })
    toast('Paramètres de l’établissement enregistrés.', 'success')
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
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
            Paramètres de l’établissement
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-slate-600">
            Ces informations alimentent les en-têtes, les récépissés et les QR codes de
            MES ACTES.
          </p>
        </div>
        <Badge tone="brand">
          <Building2 className="h-3 w-3" /> {establishment.shortName}
        </Badge>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_320px]">
        <Card className="p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-sm font-extrabold text-slate-950">
            <Building2 className="h-4 w-4 text-brand-700" /> Identité institutionnelle
          </h2>

          <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
            <Field label="Nom complet" required htmlFor="etab-name" className="sm:col-span-2">
              <Input
                id="etab-name"
                value={form.name}
                onChange={(event) => update('name', event.target.value)}
              />
            </Field>
            <Field label="Sigle" required hint="Utilisé sur les actes" htmlFor="etab-short">
              <Input
                id="etab-short"
                value={form.shortName}
                onChange={(event) => update('shortName', event.target.value.toUpperCase())}
                className="font-mono"
              />
            </Field>
            <Field label="Tutelle / université" htmlFor="etab-university">
              <Input
                id="etab-university"
                value={form.university}
                onChange={(event) => update('university', event.target.value)}
              />
            </Field>
            <Field label="Ministère" htmlFor="etab-ministry" className="sm:col-span-2">
              <Input
                id="etab-ministry"
                value={form.ministry}
                onChange={(event) => update('ministry', event.target.value)}
              />
            </Field>
            <Field label="Pays" htmlFor="etab-country">
              <Input
                id="etab-country"
                value={form.country}
                onChange={(event) => update('country', event.target.value)}
              />
            </Field>
            <Field label="Devise" htmlFor="etab-currency">
              <Input
                id="etab-currency"
                value={form.currency}
                onChange={(event) => update('currency', event.target.value)}
              />
            </Field>
            <Field label="Devise nationale (exergue)" htmlFor="etab-motto" className="sm:col-span-2">
              <Input
                id="etab-motto"
                value={form.motto}
                onChange={(event) => update('motto', event.target.value)}
              />
            </Field>
            <Field label="Adresse" htmlFor="etab-address" className="sm:col-span-2">
              <Input
                id="etab-address"
                value={form.address}
                onChange={(event) => update('address', event.target.value)}
              />
            </Field>
            <Field label="Téléphone" htmlFor="etab-phone">
              <Input
                id="etab-phone"
                value={form.phone}
                onChange={(event) => update('phone', event.target.value)}
              />
            </Field>
            <Field label="E-mail" htmlFor="etab-email">
              <Input
                id="etab-email"
                type="email"
                value={form.email}
                onChange={(event) => update('email', event.target.value)}
              />
            </Field>
            <Field label="Site web" htmlFor="etab-website">
              <Input
                id="etab-website"
                value={form.website}
                onChange={(event) => update('website', event.target.value)}
              />
            </Field>
            <Field label="URL de vérification" htmlFor="etab-verify">
              <Input
                id="etab-verify"
                value={form.verificationBaseUrl}
                onChange={(event) => update('verificationBaseUrl', event.target.value)}
                className="font-mono text-xs"
              />
            </Field>
            <Field
              label="Intitulé du service émetteur"
              htmlFor="etab-registrar"
              className="sm:col-span-2"
            >
              <Input
                id="etab-registrar"
                value={form.registrarTitle}
                onChange={(event) => update('registrarTitle', event.target.value)}
              />
            </Field>
            <Field
              label="Filières (une par ligne)"
              required
              htmlFor="etab-filieres"
              className="sm:col-span-2"
            >
              <Textarea
                id="etab-filieres"
                rows={3}
                value={filieres}
                onChange={(event) => setFilieres(event.target.value)}
              />
            </Field>
            <Field
              label="Signataires habilités (un par ligne)"
              required
              htmlFor="etab-signatories"
              className="sm:col-span-2"
            >
              <Textarea
                id="etab-signatories"
                rows={3}
                value={signatories}
                onChange={(event) => setSignatories(event.target.value)}
              />
            </Field>
          </div>

          <div className="mt-5 flex flex-col-reverse justify-between gap-2 sm:flex-row">
            <p className="text-[10px] leading-relaxed text-slate-400">
              Les modifications s’appliquent immédiatement aux nouveaux documents générés.
            </p>
            <Button onClick={save}>
              <Save className="h-4 w-4" /> Enregistrer les paramètres
            </Button>
          </div>
        </Card>

        <aside className="space-y-3">
          <Card className="bg-brand-50/60 p-4">
            <p className="flex items-center gap-1.5 text-[11px] font-extrabold text-brand-950">
              <Info className="h-3.5 w-3.5" /> Tout est modifiable
            </p>
            <p className="mt-1.5 text-[10px] leading-relaxed text-brand-900">
              Identité, filières, signataires et tarifs sont libres de modification ici : les
              en-têtes, récépissés et documents en reprennent les libellés à chaque envoi.
            </p>
          </Card>

          <Card className="p-4">
            <p className="flex items-center gap-1.5 text-[11px] font-extrabold text-slate-900">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Mot de passe du compte
            </p>
            <div className="mt-2 space-y-2">
              <Field label="Mot de passe actuel" htmlFor="admin-current-password">
                <Input
                  id="admin-current-password"
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                />
              </Field>
              <Field
                label="Nouveau mot de passe"
                hint="8 caractères minimum"
                htmlFor="admin-new-password"
              >
                <Input
                  id="admin-new-password"
                  type="password"
                  autoComplete="new-password"
                  value={nextPassword}
                  onChange={(event) => setNextPassword(event.target.value)}
                />
              </Field>
              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                disabled={!currentPassword || nextPassword.length < 8}
                onClick={submitPassword}
              >
                Mettre à jour le mot de passe
              </Button>
            </div>
          </Card>

          <Card className="p-4">
            <p className="flex items-center gap-1.5 text-[11px] font-extrabold text-slate-900">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />{' '}
              Données de la plateforme
            </p>
            <dl className="mt-2 space-y-1.5 text-[10px]">
              {[
                ['Prestations', acts.length],
                ['Dossiers', requests.length],
                ['Notifications', notifications.length],
                ['Étudiant', `${student.firstName} ${student.lastName}`],
                ['Agent', `${admin.firstName} ${admin.lastName}`],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-2">
                  <dt className="text-slate-500">{label}</dt>
                  <dd className="font-bold text-slate-900">{value}</dd>
                </div>
              ))}
            </dl>
            <Button
              variant="secondary"
              size="sm"
              className="mt-3 w-full"
              onClick={() => {
                downloadJson(
                  { establishment: form, acts, requests, notifications, student, admin },
                  'mes-actes-donnees.json',
                )
                toast('Export JSON téléchargé.', 'success')
              }}
            >
              <Download className="h-3.5 w-3.5" /> Exporter les données
            </Button>
          </Card>

        </aside>
      </div>
    </div>
  )
}

export default AdminSettings
