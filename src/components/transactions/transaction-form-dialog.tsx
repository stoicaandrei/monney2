'use client'

import * as React from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  TransactionForm,
  formatDateForInput,
  type TransactionFormData,
} from '@/components/transactions/transaction-form'
import { parseDateString } from '@/lib/utils'

export type TransactionForEdit = {
  id: Id<'transactions'>
  walletId: Id<'wallets'>
  categoryId: Id<'categories'>
  amount: number
  note?: string
  date: number
  tagIds: Id<'tags'>[]
}

interface TransactionFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: TransactionForEdit | null
}

function transactionToFormData(tx: TransactionForEdit): Partial<TransactionFormData> {
  return {
    walletId: tx.walletId,
    categoryId: tx.categoryId,
    amount: Math.abs(tx.amount).toString(),
    note: tx.note ?? '',
    date: formatDateForInput(new Date(tx.date)),
    tagIds: tx.tagIds ?? [],
  }
}

export function TransactionFormDialog({
  open,
  onOpenChange,
  transaction,
}: TransactionFormDialogProps) {
  const updateTransaction = useMutation(api.transactions.update)

  const defaultValues = React.useMemo(
    () => (transaction ? transactionToFormData(transaction) : undefined),
    [transaction]
  )

  const handleSubmit = async (data: TransactionFormData) => {
    if (!transaction) return

    const amountNum = parseFloat(data.amount)
    if (isNaN(amountNum) || amountNum === 0) return

    await updateTransaction({
      id: transaction.id,
      walletId: data.walletId as Id<'wallets'>,
      categoryId: data.categoryId as Id<'categories'>,
      amount: amountNum,
      note: data.note.trim() || undefined,
      date: parseDateString(data.date).getTime(),
      tagIds: data.tagIds.length > 0 ? data.tagIds : undefined,
    })

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Edit transaction</DialogTitle>
        </DialogHeader>
        {transaction && (
          <TransactionForm
            key={transaction.id}
            defaultValues={defaultValues}
            onSubmit={handleSubmit}
            submitLabel="Save changes"
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
