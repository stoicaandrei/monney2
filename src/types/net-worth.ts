import { CURRENCIES } from '@/types/wallet'

export const NET_WORTH_ASSET_TYPES = [
  {
    id: 'retirement_account',
    label: 'Retirement Account',
  },
] as const

export type NetWorthAssetType = (typeof NET_WORTH_ASSET_TYPES)[number]['id']
export type NetWorthCurrency = (typeof CURRENCIES)[number]['id']

export interface NetWorthSnapshot {
  id: string
  portfolioValue: number
  investedAmount: number
  createdAt: number
}

export interface NetWorthAsset {
  id: string
  name: string
  type: NetWorthAssetType
  currency: NetWorthCurrency
  order?: number
  createdAt: number
  updatedAt: number
  currentPortfolioValue: number
  currentInvestedAmount: number
  gainAmount: number
  snapshots: NetWorthSnapshot[]
}

export interface CreateNetWorthAssetFormData {
  name: string
  type: NetWorthAssetType
  currency: NetWorthCurrency
  initialPortfolioValue: number
  initialInvestedAmount: number
}

export interface NetWorthValueUpdateFormData {
  portfolioValue: number
  investedAmount: number
}

export interface NetWorthRegisterPaymentFormData {
  amount: number
}
