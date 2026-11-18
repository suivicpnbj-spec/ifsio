import {
  Award,
  BadgeCheck,
  BookMarked,
  Copy,
  Download,
  FileText,
  MessageSquareWarning,
  ScrollText,
  ArrowUpRight,
  Clock,
  FileCheck2,
} from 'lucide-react'
import { navigate } from '@/lib/router'
import { cn, formatAmount } from '@/lib/utils'
import type { ActItem, IconType } from '@/types'
import { Badge } from '@/components/ui'

const ICONS: Record<IconType, typeof FileText> = {
  document: FileText,
  transcript: ScrollText,
  award: Award,
  duplicate: Copy,
  certificate: BadgeCheck,
  complaint: MessageSquareWarning,
  thesis: BookMarked,
  download: Download,
}

export function ActIcon({
  type,
  className,
}: {
  type: IconType
  className?: string
}) {
  const Icon = ICONS[type] ?? FileText
  return <Icon className={cn('h-5 w-5', className)} />
}

export function serviceLabel(act: ActItem): string {
  if (act.serviceType === 'procedure') return 'Démarche'
  return 'Acte'
}

export function ActCard({ act, currency }: { act: ActItem; currency: string }) {
  const paid = act.feeAmount > 0
  return (
    <button
      type="button"
      onClick={() => navigate(`/acte/${act.id}`)}
      className="group flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 text-left transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lg"
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700 transition-colors group-hover:bg-brand-100">
            <ActIcon type={act.iconType} />
          </span>
          <div className="flex flex-col items-end gap-1.5">
            <Badge tone={act.serviceType === 'procedure' ? 'warning' : 'brand'}>
              {serviceLabel(act)}
            </Badge>
            <span
              className={cn(
                'text-[11px] font-extrabold',
                paid ? 'text-amber-700' : 'text-emerald-700',
              )}
            >
              {formatAmount(act.feeAmount, currency)}
            </span>
          </div>
        </div>

        <h3 className="mt-3.5 text-sm font-extrabold text-slate-950 transition-colors group-hover:text-brand-900">
          {act.title}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-500">
          {act.shortDescription}
        </p>
      </div>

      <div className="mt-4 flex items-end justify-between gap-3 border-t border-slate-100 pt-3">
        <div className="space-y-1 text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            {act.delay}
          </span>
          <span className="flex items-center gap-1.5">
            <FileCheck2 className="h-3.5 w-3.5 text-slate-400" />
            {act.requiredDocuments.length === 0
              ? 'Aucune pièce requise'
              : `${act.requiredDocuments.length} pièce(s) requise(s)`}
          </span>
        </div>
        <span className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-slate-500 transition-colors group-hover:bg-brand-800 group-hover:text-white">
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>
    </button>
  )
}
