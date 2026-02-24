'use client'

import * as React from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  InputGroup,
  InputGroupAddon,
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
import { TagCombobox } from '@/components/transactions/tag-combobox'
import { formatDateToYYYYMMDD, parseDateString } from '@/lib/utils'

export function formatDateForInput(date: Date): string {
  return formatDateToYYYYMMDD(date)
}

function formatDateDisplay(date: Date | undefined): string {
  if (!date) return ''
  return date.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export type TransactionFormData = {
  walletId: Id<'wallets'> | ''
  categoryId: Id<'categories'> | ''
  amount: string
  note: string
  date: string
  tagIds: Id<'tags'>[]
}

export const defaultTransactionFormData: TransactionFormData = {
  walletId: '' as Id<'wallets'> | '',
  categoryId: '' as Id<'categories'> | '',
  amount: '',
  note: '',
  date: formatDateForInput(new Date()),
  tagIds: [] as Id<'tags'>[],
}

export interface TransactionFormProps {
  /** Initial values for the form (e.g. when editing) */
  defaultValues?: Partial<TransactionFormData>
  /** Called when form is submitted with valid data */
  onSubmit: (data: TransactionFormData) => void | Promise<void>
  /** Label for the submit button */
  submitLabel?: string
  /** Optional cancel handler (e.g. for dialog) */
  onCancel?: () => void
  /** Show "Keep form open for bulk adding" checkbox */
  showKeepFormOpen?: boolean
  /** Controlled keep form open state (when showKeepFormOpen is true) */
  keepFormOpen?: boolean
  /** Called when keep form open checkbox changes */
  onKeepFormOpenChange?: (checked: boolean) => void
  /** Additional class name for the form */
  className?: string
}

export function TransactionForm({
  defaultValues,
  onSubmit,
  submitLabel = 'Add transaction',
  onCancel,
  showKeepFormOpen = false,
  keepFormOpen = false,
  onKeepFormOpenChange,
  className,
}: TransactionFormProps) {
  const [formData, setFormData] = React.useState<TransactionFormData>(() => ({
    ...defaultTransactionFormData,
    ...defaultValues,
  }))
  const [categoryType, setCategoryType] = React.useState<
    'income' | 'expense' | 'transfer'
  >('expense')
  const [datePickerOpen, setDatePickerOpen] = React.useState(false)
  const [dateMonth, setDateMonth] = React.useState<Date | undefined>(() =>
    formData.date ? parseDateString(formData.date) : new Date()
  )
  const [errors, setErrors] = React.useState<
    Partial<Record<keyof TransactionFormData, string>>
  >({})

  const wallets = useQuery(api.wallets.list) ?? []
  const expenseCategories = useQuery(api.categories.list, { type: 'expense' }) ?? []
  const incomeCategories = useQuery(api.categories.list, { type: 'income' }) ?? []

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

  // Only sync from defaultValues when editing (has walletId) - avoids resetting create form on re-render
  const isEditMode = defaultValues && 'walletId' in defaultValues && !!defaultValues.walletId
  React.useEffect(() => {
    if (isEditMode && defaultValues) {
      setFormData((prev) => ({ ...prev, ...defaultValues }))
      if (defaultValues.categoryId) {
        const isExpense = expenseCategories.some(
          (c) => c.id === defaultValues!.categoryId
        )
        const isIncome = incomeCategories.some(
          (c) => c.id === defaultValues!.categoryId
        )
        if (isExpense) setCategoryType('expense')
        else if (isIncome) setCategoryType('income')
      }
    }
  }, [isEditMode, defaultValues, expenseCategories, incomeCategories])

  React.useEffect(() => {
    setDateMonth(formData.date ? parseDateString(formData.date) : new Date())
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Partial<Record<keyof TransactionFormData, string>> = {}

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

    try {
      await onSubmit(formData)
      setErrors({})

      if (!showKeepFormOpen || !keepFormOpen) {
        setFormData({
          ...defaultTransactionFormData,
          ...defaultValues,
          date: formatDateForInput(new Date()),
        })
      } else {
        setFormData((prev) => ({
          ...prev,
          tagIds: [],
          date: formatDateForInput(new Date()),
        }))
      }
    } catch {
      // Let parent handle errors (e.g. toast)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={className}
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

          <Field>
            <FieldLabel>Date</FieldLabel>
            <Popover
              open={datePickerOpen}
              onOpenChange={setDatePickerOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  aria-invalid={!!errors.date}
                  className={`w-full justify-start text-left font-normal ${!formData.date ? 'text-muted-foreground' : ''}`}
                >
                  <CalendarIcon className="mr-2 size-4" />
                  {formData.date
                    ? formatDateDisplay(parseDateString(formData.date))
                    : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto overflow-hidden p-0"
                align="start"
                sideOffset={4}
              >
                <Calendar
                  mode="single"
                  selected={
                    formData.date
                      ? parseDateString(formData.date)
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
            <FieldError
              errors={
                errors.date
                  ? [{ message: errors.date }]
                  : undefined
              }
            />
          </Field>

          <Field className="sm:col-span-2">
            <FieldLabel>Tags</FieldLabel>
            <TagCombobox
              value={formData.tagIds}
              onChange={(tagIds) =>
                setFormData((prev) => ({
                  ...prev,
                  tagIds,
                }))
              }
              placeholder="Search or create tags"
            />
          </Field>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {showKeepFormOpen && (
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox
                checked={keepFormOpen}
                onCheckedChange={(checked) =>
                  onKeepFormOpenChange?.(checked === true)
                }
              />
              <span>Keep form open for bulk adding</span>
            </label>
          )}
          <Button type="submit">{submitLabel}</Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </FieldGroup>
    </form>
  )
}
