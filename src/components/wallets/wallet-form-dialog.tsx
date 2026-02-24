'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from '@/components/ui/field'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  WalletIcon,
  WALLET_ICON_OPTIONS,
} from '@/components/wallets/wallet-icons'
import {
  CURRENCIES,
  WALLET_COLORS,
  type Wallet,
  type WalletFormData,
} from '@/types/wallet'
import { cn, formatCurrencyInput, parseCurrencyInput } from '@/lib/utils'

interface WalletFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  wallet?: Wallet | null
  onSubmit: (data: WalletFormData, existingId?: string) => void
}

const defaultFormData: WalletFormData = {
  name: '',
  currency: 'USD',
  color: 'emerald',
  icon: 'wallet',
  initialAmount: 0,
}

export function WalletFormDialog({
  open,
  onOpenChange,
  wallet,
  onSubmit,
}: WalletFormDialogProps) {
  const [formData, setFormData] =
    React.useState<WalletFormData>(defaultFormData)
  const [errors, setErrors] = React.useState<
    Partial<Record<keyof WalletFormData, string>>
  >({})
  const [amountInputValue, setAmountInputValue] = React.useState('')
  const [isAmountFocused, setIsAmountFocused] = React.useState(false)

  const isEditing = !!wallet

  React.useEffect(() => {
    if (open) {
      if (wallet) {
        setFormData({
          name: wallet.name,
          currency: wallet.currency,
          color: wallet.color,
          icon: wallet.icon,
          initialAmount: wallet.initialAmount,
        })
        setAmountInputValue(formatCurrencyInput(wallet.initialAmount))
      } else {
        setFormData(defaultFormData)
        setAmountInputValue(formatCurrencyInput(0))
      }
      setErrors({})
    }
  }, [open, wallet])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Partial<Record<keyof WalletFormData, string>> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    onSubmit(formData, wallet?.id)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Edit wallet' : 'Create wallet'}
            </DialogTitle>
          </DialogHeader>
          <FieldGroup className="gap-4 py-4">
            <Field>
              <FieldLabel>Name</FieldLabel>
              <Input
                placeholder="e.g. Main Account"
                value={formData.name}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                  setErrors((prev) => ({ ...prev, name: undefined }))
                }}
                aria-invalid={!!errors.name}
                autoComplete="off"
                data-1p-ignore
                data-lpignore="true"
              />
              <FieldError
                errors={errors.name ? [{ message: errors.name }] : undefined}
              />
            </Field>

            <Field>
              <FieldLabel>Initial amount</FieldLabel>
              <InputGroup>
                <InputGroupAddon>
                  <InputGroupText>
                    {CURRENCIES.find((c) => c.id === formData.currency)
                      ?.symbol ?? formData.currency}
                  </InputGroupText>
                </InputGroupAddon>
                <InputGroupInput
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={
                    isAmountFocused
                      ? amountInputValue
                      : formatCurrencyInput(formData.initialAmount)
                  }
                  onChange={(e) => {
                    const raw = e.target.value
                    setAmountInputValue(raw)
                    const parsed = parseCurrencyInput(raw)
                    setFormData((prev) => ({ ...prev, initialAmount: parsed }))
                    setErrors((prev) => ({ ...prev, initialAmount: undefined }))
                  }}
                  onFocus={() => {
                    setIsAmountFocused(true)
                    setAmountInputValue(
                      formData.initialAmount === 0
                        ? ''
                        : String(formData.initialAmount),
                    )
                  }}
                  onBlur={() => {
                    setIsAmountFocused(false)
                    setAmountInputValue(
                      formatCurrencyInput(formData.initialAmount),
                    )
                  }}
                  aria-invalid={!!errors.initialAmount}
                  autoComplete="off"
                  data-1p-ignore
                  data-lpignore="true"
                  className="tabular-nums"
                />
              </InputGroup>
              <FieldError
                errors={
                  errors.initialAmount
                    ? [{ message: errors.initialAmount }]
                    : undefined
                }
              />
            </Field>

            <Field>
              <FieldLabel>Currency</FieldLabel>
              <Select
                value={formData.currency}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    currency: value as WalletFormData['currency'],
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.symbol} — {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>Icon</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {WALLET_ICON_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, icon: opt.id }))
                    }
                    className={cn(
                      'flex size-10 items-center justify-center rounded-none border-2 transition-colors',
                      formData.icon === opt.id
                        ? 'border-primary bg-primary/10'
                        : 'border-input hover:bg-muted',
                    )}
                  >
                    <WalletIcon
                      iconId={opt.id}
                      className="size-5"
                      strokeWidth={2}
                    />
                  </button>
                ))}
              </div>
            </Field>

            <Field>
              <FieldLabel>Color</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {WALLET_COLORS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, color: c.id }))
                    }
                    className={cn(
                      'size-8 rounded-none border-2 transition-all',
                      formData.color === c.id
                        ? 'border-foreground ring-2 ring-offset-2 ring-foreground/20'
                        : 'border-transparent hover:scale-110',
                    )}
                    style={{ backgroundColor: c.value }}
                    title={c.label}
                  />
                ))}
              </div>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {isEditing ? 'Save changes' : 'Create wallet'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
