import { KpiCard } from '@/components/dashboard/kpi-card'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { formatCurrency, formatPercent, formatDate } from '@/lib/utils'
import type { RevenueDataPoint } from '@/lib/types'
import Link from 'next/link'
import { format, startOfMonth } from 'date-fns'

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

  const chartData: RevenueDataPoint[] = Array.from({ length: 8 }, (_, i) => {
    const weekEnd = new Date(now)
    weekEnd.setDate(weekEnd.getDate() - i * 7)
    const weekStart = new Date(weekEnd)
    weekStart.setDate(weekStart.getDate() - 6)
    const weekOrders = allOrders?.filter((o) => { const d = new Date(o.sold_at); return d >= weekStart && d <= weekEnd }) ?? []
    return {
      period: format(weekEnd, 'dd MMM'),
      revenue: weekOrders.reduce((s, o) => s + (o.sale_price ?? 0), 0),
      profit: weekOrders.reduce((s, o) => s + (o.profit ?? 0), 0),
    }
  }).reverse()

  return { totalRevenue, totalProfit, monthRevenue, monthProfit, avgMargin, inStockCount, liveListings, stockValue, recentOrders: recentOrders ?? [], chartData, starlingBalance, itemsSold: allOrders?.length ?? 0, monthSold: monthOrders?.length ?? 0 }
}

async function getDemoData() {
  const { getDemoKPIs, getDemoChartData, demoOrders, demoInventory } = await import('@/lib/demo-data')
  const kpis = getDemoKPIs()
  const chartData = getDemoChartData()
  const recentOrders = demoOrders.map((o) => {
    const item = demoInventory.find((i) => i.id === o.sku_id) ?? null
    return { ...o, inventory_items: item, listings: { list_price: o.sale_price * 1.1 } }
  })
  return { ...kpis, recentOrders, chartData, starlingBalance: { balance: 1842.50, currency: 'GBP' } }
}

function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return !!(url && key && !url.includes('placeholder') && key.length > 50)
}

export default async function DashboardPage() {
  const isDemo = process.env.DEMO_MODE === 'true' || !isSupabaseConfigured()
  const now = new Date()

  const d = isDemo ? await getDemoData() : await getLiveData()

  return (
    <div className="p-4 md:p-6 space-y-5 md:space-y-6">
      {/* Demo banner */}
      {isDemo && (
        <div className="border border-[#f97316]/40 bg-orange-50/50 dark:bg-[#431407]/20 px-4 py-2.5 rounded-xl flex items-center justify-between gap-3">
          <span className="text-sm text-[#f97316] font-mono">DEMO MODE</span>
          <span className="text-xs text-[var(--text-muted)] hidden sm:block">Add your API keys in .env.local to go live</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[var(--text)] uppercase tracking-widest">Dashboard</h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">{format(now, 'EEEE, d MMMM yyyy')}</p>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        <KpiCard label="Revenue (month)" value={formatCurrency(d.monthRevenue)} sub={`All time: ${formatCurrency(d.totalRevenue)}`} accent />
        <KpiCard label="Profit (month)" value={formatCurrency(d.monthProfit)} sub={`All time: ${formatCurrency(d.totalProfit)}`} trend={d.monthProfit > 0 ? 'up' : 'down'} />
        <KpiCard label="Avg Margin" value={formatPercent(d.avgMargin)} sub={`${d.itemsSold} items sold`} />
        <KpiCard label="Items Sold" value={String(d.monthSold)} sub={`${d.itemsSold} all time`} />
        <KpiCard label="In Stock" value={String(d.inStockCount)} sub={`Value: ${formatCurrency(d.stockValue)}`} />
        <KpiCard label="Cash Balance" value={d.starlingBalance ? formatCurrency(d.starlingBalance.balance) : '—'} sub={d.starlingBalance ? 'Starling Bank' : 'Connect Starling'} />
        <KpiCard label="Live Listings" value={String(d.liveListings)} sub="Currently on Vinted" />
        <KpiCard label="Stock Value" value={formatCurrency(d.stockValue)} sub="Cost price basis" />
      </div>

      {/* Chart + Recent sales */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <div className="xl:col-span-3">
          <RevenueChart data={d.chartData} />
        </div>

        {/* Recent sales */}
        <div className="xl:col-span-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-[var(--border)] text-xs text-[var(--text-muted)] uppercase tracking-widest">Recent Sales</div>
          <div className="divide-y divide-[var(--border)]">
            {d.recentOrders.length > 0 ? (
              d.recentOrders.map((order: any) => (
                <div key={order.id} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-mono text-[var(--text-muted)] truncate">{order.inventory_items?.sku ?? '—'}</div>
                    <div className="text-sm text-[var(--text-2)] truncate mt-0.5">
                      {order.inventory_items?.brand ?? ''}{' '}{order.inventory_items?.description ?? 'Item'}
                    </div>
                    <div className="text-xs text-[var(--text-subtle)] mt-0.5">{formatDate(order.sold_at)}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-mono text-sm text-[var(--text)]">{formatCurrency(order.sale_price)}</div>
                    <div className={`font-mono text-xs ${order.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {order.profit >= 0 ? '+' : ''}{formatCurrency(order.profit)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-[var(--text-subtle)] text-sm">No sales yet</div>
            )}
          </div>
          {d.recentOrders.length > 0 && (
            <div className="px-4 py-2 border-t border-[var(--border)]">
              <Link href="/orders" className="text-xs text-[#f97316] hover:text-[#ea6c0a]">View all orders →</Link>
            </div>
          )}
        </div>
      </div>

      {/* P&L table — desktop only */}
      {d.recentOrders.length > 0 && (
        <div className="hidden md:block bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
            <div className="text-xs text-[var(--text-muted)] uppercase tracking-widest">P&amp;L Breakdown</div>
            <Link href="/orders" className="text-xs text-[#f97316] hover:text-[#ea6c0a]">All orders →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {['SKU', 'Item', 'Cost', 'List', 'Sale', 'Fees', 'Net', 'Profit', 'Margin'].map((h) => (
                    <th key={h} className="px-4 py-2 text-left text-xs text-[var(--text-muted)] uppercase tracking-widest font-normal">{h}</th>
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
                      <td className={`px-4 py-2 font-mono text-xs font-medium ${order.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
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
