import { useRef } from 'react'
import { Award, CheckCircle2, Copy, Download, ExternalLink, FileText, Printer, ShieldCheck } from 'lucide-react'
import type { Establishment, UserRequest } from '@/types'
import { InstitutionalEmblem } from '@/components/InstitutionalEmblem'
import { QrGlyph, OfficialSeal } from '@/components/Receipt'
import { formatAmount, printNode } from '@/lib/utils'
import { useApp } from '@/store'
import { Button, Modal } from '@/components/ui'

/* ───────────────────── Helpers de formatage du document ──────────────────── */

function inferDocumentTitle(actId: string, actTitle: string): string {
  if (actId.includes('reussite')) return "ATTESTATION DE RÉUSSITE AU DIPLÔME D'ÉTAT"
  if (actId.includes('diplome')) return "ATTESTATION PROVISOIRE DE DIPLÔME D'ÉTAT"
  if (actId.includes('scolarite')) return "CERTIFICAT DE SCOLARITÉ OFFICIEL"
  if (actId.includes('inscription')) return "ATTESTATION D'INSCRIPTION RÉGULIÈRE"
  if (actId.includes('releve')) return "RELEVÉ GÉNÉRAL DE NOTES ET CRÉDITS ECTS"
  return actTitle.toUpperCase()
}

function computeSecurityHash(id: string, matricule: string): string {
  let hash = 0
  const input = `${id}-${matricule}-IFSIO-UP-OFFICIAL`
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 37 + input.charCodeAt(i)) >>> 0
  }
  return hash.toString(16).toUpperCase().padStart(12, '0')
}

/* ─────────────────── Feuille officielle de l'Acte (Sheet) ─────────────────── */

