import { useState, type ReactNode } from 'react'
import {
  ArrowRightLeft,
  ArrowUpRight,
  BarChart3,
  Bell,
  Building2,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  FileText,
  FileWarning,
  Globe,
  HelpCircle,
  Info,
  LayoutDashboard,
  LogOut,
  Mail,
  MapPin,
  Menu,
  Phone,
  Search,
  Settings,
  ShieldCheck,
  User,
  X,
} from 'lucide-react'
import { navigate } from '@/lib/router'
import { cn } from '@/lib/utils'
import { useApp } from '@/store'
import { BrandLockup } from '@/components/Logo'
import { Button, Modal, ToastViewport } from '@/components/ui'

interface NavItem {
  label: string
  path: string
  icon: ReactNode
}

function isActive(path: string, target: string): boolean {
  if (target === '/') return path === '/'
  if (target === '/admin') return path === '/admin'
  return path === target || path.startsWith(`${target}/`)
}

function NavLink({
  item,
  path,
  onNavigate,
}: {
  item: NavItem
  path: string
  onNavigate: (path: string) => void
}) {
  const active = isActive(path, item.path)
  return (
    <button
      type="button"
      onClick={() => onNavigate(item.path)}
      className={cn(
        'flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold whitespace-nowrap transition-colors',
        active
          ? 'bg-brand-50 text-brand-800'
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950',
      )}
      aria-current={active ? 'page' : undefined}
    >
      <span className={cn('hidden sm:inline-flex', active ? 'text-brand-700' : 'text-slate-400')}>
        {item.icon}
      </span>
      {item.label}
    </button>
  )
}

function campusUrl(port: number, path = ''): string {
  const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost'
  return `http://${host}:${port}${path}`
}

