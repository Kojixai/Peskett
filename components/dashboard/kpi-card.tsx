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
        'bg-[#111113] border border-[#27272a] p-4 flex flex-col gap-3',
        accent && 'border-[#f97316]/30',
        className
      )}
    >
      <div className="text-xs text-zinc-500 uppercase tracking-widest">{label}</div>
      <div className={cn('font-mono text-2xl font-bold', accent ? 'text-[#f97316]' : 'text-zinc-100')}>
        {value}
      </div>
      {sub && (
        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
          {trend === 'up' && <span className="text-emerald-400">↑</span>}
          {trend === 'down' && <span className="text-red-400">↓</span>}
          <span>{sub}</span>
        </div>
      )}
    </div>
  )
}
