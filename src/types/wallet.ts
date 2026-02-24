export type WalletIconId =
  | 'wallet'
  | 'bank'
  | 'credit-card'
  | 'piggy-bank'
  | 'safe'
  | 'vault'

export const WALLET_COLORS = [
  { id: 'emerald', value: '#10b981', label: 'Emerald' },
  { id: 'blue', value: '#3b82f6', label: 'Blue' },
  { id: 'violet', value: '#8b5cf6', label: 'Violet' },
  { id: 'amber', value: '#f59e0b', label: 'Amber' },
  { id: 'rose', value: '#f43f5e', label: 'Rose' },
  { id: 'cyan', value: '#06b6d4', label: 'Cyan' },
  { id: 'slate', value: '#64748b', label: 'Slate' },
  { id: 'orange', value: '#f97316', label: 'Orange' },
] as const

export const CURRENCIES = [
  { id: 'USD', symbol: '$', label: 'US Dollar' },
  { id: 'EUR', symbol: '€', label: 'Euro' },
  { id: 'GBP', symbol: '£', label: 'British Pound' },
  { id: 'RON', symbol: 'lei', label: 'Romanian Leu' },
  { id: 'JPY', symbol: '¥', label: 'Japanese Yen' },
  { id: 'CHF', symbol: 'Fr', label: 'Swiss Franc' },
] as const

export interface Wallet {
  id: string
  name: string
  currency: (typeof CURRENCIES)[number]['id']
  color: (typeof WALLET_COLORS)[number]['id']
  icon: WalletIconId
  totalAmount: number
}

export interface WalletFormData {
  name: string
  currency: (typeof CURRENCIES)[number]['id']
  color: (typeof WALLET_COLORS)[number]['id']
  icon: WalletIconId
}
