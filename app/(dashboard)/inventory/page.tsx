import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'
import Image from 'next/image'
import { demoInventory } from '@/lib/demo-data'

export const dynamic = 'force-dynamic'

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; category?: string }>
}) {
  const params = await searchParams
  const isDemo = process.env.DEMO_MODE === 'true' || !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('supabase.co') || process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')

  let items: any[] = []

  if (isDemo) {
    items = demoInventory.filter((i) => {
      if (params.status && params.status !== 'all' && i.status !== params.status) return false
      if (params.q) {
        const q = params.q.toLowerCase()
        if (!i.brand?.toLowerCase().includes(q) && !i.description?.toLowerCase().includes(q) && !i.sku.includes(q)) return false
      }
      return true
    })
  } else {
    const supabase = await createClient()
    let query = supabase
      .from('inventory_items')
      .select('*')
      .order('created_at', { ascending: false })

    if (params.status && params.status !== 'all') {
      query = query.eq('status', params.status)
    }
    if (params.q) {
      query = query.or(`brand.ilike.%${params.q}%,description.ilike.%${params.q}%,sku.ilike.%${params.q}%`)
    }
    if (params.category) {
      query = query.ilike('category', `%${params.category}%`)
    }

    const { data } = await query
    items = data ?? []
  }

  const statuses = [
    { value: 'all', label: 'All' },
    { value: 'in_stock', label: 'In Stock' },
    { value: 'listed', label: 'Listed' },
    { value: 'sold', label: 'Sold' },
  ]

  const activeStatus = params.status ?? 'all'

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100 uppercase tracking-widest">Inventory</h1>
          <p className="text-xs text-zinc-500 mt-0.5">{items?.length ?? 0} items</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/purchases/new"
            className="hidden sm:inline-flex items-center gap-2 bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-zinc-300 text-xs font-semibold uppercase tracking-widest px-3 py-2 transition-colors"
          >
            Log Purchase
          </Link>
          <Link
            href="/listings/new"
            className="inline-flex items-center gap-2 bg-[#f97316] hover:bg-[#ea6c0a] text-white text-xs font-semibold uppercase tracking-widest px-3 py-2 transition-colors"
          >
            + New Listing
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Status filter */}
        <div className="flex">
          {statuses.map((s) => (
            <Link
              key={s.value}
              href={`/inventory?status=${s.value}${params.q ? `&q=${params.q}` : ''}`}
              className={`px-3 py-1.5 text-xs uppercase tracking-widest border-r last:border-r-0 transition-colors ${
                activeStatus === s.value
                  ? 'bg-[#18181b] text-zinc-100 border-[#27272a]'
                  : 'bg-transparent text-zinc-500 hover:text-zinc-300 border-[#27272a]'
              } border border-[#27272a]`}
            >
              {s.label}
            </Link>
          ))}
        </div>

        {/* Search */}
        <form method="get" action="/inventory" className="flex w-full sm:w-auto">
          <input
            type="hidden" name="status" value={activeStatus}
          />
          <input
            name="q"
            defaultValue={params.q ?? ''}
            placeholder="Search SKU, brand..."
            className="bg-[#111113] border border-[#27272a] px-3 py-1.5 text-sm text-zinc-100 placeholder-zinc-600 flex-1 sm:w-56 focus:outline-none focus:border-[#f97316] transition-colors"
          />
          <button
            type="submit"
            className="bg-[#18181b] border border-l-0 border-[#27272a] px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 uppercase tracking-widest transition-colors"
          >
            Go
          </button>
        </form>
      </div>

      {/* Inventory grid */}
      {!items || items.length === 0 ? (
        <div className="border border-[#27272a] py-16 text-center">
          <p className="text-zinc-600 text-sm">No items found</p>
          <Link href="/purchases/new" className="text-[#f97316] text-sm mt-2 inline-block hover:text-[#ea6c0a]">
            Log a purchase to get started →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/inventory/${item.id}`}
              className="bg-[#111113] border border-[#27272a] hover:border-[#3f3f46] transition-colors group"
            >
              {/* Photo */}
              <div className="aspect-square bg-[#18181b] overflow-hidden relative">
                {item.photos && item.photos.length > 0 ? (
                  <Image
                    src={item.photos[0]}
                    alt={item.description ?? item.sku}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-zinc-700 text-xs font-mono">NO PHOTO</span>
                  </div>
                )}
                <div className="absolute top-2 left-2">
                  <Badge status={item.status}>{item.status.replace('_', ' ')}</Badge>
                </div>
              </div>

              {/* Info */}
              <div className="p-3 space-y-2">
                <div className="font-mono text-xs text-zinc-500">{item.sku}</div>
                <div className="text-sm text-zinc-200 leading-tight">
                  {item.brand && <span className="font-medium">{item.brand} </span>}
                  {item.description}
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-zinc-500">
                    {item.size && <span>{item.size}</span>}
                    {item.condition && (
                      <span className="ml-1 text-zinc-600">· {item.condition}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-[#1e1e22]">
                  <span className="font-mono text-xs text-zinc-500">Cost</span>
                  <span className="font-mono text-sm text-zinc-200">
                    {formatCurrency(item.cost_price)}
                  </span>
                </div>
                {item.storage_location && (
                  <div className="font-mono text-xs text-zinc-600 bg-[#18181b] px-2 py-1 truncate">
                    📦 {item.storage_location}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
