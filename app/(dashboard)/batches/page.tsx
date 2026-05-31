'use client'

// app/(dashboard)/batches/page.tsx

import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { getBusinessId, BusinessIdException } from '@/lib/getBusinessId'
import {
  Plus,
  Pencil,
  Trash2,
  X,
  AlertCircle,
  Calendar,
  IndianRupee,
  Users,
  Clock,
} from 'lucide-react'

interface Branch {
  id: string
  name: string
}

interface Batch {
  id: string
  business_id: string
  branch_id: string
  name: string
  course: string | null
  default_fee: number
  duration_months: number
  created_at: string
  branch?: Branch
}

interface FormState {
  branch_id: string
  name: string
  course: string
  default_fee: string
  duration_months: string
}

const EMPTY_FORM: FormState = {
  branch_id: '',
  name: '',
  course: '',
  default_fee: '0',
  duration_months: '1',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
      {children}
      {required && <span className="ml-0.5 text-rose-500">*</span>}
    </label>
  )
}

function TextInput({
  value,
  onChange,
  placeholder,
  disabled,
  type = 'text',
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  disabled?: boolean
  type?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white
                 placeholder:text-slate-600 transition-colors focus:border-violet-500/60
                 focus:bg-white/[0.07] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
    />
  )
}

function SelectInput({
  value,
  onChange,
  disabled,
  children,
}: {
  value: string
  onChange: (v: string) => void
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full appearance-none rounded-lg border border-white/10 bg-[#0f1117] px-3 py-2.5 text-sm text-white
                 transition-colors focus:border-violet-500/60 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </select>
  )
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  )
}

function PrimaryBtn({
  onClick,
  disabled,
  loading,
  children,
}: {
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold
                 text-white shadow-[0_0_16px_rgba(124,58,237,0.3)] transition-colors hover:bg-violet-500
                 hover:shadow-[0_0_24px_rgba(124,58,237,0.45)] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading && <Spinner />}
      {children}
    </button>
  )
}

