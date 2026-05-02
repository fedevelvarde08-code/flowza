'use client'

// app/followups/page.tsx
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Lead, Customer } from '@/types'
import { Badge } from '@/components/ui/Badge'
import {
  buildWhatsAppLink,
  buildLeadWhatsAppMessage,
  buildPaymentWhatsAppMessage,
} from '@/lib/whatsapp'
import { MessageCircle, UserPlus, Users } from 'lucide-react'

export default function FollowupsPage() {
  const [followupLeads, setFollowupLeads] = useState<Lead[]>([])
  const [pendingCustomers, setPendingCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [businessName, setBusinessName] = useState('Flowza')
  useEffect(() => {
    async function fetchData() {
      const [leadsRes, customersRes] = await Promise.all([
        supabase.from('leads').select('*').eq('status', 'Follow-up').order('updated_at', { ascending: false }),
        supabase.from('customers').select('*').in('payment_status', ['Due', 'Partial']).order('pending_amount', { ascending: false }),
      ])
      setFollowupLeads(leadsRes.data ?? [])
      setPendingCustomers(customersRes.data ?? [])
      setLoading(false)
    }
    fetchData()
  }, [])

  return (
    <div className="p-8">
      <div className="page-header">
        <div>
          <h1 className="page-title">Follow-ups</h1>
          <p className="page-subtitle">
            {followupLeads.length} leads · {pendingCustomers.length} pending payments
          </p>
        </div>
      </div>

      {/* Leads needing follow-up */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <UserPlus size={16} className="text-amber-400" />
          <h2 className="text-sm font-semibold text-white">Leads — Follow-up Required</h2>
          <span className="text-xs bg-amber-500/15 text-amber-400 border border-amber-500/20 rounded-full px-2 py-0.5">{followupLeads.length}</span>
        </div>

        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="table-th">Name</th>
                <th className="table-th hidden md:table-cell">Service</th>
                <th className="table-th hidden md:table-cell">Source</th>
                <th className="table-th">Status</th>
                <th className="table-th text-right">WhatsApp</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-t border-white/5">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="table-td"><div className="h-4 bg-white/5 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : followupLeads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="table-td text-center py-10 text-slate-600">
                    No leads pending follow-up 🎉
                  </td>
                </tr>
              ) : (
                followupLeads.map((lead) => {
                  const msg = buildLeadWhatsAppMessage(
  lead.name,
  lead.service_interested ?? 'our service',
  businessName
)
                  return (
                    <tr key={lead.id} className="table-row">
                      <td className="table-td">
                        <p className="font-medium text-white">{lead.name}</p>
                        <p className="text-xs text-slate-500">{lead.phone}</p>
                      </td>
                      <td className="table-td hidden md:table-cell text-slate-400">{lead.service_interested || '—'}</td>
                      <td className="table-td hidden md:table-cell text-slate-400">{lead.source || '—'}</td>
                      <td className="table-td"><Badge status={lead.status} /></td>
                      <td className="table-td">
                        <div className="flex justify-end">
                          <a
                            href={buildWhatsAppLink(lead.phone, msg)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-xs font-medium rounded-lg border border-emerald-500/20 transition-colors"
                          >
                            <MessageCircle size={13} /> WhatsApp
                          </a>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customers with pending payments */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Users size={16} className="text-rose-400" />
          <h2 className="text-sm font-semibold text-white">Customers — Pending Payments</h2>
          <span className="text-xs bg-rose-500/15 text-rose-400 border border-rose-500/20 rounded-full px-2 py-0.5">{pendingCustomers.length}</span>
        </div>

        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="table-th">Name</th>
                <th className="table-th hidden md:table-cell">Service</th>
                <th className="table-th">Pending</th>
                <th className="table-th">Status</th>
                <th className="table-th text-right">WhatsApp</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-t border-white/5">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="table-td"><div className="h-4 bg-white/5 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : pendingCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="table-td text-center py-10 text-slate-600">
                    All payments are cleared 🎉
                  </td>
                </tr>
              ) : (
                pendingCustomers.map((c) => {
                  const pending = Number(c.pending_amount)
                  const msg = buildPaymentWhatsAppMessage(c.name, pending)
                  return (
                    <tr key={c.id} className="table-row">
                      <td className="table-td">
                        <p className="font-medium text-white">{c.name}</p>
                        <p className="text-xs text-slate-500">{c.phone}</p>
                      </td>
                      <td className="table-td hidden md:table-cell text-slate-400">{c.service_taken || '—'}</td>
                      <td className="table-td text-rose-400 font-semibold">
                        ₹{pending.toLocaleString('en-IN')}
                      </td>
                      <td className="table-td"><Badge status={c.payment_status} /></td>
                      <td className="table-td">
                        <div className="flex justify-end">
                          <a
                            href={buildWhatsAppLink(c.phone, msg)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-xs font-medium rounded-lg border border-emerald-500/20 transition-colors"
                          >
                            <MessageCircle size={13} /> WhatsApp
                          </a>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
