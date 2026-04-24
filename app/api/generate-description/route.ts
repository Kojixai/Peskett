import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateListingDescription } from '@/lib/claude'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { brand, category, size, condition, colour, pitToPit, length, imageUrls } = body

  if (!brand || !category) {
    return NextResponse.json({ error: 'brand and category are required' }, { status: 400 })
  }

  try {
    const description = await generateListingDescription({
      brand,
      category,
      size: size ?? '',
      condition: condition ?? 'good',
      colour: colour ?? '',
      pitToPit,
      length,
      imageUrls,
    })

    return NextResponse.json({ description })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
