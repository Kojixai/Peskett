'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import type { OfferRule } from '@/lib/types'

export default function SettingsPage() {
  const supabase = createClient()
  const [rules, setRules] = useState<OfferRule[]>([])
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  // New rule form
  const [ruleName, setRuleName] = useState('Default Rule')
  const [minAccept, setMinAccept] = useState('80')
  const [counterPct, setCounterPct] = useState('90')
  const [autoReject, setAutoReject] = useState('60')

  useEffect(() => {
    supabase.from('offer_rules').select('*').order('created_at').then(({ data }) => {
      if (data) setRules(data)
    })
  }, [])

  async function saveRule(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    await supabase.from('offer_rules').insert({
      rule_name: ruleName,
      min_accept_percent: parseInt(minAccept),
      counter_percent: parseInt(counterPct),
      auto_reject_below: parseInt(autoReject),
      active: true,
    })

    const { data } = await supabase.from('offer_rules').select('*').order('created_at')
    if (data) setRules(data)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setLoading(false)
  }

  async function toggleRule(id: string, active: boolean) {
    await supabase.from('offer_rules').update({ active }).eq('id', id)
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, active } : r)))
  }

  async function deleteRule(id: string) {
    await supabase.from('offer_rules').delete().eq('id', id)
    setRules((prev) => prev.filter((r) => r.id !== id))
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-[var(--text)] uppercase tracking-widest">Settings</h1>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">Appearance, offer rules and configuration</p>
      </div>

      {/* Appearance */}
      <section className="space-y-4">
        <h2 className="text-sm text-[var(--text-2)] uppercase tracking-widest">Appearance</h2>
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl">
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <div className="text-sm text-[var(--text-2)]">Dark mode</div>
              <div className="text-xs text-[var(--text-subtle)] mt-0.5">Toggle light / dark theme</div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </section>

      {/* Offer rules */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm text-[var(--text-2)] uppercase tracking-widest">Smart Offer Rules</h2>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border)] p-4 space-y-4">
          <p className="text-xs text-[var(--text-muted)]">
            Set rules for automatically accepting, countering, or rejecting offers on Vinted.
          </p>

          {rules.length > 0 && (
            <div className="space-y-2">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-center justify-between p-3 bg-[var(--bg-elevated)] border border-[var(--border)]"
                >
                  <div className="space-y-1">
                    <div className="text-sm text-[var(--text)] font-medium">{rule.rule_name}</div>
                    <div className="text-xs text-[var(--text-muted)] font-mono">
                      Accept ≥{rule.min_accept_percent}% · Counter at {rule.counter_percent}% · Reject &lt;{rule.auto_reject_below}%
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <div
                        onClick={() => toggleRule(rule.id, !rule.active)}
                        className={`w-8 h-4 relative transition-colors cursor-pointer ${
                          rule.active ? 'bg-[#f97316]' : 'bg-[var(--border-strong)]'
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 w-3 h-3 bg-white transition-transform ${
                            rule.active ? 'translate-x-4' : 'translate-x-0.5'
                          }`}
                        />
                      </div>
                      <span className="text-xs text-[var(--text-muted)]">{rule.active ? 'Active' : 'Off'}</span>
                    </label>
                    <button
                      onClick={() => deleteRule(rule.id)}
                      className="text-xs text-[var(--text-subtle)] hover:text-red-400 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={saveRule} className="space-y-3 pt-2 border-t border-[var(--border)]">
            <div className="text-xs text-[var(--text-muted)] uppercase tracking-widest">Add Rule</div>
            <Input
              label="Rule Name"
              value={ruleName}
              onChange={(e) => setRuleName(e.target.value)}
              placeholder="e.g. Default Rule"
              required
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Accept if ≥ (%)"
                type="number"
                min="0"
                max="100"
                value={minAccept}
                onChange={(e) => setMinAccept(e.target.value)}
                required
              />
              <Input
                label="Counter at (%)"
                type="number"
                min="0"
                max="100"
                value={counterPct}
                onChange={(e) => setCounterPct(e.target.value)}
                required
              />
              <Input
                label="Reject below (%)"
                type="number"
                min="0"
                max="100"
                value={autoReject}
                onChange={(e) => setAutoReject(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={loading} size="sm">
              {loading ? 'Saving...' : saved ? '✓ Saved' : 'Add Rule'}
            </Button>
          </form>
        </div>
      </section>

      {/* API status */}
      <section className="space-y-4">
        <h2 className="text-sm text-[var(--text-2)] uppercase tracking-widest">API Connections</h2>
        <div className="bg-[var(--bg-card)] border border-[var(--border)]">
          {[
            { label: 'Vinted Pro API', env: 'VINTED_PRO_ACCESS_KEY', required: true },
            { label: 'Starling Bank API', env: 'STARLING_ACCESS_TOKEN', required: false },
            { label: 'eBay API', env: 'EBAY_CLIENT_ID', required: false },
            { label: 'Claude AI', env: 'ANTHROPIC_API_KEY', required: true },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between px-4 py-3 border-b last:border-b-0 border-[var(--border)]">
              <div>
                <div className="text-sm text-[var(--text-2)]">{item.label}</div>
                <div className="font-mono text-xs text-[var(--text-subtle)]">{item.env}</div>
              </div>
              <div className={`text-xs font-mono ${item.required ? 'text-amber-400' : 'text-[var(--text-subtle)]'}`}>
                {item.required ? 'Required' : 'Optional'}
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-[var(--text-subtle)]">Configure API keys in your <code className="font-mono bg-[var(--bg-elevated)] px-1">.env.local</code> file.</p>
      </section>

      {/* Changelog */}
      <section className="space-y-4">
        <h2 className="text-sm text-[var(--text-2)] uppercase tracking-widest">Versions</h2>
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl divide-y divide-[var(--border)]">
          {CHANGELOG.map((entry) => (
            <div key={entry.version} className="px-4 py-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-[var(--text)]">{entry.version}</span>
                <span className="font-mono text-[10px] text-[var(--text-subtle)]">{entry.date}</span>
              </div>
              <ul className="space-y-0.5">
                {entry.changes.map((c, i) => (
                  <li key={i} className="text-xs text-[var(--text-muted)] flex gap-2">
                    <span className="text-[#f97316] flex-shrink-0">·</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

const CHANGELOG = [
  {
    version: 'v0.6',
    date: '26 Apr 2026 · 17:35',
    changes: [
      'Standardised all page titles to same style (uppercase, semibold, text-lg)',
      'Familjen Grotesk now applies inside the chart (SVG text nodes)',
      'Bottom nav inverted: dark background on light mode, light on dark mode',
    ],
  },
  {
    version: 'v0.5',
    date: '26 Apr 2026 · 15:00',
    changes: [
      'Familjen Grotesk replaces Poppins and JetBrains Mono site-wide',
      'Revenue chart: Today / Week / Month / Year date-range selector',
      'vs Last Month KPI card showing revenue percentage change',
      'KPI cards now link to relevant pages (Revenue, Orders, Inventory)',
      'New /revenue page: monthly breakdown with COGS, fees, VAT, order table',
      'All pages standardised to same padding (p-4 md:p-6)',
    ],
  },
  {
    version: 'v0.4',
    date: '26 Apr 2026 · 11:00',
    changes: [
      'Replaced top/side navbar with fixed bottom nav (Dashboard, Inventory, Purchases, Orders, Settings)',
      'Removed demo banner, page title and date from dashboard for cleaner mobile view',
      'Added Appearance section to Settings with light/dark mode toggle',
      'Added Versions changelog to Settings',
      'iOS safe-area inset support for bottom nav',
    ],
  },
  {
    version: 'v0.3',
    date: '25 Apr 2026 · 20:00',
    changes: [
      'Full light/dark theme system with CSS variables and localStorage persistence',
      'Pastel KPI cards with 3-column grid on mobile, 4 on desktop',
      'Revenue chart moved to top of dashboard, halved in height',
      'Icon-only dark sidebar for desktop',
    ],
  },
  {
    version: 'v0.2',
    date: '25 Apr 2026 · 14:00',
    changes: [
      'Mobile-responsive layouts with card/table dual-render pattern',
      'Inventory, Purchases and Orders pages all responsive',
      'Fixed Vercel deployment (removed standalone output mode)',
    ],
  },
  {
    version: 'v0.1',
    date: '25 Apr 2026',
    changes: [
      'Initial dashboard with KPI cards, revenue chart and P&L table',
      'Inventory, Purchases, Orders, Listings and Settings pages',
      'Supabase integration with demo mode fallback',
      'Starling Bank balance widget',
      'Smart offer rules engine',
    ],
  },
]
