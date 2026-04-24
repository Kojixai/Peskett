'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
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
    <div className="p-6 max-w-2xl space-y-8">
      <div>
        <h1 className="text-lg font-semibold text-zinc-100 uppercase tracking-widest">Settings</h1>
        <p className="text-xs text-zinc-500 mt-0.5">Offer rules and configuration</p>
      </div>

      {/* Offer rules */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm text-zinc-300 uppercase tracking-widest">Smart Offer Rules</h2>
        </div>

        <div className="bg-[#111113] border border-[#27272a] p-4 space-y-4">
          <p className="text-xs text-zinc-500">
            Set rules for automatically accepting, countering, or rejecting offers on Vinted.
          </p>

          {rules.length > 0 && (
            <div className="space-y-2">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-center justify-between p-3 bg-[#18181b] border border-[#27272a]"
                >
                  <div className="space-y-1">
                    <div className="text-sm text-zinc-200 font-medium">{rule.rule_name}</div>
                    <div className="text-xs text-zinc-500 font-mono">
                      Accept ≥{rule.min_accept_percent}% · Counter at {rule.counter_percent}% · Reject &lt;{rule.auto_reject_below}%
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <div
                        onClick={() => toggleRule(rule.id, !rule.active)}
                        className={`w-8 h-4 relative transition-colors cursor-pointer ${
                          rule.active ? 'bg-[#f97316]' : 'bg-[#27272a]'
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 w-3 h-3 bg-white transition-transform ${
                            rule.active ? 'translate-x-4' : 'translate-x-0.5'
                          }`}
                        />
                      </div>
                      <span className="text-xs text-zinc-500">{rule.active ? 'Active' : 'Off'}</span>
                    </label>
                    <button
                      onClick={() => deleteRule(rule.id)}
                      className="text-xs text-zinc-600 hover:text-red-400 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={saveRule} className="space-y-3 pt-2 border-t border-[#27272a]">
            <div className="text-xs text-zinc-500 uppercase tracking-widest">Add Rule</div>
            <Input
              label="Rule Name"
              value={ruleName}
              onChange={(e) => setRuleName(e.target.value)}
              placeholder="e.g. Default Rule"
              required
            />
            <div className="grid grid-cols-3 gap-3">
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
        <h2 className="text-sm text-zinc-300 uppercase tracking-widest">API Connections</h2>
        <div className="bg-[#111113] border border-[#27272a]">
          {[
            { label: 'Vinted Pro API', env: 'VINTED_PRO_ACCESS_KEY', required: true },
            { label: 'Starling Bank API', env: 'STARLING_ACCESS_TOKEN', required: false },
            { label: 'eBay API', env: 'EBAY_CLIENT_ID', required: false },
            { label: 'Claude AI', env: 'ANTHROPIC_API_KEY', required: true },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between px-4 py-3 border-b last:border-b-0 border-[#1e1e22]">
              <div>
                <div className="text-sm text-zinc-300">{item.label}</div>
                <div className="font-mono text-xs text-zinc-600">{item.env}</div>
              </div>
              <div className={`text-xs font-mono ${item.required ? 'text-amber-400' : 'text-zinc-600'}`}>
                {item.required ? 'Required' : 'Optional'}
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-zinc-600">Configure API keys in your <code className="font-mono bg-[#18181b] px-1">.env.local</code> file.</p>
      </section>
    </div>
  )
}