export function Shell({ path, children }: { path: string; children: ReactNode }) {
  const {
    establishment,
    student,
    admin,
    role,
    session,
    notifications,
    unreadCount,
    logout,
    markAllNotificationsRead,
    markNotificationRead,
    toasts,
    dismissToast,
    toast,
  } = useApp()

  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [spaceOpen, setSpaceOpen] = useState(false)

  const isAdmin = role === 'admin' && session
  const isStudent = role === 'student' && session

  const go = (target: string) => {
    navigate(target)
    setMobileOpen(false)
    setProfileOpen(false)
    setSpaceOpen(false)
  }

  const primaryNav: NavItem[] = isAdmin
    ? [
        { label: 'File d’instruction', path: '/admin', icon: <LayoutDashboard className="h-3.5 w-3.5" /> },
        { label: 'Statistiques', path: '/admin/statistiques', icon: <BarChart3 className="h-3.5 w-3.5" /> },
        { label: 'Catalogue', path: '/admin/catalogue', icon: <FileText className="h-3.5 w-3.5" /> },
        { label: 'Paramètres', path: '/admin/parametres', icon: <Settings className="h-3.5 w-3.5" /> },
      ]
    : [
        { label: 'Accueil', path: '/', icon: <Building2 className="h-3.5 w-3.5" /> },
        { label: 'Catalogue des actes', path: '/catalogue', icon: <Search className="h-3.5 w-3.5" /> },
        { label: 'Vérifier un acte', path: '/verifier', icon: <ShieldCheck className="h-3.5 w-3.5" /> },
        ...(isStudent
          ? [{ label: 'Mes dossiers', path: '/dossiers', icon: <FileText className="h-3.5 w-3.5" /> }]
          : []),
      ]

  const spaceItems: NavItem[] = isStudent
    ? [
        { label: 'Réclamations', path: '/reclamations', icon: <FileWarning className="h-4 w-4" /> },
        { label: 'Mon profil', path: '/profil', icon: <User className="h-4 w-4" /> },
        { label: 'Aide & contact', path: '/aide', icon: <HelpCircle className="h-4 w-4" /> },
      ]
    : isAdmin
      ? [
          { label: 'File d’instruction', path: '/admin', icon: <LayoutDashboard className="h-4 w-4" /> },
          { label: 'Statistiques', path: '/admin/statistiques', icon: <BarChart3 className="h-4 w-4" /> },
          { label: 'Catalogue & tarifs', path: '/admin/catalogue', icon: <Settings className="h-4 w-4" /> },
          { label: 'Paramètres établissement', path: '/admin/parametres', icon: <Building2 className="h-4 w-4" /> },
          { label: 'Catalogue public', path: '/catalogue', icon: <FileText className="h-4 w-4" /> },
        ]
      : [{ label: 'Aide & contact', path: '/aide', icon: <HelpCircle className="h-4 w-4" /> }]

  const displayName = isAdmin
    ? `${admin.firstName} ${admin.lastName}`
    : `${student.firstName} ${student.lastName}`
  const initials = isAdmin
    ? `${admin.firstName.charAt(0)}${admin.lastName.charAt(0)}`
    : student.initials

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[70] focus:rounded-lg focus:bg-slate-900 focus:px-3 focus:py-2 focus:text-xs focus:font-bold focus:text-white"
      >
        Aller au contenu principal
      </a>

      {/* Institutional strip */}
      <div className="bg-brand-950 text-brand-100">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-1.5 text-[10px] font-semibold sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="uppercase tracking-wider">{establishment.university}</span>
            <span className="text-white/30">•</span>
            <span className="hidden sm:inline">Guichet numérique officiel</span>
            <span className="text-white/30 hidden md:inline">•</span>
            <a
              href={campusUrl(8081, '/')}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex items-center gap-1 text-sky-300 hover:text-white"
            >
              Portail IFSIO <ExternalLink className="h-2.5 w-2.5" />
            </a>
            <span className="text-white/30 hidden md:inline">•</span>
            <a
              href={campusUrl(5174, '/')}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex items-center gap-1 text-sky-300 hover:text-white"
            >
              eRésultats <ExternalLink className="h-2.5 w-2.5" />
            </a>
          </div>
          <div className="flex items-center gap-3">
            {session ? (
              <button
                type="button"
                onClick={() => {
                  void logout()
                  navigate('/connexion')
                  toast('Connectez-vous avec un autre compte pour changer d’espace.', 'info')
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-bold text-white transition-colors hover:bg-white/20"
              >
                <ArrowRightLeft className="h-3 w-3" />
                Changer de compte
              </button>
            ) : (
              <button
                type="button"
                onClick={() => go('/connexion')}
                className="inline-flex items-center gap-1.5 font-bold text-white hover:underline"
              >
                {'Connexion'}{' '}
                <ArrowUpRight className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <button type="button" onClick={() => go(isAdmin ? '/admin' : '/')} className="min-w-0 text-left">
            <BrandLockup shortName={establishment.shortName} university={establishment.university} />
          </button>

          <nav aria-label="Navigation principale" className="hidden items-center gap-0.5 lg:flex">
            {primaryNav.map((item) => (
              <NavLink key={item.path} item={item} path={path} onNavigate={go} />
            ))}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {session && spaceItems.length > 0 && (
              <div className="relative hidden md:block">
                <button
                  type="button"
                  onClick={() => {
                    setSpaceOpen((value) => !value)
                    setProfileOpen(false)
                  }}
                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                  aria-expanded={spaceOpen}
                >
                  Mon espace
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
                {spaceOpen && (
                  <>
                    <button
                      type="button"
                      aria-label="Fermer le menu"
                      className="fixed inset-0 z-30 cursor-default"
                      onClick={() => setSpaceOpen(false)}
                    />
                    <div className="animate-fade-in absolute right-0 z-40 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                      {spaceItems.map((item) => (
                        <button
                          key={item.path}
                          type="button"
                          onClick={() => go(item.path)}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-brand-900"
                        >
                          <span className="grid h-7 w-7 place-items-center rounded-lg bg-slate-100 text-slate-500">
                            {item.icon}
                          </span>
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {isStudent && (
              <button
                type="button"
                onClick={() => setNotifOpen(true)}
                className="relative rounded-full p-2.5 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                aria-label={`Notifications (${unreadCount} non lues)`}
              >
                <Bell className="h-4.5 w-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-amber-500 px-1 text-[9px] font-black text-white">
                    {unreadCount}
                  </span>
                )}
              </button>
            )}

            {session ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen((value) => !value)
                    setSpaceOpen(false)
                  }}
                  className="flex items-center gap-2 rounded-full border border-slate-200 p-1 pr-2.5 transition-colors hover:bg-slate-50"
                  aria-expanded={profileOpen}
                  aria-label="Menu du compte"
                >
                  <span
                    className={cn(
                      'grid h-8 w-8 place-items-center rounded-full text-[11px] font-black text-white',
                      isAdmin ? 'bg-amber-600' : 'bg-brand-800',
                    )}
                  >
                    {initials}
                  </span>
                  <span className="hidden flex-col items-start leading-tight lg:flex">
                    <span className="text-[11px] font-bold text-slate-900">{displayName}</span>
                    <span className="text-[10px] text-slate-500">
                      {isAdmin ? 'Scolarité' : 'Étudiant'}
                    </span>
                  </span>
                  <ChevronDown className="hidden h-3.5 w-3.5 text-slate-400 lg:block" />
                </button>

                {profileOpen && (
                  <>
                    <button
                      type="button"
                      aria-label="Fermer le menu"
                      className="fixed inset-0 z-30 cursor-default"
                      onClick={() => setProfileOpen(false)}
                    />
                    <div className="animate-fade-in absolute right-0 z-40 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                      <div className="border-b border-slate-100 px-3 py-2.5">
                        <p className="text-sm font-extrabold text-slate-950">{displayName}</p>
                        <p className="truncate text-[11px] text-slate-500">
                          {isAdmin ? admin.email : `${student.matricule} · ${student.filiere}`}
                        </p>
                      </div>
                      <div className="py-1">
                        {!isAdmin && (
                          <>
                            <button
                              type="button"
                              onClick={() => go('/profil')}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              <User className="h-4 w-4 text-slate-400" /> Mon profil
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            void logout()
                            navigate('/connexion')
                            setProfileOpen(false)
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-brand-800 hover:bg-brand-50"
                        >
                          <ArrowRightLeft className="h-4 w-4" />
                          Changer de compte
                        </button>
                      </div>
                      <div className="border-t border-slate-100 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            logout()
                            setProfileOpen(false)
                            go('/')
                            toast('Vous êtes déconnecté.', 'info')
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                        >
                          <LogOut className="h-4 w-4" /> Se déconnecter
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Button variant="ghost" size="sm" onClick={() => go('/connexion')}>
                  Connexion
                </Button>
                <span className="hidden sm:inline-flex">
                  <Button size="sm" onClick={() => go('/inscription')}>
                    Créer un compte
                  </Button>
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={() => setMobileOpen((value) => !value)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              aria-label="Ouvrir le menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="animate-fade-in border-t border-slate-200 bg-white px-4 pb-4 lg:hidden">
            <nav aria-label="Navigation mobile" className="grid gap-1 py-2">
              {[...primaryNav, ...spaceItems.filter((item) => !primaryNav.some((nav) => nav.path === item.path))].map(
                (item) => (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => go(item.path)}
                    className={cn(
                      'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-semibold',
                      isActive(path, item.path)
                        ? 'bg-brand-50 text-brand-900'
                        : 'text-slate-700 hover:bg-slate-50',
                    )}
                  >
                    <span className="text-slate-400">{item.icon}</span>
                    {item.label}
                  </button>
                ),
              )}
            </nav>
            {!session && (
              <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                <Button variant="secondary" size="sm" onClick={() => go('/connexion')}>
                  Connexion
                </Button>
                <Button size="sm" onClick={() => go('/inscription')}>
                  Créer un compte
                </Button>
              </div>
            )}
          </div>
        )}
      </header>

      <main id="contenu" className="flex-1">
        {children}
      </main>

      <footer className="mt-16 border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-5">
            <div className="md:col-span-2">
              <BrandLockup shortName={establishment.shortName} university={establishment.university} />
              <p className="mt-3 max-w-sm text-xs leading-relaxed text-slate-500">
                MES ACTES est la plateforme officielle de dépôt, de suivi et d’instruction des
                demandes d’actes administratifs et académiques de {establishment.shortName}.
              </p>
            </div>

            <div>
              <p className="text-[11px] font-extrabold tracking-wider text-slate-900 uppercase">
                Démarches
              </p>
              <ul className="mt-3 space-y-2 text-xs text-slate-600">
                {[
                  { label: 'Catalogue des actes', path: '/catalogue' },
                  { label: 'Mes dossiers', path: '/dossiers' },
                  { label: 'Vérifier un acte (Anti-fraude)', path: '/verifier' },
                  { label: 'Aide & contact', path: '/aide' },
                ].map((link) => (
                  <li key={link.path}>
                    <button
                      type="button"
                      onClick={() => go(link.path)}
                      className="hover:text-brand-800 hover:underline"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-[11px] font-extrabold tracking-wider text-slate-900 uppercase">
                Campus Numérique
              </p>
              <ul className="mt-3 space-y-2 text-xs text-slate-600">
                {[
                  { label: 'Site Vitrine IFSIO', port: 8081, path: '/' },
                  { label: 'Plateforme eRésultats', port: 5174, path: '/' },
                  { label: 'Catalogue CNTRSS', port: 3100, path: '/' },
                ].map((hub) => (
                  <li key={hub.port}>
                    <a
                      href={campusUrl(hub.port, hub.path)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 hover:text-brand-800 hover:underline"
                    >
                      {hub.label} <ExternalLink className="h-3 w-3 text-slate-400" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-[11px] font-extrabold tracking-wider text-slate-900 uppercase">
                Établissement
              </p>
              <ul className="mt-3 space-y-2 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                  {establishment.address}
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  {establishment.phone}
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  <a href={`mailto:${establishment.email}`} className="hover:underline">
                    {establishment.email}
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5 text-slate-400" />
                  {establishment.website}
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 flex flex-col justify-between gap-3 border-t border-slate-200 pt-5 text-[10px] text-slate-500 sm:flex-row sm:items-center">
            <p>
              © {new Date().getFullYear()} {establishment.shortName} — {establishment.university}.
              Plateforme MES ACTES.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => go('/admin')}
                className="inline-flex items-center gap-1 font-semibold hover:text-brand-800"
              >
                <LayoutDashboard className="h-3 w-3" /> Espace scolarité
              </button>
            </div>
          </div>
        </div>
      </footer>

      <Modal
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        title="Notifications"
        subtitle={`${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}`}
        size="md"
        footer={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              markAllNotificationsRead()
              toast('Toutes les notifications sont marquées comme lues.', 'info')
            }}
          >
            Tout marquer comme lu
          </Button>
        }
      >
        <div className="divide-y divide-slate-100">
          {notifications.length === 0 && (
            <p className="px-5 py-8 text-center text-xs text-slate-500">Aucune notification.</p>
          )}
          {notifications.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                markNotificationRead(item.id)
                setNotifOpen(false)
                if (item.requestId) go(`/dossiers/${item.requestId}`)
              }}
              className={cn(
                'flex w-full items-start gap-3 px-5 py-3.5 text-left transition-colors hover:bg-slate-50',
                !item.read && 'bg-brand-50/40',
              )}
            >
              <span
                className={cn(
                  'mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg',
                  item.type === 'success'
                    ? 'bg-emerald-50 text-emerald-600'
                    : item.type === 'warning'
                      ? 'bg-amber-50 text-amber-600'
                      : 'bg-brand-50 text-brand-700',
                )}
              >
                {item.type === 'warning' ? (
                  <FileWarning className="h-4 w-4" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs font-bold text-slate-900">{item.title}</span>
                  {!item.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" />}
                </span>
                <span className="mt-0.5 block text-[11px] leading-relaxed text-slate-600">
                  {item.message}
                </span>
                <span className="mt-1 block text-[10px] text-slate-400">{item.timestamp}</span>
              </span>
            </button>
          ))}
        </div>
      </Modal>

      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
