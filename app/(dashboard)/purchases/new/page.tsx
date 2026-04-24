'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input, Select, Textarea } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const CONDITIONS = [
  { value: 'new', label: 'New' },
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'satisfactory', label: 'Satisfactory' },
]

const CATEGORIES = [
  { value: 'Mens / Tops / T-Shirts', label: 'T-Shirts' },
  { value: 'Mens / Tops / Shirts', label: 'Shirts' },
  { value: 'Mens / Tops / Hoodies', label: 'Hoodies' },
  { value: 'Mens / Tops / Sweatshirts', label: 'Sweatshirts' },
  { value: 'Mens / Outerwear / Jackets', label: 'Jackets' },
  { value: 'Mens / Outerwear / Coats', label: 'Coats' },
  { value: 'Mens / Bottoms / Jeans', label: 'Jeans' },
  { value: 'Mens / Bottoms / Trousers', label: 'Trousers' },
  { value: 'Mens / Bottoms / Shorts', label: 'Shorts' },
  { value: 'Mens / Footwear / Trainers', label: 'Trainers' },
  { value: 'Mens / Accessories', label: 'Accessories' },
  { value: 'Womens / Tops', label: 'Womens Tops' },
  { value: 'Womens / Dresses', label: 'Dresses' },
  { value: 'Womens / Bottoms', label: 'Womens Bottoms' },
  { value: 'Womens / Outerwear', label: 'Womens Outerwear' },
]

interface SkuForm {
  description: string
  brand: string
  category: string
  size: string
  condition: string
  colour: string
  pit_to_pit: string
  length: string
  storage_location: string
}

const defaultSku = (): SkuForm => ({
  description: '',
  brand: '',
  category: '',
  size: '',
  condition: 'good',
  colour: '',
  pit_to_pit: '',
  length: '',
  storage_location: '',
})

