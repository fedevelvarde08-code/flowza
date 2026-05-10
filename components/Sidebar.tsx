'use client'

import Link from 'next/link'
import Image from "next/image"
import { usePathname } from 'next/navigation'
import LogoutButton from '@/components/auth/LogoutButton'
import {
  LayoutDashboard,
  UserPlus,
  Users,
  Bell,
  Settings,
  Zap
} from 'lucide-react'

const navItems = [
    { href: '/dashboard/overview', label: 'Overview', icon: LayoutDashboard },  
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/leads', label: 'Leads', icon: UserPlus },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/branches', label: 'Branches', icon: Users },
  { href: '/batches', label: 'Batches', icon: UserPlus },
  { href: '/followups', label: 'Follow-ups', icon: Bell },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-[#0f1117] border-r border-white/5 flex flex-col z-50">
      {/* Logo */}
     
     <div className="flex items-center gap-0 px-2">
  <Image
    src="/logo.png"
    alt="Flowza"
    width={100}
    height={34}
    className="object-contain"
  />

  <span className="text-xl font-bold text-white">
    Flowza
  </span>
</div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href

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