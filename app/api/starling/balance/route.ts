import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAccountBalance } from '@/lib/starling'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const balance = await getAccountBalance()

  if (balance) {
    // Snapshot to DB
    await supabase.from('bank_snapshots').insert({
      source: 'starling',
      balance: balance.balance,
      currency: balance.currency,
    })
  }

  return NextResponse.json(balance ?? { balance: null, currency: 'GBP' })
}
