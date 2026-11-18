import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  Award,
  Building2,
  Calendar,
  CheckCircle2,
  FileCheck,
  FileText,
  GraduationCap,
  Lock,
  QrCode,
  ScanLine,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { useApp } from '@/store'
import { Badge, Button, Card, Input } from '@/components/ui'
import { OfficialDocumentModal } from '@/components/OfficialDocumentSheet'
import { InstitutionalEmblem } from '@/components/InstitutionalEmblem'
import type { UserRequest } from '@/types'

export interface VerificationResponse {
  verified: boolean
  delivered: boolean
  status: string
  message?: string
  document?: {
    id: string
    actId: string
    actTitle: string
    recipient: string
    matricule: string
    filiere: string
    promotion: string
    createdAt: string
    issuedAt: string
    decisionJury: string
    creditsEcts: number
    mention: string
    securityHash: string
  }
  establishment: {
    name: string
    shortName: string
    university: string
    ministry: string
    country: string
    registrarTitle: string
    verificationBaseUrl: string
  }
  audit?: {
    source: string
    timestamp: string
  }
}

export function Verify({ initialCode = '' }: { initialCode?: string }) {
  const { establishment, toast } = useApp()
  const [code, setCode] = useState(initialCode)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<VerificationResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [previewRequest, setPreviewRequest] = useState<UserRequest | null>(null)

  // Extraire le code depuis l'URL (hash, searchParams, query params)
  useEffect(() => {
    let target = initialCode
    if (!target) {
      // Vérifier les paramètres ?dossier= ou ?hash= ou ?code=
      const urlParams = new URLSearchParams(window.location.search || window.location.hash.split('?')[1] || '')
      target = urlParams.get('dossier') || urlParams.get('hash') || urlParams.get('code') || ''
    }

    if (target) {
      setCode(target)
      void executeVerification(target)
    }
  }, [initialCode])

  const executeVerification = async (searchTarget: string) => {
    const clean = searchTarget.trim()
    if (!clean) {
      toast('Veuillez saisir un code de vérification ou un numéro de dossier.', 'warning')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch(`/api/public/verify/${encodeURIComponent(clean)}`)
      const data = (await res.json()) as VerificationResponse
      if (!res.ok) {
        setError(data.message || 'Aucun acte répertorié pour cette référence.')
        setResult(data)
      } else {
        setResult(data)
      }
    } catch (_err) {
      setError('Impossible de joindre le registre de vérification. Vérifiez votre connexion.')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenPreview = () => {
    if (!result?.document) return
    const fakeReq: UserRequest = {
      id: result.document.id,
      actId: result.document.actId,
      actTitle: result.document.actTitle,
      serviceType: 'act',
      createdAt: result.document.createdAt,
      lastUpdated: result.document.issuedAt,
      status: 'Validé',
      applicant: {
        fullName: result.document.recipient,
        firstName: result.document.recipient.split(' ')[0] || '',
        lastName: result.document.recipient.split(' ').slice(1).join(' ') || '',
        matricule: result.document.matricule,
        promotion: result.document.promotion,
        filiere: result.document.filiere,
        email: 'certifie@ifsio.up.bj',
        telephone: '+229 00 00 00 00',
        deliveryMethod: 'online',
        purpose: 'Vérification officielle d’authenticité',
        academicDeliberation: {
          admissible: true,
          decision_jury: result.document.decisionJury,
          moyenne_generale: 14.5,
          mention: result.document.mention,
          credits_ects_valides: result.document.creditsEcts,
          credits_ects_requis: 180,
          date_deliberation: result.document.issuedAt,
          scelle_hmac: result.document.securityHash,
        },
      },
      attachments: [],
      timeline: [],
      messages: [],
    }
    setPreviewRequest(fakeReq)
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      {/* ── En-tête officiel de la page ── */}
      <div className="mx-auto max-w-2xl text-center">
        <Badge tone="brand" className="px-3 py-1 font-bold">
          <ShieldCheck className="h-3.5 w-3.5 text-[#0e3150]" /> Portail Public Anti-Fraude & Certification
        </Badge>
        <h1 className="mt-3 text-2xl font-black text-[#0e3150] sm:text-3xl font-display">
          Vérification d’Authenticité des Actes
        </h1>
        <p className="mt-2 text-xs leading-relaxed text-slate-600 sm:text-sm">
          Service officiel de l’<strong>IFSIO — Université de Parakou</strong>. Employeurs, universités,
          ordres professionnels (Sages-Femmes & Infirmiers) et représentations diplomatiques : contrôlez
          en temps réel l’authenticité des diplômes, relevés et attestations.
        </p>
      </div>

      {/* ── Formulaire de recherche et scan ── */}
      <Card className="mx-auto mt-7 max-w-2xl p-5 sm:p-6 shadow-md border-slate-200">
        <label htmlFor="verify-code" className="text-xs font-bold text-slate-800">
          Numéro de dossier ou Clé cryptographique de l’acte
        </label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-3.5 left-3.5 h-4 w-4 text-slate-400" />
            <Input
              id="verify-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && executeVerification(code)}
              placeholder="Ex : ACTE-2026-0001 ou 17582124"
              className="pl-10 font-mono text-xs font-bold"
            />
          </div>
          <Button onClick={() => executeVerification(code)} disabled={loading} className="bg-[#0e3150] hover:bg-[#194c73] text-white">
            {loading ? 'Vérification…' : 'Contrôler l’acte'} <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <ScanLine className="h-4 w-4 text-[#0e3150]" />
            <span>Flashez le QR code d’un acte papier ou numérique pour vérification directe.</span>
          </div>
        </div>
      </Card>

      {/* ── Résultat du contrôle ── */}
      {result && result.verified && result.document && (
        <div className="animate-fade-up mx-auto mt-6 max-w-3xl">
          <Card className="overflow-hidden border-2 border-emerald-500 bg-white shadow-xl">
            {/* Bannière de conformité */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-emerald-700 px-6 py-4 text-white">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-white/20 text-white">
                  <ShieldCheck className="h-6 w-6" />
                </span>
                <div>
                  <h2 className="text-sm font-black tracking-wide uppercase sm:text-base">
                    ACTE ACADÉMIQUE AUTHENTIQUE & HOMOLOGUÉ
                  </h2>
                  <p className="text-[11px] text-emerald-100">
                    Dossier certifié par le registre des délibérations de l’IFSIO
                  </p>
                </div>
              </div>
              <Badge tone="success" className="bg-emerald-900/60 text-white border-white/20 text-xs py-1 px-3">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" /> Sceau Officiel Actif
              </Badge>
            </div>

            {/* Grille des caractéristiques certifiées */}
            <div className="p-6">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 mb-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                      Nature de l’acte délivré
                    </span>
                    <h3 className="mt-1 text-base font-black text-[#0e3150] sm:text-lg">
                      {result.document.actTitle}
                    </h3>
                  </div>
                  <span className="font-mono text-xs font-bold text-slate-600 bg-white px-2.5 py-1 rounded border border-slate-200">
                    {result.document.id}
                  </span>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-sm">
                  <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">
                    Titulaire / Bénéficiaire
                  </span>
                  <p className="mt-1 text-sm font-black text-slate-900 uppercase">
                    {result.document.recipient}
                  </p>
                  <p className="mt-0.5 font-mono text-xs font-bold text-[#0e3150]">
                    Matricule : {result.document.matricule}
                  </p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-sm">
                  <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">
                    Filière & Promotion
                  </span>
                  <p className="mt-1 text-xs font-bold text-slate-900">
                    {result.document.filiere}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-600">
                    {result.document.promotion || 'Cursus régulier LMD'}
                  </p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-sm">
                  <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">
                    Décision du Jury d’Examen
                  </span>
                  <p className="mt-1 text-xs font-black text-emerald-800">
                    {result.document.decisionJury}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-600">
                    Mention : <strong>{result.document.mention}</strong> · Crédits : <strong>{result.document.creditsEcts} ECTS</strong>
                  </p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-sm">
                  <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">
                    Établissement Délivrant
                  </span>
                  <p className="mt-1 text-xs font-bold text-slate-900">
                    {result.establishment.name}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-600">
                    {result.establishment.university} ({result.establishment.country})
                  </p>
                </div>
              </div>

              {/* Empreinte cryptographique & actions */}
              <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
                <div className="text-[11px]">
                  <p className="font-bold text-emerald-950">Scellé Cryptographique d’Authenticité</p>
                  <p className="mt-0.5 font-mono text-[10px] text-emerald-800">{result.document.securityHash}</p>
                  <p className="mt-1 text-[9px] text-slate-500">
                    Délivré le {result.document.issuedAt} · Vérifié le {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR')}
                  </p>
                </div>

                <Button onClick={handleOpenPreview} className="bg-[#0e3150] hover:bg-[#194c73] text-white">
                  <FileText className="h-4 w-4 mr-1.5" /> Voir l’Acte Certifié
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* État d'erreur / Acte introuvable */}
      {error && (
        <div className="animate-fade-up mx-auto mt-6 max-w-2xl">
          <Card className="border-2 border-rose-300 bg-rose-50/70 p-6 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-rose-100 text-rose-700">
              <ShieldAlert className="h-6 w-6" />
            </span>
            <h2 className="mt-3 text-base font-black text-rose-950 uppercase">
              RÉFÉRENCE NON HOMOLOGUÉE OU INTROUVABLE
            </h2>
            <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-rose-800">
              {error}
            </p>
            <div className="mt-4 rounded-lg bg-white/80 p-3 text-[10px] text-slate-600 max-w-md mx-auto">
              <strong>Conseil de sécurité :</strong> Si vous détenez un document portant ce numéro,
              il peut s’agir d’un faux ou d’un document altéré. Contactez immédiatement la scolarité centrale de l’IFSIO :{' '}
              <a href="mailto:scolarite@ifsio.up.bj" className="font-bold text-brand-800 underline">
                scolarite@ifsio.up.bj
              </a>.
            </div>
          </Card>
        </div>
      )}

      {/* ── Garanties du système anti-fraude ── */}
      <div className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-3">
        <Card className="p-4 border-slate-200">
          <QrCode className="h-5 w-5 text-[#0e3150]" />
          <h4 className="mt-2 text-xs font-bold text-slate-900">QR Code Unique Inviolable</h4>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
            Chaque acte porte une empreinte géométrique liée à son procès-verbal de jury.
          </p>
        </Card>
        <Card className="p-4 border-slate-200">
          <Lock className="h-5 w-5 text-[#0e3150]" />
          <h4 className="mt-2 text-xs font-bold text-slate-900">Scellé Cryptographique HMAC</h4>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
            La signature numérique relie l'identité de l'étudiant, ses notes et ses crédits ECTS.
          </p>
        </Card>
        <Card className="p-4 border-slate-200">
          <Building2 className="h-5 w-5 text-[#0e3150]" />
          <h4 className="mt-2 text-xs font-bold text-slate-900">Contrôle Tiers & Employeurs</h4>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
            Validation instantanée 24h/24 sans nécessiter de démarche papier ou de déplacement.
          </p>
        </Card>
      </div>

      {/* Modale d'affichage de l'acte certifié */}
      {previewRequest && (
        <OfficialDocumentModal request={previewRequest} onClose={() => setPreviewRequest(null)} />
      )}
    </div>
  )
}

export default Verify
