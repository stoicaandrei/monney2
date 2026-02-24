'use client'

import * as React from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { AppSidebar } from '@/components/layout/sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox'
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from '@/components/ui/field'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CURRENCIES } from '@/types/wallet'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar as CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

function formatDateForInput(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function formatDateDisplay(date: Date | undefined): string {
  if (!date) return ''
  return date.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function isValidDate(date: Date | undefined): boolean {
  if (!date) return false
  return !isNaN(date.getTime())
}

const defaultFormData = {
  walletId: '' as Id<'wallets'> | '',
  categoryId: '' as Id<'categories'> | '',
  amount: '',
  note: '',
  date: formatDateForInput(new Date()),
}

export default function TransactionsPage() {
  const [formData, setFormData] = React.useState(defaultFormData)
  const [keepFormOpen, setKeepFormOpen] = React.useState(false)
  const [categoryType, setCategoryType] = React.useState<
    'income' | 'expense' | 'transfer'
  >('expense')
  const [datePickerOpen, setDatePickerOpen] = React.useState(false)
  const [dateDisplayValue, setDateDisplayValue] = React.useState(() =>
    formatDateDisplay(
      defaultFormData.date ? new Date(defaultFormData.date) : undefined
    )
  )
  const [dateMonth, setDateMonth] = React.useState<Date | undefined>(() =>
    defaultFormData.date ? new Date(defaultFormData.date) : new Date()
  )
  const [errors, setErrors] = React.useState<
    Partial<Record<keyof typeof formData, string>>
  >({})

  const wallets = useQuery(api.wallets.list) ?? []
  const expenseCategories = useQuery(api.categories.list, { type: 'expense' }) ?? []
  const incomeCategories = useQuery(api.categories.list, { type: 'income' }) ?? []
  const transactions = useQuery(api.transactions.list, {}) ?? []
  const createTransaction = useMutation(api.transactions.create)

  const walletItems = React.useMemo(
    () =>
      wallets.map((w) => ({
        value: w.id,
        label: `${w.name} (${w.currency})`,
      })),
    [wallets]
  )

  const categoryItems = React.useMemo(() => {
    if (categoryType === 'expense') {
      return expenseCategories.map((c) => ({
        value: c.id,
        label: c.name,
      }))
    }
    if (categoryType === 'income') {
      return incomeCategories.map((c) => ({
        value: c.id,
        label: c.name,
      }))
    }
    return []
  }, [categoryType, expenseCategories, incomeCategories])

  React.useEffect(() => {
    setDateDisplayValue(
      formatDateDisplay(
        formData.date ? new Date(formData.date) : undefined
      )
    )
    setDateMonth(
      formData.date ? new Date(formData.date) : new Date()
    )
  }, [formData.date])

  const selectedWallet = React.useMemo(
    () => wallets.find((w) => w.id === formData.walletId),
    [wallets, formData.walletId]
  )

  const handleCategoryTypeChange = (value: string) => {
    if (value === 'transfer') return
    const newType = value as 'income' | 'expense'
    setCategoryType(newType)
    const idsInNewType =
      newType === 'expense'
        ? expenseCategories.map((c) => c.id)
        : incomeCategories.map((c) => c.id)
    if (
      formData.categoryId &&
      !idsInNewType.includes(formData.categoryId as Id<'categories'>)
    ) {
      setFormData((prev) => ({ ...prev, categoryId: '' as Id<'categories'> }))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Partial<Record<keyof typeof formData, string>> = {}

    if (!formData.walletId) {
      newErrors.walletId = 'Wallet is required'
    }
    if (!formData.categoryId) {
      newErrors.categoryId = 'Category is required'
    }
    const amountNum = parseFloat(formData.amount)
    if (formData.amount === '' || isNaN(amountNum) || amountNum === 0) {
      newErrors.amount = 'Amount is required'
    }
    if (!formData.date) {
      newErrors.date = 'Date is required'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    const dateMs = new Date(formData.date).getTime()

    createTransaction({
      walletId: formData.walletId as Id<'wallets'>,
      categoryId: formData.categoryId as Id<'categories'>,
      amount: amountNum,
      note: formData.note.trim() || undefined,
      date: dateMs,
    }).then(() => {
      if (!keepFormOpen) {
        setFormData({
          ...defaultFormData,
          date: formatDateForInput(new Date()),
        })
      } else {
        setFormData((prev) => ({
          ...prev,
          date: formatDateForInput(new Date()),
        }))
      }
      setErrors({})
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

                <form
                  onSubmit={handleSubmit}
                  className="flex flex-col gap-4 rounded-lg border p-4"
                >
                  <FieldGroup className="gap-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
                      <Field>
                        <FieldLabel>Wallet</FieldLabel>
                        <Combobox
                          items={walletItems}
                          autoHighlight
                          value={
                            formData.walletId
                              ? walletItems.find((w) => w.value === formData.walletId) ?? null
                              : null
                          }
                          onValueChange={(v) => {
                            const id = (v && typeof v === 'object' && 'value' in v ? v.value : v) ?? ''
                            setFormData((prev) => ({
                              ...prev,
                              walletId: id as Id<'wallets'>,
                            }))
                            setErrors((prev) => ({ ...prev, walletId: undefined }))
                          }}
                        >
                          <ComboboxInput
                            className="w-full"
                            placeholder="Search or select wallet"
                            aria-invalid={!!errors.walletId}
                          />
                          <ComboboxContent>
                            <ComboboxEmpty>No wallets found.</ComboboxEmpty>
                            <ComboboxList>
                              {(item) => (
                                <ComboboxItem key={item.value} value={item}>
                                  {item.label}
                                </ComboboxItem>
                              )}
                            </ComboboxList>
                          </ComboboxContent>
                        </Combobox>
                        <FieldError
                          errors={
                            errors.walletId
                              ? [{ message: errors.walletId }]
                              : undefined
                          }
                        />
                      </Field>

                      <Field className="lg:col-span-2">
                        <FieldLabel>Category</FieldLabel>
                        <Combobox
                          items={categoryItems}
                          autoHighlight
                          value={
                            formData.categoryId
                              ? categoryItems.find((c) => c.value === formData.categoryId) ?? null
                              : null
                          }
                          onValueChange={(v) => {
                            const id = (v && typeof v === 'object' && 'value' in v ? v.value : v) ?? ''
                            setFormData((prev) => ({
                              ...prev,
                              categoryId: id as Id<'categories'>,
                            }))
                            setErrors((prev) => ({
                              ...prev,
                              categoryId: undefined,
                            }))
                          }}
                          onOpenChange={(open) => {
                            if (open && formData.categoryId) {
                              const isExpense = expenseCategories.some(
                                (c) => c.id === formData.categoryId
                              )
                              const isIncome = incomeCategories.some(
                                (c) => c.id === formData.categoryId
                              )
                              if (isExpense) setCategoryType('expense')
                              else if (isIncome) setCategoryType('income')
                            }
                          }}
                        >
                          <ComboboxInput
                            className="w-full"
                            placeholder="Search or select category"
                            aria-invalid={!!errors.categoryId}
                          />
                          <ComboboxContent>
                            <Tabs
                              value={categoryType}
                              onValueChange={handleCategoryTypeChange}
                              className="flex flex-col"
                            >
                              <TabsList className="mx-2 mt-2 shrink-0">
                                <TabsTrigger value="expense">Expense</TabsTrigger>
                                <TabsTrigger value="income">Income</TabsTrigger>
                                <TabsTrigger value="transfer" disabled>
                                  Transfer
                                </TabsTrigger>
                              </TabsList>
                              <TabsContent
                                value="expense"
                                className="mt-0 flex-1 overflow-hidden"
                              >
                                <ComboboxEmpty>No expense categories found.</ComboboxEmpty>
                                <ComboboxList>
                                  {(item) => (
                                    <ComboboxItem key={item.value} value={item}>
                                      {item.label}
                                    </ComboboxItem>
                                  )}
                                </ComboboxList>
                              </TabsContent>
                              <TabsContent
                                value="income"
                                className="mt-0 flex-1 overflow-hidden"
                              >
                                <ComboboxEmpty>No income categories found.</ComboboxEmpty>
                                <ComboboxList>
                                  {(item) => (
                                    <ComboboxItem key={item.value} value={item}>
                                      {item.label}
                                    </ComboboxItem>
                                  )}
                                </ComboboxList>
                              </TabsContent>
                              <TabsContent
                                value="transfer"
                                className="mt-0 flex-1 overflow-hidden"
                              >
                                <div className="text-muted-foreground flex items-center justify-center py-8 text-sm">
                                  Coming soon
                                </div>
                              </TabsContent>
                            </Tabs>
                          </ComboboxContent>
                        </Combobox>
                        <FieldError
                          errors={
                            errors.categoryId
                              ? [{ message: errors.categoryId }]
                              : undefined
                          }
                        />
                      </Field>

                      <Field>
                        <FieldLabel>Amount</FieldLabel>
                        <InputGroup aria-invalid={!!errors.amount}>
                          {selectedWallet && (
                            <InputGroupAddon align="inline-start">
                              <InputGroupText>
                                {CURRENCIES.find(
                                  (c) => c.id === selectedWallet.currency
                                )?.symbol ?? selectedWallet.currency}
                              </InputGroupText>
                            </InputGroupAddon>
                          )}
                          <InputGroupInput
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={formData.amount}
                            onChange={(e) => {
                              setFormData((prev) => ({
                                ...prev,
                                amount: e.target.value,
                              }))
                              setErrors((prev) => ({
                                ...prev,
                                amount: undefined,
                              }))
                            }}
                            aria-invalid={!!errors.amount}
                            autoComplete="off"
                          />
                        </InputGroup>
                        <FieldError
                          errors={
                            errors.amount
                              ? [{ message: errors.amount }]
                              : undefined
                          }
                        />
                      </Field>

                      <Field>
                        <FieldLabel htmlFor="transaction-date">Date</FieldLabel>
                        <InputGroup aria-invalid={!!errors.date}>
                          <InputGroupInput
                            id="transaction-date"
                            value={dateDisplayValue}
                            placeholder="June 01, 2025"
                            onChange={(e) => {
                              const value = e.target.value
                              setDateDisplayValue(value)
                              const date = new Date(value)
                              if (isValidDate(date)) {
                                setFormData((prev) => ({
                                  ...prev,
                                  date: formatDateForInput(date),
                                }))
                                setDateMonth(date)
                                setErrors((prev) => ({ ...prev, date: undefined }))
                              } else if (value === '') {
                                setFormData((prev) => ({
                                  ...prev,
                                  date: '',
                                }))
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'ArrowDown') {
                                e.preventDefault()
                                setDatePickerOpen(true)
                              }
                            }}
                          />
                          <InputGroupAddon align="inline-end">
                            <Popover
                              open={datePickerOpen}
                              onOpenChange={setDatePickerOpen}
                            >
                              <PopoverTrigger asChild>
                                <InputGroupButton
                                  id="date-picker"
                                  variant="ghost"
                                  size="icon-xs"
                                  aria-label="Select date"
                                >
                                  <CalendarIcon className="size-4" />
                                  <span className="sr-only">Select date</span>
                                </InputGroupButton>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-auto overflow-hidden p-0"
                                align="end"
                                alignOffset={-8}
                                sideOffset={10}
                              >
                                <Calendar
                                  mode="single"
                                  selected={
                                    formData.date
                                      ? new Date(formData.date)
                                      : undefined
                                  }
                                  month={dateMonth}
                                  onMonthChange={setDateMonth}
                                  onSelect={(date) => {
                                    if (date) {
                                      setFormData((prev) => ({
                                        ...prev,
                                        date: formatDateForInput(date),
                                      }))
                                      setDateDisplayValue(formatDateDisplay(date))
                                      setDateMonth(date)
                                      setErrors((prev) => ({
                                        ...prev,
                                        date: undefined,
                                      }))
                                      setDatePickerOpen(false)
                                    }
                                  }}
                                />
                              </PopoverContent>
                            </Popover>
                          </InputGroupAddon>
                        </InputGroup>
                        <FieldError
                          errors={
                            errors.date
                              ? [{ message: errors.date }]
                              : undefined
                          }
                        />
                      </Field>

                      <Field>
                        <FieldLabel>Note</FieldLabel>
                        <Input
                          placeholder="Optional note"
                          value={formData.note}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              note: e.target.value,
                            }))
                          }
                          autoComplete="off"
                        />
                      </Field>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                      <label className="flex cursor-pointer items-center gap-2 text-sm">
                        <Checkbox
                          checked={keepFormOpen}
                          onCheckedChange={(checked) =>
                            setKeepFormOpen(checked === true)
                          }
                        />
                        <span>Keep form open for bulk adding</span>
                      </label>
                      <Button type="submit">Add transaction</Button>
                    </div>
                  </FieldGroup>
                </form>

                {transactions.length > 0 && (
                  <div className="rounded-lg border">
                    <div className="border-b px-4 py-3">
                      <h2 className="text-sm font-medium">
                        Recent transactions
                      </h2>
                    </div>
                    <div className="divide-y">
                      {transactions.slice(0, 20).map((tx) => {
                        const wallet = wallets.find((w) => w.id === tx.walletId)
                        const category =
                          [...expenseCategories, ...incomeCategories].find(
                            (c) => c.id === tx.categoryId
                          )
                        return (
                          <div
                            key={tx.id}
                            className="flex items-center justify-between px-4 py-3"
                          >
                            <div className="flex flex-col gap-0.5">
                              <span className="text-sm font-medium">
                                {category?.name ?? '—'}
                              </span>
                              <span className="text-muted-foreground text-xs">
                                {wallet ? `${wallet.name} (${wallet.currency})` : '—'} •{' '}
                                {new Date(tx.date).toLocaleDateString()}
                                {tx.note && ` • ${tx.note}`}
                              </span>
                            </div>
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
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
