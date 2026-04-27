import { getConfig } from './config'

const BASE_URL = process.env.STARLING_BASE_URL ?? 'https://api.starlingbank.com'

async function starlingRequest(path: string, token: string) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    next: { revalidate: 1800 },
  })
  if (!res.ok) throw new Error(`Starling API ${res.status}`)
  return res.json()
}

export async function getAccountBalance(): Promise<{ balance: number; currency: string } | null> {
  try {
    const token = await getConfig('STARLING_ACCESS_TOKEN')
    if (!token) return null
    const accounts = await starlingRequest('/api/v2/accounts', token)
    const account = accounts.accounts?.[0]
    if (!account) return null
    const data = await starlingRequest(`/api/v2/accounts/${account.accountUid}/balance`, token)
    return { balance: data.clearedBalance.minorUnits / 100, currency: data.clearedBalance.currency }
  } catch {
    return null
  }
}
