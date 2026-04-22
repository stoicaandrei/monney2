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
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import type { WalletSection } from '@/types/wallet'

interface WalletSectionRenameDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  section: WalletSection | null
  onSubmit: (name: string) => void
}

export function WalletSectionRenameDialog({
  open,
  onOpenChange,
  section,
  onSubmit,
}: WalletSectionRenameDialogProps) {
  const [name, setName] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!open) return
    setName(section?.name ?? '')
    setError(null)
  }, [open, section])

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Section name is required')
      return
    }
    onSubmit(trimmed)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Rename section</DialogTitle>
          </DialogHeader>
          <FieldGroup className="py-4">
            <Field>
              <FieldLabel>Section name</FieldLabel>
              <Input
                value={name}
                onChange={(event) => {
                  setName(event.target.value)
                  setError(null)
                }}
                placeholder="e.g. Savings"
                aria-invalid={!!error}
              />
              <FieldError errors={error ? [{ message: error }] : undefined} />
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
            <Button type="submit">Save name</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
