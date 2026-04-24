import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'GBP'): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

export function generateSKU(date?: Date): string {
  const d = date ?? new Date()
  const dateStr = format(d, 'yyyyMMdd')
  const seq = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
  return `TH-${dateStr}-${seq}`
}

export function getMonthRange(monthsBack = 0) {
  const d = subMonths(new Date(), monthsBack)
  return {
    start: startOfMonth(d).toISOString(),
    end: endOfMonth(d).toISOString(),
  }
}

export function formatDate(iso: string): string {
  return format(new Date(iso), 'dd MMM yyyy')
}

export function formatDateTime(iso: string): string {
  return format(new Date(iso), 'dd MMM yyyy HH:mm')
}
