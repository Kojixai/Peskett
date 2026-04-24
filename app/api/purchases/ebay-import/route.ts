import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getEbayOrder } from '@/lib/ebay'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const orderId = searchParams.get('orderId')

  if (!orderId) return NextResponse.json({ error: 'orderId required' }, { status: 400 })

  const order = await getEbayOrder(orderId)
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  return NextResponse.json({
    totalCost: parseFloat(order.pricingSummary.total.value),
    itemCount: order.lineItems.reduce((s, i) => s + i.quantity, 0),
    items: order.lineItems.map((item) => ({
      title: item.title,
      price: parseFloat(item.lineItemCost.value),
      image: item.image?.imageUrl,
    })),
  })
}
