'use client'

import { Sidebar } from './sidebar'
import { BottomNav } from './bottom-nav'

export function NavLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-[var(--bg-main)] overflow-hidden">
      {/* Sidebar — desktop only */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Main content — extra bottom padding on mobile for the bottom nav */}
      <main className="flex-1 min-w-0 overflow-y-auto pb-20 md:pb-0">
        {children}
      </main>

      {/* Bottom nav — mobile only */}
      <BottomNav />
    </div>
  )
}
