import { formatCurrency, formatPercent, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'

export const dynamic = 'force-dynamic'

async function getData(year: number, month: number) {
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()

  const periodStart = new Date(year, month - 1, 1).toISOString()
  const periodEnd = new Date(year, month, 0, 23, 59, 59).toISOString()

  const { data: orders } = await supabase
    .from('orders')
    .select('*, inventory_items(sku, brand, description, cost_price), listings(list_price)')
    .gte('sold_at', periodStart)
    .lte('sold_at', periodEnd)
    .order('sold_at', { ascending: false })

  return orders ?? []
}

async function getDemoData(year: number, month: number) {
  const { demoOrders, demoInventory } = await import('@/lib/demo-data')
  const periodStart = new Date(year, month - 1, 1)
  const periodEnd = new Date(year, month, 0, 23, 59, 59)

  const filtered = demoOrders
    .filter(o => {
      const d = new Date(o.sold_at)
      return d >= periodStart && d <= periodEnd
    })
    .map(o => ({
      ...o,
      inventory_items: demoInventory.find(i => i.id === o.sku_id) ?? null,
      listings: { list_price: o.sale_price * 1.1 },
    }))

  // Demo: return all orders if month filter gives nothing (demo orders are all recent)
  if (filtered.length === 0) {
    return demoOrders.map(o => ({
      ...o,
      inventory_items: demoInventory.find(i => i.id === o.sku_id) ?? null,
      listings: { list_price: o.sale_price * 1.1 },
    }))
  }
  return filtered
}

function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return !!(url && key && !url.includes('placeholder') && key.length > 50)
}

const STAT_COLORS = [
  'bg-orange-50 dark:bg-orange-950/25',
  'bg-emerald-50 dark:bg-emerald-950/25',
  'bg-blue-50 dark:bg-blue-950/25',
  'bg-purple-50 dark:bg-purple-950/25',
  'bg-rose-50 dark:bg-rose-950/25',
  'bg-teal-50 dark:bg-teal-950/25',
  'bg-amber-50 dark:bg-amber-950/25',
  'bg-violet-50 dark:bg-violet-950/25',
]

