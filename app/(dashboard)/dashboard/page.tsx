'use client'

// app/(dashboard)/page.tsx

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getBusinessId, BusinessIdException } from '@/lib/getBusinessId'
import { buildWhatsAppLink, buildLeadWhatsAppMessage } from '@/lib/whatsapp'
import {
  Users, UserPlus, UserCheck, IndianRupee,
  CheckCircle, Clock, Bell, Phone, AlertCircle,
  ArrowRight, Calendar, ChevronDown, RefreshCcw,
} from 'lucide-react'

interface RecentLead {
  id: string
  name: string
  phone: string
  service_interested: string | null
  status: string
  created_at: string
}

interface RevenueStats {
  totalExpected: number
  collected: number
  pending: number
  collectedPct: number
}

interface DashboardStats {
  totalLeads: number
  newLeads: number
  convertedCustomers: number
  totalRevenueExpected: number
  revenueCollected: number
  revenuePending: number
  followupsDue: number
}

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatINR(n: number) {
  return '₹' + Math.round(n).toLocaleString('en-IN')
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function getMonthRange(year: number, month: number) {
  const start = new Date(year, month, 1)
  const end = new Date(year, month + 1, 1)

  return {
    startISO: start.toISOString(),
    endISO: end.toISOString(),
  }
}

function getCustomerDate(c: any) {
  return new Date(c.membership_start_date || c.joining_date || c.created_at)
}

const STATUS_STYLES: Record<string, string> = {
  New: 'bg-sky-500/15 text-sky-400 border-sky-500/25',
  Contacted: 'bg-violet-500/15 text-violet-300 border-violet-500/25',
  'Follow-up': 'bg-orange-500/15 text-orange-400 border-orange-500/25',
  Converted: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  Lost: 'bg-rose-500/15 text-rose-400 border-rose-500/25',
}

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? 'bg-slate-500/15 text-slate-400 border-slate-500/25'

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${style}`}>
      {status}
    </span>
  )
}

interface StatCardProps {
  label: string
  value: string | number
  icon: React.ElementType
  gradient: string
  iconColor: string
  sub?: string
  subColor?: string
}

function StatCard({ label, value, icon: Icon, gradient, iconColor, sub, subColor = 'text-slate-500' }: StatCardProps) {
  return (
    <div className={`rounded-xl border bg-gradient-to-br ${gradient} p-5`}>
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-white/5">
          <Icon size={18} className={iconColor} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">{label}</p>
          <p className="text-2xl font-bold text-white truncate">{value}</p>
          {sub && <p className={`text-xs mt-1 ${subColor}`}>{sub}</p>}
        </div>
      </div>
    </div>
  )
}

function DonutChart({ collected, pending, pct }: { collected: number; pending: number; pct: number }) {
  const radius = 52
  const stroke = 12
  const cx = 72
  const cy = 72
  const circumference = 2 * Math.PI * radius

  const safePct = Math.min(100, Math.max(0, pct))
  const collectedArc = circumference * (safePct / 100)
  const pendingArc = circumference * (1 - safePct / 100)
  const isEmpty = collected === 0 && pending === 0

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: 144, height: 144 }}>
        <svg width={144} height={144} viewBox={`0 0 ${cx * 2} ${cy * 2}`}>
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={stroke}
          />

          {isEmpty ? (
            <circle
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={stroke}
              strokeDasharray={`${circumference}`}
              transform={`rotate(-90 ${cx} ${cy})`}
            />
          ) : (
            <>
              {pendingArc > 0 && (
                <circle
                  cx={cx}
                  cy={cy}
                  r={radius}
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth={stroke}
                  strokeDasharray={`${pendingArc} ${circumference}`}
                  strokeDashoffset={-collectedArc}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${cx} ${cy})`}
                  style={{ filter: 'drop-shadow(0 0 6px rgba(244,63,94,0.45))' }}
                />
              )}

              {collectedArc > 0 && (
                <circle
                  cx={cx}
                  cy={cy}
                  r={radius}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth={stroke}
                  strokeDasharray={`${collectedArc} ${circumference}`}
                  strokeDashoffset={0}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${cx} ${cy})`}
                  style={{ filter: 'drop-shadow(0 0 6px rgba(16,185,129,0.45))' }}
                />
              )}
            </>
          )}
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {isEmpty ? (
            <p className="text-slate-600 text-xs">No data</p>
          ) : (
            <>
              <p className="text-white font-bold text-2xl leading-none">{Math.round(safePct)}%</p>
              <p className="text-slate-500 text-xs mt-0.5">Collected</p>
            </>
          )}
        </div>
      </div>

      <div className="w-full mt-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
            <span className="text-sm text-slate-400">Collected</span>
          </div>
          <span className="text-sm text-white font-semibold">{formatINR(collected)}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.6)]" />
            <span className="text-sm text-slate-400">Pending</span>
          </div>
          <span className="text-sm text-white font-semibold">{formatINR(pending)}</span>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const businessIdRef = useRef<string | null>(null)

  const currentDate = new Date()

  const [loading, setLoading] = useState(true)
  const [bizError, setBizError] = useState<string | null>(null)
  const [businessName, setBusinessName] = useState('My Business')

  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth())

  const yearOptions = [
    currentDate.getFullYear() + 1,
    currentDate.getFullYear(),
    currentDate.getFullYear() - 1,
    currentDate.getFullYear() - 2,
  ]

  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: 0,
    newLeads: 0,
    convertedCustomers: 0,
    totalRevenueExpected: 0,
    revenueCollected: 0,
    revenuePending: 0,
    followupsDue: 0,
  })

  const [recentLeads, setRecentLeads] = useState<RecentLead[]>([])
  const [revenue, setRevenue] = useState<RevenueStats>({
    totalExpected: 0,
    collected: 0,
    pending: 0,
    collectedPct: 0,
  })

  useEffect(() => {
    const checkApproval = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('approval_status')
        .eq('id', user.id)
        .single()

      if (profile?.approval_status?.trim() !== 'approved') {
        router.push('/pending-approval')
      }
    }

    checkApproval()
  }, [router])

  useEffect(() => {
    async function init() {
      try {
        const bizId = await getBusinessId()
        businessIdRef.current = bizId
        await fetchAll(bizId, selectedYear, selectedMonth)
      } catch (err) {
        if (err instanceof BusinessIdException) {
          setBizError(err.message)
        } else {
          setBizError('Failed to load dashboard. Please refresh.')
        }
        setLoading(false)
      }
    }

    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (businessIdRef.current) {
      fetchAll(businessIdRef.current, selectedYear, selectedMonth)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, selectedMonth])

  async function fetchAll(bizId: string, year: number, month: number) {
    setLoading(true)

    const { startISO, endISO } = getMonthRange(year, month)

    const [
      leadsRes,
      followupsRes,
      customersRes,
      settingsRes,
      recentRes,
    ] = await Promise.all([
      supabase
        .from('leads')
        .select('status, created_at')
        .eq('business_id', bizId)
        .gte('created_at', startISO)
        .lt('created_at', endISO),

      supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('business_id', bizId)
        .eq('status', 'Follow-up')
        .gte('created_at', startISO)
        .lt('created_at', endISO),

      supabase
        .from('customers')
        .select('total_amount, amount_paid, pending_amount, created_at, joining_date, membership_start_date')
        .eq('business_id', bizId),

      supabase
        .from('businesses')
        .select('business_name')
        .eq('id', bizId)
        .single(),

      supabase
        .from('leads')
        .select('id, name, phone, service_interested, status, created_at')
        .eq('business_id', bizId)
        .gte('created_at', startISO)
        .lt('created_at', endISO)
        .order('created_at', { ascending: false })
        .limit(5),
    ])

    const leads = leadsRes.data ?? []

    const customers = (customersRes.data ?? []).filter((c) => {
      const date = getCustomerDate(c)
      return date >= new Date(startISO) && date < new Date(endISO)
    })

    const totalExpected = customers.reduce((s, c) => s + Number(c.total_amount || 0), 0)
    const collected = customers.reduce((s, c) => s + Number(c.amount_paid || 0), 0)

    const rawPending = customers.reduce((s, c) => {
      const total = Number(c.total_amount) || 0
      const paid = Number(c.amount_paid) || 0
      return s + Math.max(total - paid, 0)
    }, 0)

    const pending = Math.max(rawPending, 0)

    const collectedPct =
      totalExpected > 0
        ? Math.min((collected / totalExpected) * 100, 100)
        : collected > 0
          ? 100
          : 0

    setStats({
      totalLeads: leads.length,
      newLeads: leads.filter((l) => l.status === 'New').length,
      convertedCustomers: customers.length,
      totalRevenueExpected: totalExpected,
      revenueCollected: collected,
      revenuePending: pending,
      followupsDue: followupsRes.count ?? 0,
    })

    setRevenue({ totalExpected, collected, pending, collectedPct })
    setRecentLeads(recentRes.data ?? [])

    if (settingsRes.data?.business_name) {
      setBusinessName(settingsRes.data.business_name)
    }

    setLoading(false)
  }

  function handleReset() {
    setSelectedYear(currentDate.getFullYear())
    setSelectedMonth(currentDate.getMonth())
  }

  if (bizError) {
    return (
      <div className="p-8">
        <div className="flex items-start gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl max-w-lg">
          <AlertCircle size={18} className="text-rose-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-rose-400 font-medium text-sm">Could not load dashboard</p>
            <p className="text-slate-400 text-xs mt-1">{bizError}</p>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-7 w-48 bg-white/5 rounded-lg animate-pulse" />

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3 h-80 rounded-xl bg-white/5 animate-pulse" />
          <div className="lg:col-span-2 h-80 rounded-xl bg-white/5 animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Welcome back 👋</h1>
          <p className="text-slate-500 mt-1 text-sm">
            {businessName} · {months[selectedMonth]} {selectedYear} dashboard
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Calendar size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="appearance-none rounded-lg border border-white/10 bg-[#0f1117] py-2 pl-9 pr-8 text-xs text-white outline-none"
            >
              {yearOptions.map((year) => (
                <option key={year} value={year} className="bg-[#0f1117]">
                  Year {year}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>

          <div className="relative">
            <Calendar size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="appearance-none rounded-lg border border-white/10 bg-[#0f1117] py-2 pl-9 pr-8 text-xs text-white outline-none"
            >
              {months.map((month, index) => (
                <option key={month} value={index} className="bg-[#0f1117]">
                  Month {month}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-[#0f1117] px-3 py-2 text-xs text-white hover:bg-white/5"
          >
            <RefreshCcw size={14} />
            Reset
          </button>
        </div>
      </div>

      <div className="mb-2">
        <p className="text-xs text-slate-600 uppercase tracking-widest mb-3 font-semibold">Lead Funnel</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Leads"
          value={stats.totalLeads}
          icon={Users}
          gradient="from-violet-500/20 to-violet-600/5 border-violet-500/15"
          iconColor="text-violet-400"
        />

        <StatCard
          label="New Leads"
          value={stats.newLeads}
          icon={UserPlus}
          gradient="from-sky-500/20 to-sky-600/5 border-sky-500/15"
          iconColor="text-sky-400"
        />

        <StatCard
          label="Converted Members"
          value={stats.convertedCustomers}
          icon={UserCheck}
          gradient="from-emerald-500/20 to-emerald-600/5 border-emerald-500/15"
          iconColor="text-emerald-400"
        />

        <StatCard
          label="Follow-ups Due"
          value={stats.followupsDue}
          icon={Bell}
          gradient="from-amber-500/20 to-amber-600/5 border-amber-500/15"
          iconColor="text-amber-400"
          sub={stats.followupsDue > 0 ? `${stats.followupsDue} need attention` : 'All clear'}
          subColor={stats.followupsDue > 0 ? 'text-amber-500' : 'text-slate-500'}
        />
      </div>

      <div className="mb-2">
        <p className="text-xs text-slate-600 uppercase tracking-widest mb-3 font-semibold">Revenue</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Total Expected"
          value={formatINR(stats.totalRevenueExpected)}
          icon={IndianRupee}
          gradient="from-indigo-500/20 to-indigo-600/5 border-indigo-500/15"
          iconColor="text-indigo-400"
        />

        <StatCard
          label="Collected"
          value={formatINR(stats.revenueCollected)}
          icon={CheckCircle}
          gradient="from-emerald-500/20 to-emerald-600/5 border-emerald-500/15"
          iconColor="text-emerald-400"
        />

        <StatCard
          label="Pending"
          value={formatINR(stats.revenuePending)}
          icon={Clock}
          gradient="from-rose-500/20 to-rose-600/5 border-rose-500/15"
          iconColor="text-rose-400"
          sub={stats.revenuePending > 0 ? 'Needs collection' : 'Fully collected'}
          subColor={stats.revenuePending > 0 ? 'text-rose-500' : 'text-emerald-500'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3 bg-[#13151e] border border-white/5 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
            <h2 className="text-white font-semibold text-sm">Recent Enquiries</h2>
            <a
              href="/leads"
              className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors font-medium"
            >
              View all <ArrowRight size={12} />
            </a>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left text-[11px] font-semibold text-slate-600 uppercase tracking-wider px-5 py-3">Name</th>
                  <th className="text-left text-[11px] font-semibold text-slate-600 uppercase tracking-wider px-3 py-3">Phone</th>
                  <th className="text-left text-[11px] font-semibold text-slate-600 uppercase tracking-wider px-3 py-3 hidden md:table-cell">Service</th>
                  <th className="text-left text-[11px] font-semibold text-slate-600 uppercase tracking-wider px-3 py-3">Status</th>
                  <th className="text-left text-[11px] font-semibold text-slate-600 uppercase tracking-wider px-3 py-3 hidden sm:table-cell">Date</th>
                </tr>
              </thead>

              <tbody>
                {recentLeads.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-600 text-sm px-5">
                      No leads found for {months[selectedMonth]} {selectedYear}.
                    </td>
                  </tr>
                ) : (
                  recentLeads.map((lead) => {
                    const waLink = buildWhatsAppLink(
                      lead.phone,
                      buildLeadWhatsAppMessage(
                        lead.name,
                        lead.service_interested ?? 'our membership plan',
                        businessName
                      )
                    )

                    return (
                      <tr
                        key={lead.id}
                        className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="px-5 py-3.5">
                          <span className="text-sm font-medium text-white">{lead.name}</span>
                        </td>

                        <td className="px-3 py-3.5">
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Open WhatsApp"
                            className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 transition-colors text-sm group"
                          >
                            <Phone size={12} className="opacity-60 group-hover:opacity-100 transition-opacity" />
                            {lead.phone}
                          </a>
                        </td>

                        <td className="px-3 py-3.5 hidden md:table-cell">
                          <span className="text-sm text-slate-400">
                            {lead.service_interested || '—'}
                          </span>
                        </td>

                        <td className="px-3 py-3.5">
                          <StatusBadge status={lead.status} />
                        </td>

                        <td className="px-3 py-3.5 hidden sm:table-cell">
                          <span className="text-xs text-slate-500">
                            {formatDate(lead.created_at)}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-2 bg-[#13151e] border border-white/5 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
            <h2 className="text-white font-semibold text-sm">Payments Overview</h2>
            <a
              href="/payments"
              className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors font-medium"
            >
              View all <ArrowRight size={12} />
            </a>
          </div>

          <div className="px-6 py-5">
            <DonutChart
              collected={revenue.collected}
              pending={revenue.pending}
              pct={revenue.collectedPct}
            />

            {revenue.totalExpected > 0 && (
              <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between">
                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Total Expected</span>
                <span className="text-sm text-white font-bold">{formatINR(revenue.totalExpected)}</span>
              </div>
            )}

            {revenue.totalExpected === 0 && (
              <p className="text-center text-slate-600 text-xs mt-5">
                No member payment data for {months[selectedMonth]} {selectedYear}.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}