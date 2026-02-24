import type { Wallet } from '@/types/wallet'

export const MOCK_WALLETS: Wallet[] = [
  {
    id: '1',
    name: 'Main Account',
    currency: 'USD',
    color: 'emerald',
    icon: 'wallet',
    totalAmount: 4520.5,
  },
  {
    id: '2',
    name: 'Savings',
    currency: 'EUR',
    color: 'blue',
    icon: 'piggy-bank',
    totalAmount: 12800,
  },
  {
    id: '3',
    name: 'Credit Card',
    currency: 'USD',
    color: 'violet',
    icon: 'credit-card',
    totalAmount: -342.75,
  },
  {
    id: '4',
    name: 'Cash',
    currency: 'RON',
    color: 'amber',
    icon: 'safe',
    totalAmount: 1250,
  },
]
