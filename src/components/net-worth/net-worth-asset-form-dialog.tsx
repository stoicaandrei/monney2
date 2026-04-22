'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group'
import { CURRENCIES } from '@/types/wallet'
import {
  NET_WORTH_ASSET_TYPES,
  type CreateNetWorthAssetFormData,
} from '@/types/net-worth'
import { formatCurrencyInput, parseCurrencyInput } from '@/lib/utils'

interface NetWorthAssetFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CreateNetWorthAssetFormData) => void
  defaultCurrency: CreateNetWorthAssetFormData['currency']
}

const getDefaultFormData = (
  defaultCurrency: CreateNetWorthAssetFormData['currency']
): CreateNetWorthAssetFormData => ({
  name: '',
  type: 'retirement_account',
  currency: defaultCurrency,
  initialPortfolioValue: 0,
  initialInvestedAmount: 0,
})

export function NetWorthAssetFormDialog({
  open,
  onOpenChange,
  onSubmit,
  defaultCurrency,
}: NetWorthAssetFormDialogProps) {
  const [formData, setFormData] = React.useState<CreateNetWorthAssetFormData>(
    getDefaultFormData(defaultCurrency)
  )
  const [errors, setErrors] = React.useState<
    Partial<Record<keyof CreateNetWorthAssetFormData, string>>
  >({})
  const [portfolioInput, setPortfolioInput] = React.useState('')
  const [investedInput, setInvestedInput] = React.useState('')
  const [portfolioFocused, setPortfolioFocused] = React.useState(false)
  const [investedFocused, setInvestedFocused] = React.useState(false)

  React.useEffect(() => {
    if (!open) return
    const defaults = getDefaultFormData(defaultCurrency)
    setFormData(defaults)
    setPortfolioInput(formatCurrencyInput(defaults.initialPortfolioValue))
    setInvestedInput(formatCurrencyInput(defaults.initialInvestedAmount))
    setErrors({})
  }, [open, defaultCurrency])

  const currencySymbol =
    CURRENCIES.find((currency) => currency.id === formData.currency)?.symbol ??
    formData.currency

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const newErrors: Partial<Record<keyof CreateNetWorthAssetFormData, string>> =
      {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    onSubmit({
      ...formData,
      name: formData.name.trim(),
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add net worth asset</DialogTitle>
          </DialogHeader>

          <FieldGroup className="gap-4 py-4">
            <Field>
              <FieldLabel>Asset name</FieldLabel>
              <Input
                placeholder="e.g. Vanguard IRA"
                value={formData.name}
                onChange={(event) => {
                  setFormData((prev) => ({ ...prev, name: event.target.value }))
                  setErrors((prev) => ({ ...prev, name: undefined }))
                }}
                aria-invalid={!!errors.name}
              />
              <FieldError
                errors={errors.name ? [{ message: errors.name }] : undefined}
              />
            </Field>

            <Field>
              <FieldLabel>Asset type</FieldLabel>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    type: value as CreateNetWorthAssetFormData['type'],
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NET_WORTH_ASSET_TYPES.map((assetType) => (
                    <SelectItem key={assetType.id} value={assetType.id}>
                      {assetType.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>Currency</FieldLabel>
              <Select
                value={formData.currency}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    currency: value as CreateNetWorthAssetFormData['currency'],
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((currency) => (
                    <SelectItem key={currency.id} value={currency.id}>
                      {currency.symbol} — {currency.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>Initial portfolio value</FieldLabel>
              <InputGroup>
                <InputGroupAddon>
                  <InputGroupText>{currencySymbol}</InputGroupText>
                </InputGroupAddon>
                <InputGroupInput
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={
                    portfolioFocused
                      ? portfolioInput
                      : formatCurrencyInput(formData.initialPortfolioValue)
                  }
                  onChange={(event) => {
                    const raw = event.target.value
                    setPortfolioInput(raw)
                    const parsed = parseCurrencyInput(raw)
                    setFormData((prev) => ({
                      ...prev,
                      initialPortfolioValue: parsed,
                    }))
                  }}
                  onFocus={() => {
                    setPortfolioFocused(true)
                    setPortfolioInput(
                      formData.initialPortfolioValue === 0
                        ? ''
                        : String(formData.initialPortfolioValue)
                    )
                  }}
                  onBlur={() => {
                    setPortfolioFocused(false)
                    setPortfolioInput(
                      formatCurrencyInput(formData.initialPortfolioValue)
                    )
                  }}
                />
              </InputGroup>
            </Field>

            <Field>
              <FieldLabel>Initial invested amount</FieldLabel>
              <InputGroup>
                <InputGroupAddon>
                  <InputGroupText>{currencySymbol}</InputGroupText>
                </InputGroupAddon>
                <InputGroupInput
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={
                    investedFocused
                      ? investedInput
                      : formatCurrencyInput(formData.initialInvestedAmount)
                  }
                  onChange={(event) => {
                    const raw = event.target.value
                    setInvestedInput(raw)
                    const parsed = parseCurrencyInput(raw)
                    setFormData((prev) => ({
                      ...prev,
                      initialInvestedAmount: parsed,
                    }))
                  }}
                  onFocus={() => {
                    setInvestedFocused(true)
                    setInvestedInput(
                      formData.initialInvestedAmount === 0
                        ? ''
                        : String(formData.initialInvestedAmount)
                    )
                  }}
                  onBlur={() => {
                    setInvestedFocused(false)
                    setInvestedInput(
                      formatCurrencyInput(formData.initialInvestedAmount)
                    )
                  }}
                />
              </InputGroup>
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
            <Button type="submit">Create asset</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
