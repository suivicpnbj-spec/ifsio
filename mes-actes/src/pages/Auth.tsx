import { useState, type FormEvent } from 'react'
import {
  ArrowRight,
  CheckCircle2,
  GraduationCap,
  Lock,
  ShieldCheck,
  Sparkles,
  User,
} from 'lucide-react'
import { errorMessage } from '@/lib/api'
import { navigate } from '@/lib/router'
import { useApp } from '@/store'
import { BrandMark } from '@/components/Logo'
import { AlertCircle } from 'lucide-react'
import { Button, Field, Input, Select } from '@/components/ui'


export function Auth({ mode }: { mode: 'login' | 'register' }) {
  const { establishment, login, register, toast } = useApp()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [matricule, setMatricule] = useState('')
  const [filiere, setFiliere] = useState(establishment.filieres[0] ?? '')
  const [promotion, setPromotion] = useState('Licence 1')
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [consent, setConsent] = useState(false)
  const [pending, setPending] = useState(false)

  const submitLogin = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setPending(true)
    try {
      const role = await login(email, password)
      toast('Connexion réussie.', 'success')
      navigate(role === 'admin' ? '/admin' : '/dossiers')
    } catch (error) {
      setError(errorMessage(error, 'Identifiants incorrects.'))
    } finally {
      setPending(false)
    }
  }

  const submitRegister = async (event: FormEvent) => {
    event.preventDefault()
    if (!firstName.trim() || !lastName.trim() || !registerEmail.includes('@') || !matricule.trim()) {
      toast('Renseignez votre nom, prénom, e-mail et matricule.', 'warning')
      return
    }
    if (registerPassword.length < 8) {
      toast('Le mot de passe doit contenir au moins 8 caractères.', 'warning')
      return
    }
    if (!consent) {
      toast('Vous devez accepter les conditions d’utilisation.', 'warning')
      return
    }
    setPending(true)
    try {
      await register({
        firstName,
        lastName,
        email: registerEmail,
        password: registerPassword,
        matricule,
        filiere,
        promotion,
      })
      toast('Compte créé. Bienvenue sur MES ACTES !', 'success')
      navigate('/dossiers')
    } catch (error) {
      toast(errorMessage(error, 'La création du compte a échoué.'), 'error')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-76px)] bg-slate-50">
      <div className="mx-auto grid max-w-6xl gap-0 px-4 py-8 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-12">
        {/* Visual panel */}
        <div className="relative hidden overflow-hidden rounded-l-3xl bg-gradient-to-br from-brand-950 via-[#10355c] to-[#0a2145] p-8 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="pointer-events-none absolute -top-16 -right-16 h-64 w-64 rounded-full bg-brand-500/15 blur-3xl" />
          <div className="relative">
            <BrandMark className="h-12 w-12" />
            <p className="mt-6 text-[10px] font-extrabold tracking-[0.2em] text-brand-200 uppercase">
              {establishment.shortName} · {establishment.university}
            </p>
            <h2 className="mt-2 text-2xl leading-tight font-extrabold">
              {mode === 'login'
                ? 'Vos démarches vous suivent, où que vous soyez.'
                : 'Un seul compte pour toutes vos démarches.'}
            </h2>
            <p className="mt-3 max-w-sm text-xs leading-relaxed text-brand-100/85">
              {mode === 'login'
                ? 'Retrouvez vos dossiers, vos récépissés et vos actes officiels dans un espace sécurisé.'
                : 'Créez votre espace pour déposer vos demandes et suivre leurs instructions en ligne.'}
            </p>
          </div>
          <ul className="relative space-y-2.5 text-[11px] text-brand-100">              {[
              { icon: ShieldCheck, text: 'Dépôt en ligne 24 h/24, sans déplacement' },
              { icon: GraduationCap, text: 'Suivi complet de chaque dossier' },
              { icon: CheckCircle2, text: 'Récépissé immédiat à chaque dépôt' },
            ].map((item) => (
              <li key={item.text} className="flex items-center gap-2">
                <item.icon className="h-4 w-4 text-emerald-300" /> {item.text}
              </li>
            ))}
          </ul>            <p className="relative text-[9px] text-brand-200/60">
              Données hébergées sur le serveur de l’établissement.
            </p>
        </div>

        {/* Form panel */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8 lg:rounded-l-none lg:border-l-0">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold tracking-widest text-brand-700 uppercase">
              {mode === 'login' ? 'Connexion' : 'Inscription'}
            </span>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-[11px] font-semibold text-slate-500 hover:text-brand-800"
            >
              ← Accueil
            </button>
          </div>
          <h1 className="mt-2 text-2xl font-extrabold text-slate-950">
            {mode === 'login' ? 'Heureux de vous revoir' : 'Créer mon compte étudiant'}
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            {mode === 'login'
              ? 'Connectez-vous pour accéder à votre espace.'
              : 'Quelques informations suffisent pour commencer.'}
          </p>

          {mode === 'login' ? (
            <>
              <form className="mt-5 space-y-3.5" onSubmit={submitLogin}>
                <Field label="Adresse e-mail" required htmlFor="login-email">
                  <Input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value)
                      setError('')
                    }}
                    placeholder="vous@exemple.com"
                  />
                </Field>
                <Field label="Mot de passe" required htmlFor="login-password">
                  <Input
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value)
                      setError('')
                    }}
                    placeholder="••••••••"
                  />
                </Field>

                {error && (
                  <p className="flex items-start gap-1.5 rounded-lg bg-rose-50 p-2.5 text-[11px] font-semibold text-rose-700">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {error}
                  </p>
                )}

                <Button type="submit" className="w-full" disabled={pending}>
                  {pending ? 'Connexion…' : 'Se connecter'} <ArrowRight className="h-4 w-4" />
                </Button>
              </form>


              <p className="mt-4 text-center text-[11px] text-slate-500">
                Pas encore de compte ?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/inscription')}
                  className="font-bold text-brand-800 hover:underline"
                >
                  Créer un compte
                </button>
              </p>
            </>
          ) : (
            <>
              <form className="mt-5 space-y-3.5" onSubmit={submitRegister}>
                <div className="grid gap-3.5 sm:grid-cols-2">
                  <Field label="Prénom" required htmlFor="register-first">
                    <Input
                      id="register-first"
                      value={firstName}
                      onChange={(event) => setFirstName(event.target.value)}
                      placeholder="Moussa"
                    />
                  </Field>
                  <Field label="Nom" required htmlFor="register-last">
                    <Input
                      id="register-last"
                      value={lastName}
                      onChange={(event) => setLastName(event.target.value)}
                      placeholder="DIALLO"
                    />
                  </Field>
                </div>
                <Field label="Matricule" required htmlFor="register-matricule">
                  <Input
                    id="register-matricule"
                    value={matricule}
                    onChange={(event) => setMatricule(event.target.value)}
                    placeholder="IFSIO2025-00123"
                    className="font-mono"
                  />
                </Field>
                <div className="grid gap-3.5 sm:grid-cols-2">
                  <Field label="Filière" required htmlFor="register-filiere">
                    <Select
                      id="register-filiere"
                      value={filiere}
                      onChange={(event) => setFiliere(event.target.value)}
                    >
                      {establishment.filieres.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Niveau" required htmlFor="register-level">
                    <Select
                      id="register-level"
                      value={promotion}
                      onChange={(event) => setPromotion(event.target.value)}
                    >
                      {['Licence 1', 'Licence 2', 'Licence 3', 'Master 1', 'Master 2'].map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
                <Field label="Adresse e-mail" required htmlFor="register-email">
                  <Input
                    id="register-email"
                    type="email"
                    value={registerEmail}
                    onChange={(event) => setRegisterEmail(event.target.value)}
                    placeholder="vous@exemple.com"
                  />
                </Field>
                <Field label="Mot de passe" required hint="8 caractères minimum" htmlFor="register-password">
                  <Input
                    id="register-password"
                    type="password"
                    value={registerPassword}
                    onChange={(event) => setRegisterPassword(event.target.value)}
                    placeholder="••••••••"
                  />
                </Field>
                <label className="flex cursor-pointer items-start gap-2.5 text-[11px] text-slate-600">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(event) => setConsent(event.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-brand-700"
                  />
                  J’accepte les conditions d’utilisation et la politique de confidentialité de la
                  plateforme.
                </label>
                <Button type="submit" className="w-full" disabled={pending}>
                  <Sparkles className="h-4 w-4" /> {pending ? 'Création…' : 'Créer mon compte'}
                </Button>
              </form>
              <p className="mt-4 text-center text-[11px] text-slate-500">
                Vous avez déjà un compte ?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/connexion')}
                  className="font-bold text-brand-800 hover:underline"
                >
                  Se connecter
                </button>
              </p>
            </>
          )}

          <p className="mt-5 flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
            <Lock className="h-3 w-3" />{' '}
            Connexion sécurisée — accès réservé aux comptes de l’établissement.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Auth
