import { cn } from '@/lib/utils'
import { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs text-zinc-400 uppercase tracking-widest">{label}</label>
      )}
      <input
        className={cn(
          'w-full bg-[#111113] border border-[#27272a] px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600',
          'focus:outline-none focus:border-[#f97316] transition-colors',
          error && 'border-red-800',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export function Textarea({ label, error, className, ...props }: TextareaProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs text-zinc-400 uppercase tracking-widest">{label}</label>
      )}
      <textarea
        className={cn(
          'w-full bg-[#111113] border border-[#27272a] px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600',
          'focus:outline-none focus:border-[#f97316] transition-colors resize-none',
          error && 'border-red-800',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

export function Select({ label, error, options, placeholder, className, ...props }: SelectProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs text-zinc-400 uppercase tracking-widest">{label}</label>
      )}
      <select
        className={cn(
          'w-full bg-[#111113] border border-[#27272a] px-3 py-2 text-sm text-zinc-100',
          'focus:outline-none focus:border-[#f97316] transition-colors appearance-none cursor-pointer',
          error && 'border-red-800',
          className
        )}
        {...props}
      >
        {placeholder && (
          <option value="" className="text-zinc-600">{placeholder}</option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
