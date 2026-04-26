'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: GridIcon },
  { href: '/inventory', label: 'Inventory', icon: BoxIcon },
  { href: '/purchases', label: 'Purchases', icon: ShoppingIcon },
  { href: '/listings', label: 'Listings', icon: TagIcon },
  { href: '/orders', label: 'Orders', icon: PackageIcon },
  { href: '/settings', label: 'Settings', icon: SettingsIcon },
]

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()

  return (
    <aside className="w-[68px] bg-[var(--bg-sidebar)] flex flex-col h-screen sticky top-0 flex-shrink-0">
      {/* Logo mark */}
      <div className="h-14 flex items-center justify-center border-b border-white/5 flex-shrink-0">
        <div className="w-9 h-9 bg-[#f97316] rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
          <span className="text-white font-bold text-sm tracking-wide">F</span>
        </div>
      </div>

      {/* Nav icons */}
      <nav className="flex-1 flex flex-col items-center py-4 gap-1 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              title={label}
              className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all group relative ${
                active
                  ? 'bg-white/15 text-white shadow-lg shadow-black/10'
                  : 'text-white/40 hover:text-white/80 hover:bg-white/8'
              }`}
            >
              <Icon className="w-5 h-5" />
              {/* Tooltip */}
              <span className="absolute left-full ml-3 px-2 py-1 bg-[#1e2235] text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity shadow-xl border border-white/10 z-50 hidden md:block">
                {label}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* Bottom: close button on mobile, avatar on desktop */}
      <div className="flex flex-col items-center pb-5 gap-3 flex-shrink-0">
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl text-white/40 hover:text-white/80 hover:bg-white/8 transition-all"
            aria-label="Close menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center cursor-pointer">
          <span className="text-white text-xs font-bold">T</span>
        </div>
      </div>
    </aside>
  )
}

function GridIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <rect x="3" y="3" width="7" height="7" strokeLinejoin="round" />
      <rect x="14" y="3" width="7" height="7" strokeLinejoin="round" />
      <rect x="3" y="14" width="7" height="7" strokeLinejoin="round" />
      <rect x="14" y="14" width="7" height="7" strokeLinejoin="round" />
    </svg>
  )
}
function BoxIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0v10l-8 4m0-14L4 17m8 4V11" />
    </svg>
  )
}
function ShoppingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" />
    </svg>
  )
}
function TagIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M3 3h8l9 9-8 8-9-9V3z" />
    </svg>
  )
}
function PackageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16zM3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" />
    </svg>
  )
}
function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}
