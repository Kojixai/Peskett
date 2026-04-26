import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'muted'

const variants: Record<BadgeVariant, string> = {
  default:  'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
  success:  'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400',
  warning:  'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400',
  error:    'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400',
  info:     'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400',
  muted:    'bg-[var(--bg-elevated)] text-[var(--text-muted)]',
}

const statusVariants: Record<string, BadgeVariant> = {
  in_stock:  'info',
  listed:    'warning',
  sold:      'success',
  draft:     'muted',
  scheduled: 'warning',
  live:      'success',
  deleted:   'error',
}

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  status?: string
  className?: string
}

export function Badge({ children, variant, status, className }: BadgeProps) {
  const v = variant ?? (status ? statusVariants[status] ?? 'default' : 'default')
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md tracking-wide',
        variants[v],
        className
      )}
    >
      {children}
    </span>
  )
}
