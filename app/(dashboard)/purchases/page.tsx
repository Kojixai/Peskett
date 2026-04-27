import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const sourceLabels: Record<string, string> = {
  ebay: 'eBay',
  vinted: 'Vinted',
  in_person: 'In Person',
  other: 'Other',
}

export default async function PurchasesPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('purchases')
    .select('*, inventory_items(id)')
    .order('purchase_date', { ascending: false })
  const purchases = data ?? []

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[var(--text)] uppercase tracking-widest">Purchases</h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">{purchases.length} purchase batches</p>
        </div>
        <Link href="/purchases/new"
          className="inline-flex items-center gap-2 bg-[#f97316] hover:bg-[#ea6c0a] text-white text-xs font-semibold uppercase tracking-widest px-4 py-2 transition-colors rounded-lg">
          + Log Purchase
        </Link>
      </div>

      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
        {purchases.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-[var(--text-subtle)] text-sm">No purchases logged yet</p>
            <Link href="/purchases/new" className="text-[#f97316] text-sm mt-2 inline-block hover:text-[#ea6c0a]">
              Log your first purchase →
            </Link>
          </div>
        ) : (
          <>
            <div className="divide-y divide-[var(--border)] md:hidden">
              {purchases.map((p: any) => (
                <div key={p.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-mono text-xs text-[var(--text-2)]">{formatDate(p.purchase_date)}</div>
                      <div className="text-xs text-[var(--text-muted)] mt-0.5">{sourceLabels[p.source] ?? p.source}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm text-[var(--text)]">{formatCurrency(p.total_cost)}</div>
                      <div className="font-mono text-xs text-[var(--text-muted)] mt-0.5">
                        {p.item_count} items · {formatCurrency(p.total_cost / p.item_count)}/ea
                      </div>
                    </div>
                  </div>
                  {p.notes && <div className="text-xs text-[var(--text-muted)] truncate">{p.notes}</div>}
                  <Link href={`/inventory?purchase=${p.id}`} className="font-mono text-xs text-[#f97316] hover:text-[#ea6c0a]">
                    {(p.inventory_items as any[])?.length ?? 0} SKUs →
                  </Link>
                </div>
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    {['Date', 'Source', 'Items', 'Total Cost', 'Cost/Item', 'Notes', 'SKUs'].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left text-xs text-[var(--text-muted)] uppercase tracking-widest font-normal">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {purchases.map((p: any) => (
                    <tr key={p.id} className="hover:bg-[var(--bg-elevated)] transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-[var(--text-2)]">{formatDate(p.purchase_date)}</td>
                      <td className="px-4 py-3 text-xs text-[var(--text-muted)]">{sourceLabels[p.source] ?? p.source}</td>
                      <td className="px-4 py-3 font-mono text-xs text-[var(--text-2)]">{p.item_count}</td>
                      <td className="px-4 py-3 font-mono text-sm text-[var(--text)]">{formatCurrency(p.total_cost)}</td>
                      <td className="px-4 py-3 font-mono text-xs text-[var(--text-muted)]">{formatCurrency(p.total_cost / p.item_count)}</td>
                      <td className="px-4 py-3 text-sm text-[var(--text-muted)] max-w-48 truncate">{p.notes ?? '—'}</td>
                      <td className="px-4 py-3">
                        <Link href={`/inventory?purchase=${p.id}`} className="font-mono text-xs text-[#f97316] hover:text-[#ea6c0a]">
                          {(p.inventory_items as any[])?.length ?? 0} SKUs →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
