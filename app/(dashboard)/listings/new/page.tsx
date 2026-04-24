'use client'

export const dynamic = 'force-dynamic'

import { useState, useRef, useCallback, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input, Select, Textarea } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import Link from 'next/link'

const CONDITIONS = [
  { value: 'new', label: 'New with tags' },
  { value: 'excellent', label: 'Like new' },
  { value: 'good', label: 'Good condition' },
  { value: 'satisfactory', label: 'Satisfactory' },
]

const CATEGORIES = [
  { value: 'Mens / Tops / T-Shirts', label: "Men's T-Shirts" },
  { value: 'Mens / Tops / Shirts', label: "Men's Shirts" },
  { value: 'Mens / Tops / Hoodies', label: "Men's Hoodies" },
  { value: 'Mens / Tops / Sweatshirts', label: "Men's Sweatshirts" },
  { value: 'Mens / Outerwear / Jackets', label: "Men's Jackets" },
  { value: 'Mens / Outerwear / Coats', label: "Men's Coats" },
  { value: 'Mens / Bottoms / Jeans', label: "Men's Jeans" },
  { value: 'Mens / Bottoms / Trousers', label: "Men's Trousers" },
  { value: 'Mens / Bottoms / Shorts', label: "Men's Shorts" },
  { value: 'Mens / Footwear / Trainers', label: "Men's Trainers" },
  { value: 'Mens / Accessories', label: "Men's Accessories" },
  { value: 'Womens / Tops', label: "Women's Tops" },
  { value: 'Womens / Dresses', label: "Women's Dresses" },
  { value: 'Womens / Bottoms', label: "Women's Bottoms" },
  { value: 'Womens / Outerwear', label: "Women's Outerwear" },
]

export default function NewListingPage() {
  return (
    <Suspense fallback={<div className="p-6 text-zinc-500 text-sm">Loading...</div>}>
      <NewListingPageContent />
    </Suspense>
  )
}

function NewListingPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedSkuId = searchParams.get('sku')

  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatingDesc, setGeneratingDesc] = useState(false)

  // Photos
  const [photos, setPhotos] = useState<File[]>([])
  const [photoUrls, setPhotoUrls] = useState<string[]>([])
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([])

  // SKU selection
  const [inventoryItems, setInventoryItems] = useState<any[]>([])
  const [selectedSku, setSelectedSku] = useState<string>(preselectedSkuId ?? '')
  const [selectedItem, setSelectedItem] = useState<any>(null)

  // Form fields
  const [brand, setBrand] = useState('')
  const [category, setCategory] = useState('')
  const [size, setSize] = useState('')
  const [condition, setCondition] = useState('good')
  const [colour, setColour] = useState('')
  const [pitToPit, setPitToPit] = useState('')
  const [itemLength, setItemLength] = useState('')
  const [listPrice, setListPrice] = useState('')
  const [description, setDescription] = useState('')
  const [publishMode, setPublishMode] = useState<'now' | 'schedule' | 'draft'>('now')
  const [scheduledAt, setScheduledAt] = useState('')

  // Load inventory items
  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('inventory_items')
        .select('id, sku, brand, description, category, size, condition, colour, pit_to_pit, length, photos, cost_price')
        .in('status', ['in_stock'])
        .order('created_at', { ascending: false })
      setInventoryItems(data ?? [])
      if (preselectedSkuId && data) {
        const item = data.find((i) => i.id === preselectedSkuId)
        if (item) prefillFromItem(item)
      }
    }
    load()
  }, [preselectedSkuId])

  function prefillFromItem(item: any) {
    setSelectedSku(item.id)
    setSelectedItem(item)
    setBrand(item.brand ?? '')
    setCategory(item.category ?? '')
    setSize(item.size ?? '')
    setCondition(item.condition ?? 'good')
    setColour(item.colour ?? '')
    setPitToPit(item.pit_to_pit ? String(item.pit_to_pit) : '')
    setItemLength(item.length ? String(item.length) : '')
    if (item.photos?.length > 0) {
      setPhotoUrls(item.photos)
      setUploadedUrls(item.photos)
    }
  }

  function handleSkuChange(id: string) {
    const item = inventoryItems.find((i) => i.id === id)
    if (item) prefillFromItem(item)
  }

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 8)
    setPhotos(files)
    setPhotoUrls(files.map((f) => URL.createObjectURL(f)))
  }

  async function uploadPhotos(): Promise<string[]> {
    if (photos.length === 0) return uploadedUrls

    const urls: string[] = []
    for (const file of photos) {
      const fileName = `listings/${Date.now()}-${file.name.replace(/[^a-z0-9.]/gi, '-')}`
      const { data, error } = await supabase.storage
        .from('product-photos')
        .upload(fileName, file, { upsert: true })

      if (data) {
        const { data: urlData } = supabase.storage
          .from('product-photos')
          .getPublicUrl(data.path)
        urls.push(urlData.publicUrl)
      }
    }
    setUploadedUrls(urls)
    return urls
  }

  async function handleGenerateDescription() {
    setGeneratingDesc(true)
    setError(null)

    try {
      const urls = await uploadPhotos()

      const res = await fetch('/api/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand,
          category,
          size,
          condition,
          colour,
          pitToPit: pitToPit ? parseFloat(pitToPit) : undefined,
          length: itemLength ? parseFloat(itemLength) : undefined,
          imageUrls: urls,
        }),
      })

      const data = await res.json()
      if (data.description) {
        setDescription(data.description)
        setStep(3)
      }
    } catch {
      setError('Failed to generate description')
    } finally {
      setGeneratingDesc(false)
    }
  }

  async function handlePublish() {
    setLoading(true)
    setError(null)

    try {
      const urls = uploadedUrls.length > 0 ? uploadedUrls : await uploadPhotos()

      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku_id: selectedSku || null,
          list_price: parseFloat(listPrice),
          ai_description: description,
          platform: 'vinted',
          publish_mode: publishMode,
          scheduled_at: publishMode === 'schedule' ? scheduledAt : null,
          item_details: { brand, category, size, condition, colour, pitToPit, length: itemLength },
          photo_urls: urls,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Failed to publish listing')
      }

      router.push('/listings')
    } catch (e: any) {
      setError(e.message)
      setLoading(false)
    }
  }

  // Mobile step-by-step UI
  return (
    <div className="p-4 md:p-6 max-w-xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100 uppercase tracking-widest">New Listing</h1>
          <div className="flex items-center gap-1 mt-1">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-1 w-8 transition-colors ${s <= step ? 'bg-[#f97316]' : 'bg-[#27272a]'}`}
              />
            ))}
          </div>
        </div>
        <Link href="/listings">
          <Button variant="ghost" size="sm">Cancel</Button>
        </Link>
      </div>

      {/* Step 1: Photos */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-zinc-300 uppercase tracking-widest">Step 1 — Photos</h2>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            capture="environment"
            onChange={handlePhotoSelect}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full aspect-video bg-[#111113] border-2 border-dashed border-[#27272a] hover:border-[#f97316] flex flex-col items-center justify-center gap-3 transition-colors"
          >
            <CameraIcon />
            <span className="text-sm text-zinc-500">Tap to add photos</span>
            <span className="text-xs text-zinc-600">Up to 8 photos · Camera or gallery</span>
          </button>

          {photoUrls.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {photoUrls.map((url, i) => (
                <div key={i} className="aspect-square bg-[#18181b] relative overflow-hidden">
                  <Image src={url} alt={`Photo ${i + 1}`} fill className="object-cover" />
                </div>
              ))}
            </div>
          )}

          <Button
            onClick={() => setStep(2)}
            className="w-full justify-center"
            size="lg"
          >
            {photoUrls.length > 0 ? `Continue with ${photoUrls.length} photo${photoUrls.length !== 1 ? 's' : ''}` : 'Continue without photos'}
          </Button>
        </div>
      )}

      {/* Step 2: Item details */}
      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-zinc-300 uppercase tracking-widest">Step 2 — Item Details</h2>

          {inventoryItems.length > 0 && (
            <Select
              label="Link to SKU (optional)"
              value={selectedSku}
              onChange={(e) => handleSkuChange(e.target.value)}
              options={inventoryItems.map((i) => ({
                value: i.id,
                label: `${i.sku} — ${i.brand ?? ''} ${i.description ?? ''}`.trim(),
              }))}
              placeholder="Select from inventory"
            />
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input label="Brand" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="e.g. Nike" />
            <Input label="Size" value={size} onChange={(e) => setSize(e.target.value)} placeholder="e.g. L" />
          </div>

          <Select
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={CATEGORIES}
            placeholder="Select category"
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Condition"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              options={CONDITIONS}
            />
            <Input label="Colour" value={colour} onChange={(e) => setColour(e.target.value)} placeholder="e.g. White" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Pit to Pit (cm)"
              type="number"
              value={pitToPit}
              onChange={(e) => setPitToPit(e.target.value)}
              placeholder="e.g. 52"
            />
            <Input
              label="Length (cm)"
              type="number"
              value={itemLength}
              onChange={(e) => setItemLength(e.target.value)}
              placeholder="e.g. 70"
            />
          </div>

          <Input
            label="List Price (£)"
            type="number"
            step="0.50"
            min="0"
            value={listPrice}
            onChange={(e) => setListPrice(e.target.value)}
            placeholder="e.g. 25.00"
            required
          />

          <Button
            onClick={handleGenerateDescription}
            disabled={generatingDesc || !brand || !category}
            className="w-full justify-center"
            size="lg"
          >
            {generatingDesc ? (
              <>
                <SpinnerIcon />
                Generating description...
              </>
            ) : (
              'Generate AI Description →'
            )}
          </Button>

          {error && (
            <div className="border border-red-900 bg-red-950/30 px-3 py-2 text-sm text-red-400">{error}</div>
          )}

          <button onClick={() => setStep(1)} className="text-xs text-zinc-500 hover:text-zinc-300">
            ← Back
          </button>
        </div>
      )}

      {/* Step 3: Review description */}
      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-zinc-300 uppercase tracking-widest">Step 3 — Review Description</h2>

          <Textarea
            label="Listing Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={12}
          />

          <div className="flex gap-2">
            <Button onClick={() => setStep(4)} className="flex-1 justify-center" size="lg">
              Looks good →
            </Button>
            <Button
              variant="secondary"
              onClick={handleGenerateDescription}
              disabled={generatingDesc}
            >
              {generatingDesc ? 'Regenerating...' : 'Regenerate'}
            </Button>
          </div>

          <button onClick={() => setStep(2)} className="text-xs text-zinc-500 hover:text-zinc-300">
            ← Back
          </button>
        </div>
      )}

      {/* Step 4: Publish */}
      {step === 4 && (
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-zinc-300 uppercase tracking-widest">Step 4 — Publish</h2>

          <div className="space-y-2">
            {[
              { value: 'now', label: 'Publish now', sub: 'Goes live on Vinted immediately' },
              { value: 'schedule', label: 'Schedule', sub: 'Choose a date and time' },
              { value: 'draft', label: 'Save as draft', sub: 'Publish manually later' },
            ].map((opt) => (
              <label
                key={opt.value}
                className={`flex items-center gap-3 p-3 border cursor-pointer transition-colors ${
                  publishMode === opt.value
                    ? 'border-[#f97316] bg-[#431407]/20'
                    : 'border-[#27272a] bg-[#111113] hover:border-[#3f3f46]'
                }`}
              >
                <input
                  type="radio"
                  name="publishMode"
                  value={opt.value}
                  checked={publishMode === opt.value}
                  onChange={() => setPublishMode(opt.value as typeof publishMode)}
                  className="accent-[#f97316]"
                />
                <div>
                  <div className="text-sm text-zinc-200">{opt.label}</div>
                  <div className="text-xs text-zinc-500">{opt.sub}</div>
                </div>
              </label>
            ))}
          </div>

          {publishMode === 'schedule' && (
            <Input
              label="Schedule for"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              required
            />
          )}

          {/* Summary */}
          <div className="bg-[#111113] border border-[#27272a] p-4 space-y-2">
            <div className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Summary</div>
            {[
              ['Brand', brand],
              ['Category', category],
              ['Size', size],
              ['Condition', condition],
              ['List Price', listPrice ? `£${listPrice}` : '—'],
              ['Photos', `${photoUrls.length} photo${photoUrls.length !== 1 ? 's' : ''}`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm">
                <span className="text-zinc-500">{k}</span>
                <span className="font-mono text-zinc-200">{v}</span>
              </div>
            ))}
          </div>

          {error && (
            <div className="border border-red-900 bg-red-950/30 px-3 py-2 text-sm text-red-400">{error}</div>
          )}

          <Button
            onClick={handlePublish}
            disabled={loading || !listPrice}
            className="w-full justify-center"
            size="lg"
          >
            {loading
              ? 'Publishing...'
              : publishMode === 'now'
              ? 'Publish to Vinted'
              : publishMode === 'schedule'
              ? 'Schedule Listing'
              : 'Save Draft'}
          </Button>

          <button onClick={() => setStep(3)} className="text-xs text-zinc-500 hover:text-zinc-300">
            ← Back
          </button>
        </div>
      )}
    </div>
  )
}

function CameraIcon() {
  return (
    <svg className="w-8 h-8 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="square" strokeLinejoin="miter" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="square" strokeLinejoin="miter" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function SpinnerIcon() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}
