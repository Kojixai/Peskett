export type Source = 'ebay' | 'vinted' | 'in_person' | 'other'
export type Condition = 'new' | 'excellent' | 'good' | 'satisfactory'
export type ItemStatus = 'in_stock' | 'listed' | 'sold'
export type ListingStatus = 'draft' | 'scheduled' | 'live' | 'sold' | 'deleted'
export type Platform = 'vinted' | 'ebay' | 'depop'
export type BankSource = 'starling'

export interface Purchase {
  id: string
  source: Source
  source_order_id: string | null
  purchase_date: string
  total_cost: number
  item_count: number
  notes: string | null
  receipt_image_url: string | null
  created_at: string
}

export interface InventoryItem {
  id: string
  sku: string
  purchase_id: string | null
  cost_price: number
  description: string | null
  brand: string | null
  category: string | null
  size: string | null
  condition: Condition | null
  colour: string | null
  pit_to_pit: number | null
  length: number | null
  storage_location: string | null
  photos: string[]
  status: ItemStatus
  created_at: string
}

export interface Listing {
  id: string
  sku_id: string
  vinted_item_id: string | null
  platform: Platform
  list_price: number
  ai_description: string | null
  listed_at: string | null
  scheduled_at: string | null
  status: ListingStatus
}

export interface Order {
  id: string
  vinted_order_id: string
  listing_id: string
  sku_id: string
  sale_price: number
  platform_fee: number
  shipping_cost: number
  net_revenue: number
  profit: number
  margin_percent: number
  sold_at: string
  shipment_label_url: string | null
}

export interface OfferRule {
  id: string
  rule_name: string
  min_accept_percent: number
  counter_percent: number
  auto_reject_below: number
  active: boolean
}

export interface BankSnapshot {
  id: string
  source: BankSource
  balance: number
  currency: string
  snapshot_at: string
}

export interface InventoryItemWithListing extends InventoryItem {
  listings?: Listing[]
  orders?: Order[]
  list_price?: number
  sale_price?: number
  profit?: number
}

export interface DashboardKPIs {
  revenue_month: number
  revenue_all_time: number
  profit_month: number
  profit_all_time: number
  avg_margin_percent: number
  items_sold_month: number
  items_sold_all_time: number
  items_in_stock: number
  stock_value_at_cost: number
  cash_balance: number | null
  cash_currency: string
}

export interface RevenueDataPoint {
  period: string
  revenue: number
  profit: number
}