export function OfficialDocumentSheet({
  request,
  establishment,
  sheetRef,
}: {
  request: UserRequest
  establishment: Establishment
  sheetRef?: React.RefObject<HTMLDivElement | null>
}) {
  const applicant = request.applicant
  const deliberation = applicant.academicDeliberation
  const docTitle = inferDocumentTitle(request.actId, request.actTitle)
  const securityHash = deliberation?.scelle_hmac
    ? deliberation.scelle_hmac.slice(0, 16).toUpperCase()
    : computeSecurityHash(request.id, applicant.matricule)

  const isMidwife = applicant.filiere.toLowerCase().includes('sage') ||
    applicant.filiere.toUpperCase().includes('ESSFE')

  const filiereLabel = isMidwife
    ? "École Supérieure des Sages-Femmes d'État (ESSFE)"
    : "École Supérieure des Infirmiers et Infirmières d'État (ESIIE)"

  const optionLabel = isMidwife
    ? "Soins Obstétricaux (Sage-Femme d'État)"
    : "Soins Infirmiers (Infirmier / Infirmière d'État)"

  const verificationUrl = `https://${establishment.verificationBaseUrl}?dossier=${request.id}&hash=${securityHash}`

  return (
    <div
      ref={sheetRef}
      className="doc-sheet relative w-full max-w-[760px] bg-white px-8 py-9 text-slate-900 shadow-2xl sm:px-12 sm:py-12"
      style={{
        border: '3px double #0e3150',
        outline: '1px solid #d0a94f',
        outlineOffset: '-6px',
        fontFamily: "'Times New Roman', Times, serif",
      }}
    >
      {/* ── Ruban national du Bénin (Haut) ── */}
      <div className="absolute top-0 right-0 left-0 flex h-1.5 overflow-hidden">
        <div className="w-1/3 bg-[#008751]" />
        <div className="w-1/3 bg-[#FCD116]" />
        <div className="w-1/3 bg-[#E8112D]" />
      </div>

      {/* ── En-tête institutionnel ── */}
      <div className="mt-2 flex items-start justify-between gap-4 border-b border-slate-300 pb-4 text-center">
        <div className="w-1/3 text-left">
          <p className="text-[9px] font-black tracking-widest uppercase text-slate-800">
            {establishment.country}
          </p>
          <p className="mt-0.5 text-[7px] italic text-slate-600">
            {establishment.motto}
          </p>
          <div className="my-1.5 h-0.5 w-12 bg-[#0e3150]" />
          <p className="text-[8px] font-bold text-slate-700 leading-tight">
            {establishment.ministry}
          </p>
          <p className="mt-1 text-[9px] font-black tracking-wider text-[#0e3150] uppercase">
            {establishment.university}
          </p>
        </div>

        <div className="flex flex-col items-center justify-center">
          <InstitutionalEmblem establishment={establishment} className="h-16 w-16" />
          <span className="mt-1 text-[8px] font-mono tracking-widest text-slate-500">RÉF. OFFICIELLE</span>
        </div>

        <div className="w-1/3 text-right">
          <p className="text-[10px] font-black tracking-wider text-[#0e3150] uppercase">
            {establishment.shortName}
          </p>
          <p className="mt-0.5 text-[8px] font-bold text-slate-700 leading-tight">
            {establishment.name}
          </p>
          <div className="my-1.5 ml-auto h-0.5 w-12 bg-[#0e3150]" />
          <p className="text-[7.5px] text-slate-600 leading-snug">
            {establishment.registrarTitle}
          </p>
        </div>
      </div>

      {/* ── Numéro d'enregistrement & Badge officiel ── */}
      <div className="mt-5 flex items-center justify-between text-[9px]">
        <div className="font-mono text-slate-700">
          N° <strong className="text-slate-900">{`UP/IFSIO/DAAES/${request.id}`}</strong>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-[8px] font-bold text-emerald-800">
          <ShieldCheck className="h-3 w-3 text-emerald-700" />
          <span>ACTE ACADÉMIQUE CERTIFIÉ CONFORME</span>
        </div>
      </div>

      {/* ── Titre de l'acte ── */}
      <div className="my-6 text-center">
        <h1
          className="text-[15px] font-black tracking-widest text-[#0e3150] uppercase sm:text-[18px]"
          style={{ letterSpacing: '0.12em' }}
        >
          {docTitle}
        </h1>
        <div className="mx-auto mt-2 h-0.5 w-32 bg-[#d0a94f]" />
      </div>

      {/* ── Corps certifiant ── */}
      <div className="space-y-4 text-[11px] leading-relaxed text-slate-800 sm:text-[12px]">
        <p className="text-justify indent-6">
          Le Directeur de l’<strong>Institut de Formation en Soins Infirmiers et Obstétricaux (IFSIO)</strong> de
          l’Université de Parakou, soussigné, atteste par la présente que :
        </p>

        <div className="my-3 rounded-md border border-slate-200 bg-slate-50/80 p-4 text-[11px]">
          <div className="grid grid-cols-3 gap-2">
            <span className="font-semibold text-slate-600">Nom & Prénoms :</span>
            <span className="col-span-2 font-black text-slate-950 uppercase">{applicant.fullName}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-1.5">
            <span className="font-semibold text-slate-600">Matricule national :</span>
            <span className="col-span-2 font-mono font-bold text-[#0e3150]">{applicant.matricule || 'RÉGULIER'}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-1.5">
            <span className="font-semibold text-slate-600">Filière d’études :</span>
            <span className="col-span-2 font-bold text-slate-900">{filiereLabel}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-1.5">
            <span className="font-semibold text-slate-600">Option de formation :</span>
            <span className="col-span-2 text-slate-900">{optionLabel}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-1.5">
            <span className="font-semibold text-slate-600">Promotion / Niveau :</span>
            <span className="col-span-2 text-slate-900">{applicant.promotion}</span>
          </div>
        </div>

        <p className="text-justify indent-6">
          A satisfait avec succès à l’ensemble des conditions académiques, des unités d’enseignements fondamentales,
          méthodologiques et de spécialité, ainsi qu’aux stages cliniques obligatoires et aux délibérations du jury
          universitaire de fin de cycle.
        </p>

        {/* Détails de délibération certifiée */}
        <div className="grid grid-cols-3 gap-2 rounded border border-[#d0a94f]/50 bg-[#fffdfa] p-3 text-center text-[10px]">
          <div>
            <span className="block text-[8px] font-bold tracking-wider text-slate-500 uppercase">Décision Jury</span>
            <b className="mt-0.5 block text-[12px] font-black text-emerald-800">
              {deliberation?.decision_jury ? deliberation.decision_jury.toUpperCase() : 'ADMIS(E)'}
            </b>
          </div>
          <div className="border-x border-slate-200">
            <span className="block text-[8px] font-bold tracking-wider text-slate-500 uppercase">Crédits Capitalisés</span>
            <b className="mt-0.5 block text-[12px] font-black text-[#0e3150]">
              {deliberation?.credits_ects_valides || 180} ECTS
            </b>
          </div>
          <div>
            <span className="block text-[8px] font-bold tracking-wider text-slate-500 uppercase">Mention Obtenue</span>
            <b className="mt-0.5 block text-[12px] font-black text-amber-800">
              {deliberation?.mention || 'Bien'}
            </b>
          </div>
        </div>

        <p className="text-justify indent-6 italic text-slate-600 text-[10.5px]">
          En foi de quoi, la présente attestation officielle lui est délivrée pour servir et valoir ce que de droit,
          en attendant l’établissement et la remise du diplôme définitif (Parchemin d’État).
        </p>
      </div>

      {/* ── Pied officiel : QR code de vérification, sceau, signatures ── */}
      <div className="mt-8 border-t-2 border-slate-900 pt-5">
        <div className="grid grid-cols-12 gap-4 items-end">
          {/* Bloc QR Code & Vérification publique */}
          <div className="col-span-5 flex items-center gap-3">
            <div className="rounded border-2 border-slate-900 bg-white p-1.5 shadow-sm">
              <QrGlyph code={verificationUrl} size={78} />
            </div>
            <div className="text-[7.5px] leading-tight text-slate-600">
              <p className="font-black text-slate-900 uppercase">Vérification d’authenticité</p>
              <p className="mt-0.5 font-mono text-[7px] text-[#0e3150]">{securityHash}</p>
              <p className="mt-1 text-slate-500">Flashez pour authentifier l’acte sur le registre officiel du campus.</p>
              <p className="mt-0.5 font-mono text-[6.5px] text-slate-400 truncate max-w-[150px]">{establishment.verificationBaseUrl}</p>
            </div>
          </div>

          {/* Sceau officiel central */}
          <div className="col-span-3 flex justify-center">
            <OfficialSeal shortName={establishment.shortName} size={72} />
          </div>

          {/* Signatures & Lieu */}
          <div className="col-span-4 text-right text-[8.5px]">
            <p className="text-slate-600">
              Fait à Parakou, le <strong>{request.createdAt || new Date().toLocaleDateString('fr-FR')}</strong>
            </p>
            <p className="mt-2 text-[9px] font-black text-[#0e3150] uppercase leading-tight">
              Pour le Directeur et par délégation,
            </p>
            <p className="text-[8px] font-bold text-slate-700">
              Le Directeur des Affaires Académiques
            </p>
            <div className="mt-6 font-serif italic text-slate-500 text-[10px]">
              [ Signature électronique certifiée ]
            </div>
          </div>
        </div>
      </div>

      {/* ── Mention de sécurité anti-fraude ── */}
      <div className="mt-6 border-t border-slate-200 pt-2 flex items-center justify-between text-[7px] text-slate-400 font-mono">
        <span>SÉCURITÉ IFSIO-BENIN · TOUTE REPRODUCTION OU FALSIFICATION EST PASSIBLE DE POURSUITES PÉNALES</span>
        <span>ID DOC: {request.id} · CLÉ: {securityHash}</span>
      </div>
    </div>
  )
}

