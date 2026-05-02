// components/ui/Badge.tsx
import { LeadStatus, PaymentStatus } from '@/types'

type Status = LeadStatus | PaymentStatus | string

const statusStyles: Record<string, string> = {
  New: 'bg-sky-500/15 text-sky-400 border-sky-500/20',
  Contacted: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  'Follow-up': 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  Converted: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  Lost: 'bg-rose-500/15 text-rose-400 border-rose-500/20',
  Paid: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  Partial: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  Due: 'bg-rose-500/15 text-rose-400 border-rose-500/20',
}

export function Badge({ status }: { status: Status }) {
  const style = statusStyles[status] ?? 'bg-slate-500/15 text-slate-400 border-slate-500/20'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${style}`}>
      {status}
    </span>
  )
}
