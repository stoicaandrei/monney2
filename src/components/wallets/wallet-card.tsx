'use client'

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardAction,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { WalletIcon } from '@/components/wallets/wallet-icons'
import { formatCurrency } from '@/lib/utils'
import { CURRENCIES, WALLET_COLORS, type Wallet } from '@/types/wallet'
import { HugeiconsIcon } from '@hugeicons/react'
import { Edit02Icon } from '@hugeicons/core-free-icons'
import { cn } from '@/lib/utils'

interface WalletCardProps {
  wallet: Wallet
  onEdit: (wallet: Wallet) => void
}

export function WalletCard({ wallet, onEdit }: WalletCardProps) {
  const currency = CURRENCIES.find((c) => c.id === wallet.currency)
  const colorConfig = WALLET_COLORS.find((c) => c.id === wallet.color)
  const formattedAmount = formatCurrency(
    wallet.totalAmount,
    wallet.currency,
    currency?.symbol,
  )

  return (
    <Card
      className={cn(
        'group relative overflow-hidden transition-all hover:ring-2 hover:ring-offset-2',
        'data-[slot=card]:shadow-sm',
      )}
      style={
        {
          '--wallet-accent': colorConfig?.value ?? '#64748b',
        } as React.CSSProperties
      }
    >
      <div
        className="absolute inset-x-0 top-0 h-1"
        style={{ backgroundColor: 'var(--wallet-accent)' }}
      />
      <CardHeader>
        <CardAction>
          <Button
            variant="ghost"
            size="icon-sm"
            className="opacity-0 transition-opacity group-hover:opacity-100"
            onClick={() => onEdit(wallet)}
          >
            <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} />
            <span className="sr-only">Edit wallet</span>
          </Button>
        </CardAction>
        <div className="flex items-start gap-3">
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-none ring-1 ring-black/5"
            style={{ backgroundColor: `${colorConfig?.value}20` }}
          >
            <span style={{ color: colorConfig?.value }}>
              <WalletIcon
                iconId={wallet.icon}
                className="size-5"
                strokeWidth={2}
              />
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className="truncate text-base">{wallet.name}</CardTitle>
            <CardDescription className="flex items-center gap-1.5">
              <span className="uppercase">{wallet.currency}</span>
              <span className="text-muted-foreground/60">•</span>
              <span>{currency?.label}</span>
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p
          className={cn(
            'text-2xl font-semibold tabular-nums',
            wallet.totalAmount < 0 && 'text-destructive',
          )}
        >
          {formattedAmount}
        </p>
      </CardContent>
    </Card>
  )
}
