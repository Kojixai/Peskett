import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export interface ListingDescriptionInput {
  brand: string
  category: string
  size: string
  condition: string
  pitToPit?: number
  length?: number
  colour: string
  imageUrls?: string[]
}

export async function generateListingDescription(input: ListingDescriptionInput): Promise<string> {
  const productDetails = [
    `Brand: ${input.brand}`,
    `Category: ${input.category}`,
    `Size: ${input.size}`,
    `Condition: ${input.condition}`,
    input.pitToPit ? `Pit to pit: ${input.pitToPit}cm` : null,
    input.length ? `Length: ${input.length}cm` : null,
    `Colour: ${input.colour}`,
  ]
    .filter(Boolean)
    .join('\n')

  const systemPrompt = `You are a Vinted listing copywriter. Given product details and photos, write a compelling, honest, and SEO-friendly listing description for Vinted UK. Be concise, friendly, and factual. Write in first person as the seller. Keep descriptions under 300 words. Mention any notable details, patterns, or features. Flag any visible flaws honestly.`

  const userContent: Anthropic.MessageParam['content'] = []

  // Add images if provided
  if (input.imageUrls && input.imageUrls.length > 0) {
    for (const url of input.imageUrls.slice(0, 4)) {
      try {
        const response = await fetch(url)
        const buffer = await response.arrayBuffer()
        const base64 = Buffer.from(buffer).toString('base64')
        const contentType = response.headers.get('content-type') || 'image/jpeg'

        userContent.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: contentType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
            data: base64,
          },
        })
      } catch {
        // Skip images that fail to load
      }
    }
  }

  userContent.push({
    type: 'text',
    text: `Write a Vinted UK listing description for this item:\n\n${productDetails}`,
  })

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: userContent,
      },
    ],
  } as Parameters<typeof client.messages.create>[0]) as Awaited<ReturnType<typeof client.messages.create>>

  const textBlock = (message as { content: Array<{ type: string; text?: string }> }).content.find((b) => b.type === 'text')
  return textBlock?.text ?? ''
}
