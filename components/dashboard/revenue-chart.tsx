'use client'

import { useState } from 'react'
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
import type { ChartRanges } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'

interface RevenueChartProps {
  ranges: ChartRanges
}

const TABS = [
  { key: 'today', label: 'Today' },
  { key: 'week',  label: 'Week'  },
  { key: 'month', label: 'Month' },
  { key: 'year',  label: 'Year'  },
] as const

type RangeKey = typeof TABS[number]['key']

export function RevenueChart({ ranges }: RevenueChartProps) {
  const [active, setActive] = useState<RangeKey>('week')
  const data = ranges[active]

  return (
    <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-4 shadow-sm">
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs text-[var(--text-muted)] uppercase tracking-widest font-medium">
          Revenue vs Profit
        </div>
        {/* Range tabs */}
        <div className="flex items-center gap-0.5 bg-[var(--bg-elevated)] rounded-lg p-0.5">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActive(key)}
              className={`px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wide transition-all ${
                active === key
                  ? 'bg-[var(--bg-card)] text-[#f97316] shadow-sm'
                  : 'text-[var(--text-subtle)] hover:text-[var(--text-muted)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {data.length === 0 || data.every(d => d.revenue === 0 && d.profit === 0) ? (
        <div className="flex items-center justify-center h-28 text-[var(--text-subtle)] text-sm">
          No sales data for this period
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={120}>
          <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 6" stroke="var(--border)" />
            <XAxis
              dataKey="period"
              tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'Familjen Grotesk' }}
              axisLine={{ stroke: 'var(--border)' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'Familjen Grotesk' }}
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
                fontFamily: 'Familjen Grotesk',
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
              wrapperStyle={{ fontSize: 11, fontFamily: 'Familjen Grotesk', color: 'var(--text-muted)' }}
            />
            <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: '#3b82f6' }} />
            <Line type="monotone" dataKey="profit"  stroke="#f97316" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: '#f97316' }} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
