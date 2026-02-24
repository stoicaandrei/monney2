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