export default function NewPurchasePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'purchase' | 'skus'>('purchase')

  // Purchase form
  const [source, setSource] = useState('in_person')
  const [sourceOrderId, setSourceOrderId] = useState('')
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0])
  const [totalCost, setTotalCost] = useState('')
  const [itemCount, setItemCount] = useState('1')
  const [notes, setNotes] = useState('')

  // eBay import
  const [ebayLoading, setEbayLoading] = useState(false)

  // SKU forms
  const [skus, setSkus] = useState<SkuForm[]>([defaultSku()])
  const [purchaseId, setPurchaseId] = useState<string | null>(null)

  async function importEbayOrder() {
    if (!sourceOrderId) return
    setEbayLoading(true)
    try {
      const res = await fetch(`/api/purchases/ebay-import?orderId=${sourceOrderId}`)
      const data = await res.json()
      if (data.totalCost) setTotalCost(String(data.totalCost))
      if (data.itemCount) setItemCount(String(data.itemCount))
      if (data.items) {
        setSkus(data.items.map((item: any) => ({
          ...defaultSku(),
          description: item.title ?? '',
        })))
      }
    } catch (e) {
      setError('Failed to import eBay order')
    } finally {
      setEbayLoading(false)
    }
  }

  async function handlePurchaseSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const count = parseInt(itemCount) || 1

    // Sync SKU count with item count
    if (skus.length < count) {
      setSkus((prev) => [...prev, ...Array(count - prev.length).fill(null).map(defaultSku)])
    }

    const res = await fetch('/api/purchases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source,
        source_order_id: sourceOrderId || null,
        purchase_date: purchaseDate,
        total_cost: parseFloat(totalCost),
        item_count: count,
        notes: notes || null,
      }),
    })

    if (!res.ok) {
      setError('Failed to create purchase')
      setLoading(false)
      return
    }

    const { id } = await res.json()
    setPurchaseId(id)
    setSkus(Array(count).fill(null).map(() => defaultSku()))
    setStep('skus')
    setLoading(false)
  }

  function updateSku(index: number, field: keyof SkuForm, value: string) {
    setSkus((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)))
  }

  function copyToAll(index: number, field: keyof SkuForm) {
    const value = skus[index][field]
    setSkus((prev) => prev.map((s) => ({ ...s, [field]: value })))
  }

  async function handleSkusSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!purchaseId) return
    setLoading(true)
    setError(null)

    const cost = parseFloat(totalCost) / skus.length

    const res = await fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        purchase_id: purchaseId,
        cost_price: cost,
        items: skus.map((s) => ({
          ...s,
          pit_to_pit: s.pit_to_pit ? parseFloat(s.pit_to_pit) : null,
          length: s.length ? parseFloat(s.length) : null,
        })),
      }),
    })

    if (!res.ok) {
      setError('Failed to create inventory items')
      setLoading(false)
      return
    }

    router.push('/inventory')
  }

  if (step === 'skus') {
    return (
      <div className="p-6 max-w-4xl space-y-6">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Link href="/purchases" className="hover:text-zinc-300">Purchases</Link>
          <span>/</span>
          <span>New</span>
          <span>/</span>
          <span className="text-zinc-300">Add SKUs</span>
        </div>

        <div>
          <h1 className="text-lg font-semibold text-zinc-100 uppercase tracking-widest">Add Item Details</h1>
          <p className="text-xs text-zinc-500 mt-0.5">{skus.length} item{skus.length !== 1 ? 's' : ''} — cost per item: £{(parseFloat(totalCost) / skus.length).toFixed(2)}</p>
        </div>

        <form onSubmit={handleSkusSubmit} className="space-y-4">
          {skus.map((sku, i) => (
            <div key={i} className="bg-[#111113] border border-[#27272a] p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs text-zinc-400 uppercase tracking-widest font-mono">Item {i + 1}</div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Input
                  label="Description"
                  value={sku.description}
                  onChange={(e) => updateSku(i, 'description', e.target.value)}
                  placeholder="e.g. Vintage logo tee"
                  className="col-span-2 md:col-span-1"
                />
                <Input
                  label="Brand"
                  value={sku.brand}
                  onChange={(e) => updateSku(i, 'brand', e.target.value)}
                  placeholder="e.g. Nike"
                />
                <Select
                  label="Category"
                  value={sku.category}
                  onChange={(e) => updateSku(i, 'category', e.target.value)}
                  options={CATEGORIES}
                  placeholder="Select category"
                />
                <Input
                  label="Size"
                  value={sku.size}
                  onChange={(e) => updateSku(i, 'size', e.target.value)}
                  placeholder="e.g. L / XL / 32W"
                />
                <Select
                  label="Condition"
                  value={sku.condition}
                  onChange={(e) => updateSku(i, 'condition', e.target.value)}
                  options={CONDITIONS}
                />
                <Input
                  label="Colour"
                  value={sku.colour}
                  onChange={(e) => updateSku(i, 'colour', e.target.value)}
                  placeholder="e.g. White / Navy"
                />
                <Input
                  label="Pit to Pit (cm)"
                  type="number"
                  value={sku.pit_to_pit}
                  onChange={(e) => updateSku(i, 'pit_to_pit', e.target.value)}
                  placeholder="e.g. 52"
                />
                <Input
                  label="Length (cm)"
                  type="number"
                  value={sku.length}
                  onChange={(e) => updateSku(i, 'length', e.target.value)}
                  placeholder="e.g. 70"
                />
                <Input
                  label="Storage Location"
                  value={sku.storage_location}
                  onChange={(e) => updateSku(i, 'storage_location', e.target.value)}
                  placeholder="e.g. Box A / Shelf 2"
                />
              </div>

              {skus.length > 1 && (
                <div className="flex gap-2 flex-wrap">
                  {(['brand', 'category', 'condition', 'storage_location'] as const).map((field) => (
                    <button
                      key={field}
                      type="button"
                      onClick={() => copyToAll(i, field)}
                      className="text-xs text-zinc-500 hover:text-[#f97316] transition-colors"
                    >
                      Copy {field.replace('_', ' ')} to all
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {error && (
            <div className="border border-red-900 bg-red-950/30 px-3 py-2 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : `Save ${skus.length} SKU${skus.length !== 1 ? 's' : ''}`}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push('/inventory')}
            >
              Skip for now
            </Button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-xl space-y-6">
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <Link href="/purchases" className="hover:text-zinc-300">Purchases</Link>
        <span>/</span>
        <span className="text-zinc-300">New Purchase</span>
      </div>

      <h1 className="text-lg font-semibold text-zinc-100 uppercase tracking-widest">Log Purchase</h1>

      <form onSubmit={handlePurchaseSubmit} className="space-y-4">
        <Select
          label="Source"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          options={[
            { value: 'ebay', label: 'eBay' },
            { value: 'vinted', label: 'Vinted' },
            { value: 'in_person', label: 'In Person' },
            { value: 'other', label: 'Other' },
          ]}
        />

        {source === 'ebay' && (
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                label="eBay Order ID"
                value={sourceOrderId}
                onChange={(e) => setSourceOrderId(e.target.value)}
                placeholder="Paste eBay order ID"
              />
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                variant="secondary"
                onClick={importEbayOrder}
                disabled={ebayLoading || !sourceOrderId}
              >
                {ebayLoading ? 'Importing...' : 'Import'}
              </Button>
            </div>
          </div>
        )}

        <Input
          label="Purchase Date"
          type="date"
          value={purchaseDate}
          onChange={(e) => setPurchaseDate(e.target.value)}
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Total Cost (£)"
            type="number"
            step="0.01"
            min="0"
            value={totalCost}
            onChange={(e) => setTotalCost(e.target.value)}
            placeholder="0.00"
            required
          />
          <Input
            label="Number of Items"
            type="number"
            min="1"
            value={itemCount}
            onChange={(e) => setItemCount(e.target.value)}
            required
          />
        </div>

        {totalCost && itemCount && (
          <div className="bg-[#18181b] border border-[#27272a] px-4 py-2 flex items-center justify-between">
            <span className="text-xs text-zinc-500">Cost per item</span>
            <span className="font-mono text-sm text-[#f97316]">
              £{(parseFloat(totalCost) / parseInt(itemCount)).toFixed(2)}
            </span>
          </div>
        )}

        <Textarea
          label="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Mixed lot from car boot, condition varies"
          rows={3}
        />

        {error && (
          <div className="border border-red-900 bg-red-950/30 px-3 py-2 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Continue — Add Item Details'}
          </Button>
          <Link href="/purchases">
            <Button type="button" variant="secondary">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
