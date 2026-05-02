'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { getBusinessId, BusinessIdException } from '@/lib/getBusinessId'
import { Lead, LeadStatus } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input, Select, Textarea, Button } from '@/components/ui/FormField'
import { Plus, Search, Pencil, Trash2, UserCheck, Phone, AlertCircle } from 'lucide-react'
import { buildWhatsAppLink, buildLeadWhatsAppMessage } from '@/lib/whatsapp'

const STATUS_OPTIONS = [
  { value: 'New', label: 'New' },
  { value: 'Contacted', label: 'Contacted' },
  { value: 'Follow-up', label: 'Follow-up' },
  { value: 'Converted', label: 'Converted' },
  { value: 'Lost', label: 'Lost' },
]

const SOURCE_OPTIONS = [
  { value: '', label: 'Select source...' },
  { value: 'WhatsApp', label: 'WhatsApp' },
  { value: 'Instagram', label: 'Instagram' },
  { value: 'Facebook', label: 'Facebook' },
  { value: 'Google', label: 'Google' },
  { value: 'Referral', label: 'Referral' },
  { value: 'Walk-in', label: 'Walk-in' },
  { value: 'Other', label: 'Other' },
]

const FILTER_OPTIONS = [{ value: '', label: 'All Status' }, ...STATUS_OPTIONS]

const EMPTY_FORM = {
  name: '',
  phone: '',
  business_type: '',
  service_interested: '',
  source: '',
  status: 'New' as LeadStatus,
  notes: '',
}

export default function LeadsPage() {
  const businessIdRef = useRef<string | null>(null)

  const [leads, setLeads] = useState<Lead[]>([])
  const [businessName, setBusinessName] = useState('Flowza')

  const [loading, setLoading] = useState(true)
  const [bizError, setBizError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [convertId, setConvertId] = useState<string | null>(null)

  // INIT
  useEffect(() => {
    async function init() {
      try {
        const bizId = await getBusinessId()
        businessIdRef.current = bizId

        // 🔥 GET BUSINESS NAME
        const { data } = await supabase
          .from('businesses')
          .select('name')
          .eq('id', bizId)
          .single()

        if (data?.name) setBusinessName(data.name)

        fetchLeads()
      } catch (err) {
        if (err instanceof BusinessIdException) {
          setBizError(err.message)
        } else {
          setBizError('Unexpected error')
        }
        setLoading(false)
      }
    }
    init()
  }, [])

  const fetchLeads = useCallback(async () => {
    const bizId = businessIdRef.current
    if (!bizId) return

    setLoading(true)

    let query = supabase
      .from('leads')
      .select('*')
      .eq('business_id', bizId)
      .order('created_at', { ascending: false })

    if (filterStatus) query = query.eq('status', filterStatus)

    const { data, error } = await query
    if (error) console.error(error)

    setLeads(data ?? [])
    setLoading(false)
  }, [filterStatus])

  useEffect(() => {
    if (businessIdRef.current) fetchLeads()
  }, [fetchLeads])

  const filtered = leads.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.phone.includes(search)
  )

  function openAdd() {
    setEditingLead(null)
    setForm(EMPTY_FORM)
    setShowModal(true)
  }

  function openEdit(lead: Lead) {
    setEditingLead(lead)
    setForm({
      name: lead.name,
      phone: lead.phone,
      business_type: lead.business_type ?? '',
      service_interested: lead.service_interested ?? '',
      source: lead.source ?? '',
      status: lead.status,
      notes: lead.notes ?? '',
    })
    setShowModal(true)
  }

  async function handleSave() {
    const bizId = businessIdRef.current
    if (!bizId) return

    setSaving(true)

    if (editingLead) {
      await supabase
        .from('leads')
        .update(form)
        .eq('id', editingLead.id)
        .eq('business_id', bizId)
    } else {
      await supabase.from('leads').insert([
        {
          ...form,
          business_id: bizId,
        },
      ])
    }

    setSaving(false)
    setShowModal(false)
    fetchLeads()
  }

  async function handleDelete(id: string) {
    const bizId = businessIdRef.current
    if (!bizId) return

    await supabase
      .from('leads')
      .delete()
      .eq('id', id)
      .eq('business_id', bizId)

    fetchLeads()
  }

  async function handleConvert(lead: Lead) {
    const bizId = businessIdRef.current
    if (!bizId) return

    await supabase.from('customers').insert([
      {
        business_id: bizId,
        name: lead.name,
        phone: lead.phone,
      },
    ])

    await supabase
      .from('leads')
      .update({ status: 'Converted' })
      .eq('id', lead.id)

    setConvertId(null)
    fetchLeads()
  }

  if (bizError) return <div>{bizError}</div>

  return (
    <div className="p-8">
      <div className="flex justify-between mb-6">
        <h1 className="text-xl font-semibold">Leads</h1>
        <Button onClick={openAdd}><Plus size={16}/> Add Lead</Button>
      </div>

      <div className="mb-4 flex gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
          className="px-3 py-2 bg-black/30 rounded"
        />
      </div>

      <table className="w-full">
        <tbody>
          {filtered.map((lead) => (
            <tr key={lead.id}>
              <td>{lead.name}</td>

              <td>
                <a
                  href={buildWhatsAppLink(
                    lead.phone,
                    buildLeadWhatsAppMessage(
                      lead.name,
                      lead.service_interested ?? 'our service',
                      businessName // ✅ FIXED HERE
                    )
                  )}
                  target="_blank"
                >
                  {lead.phone}
                </a>
              </td>

              <td>{lead.status}</td>

              <td>
                <button onClick={() => openEdit(lead)}>
                  <Pencil size={14}/>
                </button>

                <button onClick={() => handleDelete(lead.id)}>
                  <Trash2 size={14}/>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}