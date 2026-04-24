import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function OrdersPage() {
  const supabase = await createClient()

  const { data: orders } = await supabase
    .from('orders')
    .select('*, inventory_items(sku, brand, description, photos), listings(list_price, platform)')
    .order('sold_at', { ascending: false })

  const totalRevenue = orders?.reduce((s, o) => s + (o.sale_price ?? 0), 0) ?? 0
  const totalProfit = orders?.reduce((s, o) => s + (o.profit ?? 0), 0) ?? 0
  const avgMargin = orders && orders.length > 0
    ? orders.reduce((s, o) => s + (o.margin_percent ?? 0), 0) / orders.length
    : 0

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100 uppercase tracking-widest">Orders</h1>
          <p className="text-xs text-zinc-500 mt-0.5">{orders?.length ?? 0} total sales</p>
        </div>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Revenue', value: formatCurrency(totalRevenue) },
          { label: 'Total Profit', value: formatCurrency(totalProfit) },
          { label: 'Avg Margin', value: `${avgMargin.toFixed(1)}%` },
        ].map((item) => (
          <div key={item.label} className="bg-[#111113] border border-[#27272a] px-4 py-3">
            <div className="text-xs text-zinc-500 uppercase tracking-widest">{item.label}</div>
            <div className="font-mono text-lg font-bold text-zinc-100 mt-1">{item.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-[#111113] border border-[#27272a]">
        {!orders || orders.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-zinc-600 text-sm">No orders yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#27272a]">
                  {['SKU', 'Item', 'Sale Price', 'Fees', 'Net', 'Profit', 'Margin', 'Date', 'Label'].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs text-zinc-500 uppercase tracking-widest font-normal">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e22]">
                {orders.map((order: any) => {
                  const item = order.inventory_items
                  return (
                    <tr key={order.id} className="hover:bg-[#18181b] transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-zinc-400">{item?.sku ?? '—'}</td>
                      <td className="px-4 py-3 text-sm text-zinc-300 max-w-40 truncate">
                        {item?.brand && <span className="font-medium">{item.brand} </span>}
                        {item?.description}
                      </td>
                      <td className="px-4 py-3 font-mono text-sm text-zinc-100">{formatCurrency(order.sale_price)}</td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-500">
                        {formatCurrency(order.platform_fee + order.shipping_cost)}
                      </td>
                      <td className="px-4 py-3 font-mono text-sm text-zinc-200">{formatCurrency(order.net_revenue)}</td>
                      <td className={`px-4 py-3 font-mono text-sm font-medium ${order.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {order.profit >= 0 ? '+' : ''}{formatCurrency(order.profit)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-400">
                        {order.margin_percent?.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-500">{formatDate(order.sold_at)}</td>
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
                          <span className="text-xs text-zinc-700">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
