'use client'

import * as React from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { AppSidebar } from '@/components/layout/sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { PenSquareIcon, Trash2 } from 'lucide-react'
import { TransactionForm, formatDateForInput } from '@/components/transactions/transaction-form'
import {
  TransactionFormDialog,
  type TransactionForEdit,
} from '@/components/transactions/transaction-form-dialog'

export default function TransactionsPage() {
  const [keepFormOpen, setKeepFormOpen] = React.useState(false)
  const [editTransaction, setEditTransaction] =
    React.useState<TransactionForEdit | null>(null)

  const wallets = useQuery(api.wallets.list) ?? []
  const expenseCategories = useQuery(api.categories.list, { type: 'expense' }) ?? []
  const incomeCategories = useQuery(api.categories.list, { type: 'income' }) ?? []
  const tags = useQuery(api.tags.list) ?? []
  const transactions = useQuery(api.transactions.list, {}) ?? []
  const createTransaction = useMutation(api.transactions.create)
  const removeTransaction = useMutation(api.transactions.remove)

  const handleCreateSubmit = async (data: {
    walletId: Id<'wallets'> | ''
    categoryId: Id<'categories'> | ''
    amount: string
    note: string
    date: string
    tagIds: Id<'tags'>[]
  }) => {
    const amountNum = parseFloat(data.amount)
    await createTransaction({
      walletId: data.walletId as Id<'wallets'>,
      categoryId: data.categoryId as Id<'categories'>,
      amount: amountNum,
      note: data.note.trim() || undefined,
      date: new Date(data.date).getTime(),
      tagIds: data.tagIds.length > 0 ? data.tagIds : undefined,
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
        <SiteHeader title="Transactions" />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="flex flex-col gap-4 px-4 lg:px-6">
                <div>
                  <h1 className="text-xl font-semibold tracking-tight">
                    Transactions
                  </h1>
                  <p className="text-muted-foreground text-sm">
                    Add and track your income and expenses
                  </p>
                </div>

                <div className="flex flex-col gap-4 rounded-lg border p-4">
                  <TransactionForm
                    defaultValues={{
                      date: formatDateForInput(new Date()),
                    }}
                    onSubmit={handleCreateSubmit}
                    submitLabel="Add transaction"
                    showKeepFormOpen
                    keepFormOpen={keepFormOpen}
                    onKeepFormOpenChange={setKeepFormOpen}
                  />
                </div>

                {transactions.length > 0 && (() => {
                  const sliced = transactions.slice(0, 20)
                  const grouped = sliced.reduce<Record<string, typeof sliced>>((acc, tx) => {
                    const key = new Date(tx.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                    ;(acc[key] ??= []).push(tx)
                    return acc
                  }, {})
                  const dateKeys = Object.keys(grouped)

                  return (
                    <div className="flex flex-col gap-4">
                      <h2 className="text-sm font-medium">Recent transactions</h2>
                      {dateKeys.map((dateLabel) => {
                        const sectionTxs = grouped[dateLabel]
                        const totalByCurrency = sectionTxs.reduce<
                          Record<string, { sum: number; currency: string }>
                        >((acc, tx) => {
                          const wallet = wallets.find((w) => w.id === tx.walletId)
                          const currency = wallet?.currency ?? 'USD'
                          if (!acc[currency]) acc[currency] = { sum: 0, currency }
                          acc[currency].sum += tx.amount
                          return acc
                        }, {})
                        const totals = Object.values(totalByCurrency)

                        return (
                        <div key={dateLabel} className="rounded-lg border">
                          <div className="bg-muted/50 flex items-center justify-between border-b px-4 py-2">
                            <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
                              {dateLabel}
                            </span>
                            <div className="flex items-center gap-3">
                              {totals.map(({ sum, currency }) => (
                                <span
                                  key={currency}
                                  className={
                                    sum >= 0
                                      ? 'text-emerald-600 dark:text-emerald-400'
                                      : 'text-destructive'
                                  }
                                >
                                  {sum >= 0 ? '+' : ''}
                                  {sum.toLocaleString(undefined, {
                                    style: 'currency',
                                    currency,
                                  })}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="divide-y">
                            {grouped[dateLabel].map((tx) => {
                              const wallet = wallets.find((w) => w.id === tx.walletId)
                              const category =
                                [...expenseCategories, ...incomeCategories].find(
                                  (c) => c.id === tx.categoryId
                                )
                              return (
                                <div
                                  key={tx.id}
                                  className="group flex items-center justify-between px-4 py-3"
                                >
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-sm font-medium">
                                      {category?.name ?? '—'}
                                    </span>
                                    <span className="text-muted-foreground text-xs">
                                      {wallet ? `${wallet.name} (${wallet.currency})` : '—'}
                                      {tx.note && ` • ${tx.note}`}
                                      {(tx.tagIds?.length ?? 0) > 0 && (
                                        <>
                                          {' • '}
                                          {(tx.tagIds ?? [])
                                            .map(
                                              (id: Id<'tags'>) =>
                                                tags.find((t: { id: Id<'tags'>; name: string }) => t.id === id)?.name ??
                                                '—'
                                            )
                                            .join(', ')}
                                        </>
                                      )}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={
                                        tx.amount >= 0
                                          ? 'text-emerald-600 dark:text-emerald-400'
                                          : 'text-destructive'
                                      }
                                    >
                                      {tx.amount >= 0 ? '+' : '-'}
                                      {Math.abs(tx.amount).toLocaleString(undefined, {
                                        style: 'currency',
                                        currency: wallet?.currency ?? 'USD',
                                      })}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="text-muted-foreground hover:text-foreground size-7 opacity-0 transition-opacity group-hover:opacity-100"
                                      onClick={() =>
                                        setEditTransaction({
                                          id: tx.id,
                                          walletId: tx.walletId,
                                          categoryId: tx.categoryId,
                                          amount: tx.amount,
                                          note: tx.note,
                                          date: tx.date,
                                          tagIds: tx.tagIds ?? [],
                                        })
                                      }
                                    >
                                      <PenSquareIcon className="size-4" />
                                      <span className="sr-only">Edit transaction</span>
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="text-muted-foreground hover:text-destructive size-7 opacity-0 transition-opacity group-hover:opacity-100"
                                      onClick={() =>
                                        removeTransaction({ id: tx.id })
                                      }
                                    >
                                      <Trash2 className="size-4" />
                                      <span className="sr-only">Delete transaction</span>
                                    </Button>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                        )
                      })}
                    </div>
                  )
                })()}
              </div>
            </div>
          </div>
        </div>

        <TransactionFormDialog
          open={!!editTransaction}
          onOpenChange={(open) => !open && setEditTransaction(null)}
          transaction={editTransaction}
        />
      </SidebarInset>
    </SidebarProvider>
  )
}
