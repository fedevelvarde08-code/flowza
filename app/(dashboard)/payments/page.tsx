'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { getBusinessId, BusinessIdException } from '@/lib/getBusinessId'
import { Payment, PaymentMode } from '@/types'
import { Modal } from '@/components/ui/Modal'
import { Input, Select, Textarea, Button } from '@/components/ui/FormField'
import { Badge } from '@/components/ui/Badge'
import { Plus, Pencil, AlertCircle } from 'lucide-react'

const paymentModeOptions: { value: PaymentMode; label: string }[] = [
  { value: 'Cash', label: 'Cash' },
  { value: 'UPI', label: 'UPI' },
  { value: 'Bank Transfer', label: 'Bank Transfer' },
  { value: 'Card', label: 'Card' },
  { value: 'Cheque', label: 'Cheque' },
  { value: 'Other', label: 'Other' },
]

interface Branch {
  id: string
  name: string
}

interface Batch {
  id: string
  name: string
  branch_id: string
}

interface CustomerMini {
  id: string
  name: string
  phone: string
  pending_amount: number
  payment_status: 'Paid' | 'Partial' | 'Due'
  batch_id?: string | null
  batch?: {
    id: string
    name: string
    branch_id: string
  } | null
}

type PaymentRow = Payment & {
  customer: CustomerMini | null
}

function formatINR(n: number) {
  return '₹' + Number(n || 0).toLocaleString('en-IN')
}

const emptyForm = {
  customer_id: '',
  amount: '',
  payment_date: new Date().toISOString().split('T')[0],
  payment_mode: 'Cash' as PaymentMode,
  notes: '',
}

export default function PaymentsPage() {
  const businessIdRef = useRef<string | null>(null)

  const [payments, setPayments] = useState<PaymentRow[]>([])
  const [customers, setCustomers] = useState<CustomerMini[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
const [batches, setBatches] = useState<Batch[]>([])
const [selectedBranch, setSelectedBranch] = useState('')
const [selectedBatch, setSelectedBatch] = useState('')
 

  

  const [loading, setLoading] = useState(true)
  const [bizError, setBizError] = useState<string | null>(null)

  const [showModal, setShowModal] = useState(false)
  const [editingPayment, setEditingPayment] = useState<PaymentRow | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    const bizId = businessIdRef.current
    if (!bizId) return

    setLoading(true)

    const [paymentsRes, customersRes, branchesRes, batchesRes] = await Promise.all([
      supabase
        .from('payments')
        .select(
          '*, customer:customers(id, name, phone, pending_amount, payment_status, batch_id, batch:batches(id, name, branch_id))'
        )
        .eq('business_id', bizId)
        .order('payment_date', { ascending: false }),

      supabase
        .from('customers')
        .select('id, name, phone, pending_amount, payment_status, batch_id, batch:batches(id, name, branch_id)')
        .eq('business_id', bizId)
        .order('name'),

      supabase
        .from('branches')
        .select('id, name')
        .eq('business_id', bizId)
        .order('name'),

      supabase
        .from('batches')
        .select('id, name, branch_id')
        .eq('business_id', bizId)
        .order('name'),
    ])

    if (paymentsRes.error) console.error('fetchPayments:', paymentsRes.error.message)
    if (customersRes.error) console.error('fetchCustomers:', customersRes.error.message)
    if (branchesRes.error) console.error('fetchBranches:', branchesRes.error.message)
    if (batchesRes.error) console.error('fetchBatches:', batchesRes.error.message)

    setPayments((paymentsRes.data ?? []) as PaymentRow[])
    setCustomers((customersRes.data ?? []) as any)
    setBranches((branchesRes.data ?? []) as Branch[])
    setBatches((batchesRes.data ?? []) as Batch[])

    setLoading(false)
  }, [])

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
    ? batches.filter((b) => b.branch_id === selectedBranch)
    : batches

