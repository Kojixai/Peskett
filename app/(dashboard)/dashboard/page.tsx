import { createClient } from '@/lib/supabase/server'
import { KpiCard } from '@/components/dashboard/kpi-card'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatPercent, formatDate } from '@/lib/utils'
import { getAccountBalance } from '@/lib/starling'
import type { RevenueDataPoint } from '@/lib/types'
import Link from 'next/link'
import { format, subMonths, startOfMonth } from 'date-fns'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()

  const now = new Date()
  const monthStart = startOfMonth(now).toISOString()

  // Parallel fetches
  const [
    { data: allOrders },
    { data: monthOrders },
    { data: stockItems },
    { data: recentOrders },
    starlingBalance,
  ] = await Promise.all([
    supabase.from('orders').select('sale_price, profit, margin_percent, sold_at'),
    supabase
      .from('orders')
      .select('sale_price, profit, margin_percent')
      .gte('sold_at', monthStart),
    supabase
      .from('inventory_items')
      .select('cost_price, status')
      .in('status', ['in_stock', 'listed']),
    supabase
      .from('orders')
      .select('*, inventory_items(sku, brand, description, photos), listings(list_price)')
      .order('sold_at', { ascending: false })
      .limit(8),
    getAccountBalance(),
  ])

  // KPI calculations
  const totalRevenue = allOrders?.reduce((s, o) => s + (o.sale_price ?? 0), 0) ?? 0
  const totalProfit = allOrders?.reduce((s, o) => s + (o.profit ?? 0), 0) ?? 0
  const monthRevenue = monthOrders?.reduce((s, o) => s + (o.sale_price ?? 0), 0) ?? 0
  const monthProfit = monthOrders?.reduce((s, o) => s + (o.profit ?? 0), 0) ?? 0
  const avgMargin =
    allOrders && allOrders.length > 0
      ? allOrders.reduce((s, o) => s + (o.margin_percent ?? 0), 0) / allOrders.length
      : 0

  const inStock = stockItems?.filter((i) => i.status === 'in_stock').length ?? 0
  const stockValue = stockItems?.reduce((s, i) => s + (i.cost_price ?? 0), 0) ?? 0

  // Revenue chart — last 8 weeks
  const chartData: RevenueDataPoint[] = []
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(now)
    weekStart.setDate(weekStart.getDate() - i * 7 - 6)
    const weekEnd = new Date(now)
    weekEnd.setDate(weekEnd.getDate() - i * 7)

    const weekOrders = allOrders?.filter((o) => {
      const d = new Date(o.sold_at)
      return d >= weekStart && d <= weekEnd
    })

    chartData.push({
      period: format(weekEnd, 'dd MMM'),
      revenue: weekOrders?.reduce((s, o) => s + (o.sale_price ?? 0), 0) ?? 0,
      profit: weekOrders?.reduce((s, o) => s + (o.profit ?? 0), 0) ?? 0,
    })
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100 uppercase tracking-widest">Dashboard</h1>
          <p className="text-xs text-zinc-500 mt-0.5">{format(now, 'EEEE, d MMMM yyyy')}</p>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          label="Revenue (month)"
          value={formatCurrency(monthRevenue)}
          sub={`All time: ${formatCurrency(totalRevenue)}`}
          accent
        />
        <KpiCard
          label="Profit (month)"
          value={formatCurrency(monthProfit)}
          sub={`All time: ${formatCurrency(totalProfit)}`}
          trend={monthProfit > 0 ? 'up' : 'down'}
        />
        <KpiCard
          label="Avg Margin"
          value={formatPercent(avgMargin)}
          sub={`${allOrders?.length ?? 0} items sold`}
        />
        <KpiCard
          label="Items Sold"
          value={String(monthOrders?.length ?? 0)}
          sub={`${allOrders?.length ?? 0} all time`}
        />
        <KpiCard
          label="In Stock"
          value={String(inStock)}
          sub={`Value: ${formatCurrency(stockValue)}`}
        />
        <KpiCard
          label="Cash Balance"
          value={starlingBalance ? formatCurrency(starlingBalance.balance) : '—'}
          sub={starlingBalance ? 'Starling Bank (live)' : 'Connect Starling to see balance'}
        />
        <KpiCard
          label="Live Listings"
          value={String(stockItems?.filter((i) => i.status === 'listed').length ?? 0)}
          sub="Currently on Vinted"
        />
        <KpiCard
          label="Stock Value"
          value={formatCurrency(stockValue)}
          sub="Cost price basis"
        />
      </div>

      {/* Chart + Recent sales */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <div className="xl:col-span-3">
          <RevenueChart data={chartData} />
        </div>

        {/* Recent sales */}
        <div className="xl:col-span-2 bg-[#111113] border border-[#27272a]">
          <div className="px-4 py-3 border-b border-[#27272a] text-xs text-zinc-500 uppercase tracking-widest">
            Recent Sales
          </div>
          <div className="divide-y divide-[#1e1e22]">
            {recentOrders && recentOrders.length > 0 ? (
              recentOrders.map((order: any) => (
                <div key={order.id} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-mono text-zinc-400 truncate">
                      {(order.inventory_items as any)?.sku ?? '—'}
                    </div>
                    <div className="text-sm text-zinc-300 truncate mt-0.5">
                      {(order.inventory_items as any)?.brand ?? ''}{' '}
                      {(order.inventory_items as any)?.description ?? 'Item'}
                    </div>
                    <div className="text-xs text-zinc-600 mt-0.5">{formatDate(order.sold_at)}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-mono text-sm text-zinc-100">
                      {formatCurrency(order.sale_price)}
                    </div>
                    <div
                      className={`font-mono text-xs ${order.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
                    >
                      {order.profit >= 0 ? '+' : ''}
                      {formatCurrency(order.profit)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-zinc-600 text-sm">No sales yet</div>
            )}
          </div>
          {recentOrders && recentOrders.length > 0 && (
            <div className="px-4 py-2 border-t border-[#27272a]">
              <Link href="/orders" className="text-xs text-[#f97316] hover:text-[#ea6c0a]">
                View all orders →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* P&L table */}
      {recentOrders && recentOrders.length > 0 && (
        <div className="bg-[#111113] border border-[#27272a]">
          <div className="px-4 py-3 border-b border-[#27272a] flex items-center justify-between">
            <div className="text-xs text-zinc-500 uppercase tracking-widest">P&amp;L Breakdown</div>
            <Link href="/orders" className="text-xs text-[#f97316] hover:text-[#ea6c0a]">
              All orders →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#27272a]">
                  {['SKU', 'Item', 'Cost', 'List', 'Sale', 'Fees', 'Net', 'Profit', 'Margin'].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-2 text-left text-xs text-zinc-500 uppercase tracking-widest font-normal"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e22]">
                {recentOrders.map((order: any) => {
                  const item = order.inventory_items as any
                  return (
                    <tr key={order.id} className="hover:bg-[#18181b] transition-colors">
                      <td className="px-4 py-2 font-mono text-xs text-zinc-400">{item?.sku ?? '—'}</td>
                      <td className="px-4 py-2 text-sm text-zinc-300 max-w-32 truncate">
                        {item?.brand} {item?.description}
                      </td>
                      <td className="px-4 py-2 font-mono text-xs text-zinc-400">
                        {formatCurrency(item?.cost_price ?? 0)}
                      </td>
                      <td className="px-4 py-2 font-mono text-xs text-zinc-400">
                        {order.listings?.list_price ? formatCurrency(order.listings.list_price) : '—'}
                      </td>
                      <td className="px-4 py-2 font-mono text-xs text-zinc-200">
                        {formatCurrency(order.sale_price)}
                      </td>
                      <td className="px-4 py-2 font-mono text-xs text-zinc-400">
                        {formatCurrency(order.platform_fee + order.shipping_cost)}
                      </td>
                      <td className="px-4 py-2 font-mono text-xs text-zinc-200">
                        {formatCurrency(order.net_revenue)}
                      </td>
                      <td
                        className={`px-4 py-2 font-mono text-xs font-medium ${order.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
                      >
                        {order.profit >= 0 ? '+' : ''}
                        {formatCurrency(order.profit)}
                      </td>
                      <td className="px-4 py-2 font-mono text-xs text-zinc-400">
                        {formatPercent(order.margin_percent ?? 0)}
                      </td>
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
