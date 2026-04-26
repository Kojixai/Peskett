import { KpiCard } from '@/components/dashboard/kpi-card'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { formatCurrency, formatPercent } from '@/lib/utils'
import type { ChartRanges } from '@/lib/types'
import Link from 'next/link'
import { format, startOfMonth, startOfDay, endOfDay, subDays, subMonths, startOfMonth as startOfM, endOfMonth } from 'date-fns'

export const dynamic = 'force-dynamic'

async function getLiveData() {
  const { createClient } = await import('@/lib/supabase/server')
  const { getAccountBalance } = await import('@/lib/starling')
  const supabase = await createClient()
  const now = new Date()
  const monthStart = startOfMonth(now).toISOString()

  const [
    { data: allOrders },
    { data: monthOrders },
    { data: stockItems },
    { data: recentOrders },
    starlingBalance,
  ] = await Promise.all([
    supabase.from('orders').select('sale_price, profit, margin_percent, sold_at'),
    supabase.from('orders').select('sale_price, profit, margin_percent').gte('sold_at', monthStart),
    supabase.from('inventory_items').select('cost_price, status').in('status', ['in_stock', 'listed']),
    supabase.from('orders').select('*, inventory_items(sku, brand, description, cost_price, photos), listings(list_price)').order('sold_at', { ascending: false }).limit(8),
    getAccountBalance(),
  ])

  const totalRevenue = allOrders?.reduce((s, o) => s + (o.sale_price ?? 0), 0) ?? 0
  const totalProfit = allOrders?.reduce((s, o) => s + (o.profit ?? 0), 0) ?? 0
  const monthRevenue = monthOrders?.reduce((s, o) => s + (o.sale_price ?? 0), 0) ?? 0
  const monthProfit = monthOrders?.reduce((s, o) => s + (o.profit ?? 0), 0) ?? 0
  const avgMargin = allOrders?.length ? allOrders.reduce((s, o) => s + (o.margin_percent ?? 0), 0) / allOrders.length : 0
  const inStockCount = stockItems?.filter((i) => i.status === 'in_stock').length ?? 0
  const liveListings = stockItems?.filter((i) => i.status === 'listed').length ?? 0
  const stockValue = stockItems?.reduce((s, i) => s + (i.cost_price ?? 0), 0) ?? 0

  // Last month comparison
  const lastMonthStart = startOfMonth(subMonths(now, 1))
  const lastMonthEnd = endOfMonth(subMonths(now, 1))
  const lastMonthOrdersData = allOrders?.filter(o => {
    const d = new Date(o.sold_at)
    return d >= lastMonthStart && d <= lastMonthEnd
  }) ?? []
  const lastMonthRevenue = lastMonthOrdersData.reduce((s, o) => s + (o.sale_price ?? 0), 0)
  const lastMonthProfit = lastMonthOrdersData.reduce((s, o) => s + (o.profit ?? 0), 0)

  // Chart ranges
  const todayStart = startOfDay(now)
  const currentHour = now.getHours()
  const today = Array.from({ length: currentHour + 1 }, (_, h) => {
    const hourOrders = allOrders?.filter(o => {
      const d = new Date(o.sold_at)
      return d >= todayStart && d.getHours() === h
    }) ?? []
    return {
      period: `${String(h).padStart(2, '0')}:00`,
      revenue: hourOrders.reduce((s, o) => s + (o.sale_price ?? 0), 0),
      profit: hourOrders.reduce((s, o) => s + (o.profit ?? 0), 0),
    }
  })

  const week = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(now, 6 - i)
    const ds = startOfDay(d), de = endOfDay(d)
    const dayOrders = allOrders?.filter(o => { const od = new Date(o.sold_at); return od >= ds && od <= de }) ?? []
    return {
      period: format(d, 'EEE'),
      revenue: dayOrders.reduce((s, o) => s + (o.sale_price ?? 0), 0),
      profit: dayOrders.reduce((s, o) => s + (o.profit ?? 0), 0),
    }
  })

  const month = Array.from({ length: 4 }, (_, i) => {
    const wkEnd = endOfDay(subDays(now, i * 7))
    const wkStart = startOfDay(subDays(now, i * 7 + 6))
    const wkOrders = allOrders?.filter(o => { const d = new Date(o.sold_at); return d >= wkStart && d <= wkEnd }) ?? []
    return {
      period: `Wk ${4 - i}`,
      revenue: wkOrders.reduce((s, o) => s + (o.sale_price ?? 0), 0),
      profit: wkOrders.reduce((s, o) => s + (o.profit ?? 0), 0),
    }
  }).reverse()

  const year = Array.from({ length: 12 }, (_, i) => {
    const mDate = subMonths(now, 11 - i)
    const ms = startOfM(mDate), me = endOfMonth(mDate)
    const mOrders = allOrders?.filter(o => { const d = new Date(o.sold_at); return d >= ms && d <= me }) ?? []
    return {
      period: format(mDate, 'MMM'),
      revenue: mOrders.reduce((s, o) => s + (o.sale_price ?? 0), 0),
      profit: mOrders.reduce((s, o) => s + (o.profit ?? 0), 0),
    }
  })

  const chartRanges: ChartRanges = { today, week, month, year }

  return { totalRevenue, totalProfit, monthRevenue, monthProfit, avgMargin, inStockCount, liveListings, stockValue, recentOrders: recentOrders ?? [], chartRanges, starlingBalance, itemsSold: allOrders?.length ?? 0, monthSold: monthOrders?.length ?? 0, lastMonthRevenue, lastMonthProfit }
}

