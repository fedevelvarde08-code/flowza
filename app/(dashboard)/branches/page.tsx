'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { getBusinessId, BusinessIdException } from '@/lib/getBusinessId'
import { Plus, Pencil, Trash2, MapPin, X, AlertCircle, Users, Calendar } from 'lucide-react'

interface Branch {
  id: string
  business_id: string
  name: string
  address: string | null
  created_at: string
}

interface FormState {
  name: string
  address: string
}

const EMPTY_FORM: FormState = { name: '', address: '' }

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
      {children}
    </label>
  )
}

function TextInput({
  value,
  onChange,
  placeholder,
  disabled,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  disabled?: boolean
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-violet-500/60 focus:bg-white/[0.07] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    />
  )
}

function PrimaryButton({
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
      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-colors shadow-[0_0_16px_rgba(124,58,237,0.3)] hover:shadow-[0_0_24px_rgba(124,58,237,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      )}
      {children}
    </button>
  )
}

function SecondaryButton({
  onClick,
  children,
}: {
  onClick?: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors"
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
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
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

function DeleteModal({
  branch,
  onConfirm,
  onClose,
  deleting,
}: {
  branch: Branch
  onConfirm: () => void
  onClose: () => void
  deleting: boolean
}) {
  return (
    <Modal title="Delete Branch" onClose={onClose}>
      <p className="text-slate-400 text-sm mb-1">
        Are you sure you want to delete{' '}
        <span className="text-white font-semibold">{branch.name}</span>?
      </p>
      <p className="text-slate-600 text-xs mb-6">
        All batches linked to this branch will also be deleted. This cannot be undone.
      </p>

      <div className="flex justify-end gap-3">
        <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>

        <button
          onClick={onConfirm}
          disabled={deleting}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/25 text-rose-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {deleting ? (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          ) : (
            <Trash2 size={14} />
          )}
          Delete
        </button>
      </div>
    </Modal>
  )
}

export default function BranchesPage() {
  const businessIdRef = useRef<string | null>(null)

  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [bizError, setBizError] = useState<string | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [deletingBranch, setDeletingBranch] = useState<Branch | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchBranches = useCallback(async () => {
    const bizId = businessIdRef.current
    if (!bizId) return

    setLoading(true)

    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .eq('business_id', bizId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('fetchBranches:', error.message)
    }

    setBranches(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    async function init() {
      try {
        businessIdRef.current = await getBusinessId()
        await fetchBranches()
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
  }, [fetchBranches])

  function openAdd() {
    setEditingBranch(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setModalOpen(true)
  }

  function openEdit(branch: Branch) {
    setEditingBranch(branch)
    setForm({
      name: branch.name,
      address: branch.address ?? '',
    })
    setFormError(null)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditingBranch(null)
    setForm(EMPTY_FORM)
    setFormError(null)
  }

  async function handleSave() {
    setFormError(null)

    const trimmedName = form.name.trim()

    if (!trimmedName) {
      setFormError('Branch name is required.')
      return
    }

    const bizId = businessIdRef.current

    if (!bizId) {
      setFormError('Business not loaded. Please refresh the page.')
      return
    }

    setSaving(true)

    if (editingBranch) {
      const { error } = await supabase
        .from('branches')
        .update({
          name: trimmedName,
          address: form.address.trim() || null,
        })
        .eq('id', editingBranch.id)
        .eq('business_id', bizId)

      if (error) {
        setFormError(`Update failed: ${error.message}`)
        setSaving(false)
        return
      }
    } else {
      const { error } = await supabase.from('branches').insert([
        {
          business_id: bizId,
          name: trimmedName,
          address: form.address.trim() || null,
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
    fetchBranches()
  }

  async function handleDelete() {
    if (!deletingBranch) return

    const bizId = businessIdRef.current
    if (!bizId) return

    setDeleting(true)

    const { error } = await supabase
      .from('branches')
      .delete()
      .eq('id', deletingBranch.id)
      .eq('business_id', bizId)

    if (error) {
      console.error('delete branch:', error.message)
    }

    setDeleting(false)
    setDeletingBranch(null)
    fetchBranches()
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
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold text-white">Branches</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {loading ? '...' : `${branches.length} branch${branches.length !== 1 ? 'es' : ''}`}
          </p>
        </div>

        <PrimaryButton onClick={openAdd} disabled={!businessIdRef.current}>
          <Plus size={16} />
          Add Branch
        </PrimaryButton>
      </div>

      <div className="bg-[#13151e] border border-white/5 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">
                Branch Name
              </th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3.5 hidden sm:table-cell">
                Address
              </th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3.5 hidden md:table-cell">
                Created
              </th>
              <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {loading &&
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-t border-white/[0.04]">
                  <td className="px-5 py-4">
                    <div className="h-4 w-36 bg-white/5 rounded animate-pulse" />
                  </td>
                  <td className="px-4 py-4 hidden sm:table-cell">
                    <div className="h-4 w-48 bg-white/5 rounded animate-pulse" />
                  </td>
                  <td className="px-4 py-4 hidden md:table-cell">
                    <div className="h-4 w-24 bg-white/5 rounded animate-pulse" />
                  </td>
                  <td className="px-5 py-4">
                    <div className="h-4 w-16 bg-white/5 rounded animate-pulse ml-auto" />
                  </td>
                </tr>
              ))}

            {!loading && branches.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                      <Users size={22} className="text-violet-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">No branches yet</p>
                      <p className="text-slate-600 text-xs mt-1">
                        Add your first branch to get started.
                      </p>
                    </div>
                    <PrimaryButton onClick={openAdd}>
                      <Plus size={14} />
                      Add Branch
                    </PrimaryButton>
                  </div>
                </td>
              </tr>
            )}

            {!loading &&
              branches.map((branch) => (
                <tr
                  key={branch.id}
                  className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors group"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/15 flex items-center justify-center flex-shrink-0">
                        <Users size={14} className="text-violet-400" />
                      </div>
                      <span className="text-white font-medium text-sm">{branch.name}</span>
                    </div>
                  </td>

                  <td className="px-4 py-4 hidden sm:table-cell">
                    {branch.address ? (
                      <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                        <MapPin size={12} className="text-slate-600 flex-shrink-0" />
                        {branch.address}
                      </div>
                    ) : (
                      <span className="text-slate-600 text-sm">—</span>
                    )}
                  </td>

                  <td className="px-4 py-4 hidden md:table-cell">
                    <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                      <Calendar size={11} className="text-slate-600" />
                      {formatDate(branch.created_at)}
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEdit(branch)}
                        title="Edit branch"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/8 transition-colors"
                      >
                        <Pencil size={14} />
                      </button>

                      <button
                        onClick={() => setDeletingBranch(branch)}
                        title="Delete branch"
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

      {modalOpen && (
        <Modal title={editingBranch ? 'Edit Branch' : 'Add New Branch'} onClose={closeModal}>
          <div className="space-y-4">
            <div>
              <Label>Branch Name *</Label>
              <TextInput
                value={form.name}
                onChange={(v) => setForm({ ...form, name: v })}
                placeholder="e.g. Kothrud Centre, Main Branch"
                disabled={saving}
              />
            </div>

            <div>
              <Label>Address (optional)</Label>
              <TextInput
                value={form.address}
                onChange={(v) => setForm({ ...form, address: v })}
                placeholder="e.g. 12, FC Road, Pune 411004"
                disabled={saving}
              />
            </div>

            {formError && (
              <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                <AlertCircle size={14} className="text-rose-400 flex-shrink-0" />
                <p className="text-rose-400 text-xs">{formError}</p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/5">
            <SecondaryButton onClick={closeModal}>Cancel</SecondaryButton>
            <PrimaryButton onClick={handleSave} loading={saving}>
              {editingBranch ? 'Save Changes' : 'Add Branch'}
            </PrimaryButton>
          </div>
        </Modal>
      )}

      {deletingBranch && (
        <DeleteModal
          branch={deletingBranch}
          onConfirm={handleDelete}
          onClose={() => setDeletingBranch(null)}
          deleting={deleting}
        />
      )}
    </div>
  )
}