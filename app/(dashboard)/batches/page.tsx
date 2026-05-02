'use client'

// app/(dashboard)/batches/page.tsx

import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { getBusinessId, BusinessIdException } from '@/lib/getBusinessId'
import {
  Plus, Pencil, Trash2, X,
  AlertCircle, Calendar, IndianRupee,
  Users,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

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
  created_at: string
  branch?: Branch
}

interface FormState {
  branch_id: string
  name: string
  course: string
  default_fee: string
}

const EMPTY_FORM: FormState = {
  branch_id: '',
  name: '',
  course: '',
  default_fee: '0',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function formatINR(n: number) {
  return '₹' + Number(n).toLocaleString('en-IN')
}

// ─── Inline UI primitives ─────────────────────────────────────────────────────

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
      {children}
      {required && <span className="text-rose-500 ml-0.5">*</span>}
    </label>
  )
}

function TextInput({
  value, onChange, placeholder, disabled, type = 'text',
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
      className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm
                 placeholder:text-slate-600 focus:outline-none focus:border-violet-500/60
                 focus:bg-white/[0.07] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    />
  )
}

function SelectInput({
  value, onChange, disabled, children,
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
      className="w-full px-3 py-2.5 rounded-lg bg-[#0f1117] border border-white/10 text-white text-sm
                 focus:outline-none focus:border-violet-500/60 transition-colors
                 disabled:opacity-50 disabled:cursor-not-allowed appearance-none"
    >
      {children}
    </select>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  )
}

function PrimaryBtn({
  onClick, disabled, loading, children,
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
      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold
                 bg-violet-600 hover:bg-violet-500 text-white transition-colors
                 shadow-[0_0_16px_rgba(124,58,237,0.3)] hover:shadow-[0_0_24px_rgba(124,58,237,0.45)]
                 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading && <Spinner />}
      {children}
    </button>
  )
}

function SecondaryBtn({
  onClick, children,
}: {
  onClick?: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300
                 hover:text-white transition-colors"
    >
      {children}
    </button>
  )
}

// ─── Modal shell ──────────────────────────────────────────────────────────────

