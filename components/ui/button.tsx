import { cn } from '@/lib/utils'
import { ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-[#f97316] hover:bg-[#ea6c0a] text-white',
  secondary: 'bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated)] text-[var(--text)] border border-[var(--border)]',
  ghost: 'bg-transparent hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text)]',
  danger: 'bg-red-950 hover:bg-red-900 text-red-400 border border-red-900',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-sm',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

export function Button({ variant = 'primary', size = 'md', className, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center gap-2 font-medium uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
