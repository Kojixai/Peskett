'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import type { RevenueDataPoint } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'

interface RevenueChartProps {
  data: RevenueDataPoint[]
}

export function RevenueChart({ data }: RevenueChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-6 flex items-center justify-center h-64 shadow-sm">
        <p className="text-[var(--text-subtle)] text-sm">No sales data yet</p>
      </div>
    )
  }

  return (
    <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-4 shadow-sm">
      <div className="text-xs text-[var(--text-muted)] uppercase tracking-widest mb-4 font-medium">Revenue vs Profit</div>
      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 6" stroke="var(--border)" />
          <XAxis
            dataKey="period"
            tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'JetBrains Mono' }}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'JetBrains Mono' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `£${v}`}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              fontSize: 12,
              fontFamily: 'JetBrains Mono',
              color: 'var(--text)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
            }}
            labelStyle={{ color: 'var(--text-muted)' }}
            formatter={(value: number, name: string) => [
              formatCurrency(value),
              name.charAt(0).toUpperCase() + name.slice(1),
            ]}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, fontFamily: 'JetBrains Mono', color: 'var(--text-muted)' }}
          />
          <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: '#3b82f6' }} />
          <Line type="monotone" dataKey="profit" stroke="#f97316" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: '#f97316' }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
