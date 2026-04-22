'use client'

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { CURRENCIES } from '@/types/wallet'
import { formatCurrency } from '@/lib/utils'
import { type NetWorthAsset } from '@/types/net-worth'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon, Edit02Icon } from '@hugeicons/core-free-icons'
import { Trash2 } from 'lucide-react'
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'

interface NetWorthAssetCardProps {
  asset: NetWorthAsset
  onUpdateClick: (asset: NetWorthAsset) => void
  onRenameClick: (asset: NetWorthAsset) => void
  onDeleteClick: (asset: NetWorthAsset) => void
  onRegisterPaymentClick: (asset: NetWorthAsset) => void
}

const chartConfig = {
  portfolioValue: {
    label: 'Portfolio value',
    color: 'oklch(0.6 0.16 250)',
  },
  investedAmount: {
    label: 'Invested amount',
    color: 'oklch(0.65 0.16 140)',
  },
} satisfies ChartConfig

export function NetWorthAssetCard({
  asset,
  onUpdateClick,
  onRenameClick,
  onDeleteClick,
  onRegisterPaymentClick,
}: NetWorthAssetCardProps) {
  const currencySymbol =
    CURRENCIES.find((currency) => currency.id === asset.currency)?.symbol ??
    asset.currency

  const portfolioValueLabel = formatCurrency(
    asset.currentPortfolioValue,
    asset.currency,
    currencySymbol
  )
  const investedAmountLabel = formatCurrency(
    asset.currentInvestedAmount,
    asset.currency,
    currencySymbol
  )
  const gainLabel = formatCurrency(asset.gainAmount, asset.currency, currencySymbol)

  return (
    <Card>
      <CardHeader>
        <div className="space-y-1">
          <CardTitle>{asset.name}</CardTitle>
          <CardDescription>Retirement Account</CardDescription>
        </div>
        <CardAction className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onRenameClick(asset)}>
            <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} />
            Rename
          </Button>
          <Button variant="outline" size="sm" onClick={() => onUpdateClick(asset)}>
            <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} />
            Update values
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRegisterPaymentClick(asset)}
          >
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
            Register payment
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent size="sm">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete asset?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete {asset.name} and all of its value
                  history.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={() => onDeleteClick(asset)}
                >
                  Delete asset
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <p className="text-muted-foreground text-xs">Portfolio value</p>
            <p className="text-base font-semibold tabular-nums">
              {portfolioValueLabel}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Invested amount</p>
            <p className="text-base font-semibold tabular-nums">
              {investedAmountLabel}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Gain/Loss</p>
            <p
              className={`text-base font-semibold tabular-nums ${
                asset.gainAmount >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {gainLabel}
            </p>
          </div>
        </div>

        {asset.snapshots.length > 1 ? (
          <ChartContainer config={chartConfig} className="h-[220px] w-full">
            <LineChart data={asset.snapshots}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="createdAt"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) =>
                  new Date(value).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })
                }
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) =>
                  value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(value)
                }
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) =>
                      value != null
                        ? new Date(value as number).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : ''
                    }
                    formatter={(value) =>
                      formatCurrency(Number(value), asset.currency, currencySymbol)
                    }
                    indicator="dot"
                  />
                }
              />
              <Line
                type="monotone"
                dataKey="portfolioValue"
                stroke="var(--color-portfolioValue)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="investedAmount"
                stroke="var(--color-investedAmount)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        ) : (
          <div className="text-muted-foreground flex h-[220px] items-center justify-center rounded-none border border-dashed text-sm">
            Add another value update to see evolution
          </div>
        )}
      </CardContent>
    </Card>
  )
}
