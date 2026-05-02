// components/ui/StatCard.tsx
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  color?: 'violet' | 'emerald' | 'amber' | 'rose' | 'sky' | 'indigo'
  sub?: string
}

const colorMap = {
  violet: 'from-violet-500/20 to-violet-600/5 border-violet-500/15 text-violet-400',
  emerald: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/15 text-emerald-400',
  amber: 'from-amber-500/20 to-amber-600/5 border-amber-500/15 text-amber-400',
  rose: 'from-rose-500/20 to-rose-600/5 border-rose-500/15 text-rose-400',
  sky: 'from-sky-500/20 to-sky-600/5 border-sky-500/15 text-sky-400',
  indigo: 'from-indigo-500/20 to-indigo-600/5 border-indigo-500/15 text-indigo-400',
}

export function StatCard({ label, value, icon: Icon, color = 'violet', sub }: StatCardProps) {
  const colors = colorMap[color]
  return (
    <div className={`rounded-xl border bg-gradient-to-br ${colors} p-5 flex items-start gap-4`}>
      <div className={`p-2 rounded-lg bg-current/10`}>
        <Icon size={20} className={colors.split(' ')[3]} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">{label}</p>
        <p className="text-2xl font-bold text-white truncate">{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
      </div>
    </div>
  )
}
