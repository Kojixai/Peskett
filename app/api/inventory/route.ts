import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'

function generateSKU(date: Date, seq: number): string {
  const dateStr = format(date, 'yyyyMMdd')
  return `TH-${dateStr}-${String(seq).padStart(4, '0')}`
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const q = searchParams.get('q')

  let query = supabase
    .from('inventory_items')
    .select('*')
    .order('created_at', { ascending: false })

  if (status && status !== 'all') query = query.eq('status', status)
  if (q) query = query.or(`brand.ilike.%${q}%,description.ilike.%${q}%,sku.ilike.%${q}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { purchase_id, cost_price, items } = body

  if (!items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'items array is required' }, { status: 400 })
  }

  // Get current SKU count for today to generate sequential SKUs
  const today = new Date()
  const dateStr = format(today, 'yyyyMMdd')
  const { count } = await supabase
    .from('inventory_items')
    .select('*', { count: 'exact', head: true })
    .like('sku', `TH-${dateStr}-%`)

  const startSeq = (count ?? 0) + 1

  const records = items.map((item: any, i: number) => ({
    sku: generateSKU(today, startSeq + i),
    purchase_id: purchase_id ?? null,
    cost_price: cost_price ?? 0,
    description: item.description || null,
    brand: item.brand || null,
    category: item.category || null,
    size: item.size || null,
    condition: item.condition || null,
    colour: item.colour || null,
    pit_to_pit: item.pit_to_pit ?? null,
    length: item.length ?? null,
    storage_location: item.storage_location || null,
    photos: item.photos ?? [],
    status: 'in_stock',
  }))

  const { data, error } = await supabase
    .from('inventory_items')
    .insert(records)
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
