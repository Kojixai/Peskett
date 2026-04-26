import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { demoOrders, demoInventory } from '@/lib/demo-data'

export const dynamic = 'force-dynamic'

export default async function OrdersPage() {
  const isDemo = process.env.DEMO_MODE === 'true' || !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('supabase.co') || !!process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')
  let orders: any[]

  if (isDemo) {
    orders = demoOrders.map((o) => ({
      ...o,
      inventory_items: demoInventory.find((i) => i.id === o.sku_id) ?? null,
      listings: { list_price: o.sale_price * 1.1, platform: 'vinted' },
    }))
  } else {
    const supabase = await createClient()
    const { data } = await supabase
      .from('orders')
      .select('*, inventory_items(sku, brand, description, photos), listings(list_price, platform)')
      .order('sold_at', { ascending: false })
    orders = data ?? []
  }

  const totalRevenue = orders?.reduce((s, o) => s + (o.sale_price ?? 0), 0) ?? 0
  const totalProfit = orders?.reduce((s, o) => s + (o.profit ?? 0), 0) ?? 0
  const avgMargin = orders && orders.length > 0
    ? orders.reduce((s, o) => s + (o.margin_percent ?? 0), 0) / orders.length
    : 0

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[var(--text)] uppercase tracking-widest">Orders</h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">{orders?.length ?? 0} total sales</p>
        </div>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-2 md:gap-3">
        {[
          { label: 'Revenue', value: formatCurrency(totalRevenue) },
          { label: 'Profit', value: formatCurrency(totalProfit) },
          { label: 'Avg Margin', value: `${avgMargin.toFixed(1)}%` },
        ].map((item) => (
          <div key={item.label} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl px-3 md:px-4 py-3 shadow-sm">
            <div className="text-xs text-[var(--text-muted)] uppercase tracking-widest truncate">{item.label}</div>
            <div className="font-mono text-base md:text-lg font-bold text-[var(--text)] mt-1">{item.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
        {!orders || orders.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-[var(--text-subtle)] text-sm">No orders yet</p>
          </div>
        ) : (
          <>
            {/* Mobile card view */}
            <div className="divide-y divide-[var(--border)] md:hidden">
              {orders.map((order: any) => {
                const item = order.inventory_items
                return (
                  <div key={order.id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-mono text-xs text-[var(--text-muted)]">{item?.sku ?? '—'}</div>
                        <div className="text-sm text-[var(--text)] mt-0.5 truncate">
                          {item?.brand && <span className="font-medium">{item.brand} </span>}
                          {item?.description}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-mono text-sm text-[var(--text)]">{formatCurrency(order.sale_price)}</div>
                        <div className={`font-mono text-xs mt-0.5 ${order.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {order.profit >= 0 ? '+' : ''}{formatCurrency(order.profit)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-[var(--text-subtle)]">{formatDate(order.sold_at)}</span>
                      <span className="font-mono text-xs text-[var(--text-muted)]">{order.margin_percent?.toFixed(1)}% margin</span>
                    </div>
                    {order.shipment_label_url && (
                      <a
                        href={order.shipment_label_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-[#f97316] border border-[#f97316]/30 px-2 py-1"
                      >
                        Label ↓
                      </a>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Desktop table view */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    {['SKU', 'Item', 'Sale Price', 'Fees', 'Net', 'Profit', 'Margin', 'Date', 'Label'].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left text-xs text-[var(--text-muted)] uppercase tracking-widest font-normal">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {orders.map((order: any) => {
                    const item = order.inventory_items
                    return (
                      <tr key={order.id} className="hover:bg-[var(--bg-elevated)] transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-[var(--text-muted)]">{item?.sku ?? '—'}</td>
                        <td className="px-4 py-3 text-sm text-[var(--text-2)] max-w-40 truncate">
                          {item?.brand && <span className="font-medium">{item.brand} </span>}
                          {item?.description}
                        </td>
                        <td className="px-4 py-3 font-mono text-sm text-[var(--text)]">{formatCurrency(order.sale_price)}</td>
                        <td className="px-4 py-3 font-mono text-xs text-[var(--text-muted)]">
                          {formatCurrency(order.platform_fee + order.shipping_cost)}
                        </td>
                        <td className="px-4 py-3 font-mono text-sm text-[var(--text)]">{formatCurrency(order.net_revenue)}</td>
                        <td className={`px-4 py-3 font-mono text-sm font-medium ${order.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {order.profit >= 0 ? '+' : ''}{formatCurrency(order.profit)}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-[var(--text-muted)]">
                          {order.margin_percent?.toFixed(1)}%
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-[var(--text-muted)]">{formatDate(order.sold_at)}</td>
                        <td className="px-4 py-3">
                          {order.shipment_label_url ? (
                            <a
                              href={order.shipment_label_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-[#f97316] hover:text-[#ea6c0a] border border-[#f97316]/30 px-2 py-1 transition-colors"
                            >
                              Label ↓
                            </a>
                          ) : (
                            <span className="text-xs text-[var(--text-subtle)]">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
