import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return !!(url && key && !url.includes('placeholder') && key.length > 50)
}

export default async function ListingsPage() {
  const isDemo = process.env.DEMO_MODE === 'true' || !isSupabaseConfigured()
  let listings: any[] = []

  if (!isDemo) {
    const supabase = await createClient()
    const { data } = await supabase
      .from('listings')
      .select('*, inventory_items(sku, brand, description, photos)')
      .order('created_at', { ascending: false })
    listings = data ?? []
  }

  const grouped = {
    live: listings?.filter((l) => l.status === 'live') ?? [],
    scheduled: listings?.filter((l) => l.status === 'scheduled') ?? [],
    draft: listings?.filter((l) => l.status === 'draft') ?? [],
    sold: listings?.filter((l) => l.status === 'sold') ?? [],
  }

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100 uppercase tracking-widest">Listings</h1>
          <p className="text-xs text-zinc-500 mt-0.5">{listings?.length ?? 0} total</p>
        </div>
        <Link
          href="/listings/new"
          className="inline-flex items-center gap-2 bg-[#f97316] hover:bg-[#ea6c0a] text-white text-xs font-semibold uppercase tracking-widest px-4 py-2 transition-colors"
        >
          + New Listing
        </Link>
      </div>

      {/* Status sections */}
      {Object.entries(grouped).map(([status, items]) =>
        items.length > 0 ? (
          <div key={status} className="bg-[#111113] border border-[#27272a]">
            <div className="px-4 py-2.5 border-b border-[#27272a] flex items-center gap-3">
              <span className="text-xs text-zinc-500 uppercase tracking-widest">{status}</span>
              <Badge status={status}>{items.length}</Badge>
            </div>

            {/* Mobile card view */}
            <div className="divide-y divide-[#1e1e22] md:hidden">
              {items.map((listing: any) => {
                const item = listing.inventory_items
                return (
                  <div key={listing.id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-mono text-xs text-zinc-500">{item?.sku ?? '—'}</div>
                        <div className="text-sm text-zinc-200 truncate mt-0.5">
                          {item?.brand && <span className="font-medium">{item.brand} </span>}
                          {item?.description}
                        </div>
                      </div>
                      <div className="font-mono text-sm text-zinc-100 flex-shrink-0">
                        {formatCurrency(listing.list_price)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="muted">{listing.platform}</Badge>
                      <span className="text-xs text-zinc-600">
                        {listing.scheduled_at
                          ? formatDateTime(listing.scheduled_at)
                          : listing.listed_at
                          ? formatDateTime(listing.listed_at)
                          : '—'}
                      </span>
                    </div>
                    <Link
                      href={`/inventory/${listing.sku_id}`}
                      className="text-xs text-zinc-500 hover:text-zinc-300"
                    >
                      View item →
                    </Link>
                  </div>
                )
              })}
            </div>

            {/* Desktop table view */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1e1e22]">
                    {['SKU', 'Item', 'Platform', 'List Price', status === 'scheduled' ? 'Scheduled' : 'Listed', 'Actions'].map((h) => (
                      <th key={h} className="px-4 py-2 text-left text-xs text-zinc-600 uppercase tracking-widest font-normal">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e1e22]">
                  {items.map((listing: any) => {
                    const item = listing.inventory_items
                    return (
                      <tr key={listing.id} className="hover:bg-[#18181b] transition-colors">
                        <td className="px-4 py-2.5 font-mono text-xs text-zinc-400">{item?.sku ?? '—'}</td>
                        <td className="px-4 py-2.5 text-sm text-zinc-300">
                          {item?.brand && <span className="font-medium">{item.brand} </span>}
                          {item?.description}
                        </td>
                        <td className="px-4 py-2.5">
                          <Badge variant="muted">{listing.platform}</Badge>
                        </td>
                        <td className="px-4 py-2.5 font-mono text-sm text-zinc-100">{formatCurrency(listing.list_price)}</td>
                        <td className="px-4 py-2.5 font-mono text-xs text-zinc-500">
                          {listing.scheduled_at
                            ? formatDateTime(listing.scheduled_at)
                            : listing.listed_at
                            ? formatDateTime(listing.listed_at)
                            : '—'}
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-3">
                            <Link
                              href={`/inventory/${listing.sku_id}`}
                              className="text-xs text-zinc-500 hover:text-zinc-300"
                            >
                              View item
                            </Link>
                            {listing.vinted_item_id && (
                              <span className="font-mono text-xs text-zinc-600">
                                #{listing.vinted_item_id}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : null
      )}

      {(!listings || listings.length === 0) && (
        <div className="border border-[#27272a] py-16 text-center">
          <p className="text-zinc-600 text-sm">No listings yet</p>
          <Link href="/listings/new" className="text-[#f97316] text-sm mt-2 inline-block hover:text-[#ea6c0a]">
            Create your first listing →
          </Link>
        </div>
      )}
    </div>
  )
}
