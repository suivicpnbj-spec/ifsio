import { lazy, Suspense, type ReactNode } from 'react'
import { ArrowRight, Loader2, Lock, ShieldAlert } from 'lucide-react'
import { navigate, segmentsOf, useRoutePath } from '@/lib/router'
import { useApp, AppProvider } from '@/store'
import { Shell } from '@/components/Shell'
import { Button, Card } from '@/components/ui'
import { Home } from '@/pages/Home'

const Catalog = lazy(() => import('@/pages/Catalog'))
const ActDetail = lazy(() => import('@/pages/ActDetail'))
const RequestForm = lazy(() => import('@/pages/RequestForm'))
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const Dossier = lazy(() => import('@/pages/Dossier'))
const Reclamations = lazy(() => import('@/pages/Reclamations'))
const Profile = lazy(() => import('@/pages/Profile'))
const Help = lazy(() => import('@/pages/Help'))
const Verify = lazy(() => import('@/pages/Verify'))
const Auth = lazy(() => import('@/pages/Auth'))
const AdminQueue = lazy(() => import('@/pages/AdminQueue'))
const AdminCatalog = lazy(() => import('@/pages/AdminCatalog'))
const AdminSettings = lazy(() => import('@/pages/AdminSettings'))
const AdminStats = lazy(() => import('@/pages/AdminStats'))

function PageLoader() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="flex flex-col items-center gap-3 text-brand-700">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p className="text-xs font-bold text-slate-500">Chargement de la page…</p>
      </div>
    </div>
  )
}

function AccessNotice({
  icon,
  title,
  description,
  actions,
}: {
  icon: ReactNode
  title: string
  description: string
  actions: ReactNode
}) {
  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <Card className="p-7 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-500">
          {icon}
        </span>
        <h1 className="mt-4 text-lg font-extrabold text-slate-950">{title}</h1>
        <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-slate-500">{description}</p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">{actions}</div>
      </Card>
    </div>
  )
}

function StudentGate({ children }: { children: ReactNode }) {
  const { session, role, logout, toast } = useApp()
  if (!session) {
    return (
      <AccessNotice
        icon={<Lock className="h-6 w-6" />}
        title="Connexion requise"
        description="Connectez-vous à votre espace étudiant pour suivre vos dépôts et vos messages."
        actions={
          <>
            <Button onClick={() => navigate('/connexion')}>Se connecter</Button>
            <Button variant="secondary" onClick={() => navigate('/inscription')}>
              Créer un compte
            </Button>
          </>
        }
      />
    )
  }
  if (role !== 'student') {
    return (
      <AccessNotice
        icon={<ShieldAlert className="h-6 w-6" />}
        title="Vous êtes en espace scolarité"
        description="Cet espace est réservé aux étudiants. Connectez-vous avec un compte étudiant pour consulter les dossiers."
        actions={
          <Button
            onClick={() => {
              void logout()
              navigate('/connexion')
              toast('Connectez-vous avec un compte étudiant.', 'info')
            }}
          >
            Changer de compte
          </Button>
        }
      />
    )
  }
  return <>{children}</>
}

function AdminGate({ children }: { children: ReactNode }) {
  const { session, role, logout, toast } = useApp()
  if (!session) {
    return (
      <AccessNotice
        icon={<Lock className="h-6 w-6" />}
        title="Accès réservé à la scolarité"
        description="Connectez-vous avec un compte de scolarité pour instruire les dossiers déposés."
        actions={
          <>
            <Button onClick={() => navigate('/connexion')}>Se connecter</Button>
            <Button variant="secondary" onClick={() => navigate('/')}>
              Retour à l’accueil
            </Button>
          </>
        }
      />
    )
  }
  if (role !== 'admin') {
    return (
      <AccessNotice
        icon={<ShieldAlert className="h-6 w-6" />}
        title="Espace réservé à la scolarité"
        description="Vous êtes actuellement en espace étudiant. Connectez-vous avec un compte de scolarité pour accéder à la file d’instruction."
        actions={
          <Button
            onClick={() => {
              void logout()
              navigate('/connexion')
              toast('Connectez-vous avec un compte de scolarité.', 'info')
            }}
          >
            Changer de compte <ArrowRight className="h-4 w-4" />
          </Button>
        }
      />
    )
  }
  return <>{children}</>
}

function NotFound() {
  return (
    <AccessNotice
      icon={<Lock className="h-6 w-6" />}
      title="Page introuvable"
      description="L’adresse demandée n’existe pas ou a été déplacée."
      actions={<Button onClick={() => navigate('/')}>Retour à l’accueil</Button>}
    />
  )
}

function Routes({ path }: { path: string }) {
  const { session } = useApp()
  const [pathname, queryString] = path.split('?')
  const segments = segmentsOf(pathname)
  const params = new URLSearchParams(queryString ?? '')

  if (pathname === '/' || pathname === '') return <Home />

  if (segments[0] === 'catalogue') {
    return (
      <Catalog
        initialQuery={params.get('q') ?? ''}
        initialCategory={params.get('category') ?? 'all'}
      />
    )
  }

  if (segments[0] === 'acte' && segments[1]) {
    return <ActDetail actId={decodeURIComponent(segments[1])} />
  }

  if (segments[0] === 'demande' && segments[1]) {
    return (
      <StudentGate>
        <RequestForm actId={decodeURIComponent(segments[1])} />
      </StudentGate>
    )
  }

  if (segments[0] === 'dossiers') {
    return (
      <StudentGate>
        {segments[1] ? <Dossier requestId={decodeURIComponent(segments[1])} /> : <Dashboard />}
      </StudentGate>
    )
  }

  if (segments[0] === 'reclamations') {
    return (
      <StudentGate>
        <Reclamations />
      </StudentGate>
    )
  }

  if (segments[0] === 'profil') {
    return (
      <StudentGate>
        <Profile />
      </StudentGate>
    )
  }

  if (segments[0] === 'aide') return <Help />

  if (segments[0] === 'verifier') {
    return <Verify initialCode={segments[1] ? decodeURIComponent(segments[1]) : ''} />
  }

  if (segments[0] === 'connexion') {
    return session ? (
      <StudentGate>
        <Dashboard />
      </StudentGate>
    ) : (
      <Auth mode="login" />
    )
  }

  if (segments[0] === 'inscription') {
    return session ? (
      <StudentGate>
        <Dashboard />
      </StudentGate>
    ) : (
      <Auth mode="register" />
    )
  }

  if (segments[0] === 'admin') {
    return (
      <AdminGate>
        {segments[1] === 'catalogue' ? (
          <AdminCatalog />
        ) : segments[1] === 'parametres' ? (
          <AdminSettings />
        ) : segments[1] === 'statistiques' ? (
          <AdminStats />
        ) : (
          <AdminQueue />
        )}
      </AdminGate>
    )
  }

  return <NotFound />
}

export default function App() {
  const path = useRoutePath()
  const pathname = path.split('?')[0]

  return (
    <AppProvider>
      <Shell path={pathname}>
        <Suspense fallback={<PageLoader />}>
          <Routes path={path} />
        </Suspense>
      </Shell>
    </AppProvider>
  )
}
