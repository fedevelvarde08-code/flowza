'use client'

// app/followups/page.tsx

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getBusinessId } from '@/lib/getBusinessId'
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
  const [pendingMembers, setPendingMembers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [businessName, setBusinessName] = useState('Flowza')

  useEffect(() => {
    async function fetchData() {
      const bizId = await getBusinessId()

      const { data: businessData } = await supabase
        .from('businesses')
        .select('business_name')
        .eq('id', bizId)
        .single()

      if (businessData?.business_name) {
        setBusinessName(businessData.business_name)
      }

      const [leadsRes, membersRes] = await Promise.all([
        supabase
          .from('leads')
          .select('*')
          .eq('business_id', bizId)
          .eq('status', 'Follow-up')
          .order('updated_at', { ascending: false }),

        supabase
          .from('customers')
          .select('*')
          .eq('business_id', bizId)
          .in('payment_status', ['Due', 'Partial'])
          .order('pending_amount', { ascending: false }),
      ])

      setFollowupLeads(leadsRes.data ?? [])
      setPendingMembers(membersRes.data ?? [])
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
            {followupLeads.length} leads · {pendingMembers.length} members with pending payments
          </p>
        </div>
      </div>

      {/* Leads */}
      <div className="mb-8">
        <div className="mb-4 flex items-center gap-2">
          <UserPlus size={16} className="text-amber-400" />
          <h2 className="text-sm font-semibold text-white">
            Leads — Follow-up Required
          </h2>
          <span className="rounded-full border border-amber-500/20 bg-amber-500/15 px-2 py-0.5 text-xs text-amber-400">
            {followupLeads.length}
          </span>
        </div>

        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="table-th">Name</th>
                <th className="table-th hidden md:table-cell">Service</th>
                <th className="table-th hidden md:table-cell">Source</th>
                <th className="table-th">Status</th>
                <th className="table-th w-[160px] text-center">WhatsApp</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-t border-white/5">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="table-td">
                        <div className="h-4 animate-pulse rounded bg-white/5" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : followupLeads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="table-td py-10 text-center text-slate-600">
                    No leads pending follow-up 🎉
                  </td>
                </tr>
              ) : (
                followupLeads.map((lead) => {
                  const msg = buildLeadWhatsAppMessage(
                    lead.name,
                    lead.service_interested ?? 'our membership plan',
                    businessName
                  )

                  return (
                    <tr key={lead.id} className="table-row">
                      <td className="table-td">
                        <p className="font-medium text-white">{lead.name}</p>
                        <p className="text-xs text-slate-500">{lead.phone}</p>
                      </td>

                      <td className="table-td hidden text-slate-400 md:table-cell">
                        {lead.service_interested || '—'}
                      </td>

                      <td className="table-td hidden text-slate-400 md:table-cell">
                        {lead.source || '—'}
                      </td>

                      <td className="table-td">
                        <Badge status={lead.status} />
                      </td>

                      <td className="table-td w-[160px] text-center">
                        <div className="flex justify-center">
                          <a
                            href={buildWhatsAppLink(lead.phone, msg)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-600/20 px-3 py-1.5 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-600/30"
                          >
                            <MessageCircle size={13} />
                            WhatsApp
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

      {/* Members */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <Users size={16} className="text-rose-400" />
          <h2 className="text-sm font-semibold text-white">
            Members — Pending Payments
          </h2>
          <span className="rounded-full border border-rose-500/20 bg-rose-500/15 px-2 py-0.5 text-xs text-rose-400">
            {pendingMembers.length}
          </span>
        </div>

        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="table-th">Name</th>
                <th className="table-th hidden md:table-cell">Membership Type</th>
                <th className="table-th">Pending</th>
                <th className="table-th">Status</th>
                <th className="table-th w-[160px] text-center">WhatsApp</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-t border-white/5">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="table-td">
                        <div className="h-4 animate-pulse rounded bg-white/5" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : pendingMembers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="table-td py-10 text-center text-slate-600">
                    All member payments are cleared 🎉
                  </td>
                </tr>
              ) : (
                pendingMembers.map((member) => {
                  const pending = Number(member.pending_amount || 0)
                  const msg = buildPaymentWhatsAppMessage(member.name, pending)

                  return (
                    <tr key={member.id} className="table-row">
                      <td className="table-td">
                        <p className="font-medium text-white">{member.name}</p>
                        <p className="text-xs text-slate-500">{member.phone}</p>
                      </td>

                      <td className="table-td hidden text-slate-400 md:table-cell">
                        {member.service_taken || '—'}
                      </td>

                      <td className="table-td font-semibold text-rose-400">
                        ₹{pending.toLocaleString('en-IN')}
                      </td>

                      <td className="table-td">
                        <Badge status={member.payment_status} />
                      </td>

                      <td className="table-td w-[160px] text-center">
                        <div className="flex justify-center">
                          <a
                            href={buildWhatsAppLink(member.phone, msg)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-600/20 px-3 py-1.5 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-600/30"
                          >
                            <MessageCircle size={13} />
                            WhatsApp
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