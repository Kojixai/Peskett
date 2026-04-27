/**
 * Vinted Pro Integrations (VPI) API client.
 *
 * Official docs:  https://pro-docs.svc.vinted.com/
 * Portal:         https://pro-portal.svc.vinted.com/
 * Sandbox portal: https://pro-portal-sandbox.svc.vinted.com/
 *
 * Auth: HMAC-SHA256 request signing.
 * Each request must include:
 *   X-Vpi-Access-Key: <access_key>
 *   X-Vpi-Hmac-Sha256: t=<unix_seconds>,v1=<hex_digest>
 *
 * Signature payload = timestamp + METHOD + path_with_query + access_key + body
 */

import crypto from 'crypto'
import { getConfig } from './config'

const VPI_BASE = 'https://pro.svc.vinted.com'
const VPI_SANDBOX = 'https://pro-public-sandbox.svc.vinted.com'

function buildSignature(
  signingKey: string,
  accessKey: string,
  method: string,
  path: string,
  body: string,
  timestampSecs: number
): string {
  const payload = `${timestampSecs}${method.toUpperCase()}${path}${accessKey}${body}`
  return crypto.createHmac('sha256', signingKey).update(payload).digest('hex')
}

async function vpiRequest(path: string, options: RequestInit = {}): Promise<any> {
  const accessKey = await getConfig('VINTED_ACCESS_KEY')
  const signingKey = await getConfig('VINTED_SIGNING_KEY')
  const sandbox = await getConfig('VINTED_SANDBOX')

  if (!accessKey || !signingKey) {
    throw new Error('Vinted VPI not configured — add VINTED_ACCESS_KEY and VINTED_SIGNING_KEY in Settings')
  }

  const base = sandbox === 'true' ? VPI_SANDBOX : VPI_BASE
  const method = (options.method ?? 'GET').toUpperCase()
  const body = options.body ? String(options.body) : ''
  const timestampSecs = Math.floor(Date.now() / 1000)
  const sig = buildSignature(signingKey, accessKey, method, path, body, timestampSecs)

  const res = await fetch(`${base}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Vpi-Access-Key': accessKey,
      'X-Vpi-Hmac-Sha256': `t=${timestampSecs},v1=${sig}`,
      ...options.headers,
    },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Vinted VPI ${res.status}: ${text}`)
  }
  return res.json()
}

// ── Items ──────────────────────────────────────────────────────────────────

export interface VpiItem {
  title: string
  description: string
  price: number          // in minor units (pence)
  currency_code: string  // 'GBP'
  category_id: number
  brand_id?: number
  size_id?: number
  color_ids?: number[]
  condition: 'new_with_tags' | 'new_without_tags' | 'very_good' | 'good' | 'satisfactory'
  photo_ids?: string[]
  reference?: string     // your internal SKU
}

export async function createVintedItems(items: VpiItem[]) {
  return vpiRequest('/api/v1/items', {
    method: 'POST',
    body: JSON.stringify({ items }),
  })
}

export async function updateVintedItems(items: (Partial<VpiItem> & { id: string })[]) {
  return vpiRequest('/api/v1/items', {
    method: 'PUT',
    body: JSON.stringify({ items }),
  })
}

export async function deleteVintedItems(ids: string[]) {
  return vpiRequest('/api/v1/items', {
    method: 'DELETE',
    body: JSON.stringify({ item_ids: ids }),
  })
}

export async function getVintedItems(page = 1, perPage = 50) {
  return vpiRequest(`/api/v1/items?page=${page}&per_page=${perPage}`)
}

export async function getVintedItemStatus(itemId: string) {
  return vpiRequest(`/api/v1/items/status?item_id=${itemId}`)
}

export async function getVintedPriceSuggestion(categoryId: number, brandId?: number) {
  const qs = `category_id=${categoryId}${brandId ? `&brand_id=${brandId}` : ''}`
  return vpiRequest(`/api/v1/items/price-suggestions?${qs}`)
}

// ── Orders ─────────────────────────────────────────────────────────────────

export async function getVintedOrders(page = 1, perPage = 50) {
  return vpiRequest(`/api/v1/orders?page=${page}&per_page=${perPage}`)
}

export async function getVintedOrder(orderId: string) {
  return vpiRequest(`/api/v1/orders/${orderId}`)
}

export async function cancelVintedOrder(orderId: string, reason: string) {
  return vpiRequest(`/api/v1/orders/${orderId}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })
}

export async function getVintedOrderShipment(orderId: string) {
  return vpiRequest(`/api/v1/orders/${orderId}/shipment`)
}

export async function getVintedShipmentLabel(orderId: string): Promise<Buffer | null> {
  const accessKey = await getConfig('VINTED_ACCESS_KEY')
  const signingKey = await getConfig('VINTED_SIGNING_KEY')
  const sandbox = await getConfig('VINTED_SANDBOX')
  if (!accessKey || !signingKey) return null

  const base = sandbox === 'true' ? VPI_SANDBOX : VPI_BASE
  const path = `/api/v1/orders/${orderId}/shipment/label`
  const timestampSecs = Math.floor(Date.now() / 1000)
  const sig = buildSignature(signingKey, accessKey, 'GET', path, '', timestampSecs)

  const res = await fetch(`${base}${path}`, {
    headers: { 'X-Vpi-Access-Key': accessKey, 'X-Vpi-Hmac-Sha256': `t=${timestampSecs},v1=${sig}` },
  })
  if (!res.ok) return null
  return Buffer.from(await res.arrayBuffer())
}

// ── Taxonomy ───────────────────────────────────────────────────────────────

export async function getVintedOntologies() {
  return vpiRequest('/api/v1/ontologies')
}

// ── Webhooks ───────────────────────────────────────────────────────────────

export async function registerVintedWebhook(url: string, events: string[]) {
  return vpiRequest('/api/v1/webhooks', {
    method: 'POST',
    body: JSON.stringify({ url, events }),
  })
}

/** Verify an inbound webhook from Vinted. Returns true if signature is valid. */
export function verifyVintedWebhook(
  webhookSigningKey: string,
  rawBody: string,
  signatureHeader: string
): boolean {
  const match = signatureHeader.match(/t=(\d+),v1=([a-f0-9]+)/)
  if (!match) return false
  const [, ts, received] = match
  const expected = crypto
    .createHmac('sha256', webhookSigningKey)
    .update(`${ts}${rawBody}`)
    .digest('hex')
  return crypto.timingSafeEqual(Buffer.from(received, 'hex'), Buffer.from(expected, 'hex'))
}