export default async function RevenuePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>
}) {
  const params = await searchParams
  const now = new Date()
  const year = parseInt(params.year ?? String(now.getFullYear()))
  const month = parseInt(params.month ?? String(now.getMonth() + 1))
  const isDemo = process.env.DEMO_MODE === 'true' || !isSupabaseConfigured()

  const orders = isDemo ? await getDemoData(year, month) : await getData(year, month)

  // Summary calculations
  const grossRevenue = orders.reduce((s, o) => s + (o.sale_price ?? 0), 0)
  const cogs = orders.reduce((s, o) => s + (o.inventory_items?.cost_price ?? 0), 0)
  const platformFees = orders.reduce((s, o) => s + (o.platform_fee ?? 0), 0)
  const shippingCosts = orders.reduce((s, o) => s + (o.shipping_cost ?? 0), 0)
  const netRevenue = orders.reduce((s, o) => s + (o.net_revenue ?? 0), 0)
  const grossProfit = orders.reduce((s, o) => s + (o.profit ?? 0), 0)
  const avgMargin = orders.length > 0 ? orders.reduce((s, o) => s + (o.margin_percent ?? 0), 0) / orders.length : 0
  const avgSalePrice = orders.length > 0 ? grossRevenue / orders.length : 0
  const estimatedVat = grossRevenue / 6  // 20% VAT on revenue (if registered)

  const periodLabel = format(new Date(year, month - 1, 1), 'MMMM yyyy')

  // Month navigation
  const prevDate = subMonths(new Date(year, month - 1, 1), 1)
  const nextDate = subMonths(new Date(year, month - 1, 1), -1)
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1

  const stats = [
    { label: 'Gross Revenue',     value: formatCurrency(grossRevenue),    sub: `${orders.length} sales` },
    { label: 'Net Revenue',       value: formatCurrency(netRevenue),       sub: 'After fees & shipping' },
    { label: 'Gross Profit',      value: formatCurrency(grossProfit),      sub: `Margin: ${formatPercent(avgMargin)}` },
    { label: 'Cost of Goods',     value: formatCurrency(cogs),             sub: 'Purchase cost basis' },
    { label: 'Platform Fees',     value: formatCurrency(platformFees),     sub: 'Vinted commission' },
    { label: 'Shipping Costs',    value: formatCurrency(shippingCosts),    sub: 'Postage & labels' },
    { label: 'Avg Sale Price',    value: formatCurrency(avgSalePrice),     sub: 'Per item' },
    { label: 'Est. VAT (20%)',    value: formatCurrency(estimatedVat),     sub: 'If VAT registered' },
  ]

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors text-sm">
              ← Dashboard
            </Link>
          </div>
          <h1 className="text-lg font-semibold text-[var(--text)] uppercase tracking-widest mt-1">Revenue</h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">{periodLabel}</p>
        </div>

        {/* Month navigator */}
        <div className="flex items-center gap-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-1">
          <Link
            href={`/revenue?year=${prevDate.getFullYear()}&month=${prevDate.getMonth() + 1}`}
            className="px-3 py-1.5 rounded-lg text-xs text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-elevated)] transition-all"
          >
            ←
          </Link>
          <span className="px-3 py-1.5 text-xs font-semibold text-[var(--text)]">{periodLabel}</span>
          {!isCurrentMonth && (
            <Link
              href={`/revenue?year=${nextDate.getFullYear()}&month=${nextDate.getMonth() + 1}`}
              className="px-3 py-1.5 rounded-lg text-xs text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-elevated)] transition-all"
            >
              →
            </Link>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 md:gap-3">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className={`${STAT_COLORS[i]} rounded-2xl p-3 md:p-4 flex flex-col gap-1.5 shadow-sm border border-transparent`}
          >
            <div className="text-[10px] md:text-xs text-[var(--text-muted)] uppercase tracking-widest font-semibold leading-tight">{s.label}</div>
            <div className="font-bold text-lg md:text-2xl leading-tight text-[var(--text)]">{s.value}</div>
            <div className="text-[10px] md:text-xs text-[var(--text-muted)] truncate">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* P&L note */}
      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 rounded-xl px-4 py-2.5">
        <p className="text-xs text-amber-700 dark:text-amber-400">
          <strong>VAT note:</strong> Est. VAT figure is informational only — only applies if you are VAT registered. UK threshold is £90,000 turnover per year.
        </p>
      </div>

      {/* Orders table */}
      {orders.length > 0 ? (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-[var(--border)]">
            <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest">
              Order Breakdown — {orders.length} {orders.length === 1 ? 'sale' : 'sales'}
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-[var(--border)]">
            {orders.map((order: any) => {
              const item = order.inventory_items
              return (
                <div key={order.id} className="p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm font-medium text-[var(--text)]">{item?.brand} {item?.description}</div>
                      <div className="font-mono text-xs text-[var(--text-subtle)] mt-0.5">{item?.sku ?? '—'}</div>
                    </div>
                    <div className={`text-sm font-bold ${order.profit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {order.profit >= 0 ? '+' : ''}{formatCurrency(order.profit)}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-x-4 gap-y-1 text-xs text-[var(--text-muted)]">
                    <span>Cost: {formatCurrency(item?.cost_price ?? 0)}</span>
                    <span>Sale: {formatCurrency(order.sale_price)}</span>
                    <span>Margin: {formatPercent(order.margin_percent ?? 0)}</span>
                    <span>Fees: {formatCurrency(order.platform_fee ?? 0)}</span>
                    <span>Ship: {formatCurrency(order.shipping_cost ?? 0)}</span>
                    <span>Net: {formatCurrency(order.net_revenue ?? 0)}</span>
                  </div>
                  <div className="text-[10px] text-[var(--text-subtle)]">{formatDate(order.sold_at)}</div>
                </div>
              )
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {['Date', 'SKU', 'Item', 'COGS', 'List', 'Sale', 'Fees', 'Shipping', 'Net', 'Profit', 'Margin'].map((h) => (
                    <th key={h} className="px-4 py-2 text-left text-xs text-[var(--text-muted)] uppercase tracking-widest font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {orders.map((order: any) => {
                  const item = order.inventory_items
                  return (
                    <tr key={order.id} className="hover:bg-[var(--bg-elevated)] transition-colors">
                      <td className="px-4 py-2 text-xs text-[var(--text-muted)] whitespace-nowrap">{formatDate(order.sold_at)}</td>
                      <td className="px-4 py-2 font-mono text-xs text-[var(--text-muted)]">{item?.sku ?? '—'}</td>
                      <td className="px-4 py-2 text-sm text-[var(--text-2)] max-w-36 truncate">{item?.brand} {item?.description}</td>
                      <td className="px-4 py-2 font-mono text-xs text-[var(--text-muted)]">{formatCurrency(item?.cost_price ?? 0)}</td>
                      <td className="px-4 py-2 font-mono text-xs text-[var(--text-muted)]">{order.listings?.list_price ? formatCurrency(order.listings.list_price) : '—'}</td>
                      <td className="px-4 py-2 font-mono text-xs text-[var(--text)]">{formatCurrency(order.sale_price)}</td>
                      <td className="px-4 py-2 font-mono text-xs text-[var(--text-muted)]">{formatCurrency(order.platform_fee ?? 0)}</td>
                      <td className="px-4 py-2 font-mono text-xs text-[var(--text-muted)]">{formatCurrency(order.shipping_cost ?? 0)}</td>
                      <td className="px-4 py-2 font-mono text-xs text-[var(--text)]">{formatCurrency(order.net_revenue ?? 0)}</td>
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
      ) : (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-12 flex items-center justify-center">
          <p className="text-[var(--text-subtle)] text-sm">No sales in {periodLabel}</p>
        </div>
      )}
    </div>
  )
}
