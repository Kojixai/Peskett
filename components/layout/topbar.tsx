'use client'

import { ThemeToggle } from './theme-toggle'

interface TopbarProps {
  onMenuClick: () => void
}

export function Topbar({ onMenuClick }: TopbarProps) {
  return (
    <header className="h-14 flex items-center justify-between px-4 md:px-6 bg-[var(--bg-main)] border-b border-[var(--border)] flex-shrink-0 gap-4">
      {/* Mobile hamburger */}
      <button
        onClick={onMenuClick}
        className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] transition-all"
        aria-label="Open navigation"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Search bar */}
      <div className="hidden md:flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-3 py-2 w-72">
        <svg className="w-4 h-4 text-[var(--text-subtle)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <circle cx="11" cy="11" r="8" />
          <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
        </svg>
        <input
          placeholder="Search..."
          className="bg-transparent text-sm text-[var(--text)] placeholder-[var(--text-subtle)] outline-none flex-1"
        />
      </div>

      {/* Mobile logo (when hamburger shown) */}
      <div className="md:hidden font-mono text-base font-bold tracking-wider">
        <span className="text-[#f97316]">FLIP</span>
        <span className="text-[var(--text)]">OS</span>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-1 md:gap-2 ml-auto md:ml-0">
        <ThemeToggle />

        <button
          aria-label="Notifications"
          className="w-9 h-9 flex items-center justify-center rounded-xl text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-elevated)] transition-all"
        >
          <svg className="w-4.5 h-4.5" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" d="M15 17H9a6 6 0 006-6V9a3 3 0 00-6 0v2a6 6 0 006 6z" />
            <path strokeLinecap="round" d="M13.73 21a2 2 0 01-3.46 0" />
          </svg>
        </button>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0 cursor-pointer ml-1">
          <span className="text-white text-xs font-bold">T</span>
        </div>
      </div>
    </header>
  )
}