function SecondaryBtn({
  onClick,
  children,
}: {
  onClick?: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium
                 text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
    >
      {children}
    </button>
  )
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#13151e] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
          <h2 className="text-base font-semibold text-white">{title}</h2>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

export default function BatchesPage() {
  const businessIdRef = useRef<string | null>(null)

  const [batches, setBatches] = useState<Batch[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [bizError, setBizError] = useState<string | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [deletingBatch, setDeletingBatch] = useState<Batch | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchAll = useCallback(async (bizId?: string) => {
    const id = bizId ?? businessIdRef.current
    if (!id) return

    setLoading(true)

    const [batchesRes, branchesRes] = await Promise.all([
      supabase
        .from('batches')
        .select('*, branch:branches(id, name)')
        .eq('business_id', id)
        .order('created_at', { ascending: false }),

      supabase
        .from('branches')
        .select('id, name')
        .eq('business_id', id)
        .order('name'),
    ])

    if (batchesRes.error) console.error('fetchPlans:', batchesRes.error.message)
    if (branchesRes.error) console.error('fetchBranches:', branchesRes.error.message)

    setBatches((batchesRes.data ?? []) as Batch[])
    setBranches(branchesRes.data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    async function init() {
      try {
        businessIdRef.current = await getBusinessId()
        await fetchAll(businessIdRef.current)
      } catch (err) {
        setBizError(
          err instanceof BusinessIdException
            ? err.message
            : 'Unexpected error loading your business.'
        )
        setLoading(false)
      }
    }

    init()
  }, [fetchAll])

  function openAdd() {
    setEditingBatch(null)
    setForm({
      ...EMPTY_FORM,
      branch_id: branches.length === 1 ? branches[0].id : '',
    })
    setFormError(null)
    setModalOpen(true)
  }

  function openEdit(batch: Batch) {
    setEditingBatch(batch)
    setForm({
      branch_id: batch.branch_id,
      name: batch.name,
      course: batch.course ?? '',
      default_fee: String(batch.default_fee),
      duration_months: String(batch.duration_months || 1),
    })
    setFormError(null)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditingBatch(null)
    setForm(EMPTY_FORM)
    setFormError(null)
  }

  async function handleSave() {
    setFormError(null)

    if (!form.branch_id) {
      setFormError('Please select a branch.')
      return
    }

    const trimmedName = form.name.trim()

    if (!trimmedName) {
      setFormError('Plan name is required.')
      return
    }

    const bizId = businessIdRef.current

    if (!bizId) {
      setFormError('Business not loaded. Please refresh.')
      return
    }

    const fee = parseFloat(form.default_fee) || 0
    const duration = parseInt(form.duration_months) || 1

    if (duration <= 0) {
      setFormError('Duration must be at least 1 month.')
      return
    }

    setSaving(true)

    if (editingBatch) {
      const { error } = await supabase
        .from('batches')
        .update({
          branch_id: form.branch_id,
          name: trimmedName,
          course: form.course.trim() || null,
          default_fee: fee,
          duration_months: duration,
        })
        .eq('id', editingBatch.id)
        .eq('business_id', bizId)

      if (error) {
        setFormError(`Update failed: ${error.message}`)
        setSaving(false)
        return
      }
    } else {
      const { error } = await supabase
        .from('batches')
        .insert([
          {
            business_id: bizId,
            branch_id: form.branch_id,
            name: trimmedName,
            course: form.course.trim() || null,
            default_fee: fee,
            duration_months: duration,
          },
        ])

      if (error) {
        setFormError(`Insert failed: ${error.message}`)
        setSaving(false)
        return
      }
    }

    setSaving(false)
    closeModal()
    fetchAll()
  }

  async function handleDelete() {
    if (!deletingBatch) return

    const bizId = businessIdRef.current
    if (!bizId) return

    setDeleting(true)

    const { error } = await supabase
      .from('batches')
      .delete()
      .eq('id', deletingBatch.id)
      .eq('business_id', bizId)

    if (error) console.error('delete plan:', error.message)

    setDeleting(false)
    setDeletingBatch(null)
    fetchAll()
  }

  if (bizError) {
    return (
      <div className="p-8">
        <div className="flex max-w-lg items-start gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4">
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-rose-400" />
          <div>
            <p className="text-sm font-medium text-rose-400">Could not load business</p>
            <p className="mt-1 text-xs text-slate-400">{bizError}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Plans</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {loading ? '...' : `${batches.length} plan${batches.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        <PrimaryBtn onClick={openAdd} disabled={!businessIdRef.current}>
          <Plus size={16} />
          Add Plan
        </PrimaryBtn>
      </div>

      {!loading && branches.length === 0 && (
        <div className="mb-6 flex max-w-lg items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-amber-400" />
          <p className="text-sm text-amber-400">
            You need to add at least one <span className="font-semibold">Branch</span> before creating plans.
          </p>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-white/5 bg-[#13151e]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Plan Name
              </th>
              <th className="hidden px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 sm:table-cell">
                Branch
              </th>
              <th className="hidden px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 md:table-cell">
                Plan Type
              </th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Plan Price
              </th>
              <th className="hidden px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 lg:table-cell">
                Duration
              </th>
              <th className="hidden px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 lg:table-cell">
                Created
              </th>
              <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {loading &&
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-t border-white/[0.04]">
                  <td className="px-5 py-4">
                    <div className="h-4 w-32 animate-pulse rounded bg-white/5" />
                  </td>
                  <td className="hidden px-4 py-4 sm:table-cell">
                    <div className="h-4 w-24 animate-pulse rounded bg-white/5" />
                  </td>
                  <td className="hidden px-4 py-4 md:table-cell">
                    <div className="h-4 w-28 animate-pulse rounded bg-white/5" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-4 w-16 animate-pulse rounded bg-white/5" />
                  </td>
                  <td className="hidden px-4 py-4 lg:table-cell">
                    <div className="h-4 w-16 animate-pulse rounded bg-white/5" />
                  </td>
                  <td className="hidden px-4 py-4 lg:table-cell">
                    <div className="h-4 w-20 animate-pulse rounded bg-white/5" />
                  </td>
                  <td className="px-5 py-4">
                    <div className="ml-auto h-4 w-12 animate-pulse rounded bg-white/5" />
                  </td>
                </tr>
              ))}

            {!loading && batches.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-violet-500/20 bg-violet-500/10">
                      <Users size={22} className="text-violet-400" />
                    </div>

                    <div>
                      <p className="text-sm font-medium text-white">No plans yet</p>
                      <p className="mt-1 text-xs text-slate-600">
                        {branches.length === 0
                          ? 'Add a branch first, then create your first membership plan.'
                          : 'Add your first membership plan to get started.'}
                      </p>
                    </div>

                    {branches.length > 0 && (
                      <PrimaryBtn onClick={openAdd}>
                        <Plus size={14} />
                        Add Plan
                      </PrimaryBtn>
                    )}
                  </div>
                </td>
              </tr>
            )}

            {!loading &&
              batches.map((batch) => (
                <tr
                  key={batch.id}
                  className="group border-t border-white/[0.04] transition-colors hover:bg-white/[0.02]"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-indigo-500/15 bg-indigo-500/10">
                        <Users size={14} className="text-indigo-400" />
                      </div>
                      <span className="text-sm font-medium text-white">{batch.name}</span>
                    </div>
                  </td>

                  <td className="hidden px-4 py-4 sm:table-cell">
                    {batch.branch?.name ? (
                      <span className="inline-flex items-center gap-1.5 rounded-md border border-violet-500/15 bg-violet-500/10 px-2 py-1 text-xs font-medium text-violet-300">
                        {batch.branch.name}
                      </span>
                    ) : (
                      <span className="text-sm text-slate-600">—</span>
                    )}
                  </td>

                  <td className="hidden px-4 py-4 md:table-cell">
                    <span className="text-sm text-slate-400">{batch.course || '—'}</span>
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1 text-sm font-semibold text-emerald-400">
                      <IndianRupee size={12} className="opacity-70" />
                      {Number(batch.default_fee).toLocaleString('en-IN')}
                    </div>
                  </td>

                  <td className="hidden px-4 py-4 lg:table-cell">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Clock size={12} className="text-slate-600" />
                      {batch.duration_months || 1} month{Number(batch.duration_months || 1) > 1 ? 's' : ''}
                    </div>
                  </td>

                  <td className="hidden px-4 py-4 lg:table-cell">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Calendar size={11} className="text-slate-600" />
                      {formatDate(batch.created_at)}
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() => openEdit(batch)}
                        title="Edit plan"
                        className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-white/8 hover:text-white"
                      >
                        <Pencil size={14} />
                      </button>

                      <button
                        onClick={() => setDeletingBatch(batch)}
                        title="Delete plan"
                        className="rounded-lg p-1.5 text-slate-600 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <Modal title={editingBatch ? 'Edit Plan' : 'Add New Plan'} onClose={closeModal}>
          <div className="space-y-4">
            <div>
              <Label required>Branch</Label>

              {branches.length === 0 ? (
                <p className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
                  No branches found. Please add a branch first.
                </p>
              ) : (
                <SelectInput
                  value={form.branch_id}
                  onChange={(v) => setForm({ ...form, branch_id: v })}
                  disabled={saving}
                >
                  <option value="" className="bg-[#0f1117]">
                    Select a branch...
                  </option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id} className="bg-[#0f1117]">
                      {b.name}
                    </option>
                  ))}
                </SelectInput>
              )}
            </div>

            <div>
              <Label required>Plan Name</Label>
              <TextInput
                value={form.name}
                onChange={(v) => setForm({ ...form, name: v })}
                placeholder="e.g. Monthly Membership, Gold Plan, PT Plan"
                disabled={saving}
              />
            </div>

            <div>
              <Label>Plan Type (optional)</Label>
              <TextInput
                value={form.course}
                onChange={(v) => setForm({ ...form, course: v })}
                placeholder="e.g. Gym Membership, Personal Training, CrossFit"
                disabled={saving}
              />
            </div>

            <div>
              <Label>Plan Price (₹)</Label>
              <TextInput
                type="number"
                value={form.default_fee}
                onChange={(v) => setForm({ ...form, default_fee: v })}
                placeholder="0"
                disabled={saving}
              />
              <p className="mt-1 text-xs text-slate-600">
                This price will be used when assigning members to this plan.
              </p>
            </div>

            <div>
              <Label>Duration (Months)</Label>
              <TextInput
                type="number"
                value={form.duration_months}
                onChange={(v) => setForm({ ...form, duration_months: v })}
                placeholder="1"
                disabled={saving}
              />
              <p className="mt-1 text-xs text-slate-500">
                1 = Monthly, 3 = Quarterly, 6 = Half-Yearly, 12 = Yearly.
              </p>
            </div>

            {formError && (
              <div className="flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 p-3">
                <AlertCircle size={14} className="flex-shrink-0 text-rose-400" />
                <p className="text-xs text-rose-400">{formError}</p>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t border-white/5 pt-4">
            <SecondaryBtn onClick={closeModal}>Cancel</SecondaryBtn>
            <PrimaryBtn onClick={handleSave} loading={saving} disabled={branches.length === 0}>
              {editingBatch ? 'Save Changes' : 'Add Plan'}
            </PrimaryBtn>
          </div>
        </Modal>
      )}

      {deletingBatch && (
        <Modal title="Delete Plan" onClose={() => setDeletingBatch(null)}>
          <p className="mb-1 text-sm text-slate-400">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-white">{deletingBatch.name}</span>?
          </p>

          <p className="mb-6 text-xs text-slate-600">
            This plan will be removed. Members assigned to it may need to be reassigned. This cannot be undone.
          </p>

          <div className="flex justify-end gap-3">
            <SecondaryBtn onClick={() => setDeletingBatch(null)}>Cancel</SecondaryBtn>

            <button
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center gap-2 rounded-lg border border-rose-500/25 bg-rose-600/20 px-4 py-2
                         text-sm font-semibold text-rose-400 transition-colors hover:bg-rose-600/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {deleting ? <Spinner /> : <Trash2 size={14} />}
              Delete
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}