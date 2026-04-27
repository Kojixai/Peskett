'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ApiField {
  key: string
  label: string
  placeholder: string
  type?: 'text' | 'password'
}

interface InstructionStep {
  title: string
  detail: string
}

interface ApiConfig {
  id: string
  name: string
  badge: string
  description: string
  required: boolean
  docsUrl: string
  fields: ApiField[]
  instructions: InstructionStep[]
}

const APIS: ApiConfig[] = [
  {
    id: 'vinted',
    name: 'Vinted Pro (VPI)',
    badge: 'Required',
    description: 'Syncs orders in real time, manages listings and automates offer responses via the official Vinted Pro Integrations (VPI) API.',
    required: true,
    docsUrl: 'https://pro-portal.svc.vinted.com/',
    fields: [
      { key: 'VINTED_ACCESS_KEY',  label: 'Access Key',   placeholder: 'Paste your VPI Access Key here',  type: 'password' },
      { key: 'VINTED_SIGNING_KEY', label: 'Signing Key',  placeholder: 'Paste your VPI Signing Key here', type: 'password' },
      { key: 'VINTED_WEBHOOK_SIGNING_KEY', label: 'Webhook Signing Key', placeholder: 'Returned when you register the webhook', type: 'password' },
      { key: 'VINTED_SANDBOX',     label: 'Use Sandbox?', placeholder: 'true  (leave blank for production)',  type: 'text' },
    ],
    instructions: [
      {
        title: 'Register / upgrade to Vinted Pro',
        detail: 'You must be a registered Vinted Pro seller (sole trader, charity or company). If you are not yet on Pro, go to vinted.co.uk/pro and complete KYC/KYB verification. UK support launched October 2024.',
      },
      {
        title: 'Apply for VPI (API) allowlist access',
        detail: 'The Vinted Pro Integrations API is not self-serve — access must be granted by Vinted. Log in to the Pro portal at pro-portal.svc.vinted.com and follow the "Apply for API access" link, or contact your Vinted account manager. Explain you want API access for order management and listing automation. Approval can take several days.',
      },
      {
        title: 'Generate your environment token',
        detail: 'Once allowlisted, log in to pro-portal.svc.vinted.com. Under API Settings → Tokens, create a new token for the Production environment. The portal will display two separate values: your Access Key and your Signing Key. Copy both immediately — the Signing Key is shown only once.',
      },
      {
        title: 'Paste both keys above',
        detail: 'Paste the Access Key and Signing Key into the two fields above and click Save. Every API request is authenticated using HMAC-SHA256: your Access Key is sent in the X-Vpi-Access-Key header, and each request body is signed with your Signing Key.',
      },
      {
        title: 'Register the webhook for real-time order sync',
        detail: 'After saving your keys, open your deployed app URL and note the webhook endpoint: https://your-domain.vercel.app/api/webhooks/vinted\n\nIn the Vinted Pro portal under Webhooks, register this URL and select all events (ORDER_CREATED, ITEM_SOLD, ITEM_DELETED, etc.). The portal will return a Webhook Signing Key — paste that into the "Webhook Signing Key" field above so that incoming events can be verified.',
      },
      {
        title: 'Sandbox testing (optional)',
        detail: 'To test without affecting your live listings, use the sandbox portal at pro-portal-sandbox.svc.vinted.com. Generate separate sandbox tokens, enter "true" in the "Use Sandbox?" field, and all API calls will go to https://pro-public-sandbox.svc.vinted.com. Leave blank or set to "false" for production.',
      },
    ],
  },
  {
    id: 'starling',
    name: 'Starling Bank',
    badge: 'Optional',
    description: 'Displays your live Starling account balance on the dashboard Cash Balance card.',
    required: false,
    docsUrl: 'https://developer.starlingbank.com/personal/token',
    fields: [
      { key: 'STARLING_ACCESS_TOKEN', label: 'Personal Access Token', placeholder: 'eyJhbGciOi...', type: 'password' },
    ],
    instructions: [
      {
        title: 'Log in to Starling Developer Portal',
        detail: 'Go to developer.starlingbank.com and sign in with your existing Starling Bank credentials.',
      },
      {
        title: 'Create a Personal Access Token',
        detail: 'Navigate to "Personal Access Tokens" → "Create token". Give it a name (e.g. "FlipOS Dashboard") and select only the read-only permission scopes: "Account holder read" and "Balance read".',
      },
      {
        title: 'Copy and paste the token',
        detail: 'The token is displayed only once. Copy it immediately and paste it in the field above, then click Save.',
      },
    ],
  },
  {
    id: 'ebay',
    name: 'eBay',
    badge: 'Optional',
    description: 'Imports purchases you make on eBay directly into your Purchases log.',
    required: false,
    docsUrl: 'https://developer.ebay.com/my/keys',
    fields: [
      { key: 'EBAY_CLIENT_ID',     label: 'App ID (Client ID)',      placeholder: 'YourName-App-PRD-...', type: 'text' },
      { key: 'EBAY_CLIENT_SECRET', label: 'Cert ID (Client Secret)', placeholder: 'PRD-...',              type: 'password' },
    ],
    instructions: [
      {
        title: 'Register on the eBay Developer Programme',
        detail: 'Go to developer.ebay.com and sign in with your eBay buyer/seller account. Click "Get Application Keys".',
      },
      {
        title: 'Create a Production application',
        detail: 'Click "Create a keyset" → choose "Production". Copy the App ID (Client ID) and Cert ID (Client Secret) shown on the keys page.',
      },
      {
        title: 'Paste both keys above',
        detail: 'The App ID and Cert ID are used together for the Client Credentials OAuth flow. No additional approval is required for the Buy Order API.',
      },
    ],
  },
  {
    id: 'claude',
    name: 'Claude AI (Anthropic)',
    badge: 'Required',
    description: 'Powers AI listing descriptions, item analysis and smart offer suggestions via the Anthropic API.',
    required: true,
    docsUrl: 'https://console.anthropic.com/settings/keys',
    fields: [
      { key: 'ANTHROPIC_API_KEY', label: 'API Key', placeholder: 'sk-ant-api03-...', type: 'password' },
    ],
    instructions: [
      {
        title: 'Create an Anthropic account',
        detail: 'Go to console.anthropic.com and sign up or sign in with an existing account.',
      },
      {
        title: 'Generate an API key',
        detail: 'Navigate to Settings → API Keys → "Create Key". Name it "FlipOS" and copy the key immediately — it starts with "sk-ant-api03-" and is shown only once.',
      },
      {
        title: 'Add billing',
        detail: 'Go to Settings → Billing and add a payment method. Usage is pay-as-you-go. Generating a listing description typically costs under £0.01.',
      },
      {
        title: 'Paste the key above',
        detail: 'Paste the full key starting with "sk-ant-api03-" into the field and click Save.',
      },
    ],
  },
]

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg className={`w-4 h-4 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  )
}

function EyeIcon({ visible }: { visible: boolean }) {
  return visible ? (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round" />
    </svg>
  ) : (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  )
}

export function ApiConnections() {
  const supabase = createClient()
  const [openId, setOpenId]       = useState<string | null>(null)
  const [values, setValues]       = useState<Record<string, string>>({})
  const [saving, setSaving]       = useState<Record<string, boolean>>({})
  const [saved, setSaved]         = useState<Record<string, boolean>>({})
  const [configured, setCfg]      = useState<Record<string, boolean>>({})
  const [showSecret, setShowSec]  = useState<Record<string, boolean>>({})

  useEffect(() => {
    supabase.from('app_config').select('key,value').then(({ data }) => {
      if (!data) return
      const c: Record<string, boolean> = {}
      for (const row of data) if (row.value) c[row.key] = true
      setCfg(c)
    })
  }, [])

  async function save(api: ApiConfig) {
    setSaving(s => ({ ...s, [api.id]: true }))
    for (const f of api.fields) {
      const v = values[f.key]
      if (v === undefined) continue
      await supabase.from('app_config').upsert({ key: f.key, value: v, updated_at: new Date().toISOString() })
      if (v) setCfg(c => ({ ...c, [f.key]: true }))
    }
    setSaving(s => ({ ...s, [api.id]: false }))
    setSaved(s => ({ ...s, [api.id]: true }))
    setTimeout(() => setSaved(s => ({ ...s, [api.id]: false })), 2500)
  }

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl divide-y divide-[var(--border)]">
      {APIS.map((api) => {
        const open      = openId === api.id
        const connected = api.fields.filter(f => !f.key.includes('SANDBOX') && !f.key.includes('WEBHOOK')).every(f => configured[f.key])

        return (
          <div key={api.id}>
            <button
              onClick={() => setOpenId(open ? null : api.id)}
              className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-[var(--bg-elevated)] transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold ${
                  connected ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400' : 'bg-[var(--bg-elevated)] text-[var(--text-subtle)]'
                }`}>
                  {connected ? '✓' : '·'}
                </div>
                <span className="text-sm font-semibold text-[var(--text)]">{api.name}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                  connected
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                    : api.required
                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                    : 'bg-[var(--bg-elevated)] text-[var(--text-muted)]'
                }`}>
                  {connected ? 'Connected' : api.badge}
                </span>
                <ChevronIcon open={open} />
              </div>
            </button>

            {open && (
              <div className="px-4 pb-5 pt-4 space-y-5 border-t border-[var(--border)]">
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">{api.description}</p>

                {/* Key fields */}
                <div className="space-y-3">
                  {api.fields.map((field) => (
                    <div key={field.key}>
                      <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest block mb-1.5">
                        {field.label}
                        {configured[field.key] && <span className="ml-2 text-emerald-500 normal-case tracking-normal font-normal">✓ saved</span>}
                      </label>
                      <div className="relative">
                        <input
                          type={field.type === 'password' && !showSecret[field.key] ? 'password' : 'text'}
                          value={values[field.key] ?? ''}
                          onChange={e => setValues(v => ({ ...v, [field.key]: e.target.value }))}
                          placeholder={configured[field.key] ? '••••••••••••' : field.placeholder}
                          className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--text)] placeholder-[var(--text-subtle)] focus:outline-none focus:border-[#f97316] transition-colors pr-9"
                        />
                        {field.type === 'password' && (
                          <button type="button"
                            onClick={() => setShowSec(s => ({ ...s, [field.key]: !s[field.key] }))}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-subtle)] hover:text-[var(--text-muted)]">
                            <EyeIcon visible={!!showSecret[field.key]} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <button onClick={() => save(api)} disabled={saving[api.id]}
                  className="px-4 py-2 bg-[#f97316] hover:bg-[#ea6c0a] disabled:opacity-50 text-white text-xs font-semibold uppercase tracking-widest rounded-xl transition-colors">
                  {saving[api.id] ? 'Saving…' : saved[api.id] ? '✓ Saved' : 'Save'}
                </button>

                {/* Step-by-step instructions */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest">How to get your keys</p>
                  {api.instructions.map((step, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-5 h-5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[10px] font-bold text-[var(--text-muted)]">{i + 1}</span>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[var(--text)]">{step.title}</p>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-relaxed whitespace-pre-line">{step.detail}</p>
                      </div>
                    </div>
                  ))}
                  <a href={api.docsUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-[#f97316] hover:text-[#ea6c0a] transition-colors">
                    Open {api.name} portal →
                  </a>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
