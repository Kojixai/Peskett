import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createVintedItems } from '@/lib/vinted'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('listings')
    .select('*, inventory_items(sku, brand, description)')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { sku_id, list_price, ai_description, platform, publish_mode, scheduled_at, item_details, photo_urls } = body

  if (!list_price) {
    return NextResponse.json({ error: 'list_price is required' }, { status: 400 })
  }

  let status: string
  let listed_at: string | null = null
  let vinted_item_id: string | null = null

  if (publish_mode === 'now') {
    // Attempt to publish to Vinted
    try {
      const result = await createVintedItems([{
        title: `${item_details?.brand ?? ''} ${item_details?.description ?? ''}`.trim(),
        description: ai_description ?? '',
        price: Math.round(list_price * 100),
        currency_code: 'GBP',
        category_id: 0, // Would map from item_details.category to Vinted ontology
        condition: item_details?.condition ?? 'good',
        reference: sku_id ? String(sku_id) : undefined,
      }])
      vinted_item_id = result?.items?.[0]?.id ?? null
      status = 'live'
      listed_at = new Date().toISOString()
    } catch {
      // If Vinted API fails, save as draft
      status = 'draft'
    }
  } else if (publish_mode === 'schedule') {
    status = 'scheduled'
  } else {
    status = 'draft'
  }

  const { data: listing, error } = await supabase
    .from('listings')
    .insert({
      sku_id: sku_id ?? null,
      vinted_item_id,
      platform: platform ?? 'vinted',
      list_price,
      ai_description,
      listed_at,
      scheduled_at: scheduled_at ?? null,
      status,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Update inventory item status if SKU provided
  if (sku_id && status === 'live') {
    await supabase
      .from('inventory_items')
      .update({ status: 'listed' })
      .eq('id', sku_id)
  }

  // Update photos on inventory item if provided
  if (sku_id && photo_urls && photo_urls.length > 0) {
    await supabase
      .from('inventory_items')
      .update({ photos: photo_urls })
      .eq('id', sku_id)
  }

  return NextResponse.json(listing, { status: 201 })
}
