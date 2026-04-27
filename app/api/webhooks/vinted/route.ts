import { NextRequest, NextResponse } from 'next/server'
import { verifyVintedWebhook } from '@/lib/vinted'
import { getConfig } from '@/lib/config'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/webhooks/vinted
 * Receives Vinted Pro Integrations (VPI) webhook events.
 * Register this URL in the Vinted Pro portal.
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const sigHeader = req.headers.get('x-vpi-webhook-hmac-sha256') ?? ''

  const webhookSigningKey = await getConfig('VINTED_WEBHOOK_SIGNING_KEY')
  if (webhookSigningKey && !verifyVintedWebhook(webhookSigningKey, rawBody, sigHeader)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let event: any
  try { event = JSON.parse(rawBody) } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const supabase = await createClient()
  const eventType: string = event.event_type ?? event.type ?? ''

  switch (eventType) {
    case 'ORDER_CREATED': {
      const order = event.order ?? event.data
      if (!order) break

      const { data: listing } = await supabase
        .from('listings')
        .select('id, sku_id, list_price')
        .eq('vinted_item_id', String(order.item_id ?? order.items?.[0]?.id))
        .single()

      const salePrice    = (order.total_price ?? order.price ?? 0) / 100
      const platformFee  = (order.service_fee ?? 0) / 100
      const shippingCost = (order.shipping_cost ?? 0) / 100
      const netRevenue   = salePrice - platformFee - shippingCost

      let costPrice = 0
      if (listing?.sku_id) {
        const { data: item } = await supabase.from('inventory_items').select('cost_price').eq('id', listing.sku_id).single()
        costPrice = item?.cost_price ?? 0
      }

      const profit        = netRevenue - costPrice
      const marginPercent = salePrice > 0 ? (profit / salePrice) * 100 : 0

      await supabase.from('orders').upsert({
        vinted_order_id: String(order.id),
        listing_id:      listing?.id ?? null,
        sku_id:          listing?.sku_id ?? null,
        sale_price:      salePrice,
        platform_fee:    platformFee,
        shipping_cost:   shippingCost,
        net_revenue:     netRevenue,
        profit,
        margin_percent:  marginPercent,
        sold_at:         order.created_at ?? new Date().toISOString(),
      }, { onConflict: 'vinted_order_id' })

      if (listing?.sku_id) {
        await supabase.from('inventory_items').update({ status: 'sold' }).eq('id', listing.sku_id)
      }
      break
    }

    case 'ITEM_SOLD': {
      const id = String(event.item_id ?? event.data?.id)
      if (id) await supabase.from('listings').update({ status: 'sold' }).eq('vinted_item_id', id)
      break
    }

    case 'ITEM_DELETED': {
      const id = String(event.item_id ?? event.data?.id)
      if (id) await supabase.from('listings').update({ status: 'deleted' }).eq('vinted_item_id', id)
      break
    }
  }

  return NextResponse.json({ received: true })
}
