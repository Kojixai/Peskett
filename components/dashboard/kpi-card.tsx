import Link from 'next/link'
import { cn } from '@/lib/utils'

interface KpiCardProps {
  label: string
  value: string
  sub?: string
  trend?: 'up' | 'down' | 'neutral'
  accent?: boolean
  color?: string
  href?: string
  className?: string
}

export function KpiCard({ label, value, sub, trend, accent, color, href, className }: KpiCardProps) {
  const inner = (
    <div
      className={cn(
        color ?? 'bg-[var(--bg-card)]',
        'rounded-2xl p-3 md:p-4 flex flex-col gap-1.5 shadow-sm border border-transparent',
        accent && 'border-orange-200 dark:border-orange-800/40',
        href && 'hover:brightness-95 active:scale-[0.98] transition-all cursor-pointer',
        className
      )}
    >
      <div className="text-[10px] md:text-xs text-[var(--text-muted)] uppercase tracking-widest font-semibold leading-tight">{label}</div>
      <div className={cn(
        'font-bold text-lg md:text-2xl leading-tight',
        accent ? 'text-[#f97316]' : 'text-[var(--text)]'
      )}>
        {value}
      </div>
      {sub && (
        <div className="flex items-center gap-1 text-[10px] md:text-xs text-[var(--text-muted)]">
          {trend === 'up' && <span className="text-emerald-500 font-bold">↑</span>}
          {trend === 'down' && <span className="text-red-500 font-bold">↓</span>}
          <span className="truncate">{sub}</span>
        </div>
      )}
    </div>
  )

  if (href) return <Link href={href}>{inner}</Link>
  return inner
}