async function getDemoData() {
  const { getDemoKPIs, getDemoChartData, demoOrders, demoInventory } = await import('@/lib/demo-data')
  const kpis = getDemoKPIs()
  const chartRanges = getDemoChartData()
  const recentOrders = demoOrders.map((o) => {
    const item = demoInventory.find((i) => i.id === o.sku_id) ?? null
    return { ...o, inventory_items: item, listings: { list_price: o.sale_price * 1.1 } }
  })
  return { ...kpis, recentOrders, chartRanges, starlingBalance: { balance: 1842.50, currency: 'GBP' } }
}

function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return !!(url && key && !url.includes('placeholder') && key.length > 50)
}

const KPI_COLORS = [
  'bg-orange-50  dark:bg-orange-950/25',
  'bg-emerald-50 dark:bg-emerald-950/25',
  'bg-purple-50  dark:bg-purple-950/25',
  'bg-blue-50    dark:bg-blue-950/25',
  'bg-rose-50    dark:bg-rose-950/25',
  'bg-teal-50    dark:bg-teal-950/25',
  'bg-amber-50   dark:bg-amber-950/25',
  'bg-violet-50  dark:bg-violet-950/25',
  'bg-sky-50     dark:bg-sky-950/25',
]

export default async function DashboardPage() {
  const isDemo = process.env.DEMO_MODE === 'true' || !isSupabaseConfigured()
  const now = new Date()

  const d = isDemo ? await getDemoData() : await getLiveData()

  // vs last month
  const revenueChange = d.lastMonthRevenue > 0
    ? Math.round(((d.monthRevenue - d.lastMonthRevenue) / d.lastMonthRevenue) * 100)
    : null

  const kpis = [
    { label: 'Revenue (month)',  value: formatCurrency(d.monthRevenue),  sub: `All time: ${formatCurrency(d.totalRevenue)}`, accent: true, href: '/revenue' },
    { label: 'Profit (month)',   value: formatCurrency(d.monthProfit),   sub: `All time: ${formatCurrency(d.totalProfit)}`, trend: d.monthProfit > 0 ? 'up' : 'down' as const, href: '/revenue' },
    { label: 'vs Last Month',    value: revenueChange !== null ? `${revenueChange >= 0 ? '+' : ''}${revenueChange}%` : '—', sub: `Last month: ${formatCurrency(d.lastMonthRevenue)}`, trend: revenueChange !== null ? (revenueChange >= 0 ? 'up' : 'down') as 'up' | 'down' : undefined, href: '/revenue' },
    { label: 'Avg Margin',       value: formatPercent(d.avgMargin),      sub: `${d.itemsSold} items sold`, href: '/orders' },
    { label: 'Items Sold',       value: String(d.monthSold),             sub: `${d.itemsSold} all time`, href: '/orders' },
    { label: 'In Stock',         value: String(d.inStockCount),          sub: `Value: ${formatCurrency(d.stockValue)}`, href: '/inventory' },
    { label: 'Cash Balance',     value: d.starlingBalance ? formatCurrency(d.starlingBalance.balance) : '—', sub: d.starlingBalance ? 'Starling Bank' : 'Connect Starling' },
    { label: 'Live Listings',    value: String(d.liveListings),          sub: 'Currently on Vinted', href: '/inventory?status=listed' },
    { label: 'Stock Value',      value: formatCurrency(d.stockValue),    sub: 'Cost price basis', href: '/inventory' },
  ]

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[var(--text)]">Dashboard</h1>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">{format(now, 'EEEE, d MMMM yyyy')}</p>
      </div>

      {/* Chart */}
      <RevenueChart ranges={d.chartRanges} />

      {/* KPI grid — 3 cols mobile, 4 cols md+ */}
      <div className="grid grid-cols-3 md:grid-cols-4 gap-2 md:gap-3">
        {kpis.map((kpi, i) => (
          <KpiCard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            sub={kpi.sub}
            trend={'trend' in kpi ? (kpi.trend as 'up' | 'down' | 'neutral') : undefined}
            accent={'accent' in kpi ? kpi.accent : false}
            color={KPI_COLORS[i]}
            href={'href' in kpi ? kpi.href : undefined}
          />
        ))}
      </div>

      {/* P&L table — desktop only */}
      {d.recentOrders.length > 0 && (
        <div className="hidden md:block bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
            <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest">P&amp;L Breakdown</div>
            <Link href="/orders" className="text-xs font-medium text-[#f97316] hover:text-[#ea6c0a]">All orders →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {['SKU', 'Item', 'Cost', 'List', 'Sale', 'Fees', 'Net', 'Profit', 'Margin'].map((h) => (
                    <th key={h} className="px-4 py-2 text-left text-xs text-[var(--text-muted)] uppercase tracking-widest font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {d.recentOrders.map((order: any) => {
                  const item = order.inventory_items
                  return (
                    <tr key={order.id} className="hover:bg-[var(--bg-elevated)] transition-colors">
                      <td className="px-4 py-2 font-mono text-xs text-[var(--text-muted)]">{item?.sku ?? '—'}</td>
                      <td className="px-4 py-2 text-sm text-[var(--text-2)] max-w-32 truncate">{item?.brand} {item?.description}</td>
                      <td className="px-4 py-2 font-mono text-xs text-[var(--text-muted)]">{formatCurrency(item?.cost_price ?? 0)}</td>
                      <td className="px-4 py-2 font-mono text-xs text-[var(--text-muted)]">{order.listings?.list_price ? formatCurrency(order.listings.list_price) : '—'}</td>
                      <td className="px-4 py-2 font-mono text-xs text-[var(--text)]">{formatCurrency(order.sale_price)}</td>
                      <td className="px-4 py-2 font-mono text-xs text-[var(--text-muted)]">{formatCurrency(order.platform_fee + order.shipping_cost)}</td>
                      <td className="px-4 py-2 font-mono text-xs text-[var(--text)]">{formatCurrency(order.net_revenue)}</td>
                      <td className={`px-4 py-2 font-mono text-xs font-semibold ${order.profit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {order.profit >= 0 ? '+' : ''}{formatCurrency(order.profit)}
                      </td>
                      <td className="px-4 py-2 font-mono text-xs text-[var(--text-muted)]">{formatPercent(order.margin_percent ?? 0)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
