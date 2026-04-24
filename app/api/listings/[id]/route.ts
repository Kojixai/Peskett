import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()

  const { data, error } = await supabase
    .from('listings')
    .update(body)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: listing } = await supabase
    .from('listings')
    .select('sku_id')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('listings')
    .update({ status: 'deleted' })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Revert inventory status if listing is removed
  if (listing?.sku_id) {
    const { data: otherListings } = await supabase
      .from('listings')
      .select('id')
      .eq('sku_id', listing.sku_id)
      .in('status', ['live', 'scheduled'])

    if (!otherListings || otherListings.length === 0) {
      await supabase
        .from('inventory_items')
        .update({ status: 'in_stock' })
        .eq('id', listing.sku_id)
    }
  }

  return NextResponse.json({ success: true })
}
