import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'muted'

const variants: Record<BadgeVariant, string> = {
  default: 'bg-zinc-800 text-zinc-300',
  success: 'bg-emerald-950 text-emerald-400 border-emerald-900',
  warning: 'bg-amber-950 text-amber-400 border-amber-900',
  error: 'bg-red-950 text-red-400 border-red-900',
  info: 'bg-blue-950 text-blue-400 border-blue-900',
  muted: 'bg-zinc-900 text-zinc-500',
}

const statusVariants: Record<string, BadgeVariant> = {
  in_stock: 'info',
  listed: 'warning',
  sold: 'success',
  draft: 'muted',
  scheduled: 'warning',
  live: 'success',
  deleted: 'error',
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
        'inline-flex items-center px-2 py-0.5 text-xs font-mono font-medium uppercase tracking-wider border',
        variants[v],
        className
      )}
    >
      {children}
    </span>
  )
}