/* ──────────────────── Modale Interactive de l'Acte ─────────────────── */

export function OfficialDocumentModal({
  request,
  onClose,
}: {
  request: UserRequest | null
  onClose: () => void
}) {
  const { establishment, toast } = useApp()
  const sheetRef = useRef<HTMLDivElement | null>(null)
  if (!request) return null

  const handlePrint = () => {
    const ok = printNode(sheetRef.current, `Acte Officiel ${request.id}`)
    if (!ok) toast('Autorisez les fenêtres pop-up pour imprimer le document.', 'warning')
  }

  const handleCopyLink = () => {
    const url = `https://${establishment.verificationBaseUrl}?dossier=${request.id}`
    navigator.clipboard.writeText(url)
    toast('Lien de vérification copié dans le presse-papier !', 'success')
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="xl"
      title="Acte Académique Officiel"
      subtitle={`${request.id} · ${request.actTitle}`}
      footer={
        <div className="flex flex-wrap items-center justify-between w-full gap-2">
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handleCopyLink}>
              <Copy className="h-3.5 w-3.5" /> Copier lien QR
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Fermer
            </Button>
            <Button size="sm" onClick={handlePrint}>
              <Printer className="h-3.5 w-3.5" /> Imprimer / Enregistrer PDF
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex justify-center bg-slate-200/80 p-3 sm:p-6 overflow-x-auto">
        <OfficialDocumentSheet request={request} establishment={establishment} sheetRef={sheetRef} />
      </div>
    </Modal>
  )
}
