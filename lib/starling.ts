const STARLING_BASE_URL = process.env.STARLING_BASE_URL ?? 'https://api.starlingbank.com'
const ACCESS_TOKEN = process.env.STARLING_ACCESS_TOKEN ?? ''

async function starlingRequest(path: string) {
  const res = await fetch(`${STARLING_BASE_URL}${path}`, {
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    next: { revalidate: 1800 }, // 30 min cache
  })

  if (!res.ok) {
    throw new Error(`Starling API error ${res.status}`)
  }

  return res.json()
}

export interface StarlingBalance {
  clearedBalance: { minorUnits: number; currency: string }
  effectiveBalance: { minorUnits: number; currency: string }
  pendingTransactions: { minorUnits: number; currency: string }
  acceptedOverdraft: { minorUnits: number; currency: string }
  availableToSpend: { minorUnits: number; currency: string }
}

export async function getAccountBalance(): Promise<{ balance: number; currency: string } | null> {
  try {
    // Get accounts first
    const accounts = await starlingRequest('/api/v2/accounts')
    const account = accounts.accounts?.[0]
    if (!account) return null

    const data: StarlingBalance = await starlingRequest(
      `/api/v2/accounts/${account.accountUid}/balance`
    )

    return {
      balance: data.clearedBalance.minorUnits / 100,
      currency: data.clearedBalance.currency,
    }
  } catch {
    return null
  }
}

export async function getRecentTransactions(accountUid: string, since: string) {
  return starlingRequest(
    `/api/v2/feed/account/${accountUid}/settled-transactions-between?minTransactionTimestamp=${since}&maxTransactionTimestamp=${new Date().toISOString()}`
  )
}
