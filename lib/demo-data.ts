import type { InventoryItem, Order, Listing, Purchase, RevenueDataPoint } from './types'
import { format, subDays, subWeeks } from 'date-fns'

const now = new Date()

export const demoOrders: Order[] = [
  { id: '1', vinted_order_id: 'V-10001', listing_id: 'l1', sku_id: 'i1', sale_price: 45, platform_fee: 3.6, shipping_cost: 2.5, net_revenue: 38.9, profit: 27.9, margin_percent: 62, sold_at: subDays(now, 1).toISOString(), shipment_label_url: null },
  { id: '2', vinted_order_id: 'V-10002', listing_id: 'l2', sku_id: 'i2', sale_price: 28, platform_fee: 2.24, shipping_cost: 2.5, net_revenue: 23.26, profit: 15.26, margin_percent: 54.5, sold_at: subDays(now, 2).toISOString(), shipment_label_url: null },
  { id: '3', vinted_order_id: 'V-10003', listing_id: 'l3', sku_id: 'i3', sale_price: 65, platform_fee: 5.2, shipping_cost: 3.2, net_revenue: 56.6, profit: 43.6, margin_percent: 67.1, sold_at: subDays(now, 3).toISOString(), shipment_label_url: '#' },
  { id: '4', vinted_order_id: 'V-10004', listing_id: 'l4', sku_id: 'i4', sale_price: 22, platform_fee: 1.76, shipping_cost: 2.5, net_revenue: 17.74, profit: 9.74, margin_percent: 44.3, sold_at: subDays(now, 5).toISOString(), shipment_label_url: null },
  { id: '5', vinted_order_id: 'V-10005', listing_id: 'l5', sku_id: 'i5', sale_price: 120, platform_fee: 9.6, shipping_cost: 4.5, net_revenue: 105.9, profit: 86.9, margin_percent: 72.4, sold_at: subDays(now, 7).toISOString(), shipment_label_url: '#' },
  { id: '6', vinted_order_id: 'V-10006', listing_id: 'l6', sku_id: 'i6', sale_price: 35, platform_fee: 2.8, shipping_cost: 2.5, net_revenue: 29.7, profit: 20.7, margin_percent: 59.1, sold_at: subDays(now, 9).toISOString(), shipment_label_url: null },
  { id: '7', vinted_order_id: 'V-10007', listing_id: 'l7', sku_id: 'i7', sale_price: 55, platform_fee: 4.4, shipping_cost: 3.2, net_revenue: 47.4, profit: 35.4, margin_percent: 64.4, sold_at: subDays(now, 12).toISOString(), shipment_label_url: null },
  { id: '8', vinted_order_id: 'V-10008', listing_id: 'l8', sku_id: 'i8', sale_price: 18, platform_fee: 1.44, shipping_cost: 2.5, net_revenue: 14.06, profit: 6.06, margin_percent: 33.7, sold_at: subDays(now, 14).toISOString(), shipment_label_url: null },
]

export const demoInventory: (InventoryItem & { brand: string; description: string })[] = [
  { id: 'i10', sku: 'TH-20260420-0001', purchase_id: 'p1', cost_price: 8, description: 'Vintage Logo Tee', brand: 'Nike', category: 'Mens / Tops / T-Shirts', size: 'L', condition: 'good', colour: 'White', pit_to_pit: 54, length: 72, storage_location: 'Box A', photos: [], status: 'in_stock', created_at: subDays(now, 5).toISOString() },
  { id: 'i11', sku: 'TH-20260420-0002', purchase_id: 'p1', cost_price: 8, description: 'Windbreaker Jacket', brand: 'Adidas', category: 'Mens / Outerwear / Jackets', size: 'M', condition: 'excellent', colour: 'Navy', pit_to_pit: 56, length: 68, storage_location: 'Box A', photos: [], status: 'in_stock', created_at: subDays(now, 5).toISOString() },
  { id: 'i12', sku: 'TH-20260421-0001', purchase_id: 'p2', cost_price: 12, description: 'Graphic Hoodie', brand: 'Stone Island', category: 'Mens / Tops / Hoodies', size: 'XL', condition: 'good', colour: 'Grey', pit_to_pit: 62, length: 74, storage_location: 'Box B', photos: [], status: 'listed', created_at: subDays(now, 4).toISOString() },
  { id: 'i13', sku: 'TH-20260421-0002', purchase_id: 'p2', cost_price: 12, description: 'Slim Fit Chinos', brand: 'Ralph Lauren', category: 'Mens / Bottoms / Trousers', size: '32W 32L', condition: 'excellent', colour: 'Khaki', pit_to_pit: null, length: null, storage_location: 'Box B', photos: [], status: 'listed', created_at: subDays(now, 4).toISOString() },
  { id: 'i14', sku: 'TH-20260422-0001', purchase_id: 'p3', cost_price: 15, description: 'Down Puffer Jacket', brand: 'The North Face', category: 'Mens / Outerwear / Coats', size: 'L', condition: 'excellent', colour: 'Black', pit_to_pit: 60, length: 72, storage_location: 'Shelf 1', photos: [], status: 'in_stock', created_at: subDays(now, 3).toISOString() },
  { id: 'i15', sku: 'TH-20260422-0002', purchase_id: 'p3', cost_price: 15, description: 'Box Logo Crewneck', brand: 'Supreme', category: 'Mens / Tops / Sweatshirts', size: 'M', condition: 'good', colour: 'Red', pit_to_pit: 56, length: 68, storage_location: 'Shelf 1', photos: [], status: 'in_stock', created_at: subDays(now, 3).toISOString() },
]

