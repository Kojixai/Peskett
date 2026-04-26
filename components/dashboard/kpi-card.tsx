import { cn } from '@/lib/utils'

interface KpiCardProps {
  label: string
  value: string
  sub?: string
  trend?: 'up' | 'down' | 'neutral'
  accent?: boolean
  className?: string
}

export function KpiCard({ label, value, sub, trend, accent, className }: KpiCardProps) {
  return (
    <div
      className={cn(
        'bg-[var(--bg-card)] rounded-2xl p-4 flex flex-col gap-2 shadow-sm border border-[var(--border)]',
        accent && 'border-orange-200 dark:border-orange-900/40',
        className
      )}
    >
      <div className="text-xs text-[var(--text-muted)] uppercase tracking-widest font-medium">{label}</div>
      <div className={cn(
        'font-mono text-2xl font-bold',
        accent ? 'text-[#f97316]' : 'text-[var(--text)]'
      )}>
        {value}
      </div>
      {sub && (
        <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
          {trend === 'up' && <span className="text-emerald-500 font-bold">↑</span>}
          {trend === 'down' && <span className="text-red-500 font-bold">↓</span>}
          <span>{sub}</span>
        </div>
      )}
    </div>
  )
}
