'use client'

import * as React from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { AppSidebar } from '@/components/layout/sidebar/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty'
import { NetWorthAssetFormDialog } from '@/components/net-worth/net-worth-asset-form-dialog'
import { NetWorthValueUpdateDialog } from '@/components/net-worth/net-worth-value-update-dialog'
import { NetWorthRenameAssetDialog } from '@/components/net-worth/net-worth-rename-asset-dialog'
import { NetWorthRegisterPaymentDialog } from '@/components/net-worth/net-worth-register-payment-dialog'
import { NetWorthAssetCard } from '@/components/net-worth/net-worth-asset-card'
import {
  type NetWorthAsset,
  type CreateNetWorthAssetFormData,
  type NetWorthRegisterPaymentFormData,
  type NetWorthValueUpdateFormData,
} from '@/types/net-worth'
import { CURRENCIES } from '@/types/wallet'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon } from '@hugeicons/core-free-icons'
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'

const evolutionChartConfig = {
  totalPortfolioValue: {
    label: 'Net worth',
    color: 'oklch(0.6 0.16 250)',
  },
  totalInvestedAmount: {
    label: 'Invested amount',
    color: 'oklch(0.65 0.16 140)',
  },
} satisfies ChartConfig

export default function NetWorthPage() {
  const assetsQuery = useQuery(api.netWorth.listAssets)
  const assets = React.useMemo(
    () => (assetsQuery ?? []) as NetWorthAsset[],
    [assetsQuery]
  )
  const netWorthEvolution = useQuery(api.netWorth.netWorthEvolution) ?? []
  const preferences = useQuery(api.userPreferences.get)
  const defaultCurrency = preferences?.defaultCurrency ?? 'EUR'

  const createAsset = useMutation(api.netWorth.createAsset)
  const addSnapshot = useMutation(api.netWorth.addSnapshot)
  const renameAsset = useMutation(api.netWorth.renameAsset)
  const deleteAsset = useMutation(api.netWorth.deleteAsset)
  const registerPayment = useMutation(api.netWorth.registerPayment)

  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false)
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = React.useState(false)
  const [isRenameDialogOpen, setIsRenameDialogOpen] = React.useState(false)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = React.useState(false)
  const [selectedAsset, setSelectedAsset] = React.useState<NetWorthAsset | null>(
    null
  )

  const displayCurrency = assets[0]?.currency ?? defaultCurrency
  const currencySymbol =
    CURRENCIES.find((currency) => currency.id === displayCurrency)?.symbol ??
    displayCurrency

  const totals = React.useMemo(() => {
    return assets.reduce(
      (accumulator, asset) => {
        accumulator.portfolioValue += asset.currentPortfolioValue
        accumulator.investedAmount += asset.currentInvestedAmount
        return accumulator
      },
      { portfolioValue: 0, investedAmount: 0 }
    )
  }, [assets])

  const gainAmount = totals.portfolioValue - totals.investedAmount

  const handleCreateAsset = (data: CreateNetWorthAssetFormData) => {
    createAsset(data)
      .then(() => {
        toast.success('Asset added')
      })
      .catch((error: unknown) => {
        toast.error(
          `Could not create asset: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      })
  }

  const openUpdateDialog = (asset: NetWorthAsset) => {
    setSelectedAsset(asset)
    setIsUpdateDialogOpen(true)
  }

  const openRenameDialog = (asset: NetWorthAsset) => {
    setSelectedAsset(asset)
    setIsRenameDialogOpen(true)
  }

  const openPaymentDialog = (asset: NetWorthAsset) => {
    setSelectedAsset(asset)
    setIsPaymentDialogOpen(true)
  }

  const handleRenameAsset = (name: string) => {
    if (!selectedAsset) return
    renameAsset({
      assetId: selectedAsset.id as Id<'netWorthAssets'>,
      name,
    })
      .then(() => {
        toast.success('Asset renamed')
      })
      .catch((error: unknown) => {
        toast.error(
          `Could not rename asset: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      })
  }

  const handleValueUpdate = (data: NetWorthValueUpdateFormData) => {
    if (!selectedAsset) return
    addSnapshot({
      assetId: selectedAsset.id as Id<'netWorthAssets'>,
      portfolioValue: data.portfolioValue,
      investedAmount: data.investedAmount,
    })
      .then(() => {
        toast.success('Asset values updated')
      })
      .catch((error: unknown) => {
        toast.error(
          `Could not update values: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      })
  }

  const handleDeleteAsset = (asset: NetWorthAsset) => {
    deleteAsset({
      assetId: asset.id as Id<'netWorthAssets'>,
    })
      .then(() => {
        toast.success('Asset deleted')
      })
      .catch((error: unknown) => {
        toast.error(
          `Could not delete asset: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      })
  }

  const handleRegisterPayment = (data: NetWorthRegisterPaymentFormData) => {
    if (!selectedAsset) return
    registerPayment({
      assetId: selectedAsset.id as Id<'netWorthAssets'>,
      amount: data.amount,
    })
      .then(() => {
        toast.success('Payment registered')
      })
      .catch((error: unknown) => {
        toast.error(
          `Could not register payment: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      })
  }

  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 72)',
          '--header-height': 'calc(var(--spacing) * 12)',
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader title="Net Worth" />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-6 py-4 md:py-6">
              <div className="flex flex-col gap-4 px-4 lg:px-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h1 className="text-xl font-semibold tracking-tight">
                      Net Worth
                    </h1>
                    <p className="text-muted-foreground text-sm">
                      Track retirement accounts and compare invested amount vs
                      portfolio value
                    </p>
                  </div>
                  <Button
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="w-fit"
                  >
                    <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
                    Add asset
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Total net worth</CardDescription>
                      <CardTitle className="text-2xl font-semibold tabular-nums">
                        {formatCurrency(
                          totals.portfolioValue,
                          displayCurrency,
                          currencySymbol
                        )}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Total invested</CardDescription>
                      <CardTitle className="text-2xl font-semibold tabular-nums">
                        {formatCurrency(
                          totals.investedAmount,
                          displayCurrency,
                          currencySymbol
                        )}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Gain/Loss</CardDescription>
                      <CardTitle
                        className={`text-2xl font-semibold tabular-nums ${
                          gainAmount >= 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {formatCurrency(gainAmount, displayCurrency, currencySymbol)}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Net Worth Evolution</CardTitle>
                    <CardDescription>
                      Combined portfolio value and invested amount across all
                      assets
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {netWorthEvolution.length > 1 ? (
                      <ChartContainer
                        config={evolutionChartConfig}
                        className="h-[280px] w-full"
                      >
                        <LineChart data={netWorthEvolution}>
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
                              value >= 1000
                                ? `${(value / 1000).toFixed(1)}k`
                                : String(value)
                            }
                          />
                          <ChartTooltip
                            cursor={false}
                            content={
                              <ChartTooltipContent
                                labelFormatter={(value) =>
                                  value != null
                                    ? new Date(value as number).toLocaleDateString(
                                        'en-US',
                                        {
                                          weekday: 'short',
                                          month: 'short',
                                          day: 'numeric',
                                          year: 'numeric',
                                        }
                                      )
                                    : ''
                                }
                                formatter={(value) =>
                                  formatCurrency(
                                    Number(value),
                                    displayCurrency,
                                    currencySymbol
                                  )
                                }
                                indicator="dot"
                              />
                            }
                          />
                          <Line
                            type="monotone"
                            dataKey="totalPortfolioValue"
                            stroke="var(--color-totalPortfolioValue)"
                            strokeWidth={2}
                            dot={false}
                          />
                          <Line
                            type="monotone"
                            dataKey="totalInvestedAmount"
                            stroke="var(--color-totalInvestedAmount)"
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ChartContainer>
                    ) : (
                      <div className="text-muted-foreground flex h-[280px] items-center justify-center rounded-none border border-dashed text-sm">
                        Add at least two updates to see net worth evolution
                      </div>
                    )}
                  </CardContent>
                </Card>

                {assets.length === 0 ? (
                  <Empty className="border">
                    <EmptyHeader>
                      <EmptyTitle>No assets yet</EmptyTitle>
                      <EmptyDescription>
                        Add your first retirement account to start tracking net
                        worth.
                      </EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                      <Button onClick={() => setIsCreateDialogOpen(true)}>
                        <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
                        Add first asset
                      </Button>
                    </EmptyContent>
                  </Empty>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {assets.map((asset) => (
                      <NetWorthAssetCard
                        key={asset.id}
                        asset={asset}
                        onRenameClick={openRenameDialog}
                        onUpdateClick={openUpdateDialog}
                        onDeleteClick={handleDeleteAsset}
                        onRegisterPaymentClick={openPaymentDialog}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <footer className="border-t px-4 py-3 lg:px-6">
            <p className="text-muted-foreground text-xs">
              Multi-currency conversion is not included yet.
            </p>
          </footer>
        </div>
      </SidebarInset>

      <NetWorthAssetFormDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={handleCreateAsset}
        defaultCurrency={defaultCurrency}
      />
      <NetWorthValueUpdateDialog
        open={isUpdateDialogOpen}
        onOpenChange={setIsUpdateDialogOpen}
        asset={selectedAsset}
        onSubmit={handleValueUpdate}
      />
      <NetWorthRenameAssetDialog
        open={isRenameDialogOpen}
        onOpenChange={setIsRenameDialogOpen}
        asset={selectedAsset}
        onSubmit={handleRenameAsset}
      />
      <NetWorthRegisterPaymentDialog
        open={isPaymentDialogOpen}
        onOpenChange={setIsPaymentDialogOpen}
        asset={selectedAsset}
        onSubmit={handleRegisterPayment}
      />
    </SidebarProvider>
  )
}
