const VINTED_BASE_URL = process.env.VINTED_PRO_BASE_URL ?? 'https://www.vinted.co.uk/api/v5'
const ACCESS_KEY = process.env.VINTED_PRO_ACCESS_KEY ?? ''

async function vintedRequest(path: string, options: RequestInit = {}) {
  const res = await fetch(`${VINTED_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${ACCESS_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Vinted API error ${res.status}: ${body}`)
  }

  return res.json()
}

export interface VintedCreateItemPayload {
  title: string
  description: string
  price: number
  category_id: number
  brand_id?: number
  size_id?: number
  condition: string
  colour_ids?: number[]
  photo_ids?: string[]
}

export async function createVintedListing(payload: VintedCreateItemPayload) {
  return vintedRequest('/items', {
    method: 'POST',
    body: JSON.stringify({ item: payload }),
  })
}

export async function getVintedOrders(page = 1, perPage = 50) {
  return vintedRequest(`/orders?page=${page}&per_page=${perPage}`)
}

export async function getVintedOrder(orderId: string) {
  return vintedRequest(`/orders/${orderId}`)
}

export async function getVintedOntologies() {
  return vintedRequest('/ontologies')
}

export async function acceptVintedOffer(offerId: string) {
  return vintedRequest(`/offers/${offerId}/accept`, { method: 'POST' })
}

export async function counterVintedOffer(offerId: string, price: number) {
  return vintedRequest(`/offers/${offerId}/counter`, {
    method: 'POST',
    body: JSON.stringify({ price }),
  })
}

export async function rejectVintedOffer(offerId: string) {
  return vintedRequest(`/offers/${offerId}/reject`, { method: 'POST' })
}
