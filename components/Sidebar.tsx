'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import LogoutButton from '@/components/auth/LogoutButton'
import {
  LayoutDashboard,
  UserPlus,
  Users,
  CreditCard,
  Bell,
  Settings,
  Zap
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/leads', label: 'Leads', icon: UserPlus },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/branches', label: 'Branches', icon: Users },
  { href: '/batches', label: 'Batches', icon: UserPlus },
  { href: '/payments', label: 'Payments', icon: CreditCard },
  { href: '/followups', label: 'Follow-ups', icon: Bell },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-[#0f1117] border-r border-white/5 flex flex-col z-50">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-6 py-5 border-b border-white/5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
          <Zap size={16} className="text-white" strokeWidth={2.5} />
        </div>
        <span className="text-white font-bold text-lg tracking-tight">Flowza</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)

          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                isActive
                  ? 'bg-violet-600/20 text-violet-300 border border-violet-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon
                size={17}
                className={isActive ? 'text-violet-400' : 'text-slate-500 group-hover:text-slate-300'}
                strokeWidth={isActive ? 2.5 : 2}
              />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="px-4 pb-3">
        <LogoutButton />
      </div>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-white/5">
        <p className="text-xs text-slate-600 text-center">Flowza v1.0 · MVP</p>
      </div>
    </aside>
  )
}