// components/ui/FormField.tsx

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
}
export function Input({ label, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</label>
      <input
        {...props}
        className={`w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-violet-500/60 focus:bg-white/8 transition-colors ${className}`}
      />
    </div>
  )
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  options: { value: string; label: string }[]
}
export function Select({ label, options, className = '', ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</label>
      <select
        {...props}
        className={`w-full px-3 py-2 rounded-lg bg-[#0f1117] border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500/60 transition-colors appearance-none ${className}`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-[#0f1117]">
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
}
export function Textarea({ label, className = '', ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</label>
      <textarea
        {...props}
        rows={3}
        className={`w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-violet-500/60 transition-colors resize-none ${className}`}
      />
    </div>
  )
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md'
  loading?: boolean
}
export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed'
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm' }
  const variants = {
    primary: 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/20',
    secondary: 'bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white',
    danger: 'bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/20 text-rose-400',
    ghost: 'text-slate-400 hover:text-white hover:bg-white/5',
  }
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      ) : null}
      {children}
    </button>
  )
}
