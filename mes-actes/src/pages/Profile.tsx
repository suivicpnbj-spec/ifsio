import { useState } from 'react'
import {
  Archive,
  ArrowRight,
  BadgeCheck,
  BellRing,
  BookOpen,
  Check,
  CreditCard,
  QrCode,
  Save,
  ShieldCheck,
  Smartphone,
  User,
  Wallet,
} from 'lucide-react'
import { navigate } from '@/lib/router'
import { useApp } from '@/store'
import { BrandMark } from '@/components/Logo'
import {
  Badge,
  Button,
  Card,
  Field,
  Input,
  Select,
} from '@/components/ui'
import { cn } from '@/lib/utils'
import type { StudentProfile } from '@/types'

type Tab = 'identity' | 'contact' | 'security'

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'identity', label: 'Identité & cursus' },
  { id: 'contact', label: 'Contact & alertes' },
  { id: 'security', label: 'Sécurité' },
]

export function Profile() {
  const { student, establishment, requests, updateStudent, changePassword, logout, toast } = useApp()
  const [tab, setTab] = useState<Tab>('identity')
  const [form, setForm] = useState<StudentProfile>({ ...student })
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const delivered = requests.filter((request) => request.status === 'Validé').length
  const update = <K extends keyof StudentProfile>(key: K, value: StudentProfile[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const save = () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast('Le nom et le prénom sont obligatoires.', 'warning')
      return
    }
    updateStudent({
      ...form,
      lastName: form.lastName.toUpperCase(),
      initials: `${form.firstName.charAt(0)}${form.lastName.charAt(0)}`.toUpperCase(),
    })
    toast('Profil mis à jour.', 'success')
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
        <div className="h-24 bg-gradient-to-r from-brand-950 via-[#10355c] to-brand-900" />
        <div className="flex flex-col justify-between gap-4 px-5 pb-5 sm:flex-row sm:items-end sm:px-7">
          <div className="flex items-end gap-4">
            <span className="-mt-10 grid h-20 w-20 shrink-0 place-items-center rounded-2xl border-4 border-white bg-brand-900 text-xl font-extrabold text-white shadow-lg">
              {form.firstName.charAt(0)}
              {form.lastName.charAt(0)}
            </span>
            <div className="pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-950">
                  {form.firstName} {form.lastName}
                </h1>
                <Badge tone="success">
                  <BadgeCheck className="h-3 w-3" /> Compte actif
                </Badge>
              </div>
              <p className="mt-0.5 text-[11px] text-slate-500">
                {form.filiere} · {form.promotion} ·{' '}
                <span className="font-mono font-bold text-slate-700">{form.matricule}</span>
              </p>
            </div>
          </div>
          <div className="flex gap-2 pb-1">
            <div className="rounded-xl bg-slate-50 px-3 py-2 text-center">
              <p className="font-mono text-base font-extrabold text-slate-950">{requests.length}</p>
              <p className="text-[9px] text-slate-500">dossiers</p>
            </div>
            <div className="rounded-xl bg-slate-50 px-3 py-2 text-center">
              <p className="font-mono text-base font-extrabold text-emerald-700">{delivered}</p>
              <p className="text-[9px] text-slate-500">dossiers validés</p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick links */}
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { icon: BookOpen, label: 'Catalogue des actes', path: '/catalogue' },
          { icon: BadgeCheck, label: 'Mes dossiers', path: '/dossiers' },
          { icon: BellRing, label: 'Réclamations', path: '/reclamations' },
          { icon: Archive, label: 'Aide & contact', path: '/aide' },
        ].map((item) => (
          <button
            key={item.path}
            type="button"
            onClick={() => navigate(item.path)}
            className="group flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-[11px] font-bold text-slate-700 transition-colors hover:border-brand-300 hover:text-brand-900"
          >
            <item.icon className="h-4 w-4 text-brand-700" />
            <span className="flex-1">{item.label}</span>
            <ArrowRight className="h-3 w-3 text-slate-300 group-hover:text-brand-700" />
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div className="mt-5 flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1 sm:inline-flex">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              'rounded-lg px-3 py-2 text-[11px] font-bold transition-colors',
              tab === item.id ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_300px]">
        <Card className="p-5 sm:p-6">
          {tab === 'identity' && (
            <>
              <h2 className="flex items-center gap-2 text-sm font-extrabold text-slate-950">
                <User className="h-4 w-4 text-brand-700" /> Informations académiques
              </h2>
              <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
                <Field label="Prénom" required htmlFor="profile-first">
                  <Input
                    id="profile-first"
                    value={form.firstName}
                    onChange={(event) => update('firstName', event.target.value)}
                  />
                </Field>
                <Field label="Nom" required htmlFor="profile-last">
                  <Input
                    id="profile-last"
                    value={form.lastName}
                    onChange={(event) => update('lastName', event.target.value)}
                  />
                </Field>
                <Field label="Matricule" hint="Attribué par l’établissement" htmlFor="profile-matricule">
                  <Input id="profile-matricule" value={form.matricule} disabled className="font-mono" />
                </Field>
                <Field label="INE" htmlFor="profile-ine">
                  <Input
                    id="profile-ine"
                    value={form.ine ?? ''}
                    onChange={(event) => update('ine', event.target.value)}
                    className="font-mono"
                  />
                </Field>
                <Field label="Filière" htmlFor="profile-filiere" className="sm:col-span-2">
                  <Select
                    id="profile-filiere"
                    value={form.filiere}
                    onChange={(event) => update('filiere', event.target.value)}
                  >
                    {establishment.filieres.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Promotion" htmlFor="profile-promotion">
                  <Select
                    id="profile-promotion"
                    value={form.promotion}
                    onChange={(event) => update('promotion', event.target.value)}
                  >
                    {['Licence 1', 'Licence 2', 'Licence 3', 'Master 1', 'Master 2', 'Diplômé'].map(
                      (item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ),
                    )}
                  </Select>
                </Field>
                <Field label="Nationalité" htmlFor="profile-nationality">
                  <Input
                    id="profile-nationality"
                    value={form.nationality ?? ''}
                    onChange={(event) => update('nationality', event.target.value)}
                  />
                </Field>
                <Field label="Date de naissance" htmlFor="profile-birth">
                  <Input
                    id="profile-birth"
                    value={form.birthDate ?? ''}
                    onChange={(event) => update('birthDate', event.target.value)}
                    placeholder="12 novembre 2002"
                  />
                </Field>
                <Field label="Lieu de naissance" htmlFor="profile-birthplace">
                  <Input
                    id="profile-birthplace"
                    value={form.birthPlace ?? ''}
                    onChange={(event) => update('birthPlace', event.target.value)}
                  />
                </Field>
                <Field label="Adresse" htmlFor="profile-address" className="sm:col-span-2">
                  <Input
                    id="profile-address"
                    value={form.address ?? ''}
                    onChange={(event) => update('address', event.target.value)}
                  />
                </Field>
              </div>
              <div className="mt-5 flex justify-end">
                <Button onClick={save}>
                  <Save className="h-4 w-4" /> Enregistrer
                </Button>
              </div>
            </>
          )}

          {tab === 'contact' && (
            <>
              <h2 className="flex items-center gap-2 text-sm font-extrabold text-slate-950">
                <Smartphone className="h-4 w-4 text-brand-700" /> Coordonnées & alertes
              </h2>
              <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
                <Field label="E-mail" htmlFor="profile-email">
                  <Input
                    id="profile-email"
                    type="email"
                    value={form.email}
                    onChange={(event) => update('email', event.target.value)}
                  />
                </Field>
                <Field label="Téléphone" htmlFor="profile-phone">
                  <Input
                    id="profile-phone"
                    value={form.phone}
                    onChange={(event) => update('phone', event.target.value)}
                  />
                </Field>
                <Field label="Contact d’urgence" htmlFor="profile-emergency" className="sm:col-span-2">
                  <Input
                    id="profile-emergency"
                    value={form.emergencyContact ?? ''}
                    onChange={(event) => update('emergencyContact', event.target.value)}
                  />
                </Field>
              </div>

              <div className="mt-5 space-y-2">
                <p className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                  <BellRing className="h-3.5 w-3.5 text-brand-700" /> Canaux de notification
                </p>
                {[
                  {
                    key: 'smsAlerts' as const,
                    title: 'Alertes SMS',
                    text: 'Notification à chaque changement de statut d’un dossier.',
                  },
                  {
                    key: 'emailAlerts' as const,
                    title: 'Alertes e-mail',
                    text: 'Récépissés, demandes de complément et actes délivrés.',
                  },
                ].map((item) => (
                  <label
                    key={item.key}
                    className="flex cursor-pointer items-start justify-between gap-3 rounded-xl border border-slate-200 p-3"
                  >
                    <span>
                      <span className="block text-[11px] font-bold text-slate-900">{item.title}</span>
                      <span className="mt-0.5 block text-[10px] text-slate-500">{item.text}</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={form[item.key]}
                      onChange={(event) => update(item.key, event.target.checked)}
                      className="mt-1 h-4 w-4 accent-brand-700"
                    />
                  </label>
                ))}
              </div>
              <div className="mt-5 flex justify-end">
                <Button onClick={save}>
                  <Save className="h-4 w-4" /> Enregistrer
                </Button>
              </div>
            </>
          )}

          {tab === 'security' && (
            <>
              <h2 className="flex items-center gap-2 text-sm font-extrabold text-slate-950">
                <ShieldCheck className="h-4 w-4 text-emerald-600" /> Sécurité du compte
              </h2>
              <div className="mt-4 grid max-w-md gap-3">
                <Field label="Mot de passe actuel" htmlFor="old-password">
                  <Input
                    id="old-password"
                    type="password"
                    value={oldPassword}
                    onChange={(event) => setOldPassword(event.target.value)}
                    placeholder="••••••••"
                  />
                </Field>
                <Field label="Nouveau mot de passe" htmlFor="new-password">
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder="8 caractères minimum"
                  />
                </Field>
                <Field label="Confirmation" htmlFor="confirm-password">
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                  />
                </Field>
                <Button
                  onClick={async () => {
                    if (!oldPassword || newPassword.length < 8 || newPassword !== confirmPassword) {
                      toast(
                        'Vérifiez le mot de passe actuel, la longueur et la confirmation.',
                        'warning',
                      )
                      return
                    }
                    const updated = await changePassword(oldPassword, newPassword)
                    if (!updated) return
                    setOldPassword('')
                    setNewPassword('')
                    setConfirmPassword('')
                  }}
                >
                  Mettre à jour le mot de passe
                </Button>
              </div>

              <div className="mt-6 border-t border-slate-100 pt-4">
                <p className="text-[11px] font-bold text-slate-900">Sessions actives</p>
                <div className="mt-2 space-y-2">
                  {[
                    { device: 'Chrome · Linux', place: 'Parakou, Bénin', current: true },
                    { device: 'Application mobile', place: 'Cotonou, Bénin', current: false },
                  ].map((item) => (
                    <div
                      key={item.device}
                      className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 p-2.5 text-[11px]"
                    >
                      <span>
                        <span className="font-bold text-slate-900">{item.device}</span>
                        <span className="ml-1 text-slate-500">· {item.place}</span>
                      </span>
                      {item.current ? (
                        <Badge tone="success">Session courante</Badge>
                      ) : (
                        <Badge tone="neutral">Active</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <Button
                variant="danger"
                className="mt-5"
                onClick={() => {
                  logout()
                  navigate('/')
                  toast('Vous êtes déconnecté.', 'info')
                }}
              >
                Se déconnecter
              </Button>
            </>
          )}
        </Card>

        <aside className="space-y-3">
          <Card className="p-4">
            <p className="text-[11px] font-extrabold text-slate-900">Compte étudiant</p>
            <dl className="mt-2 space-y-1.5 text-[11px]">
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Statut</dt>
                <dd className="font-semibold text-emerald-700">Inscription active</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Rôle</dt>
                <dd className="font-semibold text-slate-900">{form.role}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Établissement</dt>
                <dd className="max-w-[65%] text-right font-semibold text-slate-900">
                  {establishment.shortName}
                </dd>
              </div>
            </dl>
          </Card>
          <Card className="p-4">
            <p className="text-[10px] leading-relaxed text-slate-500">
              Ces informations proviennent de votre compte sur la plateforme. Pour corriger
              votre nom, matricule ou filière, adressez une demande à la scolarité de l’IFSIO.
            </p>
          </Card>
        </aside>
      </div>
    </div>
  )
}

export default Profile