const filteredCustomers = customers.filter((c) => {
  const customerBatch = batches.find((b) => b.id === c.batch_id)

  if (selectedBranch && customerBatch?.branch_id !== selectedBranch) {
    return false
  }

  if (selectedBatch && c.batch_id !== selectedBatch) {
    return false
  }

  return true
})
useEffect(() => {
  const selectedCustomer = customers.find(
    (c) => c.id === form.customer_id
  )

  if (selectedCustomer) {
    let amountToFill = ''

    if (selectedCustomer.payment_status === 'Paid') {
      amountToFill = ''
    } else {
      amountToFill = String(selectedCustomer.pending_amount || '')
    }

    setForm((prev) => ({
      ...prev,
      amount: amountToFill,
    }))
  }
}, [form.customer_id, customers])
  const filteredPayments = payments.filter((p) => {
    const customer = p.customer

    const matchesBatch =
      !selectedBatch || customer?.batch_id === selectedBatch

    const matchesBranch =
      !selectedBranch ||
      filteredBatches.some((b) => b.id === customer?.batch_id)

    return matchesBatch && matchesBranch
  })

  function openAdd() {
    setEditingPayment(null)
    setForm(emptyForm)
    setFormError(null)
    setShowModal(true)
  }

  function openEdit(p: PaymentRow) {
    setEditingPayment(p)
    setForm({
      customer_id: p.customer_id,
      amount: String(p.amount),
      payment_date: p.payment_date,
      payment_mode: p.payment_mode,
      notes: p.notes ?? '',
    })
    setFormError(null)
    setShowModal(true)
  }

  async function handleSave() {
    setFormError(null)

    if (!form.customer_id) return setFormError('Please select a customer.')
    if (!form.amount) return setFormError('Amount is required.')

    const bizId = businessIdRef.current
    if (!bizId) return setFormError('Business not loaded. Please refresh.')

    setSaving(true)

    const payload = {
      customer_id: form.customer_id,
      amount: parseFloat(form.amount),
      payment_date: form.payment_date,
      payment_mode: form.payment_mode,
      notes: form.notes,
    }

    if (editingPayment) {
      const { error } = await supabase
        .from('payments')
        .update(payload)
        .eq('id', editingPayment.id)
        .eq('business_id', bizId)

      if (error) {
        setFormError(`Update failed: ${error.message}`)
        setSaving(false)
        return
      }
    } else {
      const { error } = await supabase
        .from('payments')
        .insert([
          {
            business_id: bizId,
            ...payload,
          },
        ])

      if (error) {
        setFormError(`Insert failed: ${error.message}`)
        setSaving(false)
        return
      }
    }

    setSaving(false)
    setShowModal(false)
    fetchData()
  }

  const customerOptions = [
    { value: '', label: 'Select customer...' },
    ...filteredCustomers.map((c) => ({
      value: c.id,
      label: `${c.name} (Pending: ${formatINR(c.pending_amount)})`,
    })),
  ]

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
          <h1 className="page-title">Payments</h1>
          <p className="page-subtitle">{filteredPayments.length} transactions recorded</p>
        </div>

        <Button onClick={openAdd} disabled={!businessIdRef.current}>
          <Plus size={16} /> Record Payment
        </Button>
      </div>

      <div className="flex gap-3 mb-5">
        <select
          value={selectedBranch}
          onChange={(e) => {
            setSelectedBranch(e.target.value)
            setSelectedBatch('')
          }}
          className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm"
        >
          <option value="" className="bg-[#0f1117] text-white">
            All Branches
          </option>
          {branches.map((b) => (
            <option key={b.id} value={b.id} className="bg-[#0f1117] text-white">
              {b.name}
            </option>
          ))}
        </select>

        <select
          value={selectedBatch}
          onChange={(e) => setSelectedBatch(e.target.value)}
          className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm"
        >
          <option value="" className="bg-[#0f1117] text-white">
            All Batches
          </option>
          {filteredBatches.map((b) => (
            <option key={b.id} value={b.id} className="bg-[#0f1117] text-white">
              {b.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {(['Paid', 'Partial', 'Due'] as const).map((s) => {
          const count = filteredCustomers.filter((c) => c.payment_status === s).length

          return (
            <div key={s} className="card p-4 flex items-center gap-3">
              <Badge status={s} />
              <span className="text-white font-semibold">{count}</span>
              <span className="text-slate-500 text-sm">customers</span>
            </div>
          )
        })}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="table-th">Customer</th>
              <th className="table-th hidden md:table-cell">Batch</th>
              <th className="table-th">Amount</th>
              <th className="table-th hidden md:table-cell">Mode</th>
              <th className="table-th hidden md:table-cell">Date</th>
              <th className="table-th hidden lg:table-cell">Notes</th>
              <th className="table-th text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-t border-white/5">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="table-td">
                      <div className="h-4 bg-white/5 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : filteredPayments.length === 0 ? (
              <tr>
                <td colSpan={7} className="table-td text-center py-12 text-slate-600">
                  No payments recorded yet.
                </td>
              </tr>
            ) : (
              filteredPayments.map((p) => (
                <tr key={p.id} className="table-row">
                  <td className="table-td">
                    <p className="font-medium text-white">{p.customer?.name ?? '—'}</p>
                    {p.customer?.payment_status && <Badge status={p.customer.payment_status} />}
                  </td>

                  <td className="table-td hidden md:table-cell text-slate-400">
                    {p.customer?.batch?.name || '—'}
                  </td>

                  <td className="table-td text-emerald-400 font-semibold">
                    {formatINR(p.amount)}
                  </td>

                  <td className="table-td hidden md:table-cell">
                    <span className="text-xs bg-white/5 border border-white/10 rounded px-2 py-1 text-slate-400">
                      {p.payment_mode}
                    </span>
                  </td>

                  <td className="table-td hidden md:table-cell text-slate-400">
                    {p.payment_date}
                  </td>

                  <td className="table-td hidden lg:table-cell text-slate-500 text-xs">
                    {p.notes || '—'}
                  </td>

                  <td className="table-td">
                    <div className="flex justify-end">
                      <button
                        onClick={() => openEdit(p)}
                        className="p-1.5 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                      >
                        <Pencil size={14} />
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
        <Modal
          title={editingPayment ? 'Edit Payment' : 'Record Payment'}
          onClose={() => setShowModal(false)}
        >
          <div className="flex flex-col gap-4">
           <div className="grid grid-cols-2 gap-4 mb-4">
<select
  value={selectedBranch}
  onChange={(e) => {
    setSelectedBranch(e.target.value)
    setSelectedBatch('')
    setForm({ ...form, customer_id: '' })
  }}
  className="w-full px-3 py-2 rounded-lg bg-[#0f1117] border border-white/10 text-white text-sm appearance-none"
>
  <option value="" className="bg-[#0f1117] text-white">All Branches</option>
  {branches.map((b) => (
    <option key={b.id} value={b.id} className="bg-[#0f1117] text-white">
      {b.name}
    </option>
  ))}
</select>

  <select
  value={selectedBatch}
  onChange={(e) => {
    setSelectedBatch(e.target.value)
    setForm({ ...form, customer_id: '' })
  }}
  className="w-full px-3 py-2 rounded-lg bg-[#0f1117] border border-white/10 text-white text-sm appearance-none"
>
  <option value="" className="bg-[#0f1117] text-white">All Batches</option>
  {filteredBatches.map((b) => (
    <option key={b.id} value={b.id} className="bg-[#0f1117] text-white">
      {b.name}
    </option>
  ))}
</select>
</div>
            <Select
              label="Customer *"
              value={form.customer_id}
              onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
              options={customerOptions}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Amount (₹) *"
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="5000"
              />

              <Input
                label="Payment Date"
                type="date"
                value={form.payment_date}
                onChange={(e) => setForm({ ...form, payment_date: e.target.value })}
              />
            </div>

            <Select
              label="Payment Mode"
              value={form.payment_mode}
              onChange={(e) =>
                setForm({ ...form, payment_mode: e.target.value as PaymentMode })
              }
              options={paymentModeOptions}
            />

            <Textarea
              label="Notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Optional notes..."
            />
          </div>

          {formError && (
            <div className="flex items-center gap-2 mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg">
              <AlertCircle size={14} className="text-rose-400 shrink-0" />
              <p className="text-rose-400 text-xs">{formError}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/5">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving}>
              {editingPayment ? 'Update' : 'Record'}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}