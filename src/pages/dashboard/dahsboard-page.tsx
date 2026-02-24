'use client'

import * as React from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts'
import { AppSidebar } from '@/components/layout/sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Receipt } from 'lucide-react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ChartUpIcon,
  ChartDownIcon,
  Wallet01Icon,
} from '@hugeicons/core-free-icons'

const chartConfig = {
  income: {
    label: 'Income',
    color: 'oklch(0.65 0.15 160)',
  },
  expenses: {
    label: 'Expenses',
    color: 'oklch(0.65 0.18 25)',
  },
  value: {
    label: 'Amount',
    color: 'hsl(var(--chart-1))',
  },
  cumulativeIncome: {
    label: 'Cumulative Income',
    color: 'oklch(0.65 0.15 160)',
  },
  cumulativeExpenses: {
    label: 'Cumulative Expenses',
    color: 'oklch(0.65 0.18 25)',
  },
} satisfies ChartConfig

export default function DashboardPage() {
  const [days, setDays] = React.useState(30)
  const stats = useQuery(api.dashboard.stats, { days })
  const dailyBreakdown = useQuery(api.dashboard.dailyBreakdown, { days })
  const expensesByCategory = useQuery(api.dashboard.expensesByCategory, { days })
  const wallets = useQuery(api.wallets.list) ?? []
  const currency = wallets[0]?.currency ?? 'USD'

  const formatCurrency = (value: number) =>
    value.toLocaleString(undefined, { style: 'currency', currency })

  const pieData = React.useMemo(
    () =>
      (expensesByCategory ?? []).map((item) => ({
        ...item,
        fill: item.color,
      })),
    [expensesByCategory]
  )

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
        <SiteHeader title="Dashboard" />
        <div className="@container/main flex flex-1 flex-col gap-6 px-4 py-6 lg:px-6">
          {/* Summary cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="overflow-hidden border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent dark:from-emerald-500/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardDescription>Total Income</CardDescription>
                <HugeiconsIcon
                  icon={ChartUpIcon}
                  strokeWidth={2}
                  className="text-emerald-600 dark:text-emerald-400 size-5"
                />
              </CardHeader>
              <CardContent>
                <CardTitle className="text-2xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                  {stats ? formatCurrency(stats.income) : '—'}
                </CardTitle>
                <p className="text-muted-foreground text-xs">
                  Last {days} days
                </p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-rose-500/20 bg-gradient-to-br from-rose-500/5 to-transparent dark:from-rose-500/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardDescription>Total Expenses</CardDescription>
                <HugeiconsIcon
                  icon={ChartDownIcon}
                  strokeWidth={2}
                  className="text-rose-600 dark:text-rose-400 size-5"
                />
              </CardHeader>
              <CardContent>
                <CardTitle className="text-2xl font-semibold tabular-nums text-rose-600 dark:text-rose-400">
                  {stats ? formatCurrency(stats.expenses) : '—'}
                </CardTitle>
                <p className="text-muted-foreground text-xs">
                  Last {days} days
                </p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent dark:from-blue-500/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardDescription>Balance</CardDescription>
                <HugeiconsIcon
                  icon={Wallet01Icon}
                  strokeWidth={2}
                  className="text-blue-600 dark:text-blue-400 size-5"
                />
              </CardHeader>
              <CardContent>
                <CardTitle
                  className={`text-2xl font-semibold tabular-nums ${
                    stats && stats.balance >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {stats ? formatCurrency(stats.balance) : '—'}
                </CardTitle>
                <p className="text-muted-foreground text-xs">
                  Income − expenses
                </p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-transparent dark:from-violet-500/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardDescription>Transactions</CardDescription>
                <Receipt
                  className="text-violet-600 dark:text-violet-400 size-5"
                  strokeWidth={2}
                />
              </CardHeader>
              <CardContent>
                <CardTitle className="text-2xl font-semibold tabular-nums text-violet-600 dark:text-violet-400">
                  {stats?.transactionCount ?? '—'}
                </CardTitle>
                <p className="text-muted-foreground text-xs">
                  Last {days} days
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Time range selector */}
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">Time range:</span>
            <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="14">Last 14 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Charts row */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Income vs Expenses over time */}
            <Card>
              <CardHeader>
                <CardTitle>Income vs Expenses</CardTitle>
                <CardDescription>
                  Daily breakdown for the selected period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={chartConfig}
                  className="aspect-auto h-[280px] w-full"
                >
                  <BarChart data={dailyBreakdown ?? []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="date"
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
                      tickFormatter={(v) =>
                        v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)
                      }
                    />
                    <ChartTooltip
                      cursor={false}
                      content={
                        <ChartTooltipContent
                          labelFormatter={(value) =>
                            new Date(value).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })
                          }
                          formatter={(value) =>
                            formatCurrency(Number(value))
                          }
                          indicator="dot"
                        />
                      }
                    />
                    <Bar
                      dataKey="income"
                      fill="var(--color-income)"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="expenses"
                      fill="var(--color-expenses)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Expenses by category pie chart */}
            <Card>
              <CardHeader>
                <CardTitle>Expenses by Category</CardTitle>
                <CardDescription>
                  How your spending is distributed
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pieData.length > 0 ? (
                  <ChartContainer
                    config={chartConfig}
                    className="aspect-square h-[280px] w-full"
                  >
                    <PieChart>
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            labelFormatter={(_, payload) =>
                              payload?.[0]?.payload?.name ??
                              payload?.[0]?.name ??
                              ''
                            }
                            formatter={(value) =>
                              formatCurrency(Number(value))
                            }
                            indicator="dot"
                          />
                        }
                      />
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        strokeWidth={2}
                        stroke="var(--background)"
                      />
                    </PieChart>
                  </ChartContainer>
                ) : (
                  <div className="flex aspect-square h-[280px] w-full items-center justify-center rounded-lg border border-dashed">
                    <p className="text-muted-foreground text-sm">
                      No expenses in this period
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Cash flow trend (area chart) */}
          <Card>
            <CardHeader>
              <CardTitle>Cash Flow Trend</CardTitle>
              <CardDescription>
                Cumulative income and expenses over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={chartConfig}
                className="aspect-auto h-[260px] w-full"
              >
                <AreaChart
                  data={
                    (dailyBreakdown ?? []).map((d, i, arr) => {
                      let cumIncome = 0
                      let cumExpenses = 0
                      for (let j = 0; j <= i; j++) {
                        cumIncome += arr[j].income
                        cumExpenses += arr[j].expenses
                      }
                      return {
                        ...d,
                        cumulativeIncome: cumIncome,
                        cumulativeExpenses: cumExpenses,
                        net: cumIncome - cumExpenses,
                      }
                    })
                  }
                >
                  <defs>
                    <linearGradient id="fillIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="var(--color-income)"
                        stopOpacity={0.4}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--color-income)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                    <linearGradient
                      id="fillExpenses"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="var(--color-expenses)"
                        stopOpacity={0.4}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--color-expenses)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
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
                    tickFormatter={(v) =>
                      v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)
                    }
                  />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        labelFormatter={(value) =>
                          new Date(value).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })
                        }
                        formatter={(value) =>
                          formatCurrency(Number(value))
                        }
                        indicator="dot"
                      />
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="cumulativeIncome"
                    stroke="var(--color-income)"
                    fill="url(#fillIncome)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="cumulativeExpenses"
                    stroke="var(--color-expenses)"
                    fill="url(#fillExpenses)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <p className="text-muted-foreground text-xs">
            Currency conversion coming soon.
          </p>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
