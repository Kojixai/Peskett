import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'
import Link from 'next/link'
import Image from 'next/image'

export const dynamic = 'force-dynamic'

export default async function InventoryItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: item }, { data: listings }, { data: orders }] = await Promise.all([
    supabase.from('inventory_items').select('*').eq('id', id).single(),
    supabase.from('listings').select('*').eq('sku_id', id).order('created_at', { ascending: false }),
    supabase.from('orders').select('*').eq('sku_id', id).order('sold_at', { ascending: false }),
  ])

  if (!item) notFound()

  const activeListings = listings?.filter((l) => ['live', 'scheduled', 'draft'].includes(l.status)) ?? []

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <Link href="/inventory" className="hover:text-zinc-300">Inventory</Link>
        <span>/</span>
        <span className="font-mono text-zinc-400">{item.sku}</span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Photos */}
        <div className="xl:col-span-1 space-y-3">
          {item.photos && item.photos.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {item.photos.map((url: string, i: number) => (
                <div key={i} className={`aspect-square bg-[#18181b] relative overflow-hidden ${i === 0 ? 'col-span-2' : ''}`}>
                  <Image src={url} alt={`Photo ${i + 1}`} fill className="object-cover" />
                </div>
              ))}
            </div>
          ) : (
            <div className="aspect-square bg-[#111113] border border-[#27272a] flex items-center justify-center">
              <span className="text-zinc-700 font-mono text-sm">NO PHOTOS</span>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="xl:col-span-2 space-y-5">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <div className="font-mono text-sm text-zinc-500 mb-1">{item.sku}</div>
              <h1 className="text-xl font-semibold text-zinc-100">
                {item.brand && <span>{item.brand} — </span>}
                {item.description ?? 'Unnamed item'}
              </h1>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge status={item.status}>{item.status.replace('_', ' ')}</Badge>
              <Link
                href={`/listings/new?sku=${item.id}`}
                className="inline-flex items-center gap-1 bg-[#f97316] hover:bg-[#ea6c0a] text-white text-xs font-semibold uppercase tracking-widest px-3 py-1.5 transition-colors"
              >
                List Item
              </Link>
            </div>
          </div>

          {/* Spec grid */}
          <div className="bg-[#111113] border border-[#27272a]">
            <div className="px-4 py-2.5 border-b border-[#27272a] text-xs text-zinc-500 uppercase tracking-widest">
              Item Details
            </div>
            <div className="grid grid-cols-2 divide-y divide-[#1e1e22]">
              {[
                ['Category', item.category],
                ['Size', item.size],
                ['Condition', item.condition],
                ['Colour', item.colour],
                ['Pit to Pit', item.pit_to_pit ? `${item.pit_to_pit}cm` : null],
                ['Length', item.length ? `${item.length}cm` : null],
                ['Storage', item.storage_location],
                ['Cost Price', formatCurrency(item.cost_price)],
                ['Added', formatDate(item.created_at)],
              ]
                .filter(([, v]) => v)
                .map(([label, value]) => (
                  <div key={label as string} className="px-4 py-2.5 flex items-center justify-between border-r border-[#1e1e22] odd:border-r even:border-r-0">
                    <span className="text-xs text-zinc-500">{label}</span>
                    <span className="font-mono text-xs text-zinc-200">{value}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Listings */}
          {activeListings.length > 0 && (
            <div className="bg-[#111113] border border-[#27272a]">
              <div className="px-4 py-2.5 border-b border-[#27272a] text-xs text-zinc-500 uppercase tracking-widest">
                Active Listings
              </div>
              <div className="divide-y divide-[#1e1e22]">
                {activeListings.map((listing) => (
                  <div key={listing.id} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <div className="text-sm text-zinc-200 capitalize">{listing.platform}</div>
                      {listing.listed_at && (
                        <div className="text-xs text-zinc-500 mt-0.5">Listed {formatDate(listing.listed_at)}</div>
                      )}
                      {listing.scheduled_at && listing.status === 'scheduled' && (
                        <div className="text-xs text-zinc-500 mt-0.5">Scheduled {formatDateTime(listing.scheduled_at)}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm text-zinc-100">{formatCurrency(listing.list_price)}</span>
                      <Badge status={listing.status}>{listing.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sales history */}
          {orders && orders.length > 0 && (
            <div className="bg-[#111113] border border-[#27272a]">
              <div className="px-4 py-2.5 border-b border-[#27272a] text-xs text-zinc-500 uppercase tracking-widest">
                Sale History
              </div>
              {orders.map((order) => (
                <div key={order.id} className="px-4 py-3 space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <div className="text-xs text-zinc-500">Sale price</div>
                      <div className="font-mono text-sm text-zinc-100">{formatCurrency(order.sale_price)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-zinc-500">Net revenue</div>
                      <div className="font-mono text-sm text-zinc-200">{formatCurrency(order.net_revenue)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-zinc-500">Profit</div>
                      <div className={`font-mono text-sm ${order.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {order.profit >= 0 ? '+' : ''}{formatCurrency(order.profit)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-zinc-500">Margin</div>
                      <div className="font-mono text-sm text-zinc-200">{order.margin_percent?.toFixed(1)}%</div>
                    </div>
                  </div>
                  <div className="text-xs text-zinc-600">{formatDateTime(order.sold_at)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
