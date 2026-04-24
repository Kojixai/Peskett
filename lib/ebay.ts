const EBAY_BASE_URL = process.env.EBAY_BASE_URL ?? 'https://api.ebay.com'

async function getEbayToken(): Promise<string> {
  // Use existing OAuth token if available
  if (process.env.EBAY_OAUTH_TOKEN) {
    return process.env.EBAY_OAUTH_TOKEN
  }

  // Otherwise, use client credentials flow
  const credentials = Buffer.from(
    `${process.env.EBAY_CLIENT_ID}:${process.env.EBAY_CLIENT_SECRET}`
  ).toString('base64')

  const res = await fetch(`${EBAY_BASE_URL}/identity/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope',
  })

  if (!res.ok) throw new Error('Failed to get eBay token')
  const data = await res.json()
  return data.access_token
}

export interface EbayOrderLine {
  lineItemId: string
  title: string
  quantity: number
  lineItemCost: { value: string; currency: string }
  image: { imageUrl: string }
}

export interface EbayOrder {
  orderId: string
  creationDate: string
  lineItems: EbayOrderLine[]
  pricingSummary: {
    priceSubtotal: { value: string; currency: string }
    deliveryCost: { value: string; currency: string }
    total: { value: string; currency: string }
  }
}

export async function getEbayOrder(purchaseOrderId: string): Promise<EbayOrder | null> {
  try {
    const token = await getEbayToken()
    const res = await fetch(
      `${EBAY_BASE_URL}/buy/order/v2/purchase_order/${purchaseOrderId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}
