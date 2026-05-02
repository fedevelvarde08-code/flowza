'use client'

// app/leads/page.tsx
// Leads are scoped to the logged-in user's business via business_id.
// All reads and writes go through getBusinessId() — never hardcoded.

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
  // Resolved once on mount and cached — no repeated DB lookups per action
  const businessIdRef = useRef<string | null>(null)

  const [leads, setLeads] = useState<Lead[]>([])
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

  // ── 1. Resolve business_id once on mount ──────────────────────────────────
  useEffect(() => {
    async function init() {
      try {
        businessIdRef.current = await getBusinessId()
        fetchLeads()
      } catch (err) {
        if (err instanceof BusinessIdException) {
          setBizError(err.message)
        } else {
          setBizError('Unexpected error loading your business.')
        }
        setLoading(false)
      }
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── 2. Fetch leads scoped to this business ────────────────────────────────
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
    if (error) console.error('fetchLeads:', error.message)
    setLeads(data ?? [])
    setLoading(false)
  }, [filterStatus])

  useEffect(() => {
    if (businessIdRef.current) fetchLeads()
  }, [fetchLeads])

  // Client-side search
  const filtered = leads.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.phone.includes(search) ||
      (l.service_interested ?? '').toLowerCase().includes(search.toLowerCase())
  )

  function openAdd() {
    setEditingLead(null)
    setForm(EMPTY_FORM)
    setFormError(null)
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
    setFormError(null)
    setShowModal(true)
  }

  // ── 3. Insert lead with business_id ───────────────────────────────────────
  async function handleSave() {
    setFormError(null)
    if (!form.name.trim()) return setFormError('Name is required.')
    if (!form.phone.trim()) return setFormError('Phone is required.')

    const bizId = businessIdRef.current
    if (!bizId) return setFormError('Business not loaded. Please refresh the page.')

    setSaving(true)

    if (editingLead) {
      const { error } = await supabase
        .from('leads')
        .update({
          name: form.name,
          phone: form.phone,
          business_type: form.business_type,
          service_interested: form.service_interested,
          source: form.source,
          status: form.status,
          notes: form.notes,
        })
        .eq('id', editingLead.id)
        .eq('business_id', bizId) // safety: confirm it belongs to us

      if (error) { setFormError(`Update failed: ${error.message}`); setSaving(false); return }
    } else {
      const { error } = await supabase
        .from('leads')
        .insert([{
          business_id: bizId,       // ← always from resolved ref, never hardcoded
          name: form.name,
          phone: form.phone,
          business_type: form.business_type,
          service_interested: form.service_interested,
          source: form.source,
          status: form.status,
          notes: form.notes,
        }])

      if (error) { setFormError(`Insert failed: ${error.message}`); setSaving(false); return }
    }

    setSaving(false)
    setShowModal(false)
    fetchLeads()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this lead?')) return
    const bizId = businessIdRef.current
    if (!bizId) return
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id)
      .eq('business_id', bizId)
    if (error) alert(`Delete failed: ${error.message}`)
    else fetchLeads()
  }

  async function handleConvert(lead: Lead) {
    const bizId = businessIdRef.current
    if (!bizId) return

    const { error } = await supabase
      .from('customers')
      .insert([{
        business_id: bizId,
        lead_id: lead.id,
        name: lead.name,
        phone: lead.phone,
        business_type: lead.business_type ?? '',
        service_taken: lead.service_interested ?? '',
        joining_date: new Date().toISOString().split('T')[0],
        total_amount: 0,
        amount_paid: 0,
        payment_status: 'Due',
      }])

    if (error) { alert(`Convert failed: ${error.message}`); return }

    await supabase
      .from('leads')
      .update({ status: 'Converted' })
      .eq('id', lead.id)
      .eq('business_id', bizId)

    setConvertId(null)
    fetchLeads()
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (bizError) {
    return (
      <div className="p-8">
        <div className="flex items-start gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl max-w-lg">
          <AlertCircle size={18} className="text-rose-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-rose-400 font-medium text-sm">Could not load business</p>
            <p className="text-slate-400 text-xs mt-1">{bizError}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="page-header">
        <div>
          <h1 className="page-title">Leads</h1>
          <p className="page-subtitle">{leads.length} total leads</p>
        </div>
        <Button onClick={openAdd} disabled={!businessIdRef.current}>
          <Plus size={16} /> Add Lead
        </Button>
      </div>

      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, phone, service..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-violet-500/60"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-sm focus:outline-none appearance-none"
        >
          {FILTER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value} className="bg-[#0f1117]">{o.label}</option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="table-th">Name</th>
              <th className="table-th">Phone</th>
              <th className="table-th hidden md:table-cell">Service</th>
              <th className="table-th hidden lg:table-cell">Source</th>
              <th className="table-th">Status</th>
              <th className="table-th text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-t border-white/5">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="table-td">
                      <div className="h-4 bg-white/5 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="table-td text-center py-12 text-slate-600">
                  {search || filterStatus ? 'No leads match your filter.' : 'No leads yet. Add your first lead →'}
                </td>
              </tr>
            ) : (
              filtered.map((lead) => (
                <tr key={lead.id} className="table-row">
                  <td className="table-td font-medium text-white">{lead.name}</td>
                  <td className="table-td">
                    <a
                      href={buildWhatsAppLink(lead.phone, buildLeadWhatsAppMessage(lead.name, lead.service_interested ?? 'our service'))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      <Phone size={12} />{lead.phone}
                    </a>
                  </td>
                  <td className="table-td hidden md:table-cell text-slate-400">{lead.service_interested || '—'}</td>
                  <td className="table-td hidden lg:table-cell text-slate-400">{lead.source || '—'}</td>
                  <td className="table-td"><Badge status={lead.status} /></td>
                  <td className="table-td">
                    <div className="flex items-center justify-end gap-1">
                      {lead.status !== 'Converted' && (
                        <button onClick={() => setConvertId(lead.id)} title="Convert to customer"
                          className="p-1.5 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors">
                          <UserCheck size={15} />
                        </button>
                      )}
                      <button onClick={() => openEdit(lead)}
                        className="p-1.5 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDelete(lead.id)}
                        className="p-1.5 text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <Modal title={editingLead ? 'Edit Lead' : 'Add New Lead'} onClose={() => setShowModal(false)} size="lg">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Rahul Sharma" />
            <Input label="Phone *" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="9876543210" />
            <Input label="Business Type" value={form.business_type} onChange={(e) => setForm({ ...form, business_type: e.target.value })} placeholder="Coaching / Gym / Clinic" />
            <Input label="Service Interested" value={form.service_interested} onChange={(e) => setForm({ ...form, service_interested: e.target.value })} placeholder="Math Tuition / Yoga" />
            <Select label="Source" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} options={SOURCE_OPTIONS} />
            <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as LeadStatus })} options={STATUS_OPTIONS} />
            <div className="col-span-2">
              <Textarea label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Any notes..." />
            </div>
          </div>
          {formError && (
            <div className="flex items-center gap-2 mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg">
              <AlertCircle size={14} className="text-rose-400 shrink-0" />
              <p className="text-rose-400 text-xs">{formError}</p>
            </div>
          )}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/5">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>{editingLead ? 'Update Lead' : 'Add Lead'}</Button>
          </div>
        </Modal>
      )}

      {convertId && (() => {
        const lead = leads.find((l) => l.id === convertId)!
        return (
          <Modal title="Convert to Customer?" onClose={() => setConvertId(null)} size="sm">
            <p className="text-slate-400 text-sm mb-5">
              <span className="text-white font-medium">{lead.name}</span> will be added to Customers.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setConvertId(null)}>Cancel</Button>
              <Button onClick={() => handleConvert(lead)}>Convert</Button>
            </div>
          </Modal>
        )
      })()}
    </div>
  )
}