import { HugeiconsIcon } from '@hugeicons/react'
import {
  Wallet01Icon,
  BankIcon,
  CreditCardIcon,
  PiggyBankIcon,
  SafeIcon,
  MoneySafeIcon,
} from '@hugeicons/core-free-icons'
import type { WalletIconId } from '@/types/wallet'

const iconMap = {
  wallet: Wallet01Icon,
  bank: BankIcon,
  'credit-card': CreditCardIcon,
  'piggy-bank': PiggyBankIcon,
  safe: SafeIcon,
  vault: MoneySafeIcon,
} as const satisfies Record<WalletIconId, typeof Wallet01Icon>

export function getWalletIcon(iconId: WalletIconId) {
  return iconMap[iconId]
}

export function WalletIcon({
  iconId,
  className,
  strokeWidth = 2,
}: {
  iconId: WalletIconId
  className?: string
  strokeWidth?: number
}) {
  const Icon = getWalletIcon(iconId)
  return <HugeiconsIcon icon={Icon} strokeWidth={strokeWidth} className={className} />
}

export const WALLET_ICON_OPTIONS: { id: WalletIconId; label: string }[] = [
  { id: 'wallet', label: 'Wallet' },
  { id: 'bank', label: 'Bank' },
  { id: 'credit-card', label: 'Credit Card' },
  { id: 'piggy-bank', label: 'Piggy Bank' },
  { id: 'safe', label: 'Safe' },
  { id: 'vault', label: 'Vault' },
]
