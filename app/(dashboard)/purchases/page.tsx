import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { demoPurchases, demoInventory } from '@/lib/demo-data'

export const dynamic = 'force-dynamic'

const sourceLabels: Record<string, string> = {
  ebay: 'eBay',
  vinted: 'Vinted',
  in_person: 'In Person',
  other: 'Other',
}

export default async function PurchasesPage() {
  const isDemo = process.env.DEMO_MODE === 'true'
  let purchases: any[]

  if (isDemo) {
    purchases = demoPurchases.map((p) => ({
      ...p,
      inventory_items: demoInventory.filter((i) => i.purchase_id === p.id),
    }))
  } else {
    const supabase = await createClient()
    const { data } = await supabase
      .from('purchases')
      .select('*, inventory_items(id)')
      .order('purchase_date', { ascending: false })
    purchases = data ?? []
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100 uppercase tracking-widest">Purchases</h1>
          <p className="text-xs text-zinc-500 mt-0.5">{purchases?.length ?? 0} purchase batches</p>
        </div>
        <Link
          href="/purchases/new"
          className="inline-flex items-center gap-2 bg-[#f97316] hover:bg-[#ea6c0a] text-white text-xs font-semibold uppercase tracking-widest px-4 py-2 transition-colors"
        >
          + Log Purchase
        </Link>
      </div>

      <div className="bg-[#111113] border border-[#27272a]">
        {!purchases || purchases.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-zinc-600 text-sm">No purchases logged yet</p>
            <Link href="/purchases/new" className="text-[#f97316] text-sm mt-2 inline-block hover:text-[#ea6c0a]">
              Log your first purchase →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#27272a]">
                  {['Date', 'Source', 'Items', 'Total Cost', 'Cost/Item', 'Notes', 'SKUs'].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-2.5 text-left text-xs text-zinc-500 uppercase tracking-widest font-normal"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e22]">
                {purchases.map((p) => (
                  <tr key={p.id} className="hover:bg-[#18181b] transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-zinc-300">{formatDate(p.purchase_date)}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-zinc-400">{sourceLabels[p.source] ?? p.source}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-300">{p.item_count}</td>
                    <td className="px-4 py-3 font-mono text-sm text-zinc-100">{formatCurrency(p.total_cost)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-400">
                      {formatCurrency(p.total_cost / p.item_count)}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-500 max-w-48 truncate">{p.notes ?? '—'}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/inventory?purchase=${p.id}`}
                        className="font-mono text-xs text-[#f97316] hover:text-[#ea6c0a]"
                      >
                        {(p.inventory_items as any[])?.length ?? 0} SKUs →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
