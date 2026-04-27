import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import Image from 'next/image'

export const dynamic = 'force-dynamic'

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; category?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('inventory_items')
    .select('*')
    .order('created_at', { ascending: false })

  if (params.status && params.status !== 'all') query = query.eq('status', params.status)
  if (params.q) query = query.or(`brand.ilike.%${params.q}%,description.ilike.%${params.q}%,sku.ilike.%${params.q}%`)
  if (params.category) query = query.ilike('category', `%${params.category}%`)

  const { data } = await query
  const items = data ?? []

  const statuses = [
    { value: 'all', label: 'All' },
    { value: 'in_stock', label: 'In Stock' },
    { value: 'listed', label: 'Listed' },
    { value: 'sold', label: 'Sold' },
  ]
  const activeStatus = params.status ?? 'all'

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[var(--text)] uppercase tracking-widest">Inventory</h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">{items.length} items</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/purchases/new"
            className="hidden sm:inline-flex items-center gap-2 bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-2)] text-xs font-semibold uppercase tracking-widest px-3 py-2 transition-colors rounded-lg">
            Log Purchase
          </Link>
          <Link href="/listings/new"
            className="inline-flex items-center gap-2 bg-[#f97316] hover:bg-[#ea6c0a] text-white text-xs font-semibold uppercase tracking-widest px-3 py-2 transition-colors rounded-lg">
            + New Listing
          </Link>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex rounded-lg overflow-hidden border border-[var(--border)]">
          {statuses.map((s) => (
            <Link key={s.value}
              href={`/inventory?status=${s.value}${params.q ? `&q=${params.q}` : ''}`}
              className={`px-3 py-1.5 text-xs uppercase tracking-widest border-r last:border-r-0 transition-colors border-[var(--border)] ${
                activeStatus === s.value ? 'bg-[var(--bg-elevated)] text-[var(--text)]' : 'text-[var(--text-muted)] hover:text-[var(--text-2)]'
              }`}>
              {s.label}
            </Link>
          ))}
        </div>

        <form method="get" action="/inventory" className="flex w-full sm:w-auto rounded-lg overflow-hidden border border-[var(--border)]">
          <input type="hidden" name="status" value={activeStatus} />
          <input name="q" defaultValue={params.q ?? ''} placeholder="Search SKU, brand..."
            className="bg-[var(--bg-card)] px-3 py-1.5 text-sm text-[var(--text)] placeholder-[var(--text-subtle)] flex-1 sm:w-56 focus:outline-none" />
          <button type="submit"
            className="bg-[var(--bg-elevated)] border-l border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text)] uppercase tracking-widest transition-colors">
            Go
          </button>
        </form>
      </div>

      {items.length === 0 ? (
        <div className="border border-[var(--border)] rounded-2xl py-16 text-center">
          <p className="text-[var(--text-subtle)] text-sm">No items found</p>
          <Link href="/purchases/new" className="text-[#f97316] text-sm mt-2 inline-block hover:text-[#ea6c0a]">
            Log a purchase to get started →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {items.map((item: any, idx: number) => {
            const colors = ['bg-orange-50 dark:bg-orange-950/20', 'bg-purple-50 dark:bg-purple-950/20', 'bg-emerald-50 dark:bg-emerald-950/20', 'bg-blue-50 dark:bg-blue-950/20', 'bg-rose-50 dark:bg-rose-950/20', 'bg-violet-50 dark:bg-violet-950/20']
            return (
              <Link key={item.id} href={`/inventory/${item.id}`}
                className={`${colors[idx % colors.length]} border border-[var(--border)] hover:border-[var(--border-strong)] hover:shadow-md transition-all rounded-2xl overflow-hidden group`}>
                <div className="aspect-square bg-black/5 overflow-hidden relative">
                  {item.photos?.length > 0 ? (
                    <Image src={item.photos[0]} alt={item.description ?? item.sku} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-[var(--text-subtle)] text-xs font-mono">NO PHOTO</span>
                    </div>
                  )}
                  <div className="absolute top-2 left-2">
                    <Badge status={item.status}>{item.status.replace('_', ' ')}</Badge>
                  </div>
                </div>
                <div className="p-3 space-y-2">
                  <div className="font-mono text-xs text-[var(--text-muted)]">{item.sku}</div>
                  <div className="text-sm text-[var(--text)] leading-tight">
                    {item.brand && <span className="font-medium">{item.brand} </span>}{item.description}
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">
                    {item.size && <span>{item.size}</span>}
                    {item.condition && <span className="ml-1 text-[var(--text-subtle)]">· {item.condition}</span>}
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-[var(--border)]">
                    <span className="font-mono text-xs text-[var(--text-muted)]">Cost</span>
                    <span className="font-mono text-sm text-[var(--text)]">{formatCurrency(item.cost_price)}</span>
                  </div>
                  {item.storage_location && (
                    <div className="font-mono text-xs text-[var(--text-subtle)] bg-[var(--bg-elevated)] px-2 py-1 truncate">
                      {item.storage_location}
                    </div>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
