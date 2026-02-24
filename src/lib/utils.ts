import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function formatCurrency(
  amount: number,
  currency: string,
  symbol?: string
): string {
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount))
  const sign = amount < 0 ? '-' : ''
  const sym = symbol ?? currency
  const spacer = sym.length > 1 ? ' ' : ''
  return `${sign}${sym}${spacer}${formatted}`
}

/** Format a number for display in a currency input (locale-aware, 2 decimals) */
export function formatCurrencyInput(value: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

/** Parse a string input into a number (handles locale formatting) */
export function parseCurrencyInput(value: string): number {
  const cleaned = value.replace(/[^\d.-]/g, '')
  const parsed = parseFloat(cleaned)
  return Number.isNaN(parsed) ? 0 : parsed
}

/**
 * Format a Date to YYYY-MM-DD using local timezone.
 * Use this for date-only values (e.g. transaction dates) to avoid timezone shifts.
 */
export function formatDateToYYYYMMDD(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Parse a YYYY-MM-DD string to a Date at local midnight.
 * Avoids timezone shift: new Date("2025-02-22") is UTC midnight, which can
 * display as the previous day in timezones behind UTC.
 */
export function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}
