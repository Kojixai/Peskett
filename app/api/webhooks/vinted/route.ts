import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { createHmac, timingSafeEqual } from 'crypto'

function verifySignature(body: string, signature: string): boolean {
  const secret = process.env.VINTED_PRO_HMAC_SECRET
  if (!secret) return false
  const expected = createHmac('sha256', secret).update(body).digest('hex')
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  } catch {
    return false
  }
}

export async function POST(request: Request) {
  const rawBody = await request.text()
  const signature = request.headers.get('x-vinted-signature') ?? ''

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const event = JSON.parse(rawBody)
  const supabase = await createServiceClient()

  // Handle order events
  if (event.type === 'order.created' || event.type === 'order.paid') {
    const order = event.data
    const vintedOrderId = String(order.id)

    // Find the listing
    const { data: listing } = await supabase
      .from('listings')
      .select('id, sku_id, list_price')
      .eq('vinted_item_id', String(order.item_id))
      .single()

    if (listing) {
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
        vinted_order_id: vintedOrderId,
        listing_id: listing.id,
        sku_id: listing.sku_id,
        sale_price: salePrice,
        platform_fee: platformFee,
        shipping_cost: shippingCost,
        profit,
        margin_percent: marginPercent,
        sold_at: order.created_at ?? new Date().toISOString(),
        shipment_label_url: order.shipment?.label_url ?? null,
      }, { onConflict: 'vinted_order_id' })

      await supabase.from('inventory_items').update({ status: 'sold' }).eq('id', listing.sku_id)
      await supabase.from('listings').update({ status: 'sold' }).eq('id', listing.id)
    }
  }

  return NextResponse.json({ received: true })
}
