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
  type NetWorthRegisterPaymentFormData,
} from '@/types/net-worth'
import { formatCurrencyInput, parseCurrencyInput } from '@/lib/utils'

interface NetWorthRegisterPaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  asset: NetWorthAsset | null
  onSubmit: (data: NetWorthRegisterPaymentFormData) => void
}

export function NetWorthRegisterPaymentDialog({
  open,
  onOpenChange,
  asset,
  onSubmit,
}: NetWorthRegisterPaymentDialogProps) {
  const [amount, setAmount] = React.useState(0)
  const [amountInput, setAmountInput] = React.useState('')
  const [isAmountFocused, setIsAmountFocused] = React.useState(false)

  React.useEffect(() => {
    if (!open) return
    setAmount(0)
    setAmountInput('')
    setIsAmountFocused(false)
  }, [open, asset])

  const currencySymbol = asset
    ? CURRENCIES.find((currency) => currency.id === asset.currency)?.symbol ??
      asset.currency
    : ''

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    onSubmit({ amount })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Register payment for {asset?.name}</DialogTitle>
          </DialogHeader>

          <FieldGroup className="gap-4 py-4">
            <Field>
              <FieldLabel>Payment amount</FieldLabel>
              <InputGroup>
                <InputGroupAddon>
                  <InputGroupText>{currencySymbol}</InputGroupText>
                </InputGroupAddon>
                <InputGroupInput
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={
                    isAmountFocused ? amountInput : formatCurrencyInput(amount)
                  }
                  onChange={(event) => {
                    const raw = event.target.value
                    setAmountInput(raw)
                    setAmount(parseCurrencyInput(raw))
                  }}
                  onFocus={() => {
                    setIsAmountFocused(true)
                    setAmountInput(amount === 0 ? '' : String(amount))
                  }}
                  onBlur={() => {
                    setIsAmountFocused(false)
                    setAmountInput(formatCurrencyInput(amount))
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
            <Button type="submit" disabled={amount <= 0}>
              Register payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