export const demoListings: Listing[] = [
  { id: 'l10', sku_id: 'i12', vinted_item_id: '987654', platform: 'vinted', list_price: 55, ai_description: 'Stone Island hoodie in great condition...', listed_at: subDays(now, 4).toISOString(), scheduled_at: null, status: 'live' },
  { id: 'l11', sku_id: 'i13', vinted_item_id: '987655', platform: 'vinted', list_price: 45, ai_description: 'Ralph Lauren chinos, barely worn...', listed_at: subDays(now, 4).toISOString(), scheduled_at: null, status: 'live' },
]

export const demoPurchases: Purchase[] = [
  { id: 'p1', source: 'ebay', source_order_id: 'EB-2891001', purchase_date: subDays(now, 5).toISOString().split('T')[0], total_cost: 32, item_count: 4, notes: 'Mixed Nike/Adidas lot', receipt_image_url: null, created_at: subDays(now, 5).toISOString() },
  { id: 'p2', source: 'in_person', source_order_id: null, purchase_date: subDays(now, 4).toISOString().split('T')[0], total_cost: 24, item_count: 2, notes: 'Car boot sale — Stratford', receipt_image_url: null, created_at: subDays(now, 4).toISOString() },
  { id: 'p3', source: 'vinted', source_order_id: 'V-88812', purchase_date: subDays(now, 3).toISOString().split('T')[0], total_cost: 45, item_count: 3, notes: null, receipt_image_url: null, created_at: subDays(now, 3).toISOString() },
]

export function getDemoChartData(): RevenueDataPoint[] {
  return Array.from({ length: 8 }, (_, i) => {
    const week = 7 - i
    const base = 80 + Math.sin(i) * 30
    const revenue = Math.round(base + i * 15 + Math.random() * 20)
    const profit = Math.round(revenue * (0.55 + Math.random() * 0.15))
    return {
      period: format(subWeeks(now, week), 'dd MMM'),
      revenue,
      profit,
    }
  })
}

export function getDemoKPIs() {
  const allOrders = demoOrders
  const monthOrders = demoOrders.filter((o) => {
    const d = new Date(o.sold_at)
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    return d >= start
  })

  const totalRevenue = allOrders.reduce((s, o) => s + o.sale_price, 0)
  const totalProfit = allOrders.reduce((s, o) => s + o.profit, 0)
  const monthRevenue = monthOrders.reduce((s, o) => s + o.sale_price, 0)
  const monthProfit = monthOrders.reduce((s, o) => s + o.profit, 0)
  const avgMargin = allOrders.reduce((s, o) => s + o.margin_percent, 0) / allOrders.length

  const inStockCount = demoInventory.filter((i) => i.status === 'in_stock').length
  const stockValue = demoInventory.filter((i) => i.status !== 'sold').reduce((s, i) => s + i.cost_price, 0)
  const liveListings = demoInventory.filter((i) => i.status === 'listed').length

  return { totalRevenue, totalProfit, monthRevenue, monthProfit, avgMargin, inStockCount, stockValue, liveListings, itemsSold: allOrders.length, monthSold: monthOrders.length }
}