function Modal({
  title, onClose, children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#13151e] border border-white/10 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h2 className="text-white font-semibold text-base">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BatchesPage() {
  const businessIdRef = useRef<string | null>(null)

  const [batches, setBatches] = useState<Batch[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [bizError, setBizError] = useState<string | null>(null)

  // Add / Edit
  const [modalOpen, setModalOpen] = useState(false)
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Delete
  const [deletingBatch, setDeletingBatch] = useState<Batch | null>(null)
  const [deleting, setDeleting] = useState(false)

  // ── 1. Resolve business_id once ───────────────────────────────────────────
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── 2. Fetch batches + branches in parallel ───────────────────────────────
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

    if (batchesRes.error) console.error('fetchBatches:', batchesRes.error.message)
    if (branchesRes.error) console.error('fetchBranches:', branchesRes.error.message)

    setBatches(batchesRes.data ?? [])
    setBranches(branchesRes.data ?? [])
    setLoading(false)
  }, [])

  // ── Modal helpers ─────────────────────────────────────────────────────────
  function openAdd() {
    setEditingBatch(null)
    setForm({
      ...EMPTY_FORM,
      // Pre-select first branch if only one exists
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

  // ── 3. Save (insert or update) ────────────────────────────────────────────
  async function handleSave() {
    setFormError(null)

    if (!form.branch_id) {
      setFormError('Please select a branch.')
      return
    }
    const trimmedName = form.name.trim()
    if (!trimmedName) {
      setFormError('Batch name is required.')
      return
    }

    const bizId = businessIdRef.current
    if (!bizId) {
      setFormError('Business not loaded. Please refresh.')
      return
    }

    const fee = parseFloat(form.default_fee) || 0

    setSaving(true)

    if (editingBatch) {
      const { error } = await supabase
        .from('batches')
        .update({
          branch_id: form.branch_id,
          name: trimmedName,
          course: form.course.trim() || null,
          default_fee: fee,
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
        .insert([{
          business_id: bizId,           // ← always attached
          branch_id: form.branch_id,
          name: trimmedName,
          course: form.course.trim() || null,
          default_fee: fee,
        }])

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

  // ── 4. Delete ─────────────────────────────────────────────────────────────
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

    if (error) console.error('delete batch:', error.message)

    setDeleting(false)
    setDeletingBatch(null)
    fetchAll()
  }

  // ─── Render ───────────────────────────────────────────────────────────────

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

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold text-white">Batches</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {loading ? '...' : `${batches.length} batch${batches.length !== 1 ? 'es' : ''}`}
          </p>
        </div>
        <PrimaryBtn onClick={openAdd} disabled={!businessIdRef.current}>
          <Plus size={16} />
          Add Batch
        </PrimaryBtn>
      </div>

      {/* ── No branches warning ──────────────────────────────────────────────── */}
      {!loading && branches.length === 0 && (
        <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-6 max-w-lg">
          <AlertCircle size={16} className="text-amber-400 mt-0.5 shrink-0" />
          <p className="text-amber-400 text-sm">
            You need to add at least one <span className="font-semibold">Branch</span> before creating batches.
          </p>
        </div>
      )}

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      <div className="bg-[#13151e] border border-white/5 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">
                Batch Name
              </th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3.5 hidden sm:table-cell">
                Branch
              </th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3.5 hidden md:table-cell">
                Course
              </th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3.5">
                Default Fee
              </th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3.5 hidden lg:table-cell">
                Created
              </th>
              <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>

            {/* Loading skeleton */}
            {loading && Array.from({ length: 4 }).map((_, i) => (
              <tr key={i} className="border-t border-white/[0.04]">
                <td className="px-5 py-4"><div className="h-4 w-32 bg-white/5 rounded animate-pulse" /></td>
                <td className="px-4 py-4 hidden sm:table-cell"><div className="h-4 w-24 bg-white/5 rounded animate-pulse" /></td>
                <td className="px-4 py-4 hidden md:table-cell"><div className="h-4 w-28 bg-white/5 rounded animate-pulse" /></td>
                <td className="px-4 py-4"><div className="h-4 w-16 bg-white/5 rounded animate-pulse" /></td>
                <td className="px-4 py-4 hidden lg:table-cell"><div className="h-4 w-20 bg-white/5 rounded animate-pulse" /></td>
                <td className="px-5 py-4"><div className="h-4 w-12 bg-white/5 rounded animate-pulse ml-auto" /></td>
              </tr>
            ))}

            {/* Empty state */}
            {!loading && batches.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                      <Users size={22} className="text-violet-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">No batches yet</p>
                      <p className="text-slate-600 text-xs mt-1">
                        {branches.length === 0
                          ? 'Add a branch first, then create your first batch.'
                          : 'Add your first batch to get started.'}
                      </p>
                    </div>
                    {branches.length > 0 && (
                      <PrimaryBtn onClick={openAdd}>
                        <Plus size={14} />
                        Add Batch
                      </PrimaryBtn>
                    )}
                  </div>
                </td>
              </tr>
            )}

            {/* Data rows */}
            {!loading && batches.map((batch) => (
              <tr
                key={batch.id}
                className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors group"
              >
                {/* Batch name */}
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/15 flex items-center justify-center flex-shrink-0">
                      <Users size={14} className="text-indigo-400" />
                    </div>
                    <span className="text-white font-medium text-sm">{batch.name}</span>
                  </div>
                </td>

                {/* Branch name */}
                <td className="px-4 py-4 hidden sm:table-cell">
                  {batch.branch?.name ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md
                                     bg-violet-500/10 text-violet-300 border border-violet-500/15">
                      {batch.branch.name}
                    </span>
                  ) : (
                    <span className="text-slate-600 text-sm">—</span>
                  )}
                </td>

                {/* Course */}
                <td className="px-4 py-4 hidden md:table-cell">
                  <span className="text-sm text-slate-400">
                    {batch.course || '—'}
                  </span>
                </td>

                {/* Default fee */}
                <td className="px-4 py-4">
                  <div className="flex items-center gap-1 text-sm font-semibold text-emerald-400">
                    <IndianRupee size={12} className="opacity-70" />
                    {Number(batch.default_fee).toLocaleString('en-IN')}
                  </div>
                </td>

                {/* Created date */}
                <td className="px-4 py-4 hidden lg:table-cell">
                  <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                    <Calendar size={11} className="text-slate-600" />
                    {formatDate(batch.created_at)}
                  </div>
                </td>

                {/* Actions */}
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEdit(batch)}
                      title="Edit batch"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/8 transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setDeletingBatch(batch)}
                      title="Delete batch"
                      className="p-1.5 rounded-lg text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
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

      {/* ── Add / Edit Modal ─────────────────────────────────────────────────── */}
      {modalOpen && (
        <Modal
          title={editingBatch ? 'Edit Batch' : 'Add New Batch'}
          onClose={closeModal}
        >
          <div className="space-y-4">

            {/* Branch dropdown */}
            <div>
              <Label required>Branch</Label>
              {branches.length === 0 ? (
                <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                  No branches found. Please add a branch first.
                </p>
              ) : (
                <SelectInput
                  value={form.branch_id}
                  onChange={(v) => setForm({ ...form, branch_id: v })}
                  disabled={saving}
                >
                  <option value="" className="bg-[#0f1117]">Select a branch...</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id} className="bg-[#0f1117]">
                      {b.name}
                    </option>
                  ))}
                </SelectInput>
              )}
            </div>

            {/* Batch name */}
            <div>
              <Label required>Batch Name</Label>
              <TextInput
                value={form.name}
                onChange={(v) => setForm({ ...form, name: v })}
                placeholder="e.g. JEE Morning Batch, Batch A 2025"
                disabled={saving}
              />
            </div>

            {/* Course */}
            <div>
              <Label>Course (optional)</Label>
              <TextInput
                value={form.course}
                onChange={(v) => setForm({ ...form, course: v })}
                placeholder="e.g. JEE Foundation, NEET, 11th Science"
                disabled={saving}
              />
            </div>

            {/* Default fee */}
            <div>
              <Label>Default Fee (₹)</Label>
              <TextInput
                type="number"
                value={form.default_fee}
                onChange={(v) => setForm({ ...form, default_fee: v })}
                placeholder="0"
                disabled={saving}
              />
              <p className="text-xs text-slate-600 mt-1">
                This will be pre-filled when adding students to this batch.
              </p>
            </div>

            {/* Form error */}
            {formError && (
              <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                <AlertCircle size={14} className="text-rose-400 flex-shrink-0" />
                <p className="text-rose-400 text-xs">{formError}</p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/5">
            <SecondaryBtn onClick={closeModal}>Cancel</SecondaryBtn>
            <PrimaryBtn
              onClick={handleSave}
              loading={saving}
              disabled={branches.length === 0}
            >
              {editingBatch ? 'Save Changes' : 'Add Batch'}
            </PrimaryBtn>
          </div>
        </Modal>
      )}

      {/* ── Delete Confirm Modal ─────────────────────────────────────────────── */}
      {deletingBatch && (
        <Modal title="Delete Batch" onClose={() => setDeletingBatch(null)}>
          <p className="text-slate-400 text-sm mb-1">
            Are you sure you want to delete{' '}
            <span className="text-white font-semibold">{deletingBatch.name}</span>?
          </p>
          <p className="text-slate-600 text-xs mb-6">
            This batch will be removed. Students assigned to it will have their batch cleared. This cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <SecondaryBtn onClick={() => setDeletingBatch(null)}>Cancel</SecondaryBtn>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold
                         bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/25 text-rose-400
                         transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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