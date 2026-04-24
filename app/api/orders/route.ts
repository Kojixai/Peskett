import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getVintedOrders } from '@/lib/vinted'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const sync = searchParams.get('sync') === 'true'

  if (sync) {
    // Pull latest orders from Vinted and upsert
    try {
      const vintedData = await getVintedOrders()
      const orders = vintedData.orders ?? []

      for (const order of orders) {
        // Find matching listing by vinted_item_id
        const { data: listing } = await supabase
          .from('listings')
          .select('id, sku_id, list_price')
          .eq('vinted_item_id', String(order.item_id))
          .single()

        if (!listing) continue

        // Get cost price for profit calculation
        const { data: item } = await supabase
          .from('inventory_items')
          .select('cost_price')
          .eq('id', listing.sku_id)
          .single()

        const costPrice = item?.cost_price ?? 0
        const salePrice = parseFloat(order.total_item_price ?? 0)
        const platformFee = parseFloat(order.service_fee ?? 0)
        const shippingCost = parseFloat(order.shipment_price ?? 0)
        const netRevenue = salePrice - platformFee - shippingCost
        const profit = netRevenue - costPrice
        const marginPercent = salePrice > 0 ? (profit / salePrice) * 100 : 0

        await supabase.from('orders').upsert({
          vinted_order_id: String(order.id),
          listing_id: listing.id,
          sku_id: listing.sku_id,
          sale_price: salePrice,
          platform_fee: platformFee,
          shipping_cost: shippingCost,
          profit,
          margin_percent: marginPercent,
          sold_at: order.created_at ?? new Date().toISOString(),
          shipment_label_url: order.shipment?.tracking_url ?? null,
        }, { onConflict: 'vinted_order_id' })

        // Mark item as sold
        await supabase
          .from('inventory_items')
          .update({ status: 'sold' })
          .eq('id', listing.sku_id)

        await supabase
          .from('listings')
          .update({ status: 'sold' })
          .eq('id', listing.id)
      }
    } catch (e) {
      // Sync failure is non-fatal — return cached orders
    }
  }

  const { data, error } = await supabase
    .from('orders')
    .select('*, inventory_items(sku, brand, description), listings(list_price, platform)')
    .order('sold_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { vinted_order_id, listing_id, sku_id, sale_price, platform_fee, shipping_cost, sold_at, shipment_label_url } = body

  // Get cost price for profit
  const { data: item } = await supabase
    .from('inventory_items')
    .select('cost_price')
    .eq('id', sku_id)
    .single()

  const costPrice = item?.cost_price ?? 0
  const fee = platform_fee ?? 0
  const shipping = shipping_cost ?? 0
  const netRevenue = sale_price - fee - shipping
  const profit = netRevenue - costPrice
  const marginPercent = sale_price > 0 ? (profit / sale_price) * 100 : 0

  const { data, error } = await supabase
    .from('orders')
    .insert({
      vinted_order_id,
      listing_id,
      sku_id,
      sale_price,
      platform_fee: fee,
      shipping_cost: shipping,
      profit,
      margin_percent: marginPercent,
      sold_at: sold_at ?? new Date().toISOString(),
      shipment_label_url,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Update item and listing status
  if (sku_id) {
    await supabase.from('inventory_items').update({ status: 'sold' }).eq('id', sku_id)
  }
  if (listing_id) {
    await supabase.from('listings').update({ status: 'sold' }).eq('id', listing_id)
  }

  return NextResponse.json(data, { status: 201 })
}
