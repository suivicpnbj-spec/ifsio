import { useState } from 'react'
import {
  ChevronDown,
  Clock,
  FileQuestion,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  ShieldCheck,
} from 'lucide-react'
import { useApp } from '@/store'
import { Badge, Card } from '@/components/ui'
import { cn } from '@/lib/utils'

const FAQ = [
  {
    question: 'Comment suivre l’avancement de ma demande ?',
    answer:
      'Chaque dépôt génère un numéro de dossier et un récépissé. Consultez « Mes dossiers » ou utilisez le suivi rapide de la page d’accueil avec ce numéro ou votre matricule.',
  },
  {
    question: 'Quels sont les délais d’instruction ?',
    answer:
      'Ils varient de 48 heures ouvrées (attestations courantes) à 20 jours ouvrés (parchemin d’État). Le délai indicatif est affiché sur chaque fiche du catalogue ; l’acte se retire ensuite auprès de l’administration.',
  },
  {
    question: 'Que se passe-t-il si une pièce est manquante ?',
    answer:
      'La scolarité passe le dossier en « En attente de complément » et vous notifie le motif. Vous téléversez la pièce depuis le dossier, qui repasse automatiquement en traitement.',
  },
  {
    question: 'Comment contester une note ?',
    answer:
      'Depuis « Réclamations », choisissez votre filière puis l’UE et l’élément constitutif contestés dans le catalogue, joignez les pièces requises et réglez les frais en ligne depuis le dossier. La commission pédagogique rend une décision motivée sous 5 jours ouvrés en moyenne.',
  },
  {
    question: 'Comment prouver que j’ai déposé ma demande ?',
    answer:
      'Chaque dépôt remet immédiatement un récépissé horodaté portant votre numéro de dossier et un QR code de suivi, imprimable et conservable, utilisable auprès de l’administration.',
  },
  {
    question: 'Le paiement en ligne est-il obligatoire ?',
    answer:
      'Seules les prestations tarifées (relevés, duplicatas, réclamations…) nécessitent un règlement, réglable en ligne depuis votre dossier sans passer à la banque. Les attestations courantes sont gratuites pour les étudiants inscrits.',
  },
]

export function Help() {
  const { establishment } = useApp()
  const [open, setOpen] = useState<number | null>(0)

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="border-b border-slate-200 pb-5">
        <p className="text-[11px] font-extrabold tracking-[0.16em] text-brand-700 uppercase">
          Centre d’aide
        </p>
        <h1 className="mt-1 text-2xl font-extrabold text-slate-950 sm:text-3xl">
          Une question sur votre dossier ?
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm text-slate-600">
          Consultez les réponses aux questions fréquentes ou contactez directement le service de
          scolarité de {establishment.shortName}.
        </p>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-extrabold text-slate-950">
            <FileQuestion className="h-4 w-4 text-brand-700" /> Questions fréquentes
          </h2>
          {FAQ.map((item, index) => {
            const isOpen = open === index
            return (
              <Card key={item.question} className="overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
                >
                  <span className="text-xs font-bold text-slate-900">{item.question}</span>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 shrink-0 text-slate-400 transition-transform',
                      isOpen && 'rotate-180 text-brand-700',
                    )}
                  />
                </button>
                {isOpen && (
                  <p className="animate-fade-in border-t border-slate-100 px-4 py-3 text-[11px] leading-relaxed text-slate-600">
                    {item.answer}
                  </p>
                )}
              </Card>
            )
          })}

          <Card className="p-5">
            <h2 className="flex items-center gap-2 text-sm font-extrabold text-slate-950">
              <MessageSquare className="h-4 w-4 text-brand-700" /> Contacter la scolarité
            </h2>
            <p className="mt-1 text-[11px] text-slate-500">
              Pour une situation qui n’est pas couverte par cette aide, écrivez ou appelez
              directement le secrétariat de l’IFSIO : indiquez votre numéro de dossier.
            </p>
            <div className="mt-3 grid gap-2 text-[11px] text-slate-700">
              <a
                className="flex items-center gap-2 font-semibold hover:text-brand-800"
                href={`mailto:${establishment.email}`}
              >
                <Mail className="h-3.5 w-3.5 text-brand-700" /> {establishment.email}
              </a>
              <a
                className="flex items-center gap-2 font-semibold hover:text-brand-800"
                href={`tel:${establishment.phone.replace(/\s/g, '')}`}
              >
                <Phone className="h-3.5 w-3.5 text-brand-700" /> {establishment.phone}
              </a>
            </div>
          </Card>
        </div>

        <aside className="space-y-3">
          <Card className="p-5">
            <Badge tone="brand">
              <ShieldCheck className="h-3 w-3" /> Guichet officiel
            </Badge>
            <p className="mt-2.5 text-sm font-extrabold text-slate-950">{establishment.shortName}</p>
            <p className="text-[11px] text-slate-500">{establishment.university}</p>
            <ul className="mt-3 space-y-2 text-[11px] text-slate-600">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-700" />
                {establishment.address}
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-brand-700" />
                {establishment.phone}
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-brand-700" />
                <a href={`mailto:${establishment.email}`} className="hover:underline">
                  {establishment.email}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-700" />
                Lundi — vendredi
                <br />
                08h00 – 12h30 · 15h00 – 17h30
              </li>
            </ul>
          </Card>

          <Card className="bg-brand-50/60 p-5">
            <p className="text-[11px] font-extrabold text-brand-950">Avant de nous contacter</p>
            <ul className="mt-2 space-y-1.5 text-[10px] leading-relaxed text-brand-900">
              <li>• Munissez-vous de votre numéro de dossier.</li>
              <li>• Vérifiez l’état du dossier dans « Mes dossiers ».</li>
              <li>• Consultez les messages échangés avec la scolarité.</li>
            </ul>
          </Card>
        </aside>
      </div>
    </div>
  )
}

export default Help
