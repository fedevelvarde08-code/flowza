'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { getBusinessId, BusinessIdException } from '@/lib/getBusinessId'
import { Customer, PaymentStatus } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input, Button } from '@/components/ui/FormField'
import { Pencil, Search, Phone, AlertCircle, Trash2, Users } from 'lucide-react'
import { buildWhatsAppLink, buildPaymentWhatsAppMessage } from '@/lib/whatsapp'

interface Batch {
  id: string
  name: string
  branch_id: string
  default_fee: number
}

interface Branch {
  id: string
  name: string
}

interface CustomerRow extends Customer {
  batch_id?: string | null
  batch?: {
    id: string
    name: string
  } | null
}

const filterOptions = [
  { value: '', label: 'All Status' },
  { value: 'Due', label: 'Due' },
  { value: 'Partial', label: 'Partial' },
  { value: 'Paid', label: 'Paid' },
]

function formatINR(n: number) {
  return '₹' + Number(n || 0).toLocaleString('en-IN')
}

export default function CustomersPage() {
  const businessIdRef = useRef<string | null>(null)

  const [customers, setCustomers] = useState<CustomerRow[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [branches, setBranches] = useState<Branch[]>([])

  const [selectedBranch, setSelectedBranch] = useState('')
  const [selectedBatch, setSelectedBatch] = useState('')
  const [formBranchId, setFormBranchId] = useState('')

  const [loading, setLoading] = useState(true)
  const [bizError, setBizError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<CustomerRow | null>(null)

  const [form, setForm] = useState({
    name: '',
    phone: '',
    business_type: '',
    service_taken: '',
    joining_date: '',
    total_amount: '',
    amount_paid: '',
    batch_id: '',
  })

  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    const bizId = businessIdRef.current
    if (!bizId) return

    setLoading(true)

    let customersQuery = supabase
      .from('customers')
      .select('*, batch:batches(id, name)')
      .eq('business_id', bizId)
      .order('created_at', { ascending: false })

    if (filterStatus) {
      customersQuery = customersQuery.eq('payment_status', filterStatus)
    }

    const [customersRes, batchesRes, branchesRes] = await Promise.all([
      customersQuery,

      supabase
        .from('batches')
        .select('id, name, branch_id, default_fee')
        .eq('business_id', bizId)
        .order('name'),

      supabase
        .from('branches')
        .select('id, name')
        .eq('business_id', bizId)
        .order('name'),
    ])

    if (customersRes.error) console.error('fetchCustomers:', customersRes.error.message)
    if (batchesRes.error) console.error('fetchBatches:', batchesRes.error.message)
    if (branchesRes.error) console.error('fetchBranches:', branchesRes.error.message)

    setCustomers((customersRes.data ?? []) as CustomerRow[])
    setBatches((batchesRes.data ?? []) as Batch[])
    setBranches((branchesRes.data ?? []) as Branch[])
    setLoading(false)
  }, [filterStatus])

  useEffect(() => {
    async function init() {
      try {
        businessIdRef.current = await getBusinessId()
        await fetchData()
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
  }, [fetchData])

  useEffect(() => {
    if (businessIdRef.current) fetchData()
  }, [fetchData])

  const filteredBatches = selectedBranch
    ? batches.filter((batch) => batch.branch_id === selectedBranch)
    : batches

  const formFilteredBatches = formBranchId
    ? batches.filter((batch) => batch.branch_id === formBranchId)
    : batches

  const filtered = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      (c.batch?.name ?? '').toLowerCase().includes(search.toLowerCase())

    const matchesBatch = !selectedBatch || c.batch_id === selectedBatch

    const matchesBranch =
      !selectedBranch || filteredBatches.some((b) => b.id === c.batch_id)

    return matchesSearch && matchesBatch && matchesBranch
  })

  const totalCustomers = filtered.length
  const paidCustomers = filtered.filter((c) => c.payment_status === 'Paid').length
  const partialCustomers = filtered.filter((c) => c.payment_status === 'Partial').length
  const dueCustomers = filtered.filter((c) => c.payment_status === 'Due').length

 function openEdit(c: CustomerRow) {
  console.log('EDIT CLICKED:', c)

  const customerBatch = batches.find((b) => b.id === c.batch_id)

  setFormBranchId(customerBatch?.branch_id || '')

  setEditingCustomer(c)

  setForm({
    name: c.name || '',
    phone: c.phone || '',
    business_type: c.business_type || '',
    service_taken: c.service_taken || '',
    joining_date: c.joining_date || '',
    total_amount: String(c.total_amount || 0),
    amount_paid: String(c.amount_paid || 0),
    batch_id: c.batch_id || '',
  })

  setFormError(null)

  // 🔥 THIS IS THE IMPORTANT LINE
  setShowModal(true)
}

  async function handleSave() {
  if (!editingCustomer) return

  setFormError(null)

  const bizId = businessIdRef.current
  if (!bizId) {
    setFormError('Business not loaded. Please refresh.')
    return
  }

  if (!form.name || !form.phone) {
    setFormError('Name and phone are required.')
    return
  }

  setSaving(true)

  const total = parseFloat(form.total_amount) || 0
  const paid = parseFloat(form.amount_paid) || 0
  const pending = Math.max(total - paid, 0)

  const status: PaymentStatus =
    pending === 0 && total > 0 ? 'Paid' : paid > 0 ? 'Partial' : 'Due'

  const { error } = await supabase
    .from('customers')
    .update({
      name: form.name,
      phone: form.phone,
      business_type: form.business_type || '',
      service_taken: form.service_taken || '',
      joining_date: form.joining_date || new Date().toISOString().split('T')[0],
      total_amount: total,
      amount_paid: paid,
      payment_status: status,
      batch_id: form.batch_id || null,
    })
    .eq('id', editingCustomer.id)
    .eq('business_id', bizId)

  if (error) {
    console.error('CUSTOMER UPDATE ERROR:', error)
    alert(error.message)
    setFormError(`Update failed: ${error.message}`)
    setSaving(false)
    return
  }

  setSaving(false)
  setShowModal(false)
  fetchData()
}

  async function handleDeleteCustomer(c: CustomerRow) {
    if (!confirm(`Delete ${c.name}?`)) return

    const bizId = businessIdRef.current
    if (!bizId) return

    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', c.id)
      .eq('business_id', bizId)

    if (error) {
      alert(error.message)
      return
    }

    fetchData()
  }

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
        <h1 className="page-title">Customers</h1>
        <p className="page-subtitle">{customers.length} total customers</p>
      </div>
    </div>

    {/* ✅ SUMMARY BAR */}
    <div className="grid grid-cols-4 gap-4 mb-6">
      {(['Paid', 'Partial', 'Due'] as const).map((s) => {
        const count = filtered.filter((c) => c.payment_status === s).length

        return (
          <div key={s} className="card p-4 flex items-center gap-3">
            <Badge status={s} />
            <span className="text-white font-semibold">{count}</span>
            <span className="text-slate-500 text-sm">customers</span>
          </div>
        )
      })}

      {/* Total customers */}
      <div className="card p-4 flex items-center gap-3">
        <span className="text-white font-semibold">{filtered.length}</span>
        <span className="text-slate-500 text-sm">customers</span>
      </div>
    </div>

    <div className="flex gap-3 mb-5">
      <div className="relative flex-1 max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, phone, batch..."
          className="w-full pl-9 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm"
        />
      </div>

      <select
        value={selectedBranch}
        onChange={(e) => {
          setSelectedBranch(e.target.value)
          setSelectedBatch('')
        }}
        className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm"
      >
        <option value="">All Branches</option>
        {branches.map((b) => (
          <option key={b.id} value={b.id}>{b.name}</option>
        ))}
      </select>

      <select
        value={selectedBatch}
        onChange={(e) => setSelectedBatch(e.target.value)}
        className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm"
      >
        <option value="">All Batches</option>
        {filteredBatches.map((b) => (
          <option key={b.id} value={b.id}>{b.name}</option>
        ))}
      </select>

      <select
        value={filterStatus}
        onChange={(e) => setFilterStatus(e.target.value)}
        className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm"
      >
        {filterOptions.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>

    {/* TABLE (unchanged) */}
    <div className="card overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/5">
            <th className="table-th">Name</th>
            <th className="table-th hidden md:table-cell">Service</th>
            <th className="table-th hidden lg:table-cell">Batch</th>
            <th className="table-th">Total</th>
            <th className="table-th">Paid</th>
            <th className="table-th">Pending</th>
            <th className="table-th">Status</th>
            <th className="table-th text-right">Actions</th>
          </tr>
        </thead>

        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-t border-white/5">
                {Array.from({ length: 8 }).map((_, j) => (
                  <td key={j} className="table-td">
                    <div className="h-4 bg-white/5 rounded animate-pulse" />
                  </td>
                ))}
              </tr>
            ))
          ) : filtered.length === 0 ? (
            <tr>
              <td colSpan={8} className="table-td text-center py-12 text-slate-600">
                No customers match your filter.
              </td>
            </tr>
          ) : (
            filtered.map((c) => {
              const pending = Math.max(Number(c.pending_amount ?? 0), 0)

              return (
                <tr key={c.id} className="table-row">
                  <td className="table-td">
                    <p className="text-white font-medium">{c.name}</p>
                  </td>

                  <td className="table-td hidden md:table-cell">
                    {c.service_taken || '—'}
                  </td>

                  <td className="table-td hidden lg:table-cell">
                    {c.batch?.name || '—'}
                  </td>

                  <td className="table-td">{formatINR(c.total_amount)}</td>
                  <td className="table-td text-emerald-400">{formatINR(c.amount_paid)}</td>
                  <td className="table-td text-rose-400">{formatINR(pending)}</td>
                  <td className="table-td">
                    <Badge status={c.payment_status} />
                  </td>

                 <td className="table-td text-right">
  <button
    type="button"
    onClick={() => openEdit(c)}
    className="p-1.5 text-slate-500 hover:text-white"
  >
    <Pencil size={14} />
  </button>

  <button
    onClick={() => handleDeleteCustomer(c)}
    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg"
  >
    <Trash2 size={14} />
  </button>
</td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  {showModal && (
  <Modal
    title="Edit Customer"
    onClose={() => setShowModal(false)}
    size="lg"
  >
   <div className="grid grid-cols-2 gap-4">
  <Input label="Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
  <Input label="Phone *" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
  <Input label="Business Type" value={form.business_type} onChange={(e) => setForm({ ...form, business_type: e.target.value })} />
  <Input label="Service Taken" value={form.service_taken} onChange={(e) => setForm({ ...form, service_taken: e.target.value })} />
  <Input label="Joining Date" type="date" value={form.joining_date} onChange={(e) => setForm({ ...form, joining_date: e.target.value })} />

  <div>
    <label className="block text-sm text-slate-400 mb-1">Branch</label>
    <select
      value={formBranchId}
      onChange={(e) => {
        setFormBranchId(e.target.value)
        setForm({ ...form, batch_id: '' })
      }}
      className="w-full px-3 py-2.5 rounded-lg bg-[#0f1117] border border-white/10 text-white text-sm"
    >
      <option value="" className="bg-[#0f1117] text-white">Select branch</option>
      {branches.map((b) => (
        <option key={b.id} value={b.id} className="bg-[#0f1117] text-white">
          {b.name}
        </option>
      ))}
    </select>
  </div>

  <div>
    <label className="block text-sm text-slate-400 mb-1">Batch</label>
    <select
      value={form.batch_id}
      onChange={(e) => {
        const batchId = e.target.value
        const selected = batches.find((b) => b.id === batchId)

        setForm({
          ...form,
          batch_id: batchId,
          total_amount:
            selected?.default_fee != null
              ? String(selected.default_fee)
              : form.total_amount,
        })
      }}
      className="w-full px-3 py-2.5 rounded-lg bg-[#0f1117] border border-white/10 text-white text-sm"
    >
      <option value="" className="bg-[#0f1117] text-white">Select batch</option>
      {formFilteredBatches.map((b) => (
        <option key={b.id} value={b.id} className="bg-[#0f1117] text-white">
          {b.name}
        </option>
      ))}
    </select>
  </div>

  <Input label="Total Amount" type="number" value={form.total_amount} onChange={(e) => setForm({ ...form, total_amount: e.target.value })} />
  <Input label="Amount Paid" type="number" value={form.amount_paid} onChange={(e) => setForm({ ...form, amount_paid: e.target.value })} />

  {formError && (
    <div className="col-span-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
      <p className="text-sm text-rose-400">{formError}</p>
    </div>
  )}
</div>

<div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/5">
  <Button variant="secondary" onClick={() => setShowModal(false)}>
    Cancel
  </Button>
  <Button onClick={handleSave} loading={saving}>
    Save Changes
  </Button>
</div>
  </Modal>
)}
  </div>
)
}