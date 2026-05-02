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
  const [pendingCustomers, setPendingCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [businessName, setBusinessName] = useState('Flowza')

  useEffect(() => {
    async function fetchData() {
      const bizId = await getBusinessId()

      // ✅ FETCH REAL BUSINESS NAME
      const { data: businessData } = await supabase
        .from('businesses')
        .select('business_name')
        .eq('id', bizId)
        .single()

      if (businessData?.business_name) {
        setBusinessName(businessData.business_name)
      }

      const [leadsRes, customersRes] = await Promise.all([
        supabase
          .from('leads')
          .select('*')
          .eq('status', 'Follow-up')
          .order('updated_at', { ascending: false }),

        supabase
          .from('customers')
          .select('*')
          .in('payment_status', ['Due', 'Partial'])
          .order('pending_amount', { ascending: false }),
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

      {/* Leads */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <UserPlus size={16} className="text-amber-400" />
          <h2 className="text-sm font-semibold text-white">Leads — Follow-up Required</h2>
        </div>

        <div className="card overflow-hidden">
          <table className="w-full">
            <tbody>
              {followupLeads.map((lead) => {
                const msg = buildLeadWhatsAppMessage(
                  lead.name,
                  lead.service_interested ?? 'our service',
                  businessName // ✅ FIXED
                )

                return (
                  <tr key={lead.id}>
                    <td>{lead.name}</td>
                    <td>
                      <a href={buildWhatsAppLink(lead.phone, msg)} target="_blank">
                        WhatsApp
                      </a>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customers */}
      <div>
        <div className="card overflow-hidden">
          <table className="w-full">
            <tbody>
              {pendingCustomers.map((c) => {
                const msg = buildPaymentWhatsAppMessage(
                  c.name,
                  Number(c.pending_amount)
                )

                return (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td>
                      <a href={buildWhatsAppLink(c.phone, msg)} target="_blank">
                        WhatsApp
                      </a>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}