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
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group'
import { CURRENCIES } from '@/types/wallet'
import {
  type NetWorthAsset,
  type NetWorthValueUpdateFormData,
} from '@/types/net-worth'
import { formatCurrencyInput, parseCurrencyInput } from '@/lib/utils'

interface NetWorthValueUpdateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  asset: NetWorthAsset | null
  onSubmit: (data: NetWorthValueUpdateFormData) => void
}

export function NetWorthValueUpdateDialog({
  open,
  onOpenChange,
  asset,
  onSubmit,
}: NetWorthValueUpdateDialogProps) {
  const [formData, setFormData] = React.useState<NetWorthValueUpdateFormData>({
    portfolioValue: 0,
    investedAmount: 0,
  })
  const [portfolioInput, setPortfolioInput] = React.useState('')
  const [investedInput, setInvestedInput] = React.useState('')
  const [portfolioFocused, setPortfolioFocused] = React.useState(false)
  const [investedFocused, setInvestedFocused] = React.useState(false)

  React.useEffect(() => {
    if (!open || !asset) return
    setFormData({
      portfolioValue: asset.currentPortfolioValue,
      investedAmount: asset.currentInvestedAmount,
    })
    setPortfolioInput(formatCurrencyInput(asset.currentPortfolioValue))
    setInvestedInput(formatCurrencyInput(asset.currentInvestedAmount))
  }, [open, asset])

  const currencySymbol = asset
    ? CURRENCIES.find((currency) => currency.id === asset.currency)?.symbol ??
      asset.currency
    : ''

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    onSubmit(formData)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Update {asset?.name} values</DialogTitle>
          </DialogHeader>

          <FieldGroup className="gap-4 py-4">
            <Field>
              <FieldLabel>Portfolio value</FieldLabel>
              <InputGroup>
                <InputGroupAddon>
                  <InputGroupText>{currencySymbol}</InputGroupText>
                </InputGroupAddon>
                <InputGroupInput
                  type="text"
                  inputMode="decimal"
                  value={
                    portfolioFocused
                      ? portfolioInput
                      : formatCurrencyInput(formData.portfolioValue)
                  }
                  onChange={(event) => {
                    const raw = event.target.value
                    setPortfolioInput(raw)
                    setFormData((prev) => ({
                      ...prev,
                      portfolioValue: parseCurrencyInput(raw),
                    }))
                  }}
                  onFocus={() => {
                    setPortfolioFocused(true)
                    setPortfolioInput(
                      formData.portfolioValue === 0
                        ? ''
                        : String(formData.portfolioValue)
                    )
                  }}
                  onBlur={() => {
                    setPortfolioFocused(false)
                    setPortfolioInput(formatCurrencyInput(formData.portfolioValue))
                  }}
                />
              </InputGroup>
            </Field>

            <Field>
              <FieldLabel>Invested amount</FieldLabel>
              <InputGroup>
                <InputGroupAddon>
                  <InputGroupText>{currencySymbol}</InputGroupText>
                </InputGroupAddon>
                <InputGroupInput
                  type="text"
                  inputMode="decimal"
                  value={
                    investedFocused
                      ? investedInput
                      : formatCurrencyInput(formData.investedAmount)
                  }
                  onChange={(event) => {
                    const raw = event.target.value
                    setInvestedInput(raw)
                    setFormData((prev) => ({
                      ...prev,
                      investedAmount: parseCurrencyInput(raw),
                    }))
                  }}
                  onFocus={() => {
                    setInvestedFocused(true)
                    setInvestedInput(
                      formData.investedAmount === 0
                        ? ''
                        : String(formData.investedAmount)
                    )
                  }}
                  onBlur={() => {
                    setInvestedFocused(false)
                    setInvestedInput(formatCurrencyInput(formData.investedAmount))
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
            <Button type="submit">Save update</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
