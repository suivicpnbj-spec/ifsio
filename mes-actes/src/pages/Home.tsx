import { useMemo, useState } from 'react'
import {
  ArrowRight,
  Award,
  BadgeCheck,
  BookOpen,
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  Globe,
  GraduationCap,
  Mail,
  MapPin,
  MessageSquareWarning,
  Phone,
  QrCode,
  Scale,
  Search,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react'
import { actCategories } from '@/lib/categories'
import { navigate } from '@/lib/router'
import { cn } from '@/lib/utils'
import { useApp } from '@/store'
import { ActCard } from '@/components/ActCard'
import { BrandMark } from '@/components/Logo'
import { InstitutionalEmblem } from '@/components/InstitutionalEmblem'
import { OfficialSeal, QrGlyph } from '@/components/Receipt'
import { Button, Card, Input, SectionHeading } from '@/components/ui'
import type { CategoryId } from '@/types'

const CATEGORY_ICONS: Record<CategoryId, typeof FileText> = {
  scolarite: GraduationCap,
  resultats: ScrollText,
  diplomes: Award,
  soutenance: BadgeCheck,
  stages: BookOpen,
  formation: BookOpen,
  reclamations: MessageSquareWarning,
  memoires: FileText,
  autres: FileText,
}

export function Home() {
  const { establishment, acts, requests, session, role, toast } = useApp()
  const [query, setQuery] = useState('')
  const [tracking, setTracking] = useState('')

  const activeActs = useMemo(() => acts.filter((act) => act.active !== false), [acts])
  const categories = useMemo(() => actCategories(activeActs), [activeActs])
  const popular = useMemo(() => activeActs.filter((act) => act.popular).slice(0, 4), [activeActs])

  const search = () => {
    const value = query.trim()
    navigate(value ? `/catalogue?q=${encodeURIComponent(value)}` : '/catalogue')
  }

  const followDossier = () => {
    const value = tracking.trim().toLowerCase()
    if (!value) {
      toast('Saisissez un numéro de dossier ou votre matricule.', 'warning')
      return
    }
    const match = requests.find(
      (request) =>
        request.id.toLowerCase().includes(value) ||
        request.applicant.matricule.toLowerCase() === value,
    )
    if (!match) {
      toast('Aucun dossier ne correspond à cette référence.', 'error')
      return
    }
    if (session && role === 'student') {
      navigate(`/dossiers/${match.id}`)
    } else {
      toast('Connectez-vous pour consulter votre dossier.', 'info')
      navigate('/connexion')
    }
  }

  return (
    <div className="space-y-14 pb-16 sm:space-y-16">
      {/* ───────────────────────── Hero ───────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-950 via-[#0e3560] to-[#0a2145] text-white">
        <div className="pointer-events-none absolute -top-24 -right-16 h-80 w-80 rounded-full bg-brand-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="pointer-events-none absolute right-6 bottom-4 hidden opacity-[0.06] lg:block">
          <BrandMark className="h-72 w-72" />
        </div>

        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-12 lg:gap-12 lg:px-8 lg:py-20">
          <div className="lg:col-span-7">
            <div className="inline-flex flex-wrap items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-bold tracking-wide backdrop-blur uppercase">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                {establishment.country}
              </span>
              <span className="text-white/30">•</span>
              <span className="text-brand-100">{establishment.university}</span>
              <span className="text-white/30">•</span>
              <span className="text-amber-300">{establishment.shortName}</span>
            </div>

            <h1 className="mt-5 text-3xl leading-[1.08] font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              Vos démarches administratives,
              <span className="block bg-gradient-to-r from-sky-300 via-brand-100 to-amber-200 bg-clip-text text-transparent">
                sans file d’attente.
              </span>
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-brand-100/90 sm:text-base">
              Déposez vos dossiers en ligne, à toute heure : récépissé immédiat, suivi de
              l’instruction, messagerie avec la scolarité et règlement en ligne des frais. Plus de
              déplacement, plus d’horaires de bureau.
            </p>

            {/* Recherche */}
            <div className="mt-6 max-w-xl">
              <div className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white p-2 shadow-2xl">
                <Search className="ml-2 h-4 w-4 shrink-0 text-slate-400" />
                <input
                  aria-label="Rechercher une démarche"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => event.key === 'Enter' && search()}
                  placeholder="Quelle démarche souhaitez-vous effectuer ?"
                  className="min-w-0 flex-1 border-0 bg-transparent py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-0 focus:outline-none"
                />
                <Button onClick={search} size="md" className="shrink-0">
                  Rechercher <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] text-brand-100/80">
                <span className="font-semibold">Demandes fréquentes :</span>
                {['Attestation de scolarité', 'Relevé de notes', 'Attestation de réussite'].map(
                  (item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => navigate(`/catalogue?q=${encodeURIComponent(item)}`)}
                      className="rounded-full border border-white/20 px-2.5 py-1 font-semibold transition-colors hover:bg-white/10"
                    >
                      {item}
                    </button>
                  ),
                )}
                <button
                  type="button"
                  onClick={() => navigate('/verifier')}
                  className="rounded-full border border-[#d0a94f]/50 bg-[#d0a94f]/20 px-2.5 py-1 font-bold text-amber-200 transition-colors hover:bg-[#d0a94f]/30"
                >
                  🛡️ Vérifier un acte (QR Code)
                </button>
              </div>
            </div>

          </div>

          {/* Visuel produit : photo campus, composition alignée sur la maquette Figma */}
          <div className="relative lg:col-span-5">
            <div className="relative mx-auto w-full max-w-md lg:max-w-none">
              {/* Lueur décorative */}
              <div
                aria-hidden
                className="absolute -inset-2 rounded-3xl bg-gradient-to-tr from-sky-400/20 to-brand-300/10 blur-xl"
              />

              <figure className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/20 bg-slate-800 shadow-2xl sm:rounded-3xl">
                <div
                  role="img"
                  aria-label="Illustration institutionnelle de l’IFSIO et de l’Université de Parakou"
                  className="relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br from-brand-900 via-[#123e6b] to-sky-800"
                >
                  <div className="absolute -right-12 -top-16 h-64 w-64 rounded-full border border-white/10" />
                  <div className="absolute -bottom-24 -left-12 h-72 w-72 rounded-full border border-white/10" />
                  <div className="relative flex flex-col items-center gap-5 px-6 text-center text-white">
                    <div className="grid h-28 w-28 place-items-center rounded-3xl border border-white/20 bg-white/10 shadow-2xl backdrop-blur">
                      <Building2 className="h-16 w-16 text-sky-100" strokeWidth={1.25} />
                    </div>
                    <div>
                      <p className="text-xs font-bold tracking-[0.25em] text-sky-200 uppercase">Université de Parakou</p>
                      <p className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">IFSIO</p>
                      <p className="mt-1 text-xs text-white/75">Institut de Formation en Soins Infirmiers et Obstétricaux</p>
                    </div>
                    <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-sky-50">
                      <GraduationCap className="h-4 w-4" />
                      Excellence • Formation • Engagement
                    </div>
                  </div>
                </div>

                {/* Badge flottant : établissement + disponibilité */}
                <figcaption className="absolute right-4 bottom-4 left-4 flex items-center justify-between gap-3 rounded-xl border border-white/80 bg-white/95 p-3 text-slate-900 shadow-lg backdrop-blur-md">
                  <span className="flex items-center gap-2.5">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    </span>
                    <span className="leading-tight">
                      <span className="block text-xs font-bold text-slate-900">
                        {establishment.shortName} • {establishment.university}
                      </span>
                      <span className="block text-[11px] text-slate-500">
                        Soins Infirmiers & Obstétricaux
                      </span>
                    </span>
                  </span>
                  <span className="shrink-0 rounded bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
                    En ligne 24 h/24
                  </span>
                </figcaption>
              </figure>

            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────── Suivi de dossier ───────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Card className="grid gap-4 p-5 sm:p-6 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-4">
            <p className="flex items-center gap-2 text-[11px] font-extrabold tracking-[0.16em] text-brand-700 uppercase">
              <QrCode className="h-4 w-4" /> Suivi de dossier
            </p>
            <h2 className="mt-1.5 text-lg font-extrabold text-slate-950">
              Déjà une demande déposée ?
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Consultez l’avancement avec votre numéro de dossier ou votre matricule.
            </p>
          </div>

          <div className={requests.length > 0 ? 'lg:col-span-5' : 'lg:col-span-8'}>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={tracking}
                onChange={(event) => setTracking(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && followDossier()}
                placeholder="ACTE-2026-0001 ou votre matricule"
                aria-label="Numéro de dossier ou matricule"
                className="font-mono text-xs"
              />
              <Button onClick={followDossier} variant="dark" className="shrink-0">
                Consulter <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {requests.length > 0 && (
            <div className="grid grid-cols-2 gap-2 lg:col-span-3">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="font-mono text-lg font-extrabold text-slate-900">{requests.length}</p>
                <p className="text-[10px] text-slate-500">dossiers enregistrés</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="font-mono text-lg font-extrabold text-emerald-700">
                  {requests.filter((request) => request.status === 'Validé').length}
                </p>
                <p className="text-[10px] text-slate-500">dossiers validés</p>
              </div>
            </div>
          )}
        </Card>
      </section>

      {/* ───────────────────────── Bandeau confiance ───────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Clock, title: 'Disponible 24h/24', text: 'Déposez une demande à tout moment, même le week-end.' },
            {
              icon: CheckCircle2,
              title: 'Récépissé immédiat',
              text: 'Un numéro de dossier et un récépissé avec QR code à chaque dépôt.',
            },
            {
              icon: CreditCard,
              title: 'Paiement en ligne',
              text: 'Réglez vos frais sans passer à la banque ni à la caisse.',
            },
            {
              icon: Users,
              title: 'Dialogue avec la scolarité',
              text: 'Messages, compléments de pièces et notifications dans votre espace.',
            },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-3 bg-white p-4">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
                <item.icon className="h-4.5 w-4.5" />
              </span>
              <div>
                <p className="text-xs font-extrabold text-slate-900">{item.title}</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────── Trois guichets dédiés ─────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          kicker="Espaces dédiés"
          title="Tout le guichet, au même endroit"
          description="Dépôt des actes, réclamation de notes et suivi de vos dossiers : des parcours complets, instruits en ligne."
        />

        <div className="mt-6 grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Scale,
              tone: 'amber' as const,
              badge: 'Instruction en ligne',
              title: 'Guichet de réclamation',
              text: 'Contestez une évaluation et suivez la délibération de la commission pédagogique.',
              bullets: [
                'Matière et session renseignées',
                'Argumentaire et pièces jointes',
                'Décision motivée et tracée',
              ],
              cta: 'Ouvrir les réclamations',
              to: '/reclamations',
            },
            {
              icon: BookOpen,
              tone: 'brand' as const,
              badge: 'Sans déplacement',
              title: 'Catalogue des actes',
              text: 'Complétez le formulaire guidé et transmettez vos pièces en ligne en toute sécurité.',
              bullets: [
                'Formulaire étape par étape',
                'Récépissé de dépôt immédiat',
                'Tarification transparente',
              ],
              cta: 'Parcourir le catalogue',
              to: '/catalogue',
            },
            {
              icon: FileText,
              tone: 'emerald' as const,
              badge: 'Suivi personnalisé',
              title: 'Mes dossiers & retraits',
              text: 'Suivez l’instruction, échangez avec la scolarité et retrouvez vos attestations certifiées.',
              bullets: [
                'Fil d’instruction en direct',
                'Messagerie scolarité intégrée',
                'Règlement sécurisé Mobile Money',
              ],
              cta: session ? 'Ouvrir mes dossiers' : 'Se connecter',
              to: session ? '/dossiers' : '/connexion',
            },
            {
              icon: ShieldCheck,
              tone: 'brand' as const,
              badge: 'Vérification QR',
              title: 'Portail Anti-Fraude',
              text: 'Employeurs et partenaires : contrôlez en temps réel la validité d’un acte ou diplôme IFSIO.',
              bullets: [
                'Scan QR code instantané',
                'Scellé cryptographique HMAC',
                'Contrôle tiers 24h/24',
              ],
              cta: 'Vérifier l’authenticité',
              to: '/verifier',
            },
          ].map((hub) => {
            const tones = {
              amber: 'bg-amber-50 text-amber-700',
              emerald: 'bg-emerald-50 text-emerald-700',
              brand: 'bg-brand-50 text-brand-700',
            } as const
            const badgeTones = {
              amber: 'border-amber-200 bg-amber-50 text-amber-800',
              emerald: 'border-emerald-200 bg-emerald-50 text-emerald-800',
              brand: 'border-brand-200 bg-brand-50 text-brand-800',
            } as const
            const ctaTones = {
              amber: 'border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100',
              emerald: 'border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100',
              brand: 'border-brand-200 bg-brand-50 text-brand-900 hover:bg-brand-100',
            } as const
            return (
              <Card key={hub.title} className="flex flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <span
                    className={cn('grid h-12 w-12 place-items-center rounded-2xl', tones[hub.tone])}
                  >
                    <hub.icon className="h-6 w-6" />
                  </span>
                  <span
                    className={cn(
                      'rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase',
                      badgeTones[hub.tone],
                    )}
                  >
                    {hub.badge}
                  </span>
                </div>
                <h3 className="mt-4 text-base font-extrabold text-slate-950">{hub.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{hub.text}</p>
                <ul className="mt-4 space-y-2 text-xs text-slate-600">
                  {hub.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                      {bullet}
                    </li>
                  ))}
                </ul>
                <div className="mt-5 pt-1">
                  <Button
                    variant="secondary"
                    className={cn('w-full justify-between', ctaTones[hub.tone])}
                    onClick={() => navigate(hub.to)}
                  >
                    {hub.cta} <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      </section>

      {/* ───────────────────────── Catégories ───────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          kicker="Toutes vos démarches"
          title="Que souhaitez-vous obtenir ?"
          description="Attestations, relevés, diplômes, réclamations : déposez votre dossier en ligne, le guichet est ouvert à toute heure."
          action={
            <Button variant="secondary" size="sm" onClick={() => navigate('/catalogue')}>
              Voir tout le catalogue <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          }
        />

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => {
            const Icon = CATEGORY_ICONS[category.id] ?? FileText
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => navigate(`/catalogue?category=${category.id}`)}
                className="group flex items-center gap-3.5 rounded-2xl border border-slate-200 bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-50 text-brand-700 transition-colors group-hover:bg-brand-50">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-extrabold text-slate-900">
                    {category.label}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-slate-500">
                    {category.count} prestation{category.count > 1 ? 's' : ''}
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-700" />
              </button>
            )
          })}
        </div>
      </section>

      {/* ───────────────────────── Démarches fréquentes ───────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          kicker="Les plus demandés"
          title="Démarches fréquentes"
          description="Accédez directement aux prestations les plus sollicitées par les étudiants."
        />
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {popular.map((act) => (
            <ActCard key={act.id} act={act} currency={establishment.currency} />
          ))}
        </div>
      </section>

      {/* ───────────────────────── Procédure ───────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-9">
          <SectionHeading
            kicker="Parcours dématérialisé"
            title="Trois étapes, un récépissé officiel"
            description="Plus de longue file d’attente à la scolarité ni à la banque : le dépôt, le suivi et le règlement se font en ligne."
          />
          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {[
              {
                step: '1',
                tone: 'bg-brand-900',
                title: 'Choisissez et déposez',
                text: 'Parcourez le catalogue, remplissez le formulaire guidé et transmettez vos pièces justificatives depuis votre appareil.',
              },
              {
                step: '2',
                tone: 'bg-amber-600',
                title: 'Récépissé & règlement',
                text: 'Votre dossier reçoit aussitôt son numéro et son récépissé. Les frais éventuels se règlent en ligne, quittance jointe au dossier.',
              },
              {
                step: '3',
                tone: 'bg-emerald-700',
                title: 'Instruction & retrait',
                text: 'La scolarité instruit votre dossier et vous notifie chaque étape : l’acte est retiré auprès de l’administration une fois validé.',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-5 text-center"
              >
                <span
                  className={cn(
                    'grid h-12 w-12 place-items-center rounded-2xl font-mono text-lg font-black text-white shadow-md',
                    item.tone,
                  )}
                >
                  {item.step}
                </span>
                <h3 className="text-sm font-extrabold text-slate-900">{item.title}</h3>
                <p className="text-xs leading-relaxed text-slate-600">{item.text}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button onClick={() => navigate('/catalogue')}>
              <Sparkles className="h-4 w-4" /> Faire une demande
            </Button>
            <Button variant="secondary" onClick={() => navigate(session ? '/dossiers' : '/connexion')}>
              <QrCode className="h-4 w-4" /> Suivre une demande
            </Button>
          </div>
        
        </div>
      </section>

     

      {/* ─────────────── Contact scolarité ─────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-2">
          
          <Card className="bg-slate-50 p-5 sm:p-6">
            <h3 className="text-sm font-extrabold text-slate-950">
              Besoin d’aide ou d’un renseignement ?
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
              Le service de la scolarité est à votre disposition pour toute demande particulière ou
              litige académique.
            </p>
            <ul className="mt-4 space-y-2.5 text-xs text-slate-700">
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" />
                {establishment.address}
              </li>
              <li className="flex items-start gap-2.5">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" />
                <span className="font-mono">{establishment.phone}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" />
                {establishment.email}
              </li>
              <li className="flex items-start gap-2.5">
                <Globe className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" />
                {establishment.website}
              </li>
            </ul>
            <div className="mt-5">
              <Button variant="dark" onClick={() => navigate('/aide')}>
                Consulter la foire aux questions <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        </div>
      </section>

      
    </div>
  )
}

export default Home
