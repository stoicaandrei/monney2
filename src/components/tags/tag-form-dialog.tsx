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
import type { Id } from '../../../convex/_generated/dataModel'

type Tag = { id: Id<'tags'>; name: string }

interface TagFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tag?: Tag | null
  onSubmit: (name: string, existingId?: Id<'tags'>) => void
}

export function TagFormDialog({
  open,
  onOpenChange,
  tag,
  onSubmit,
}: TagFormDialogProps) {
  const [name, setName] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)

  const isEditing = !!tag

  React.useEffect(() => {
    if (open) {
      setName(tag?.name ?? '')
      setError(null)
    }
  }, [open, tag])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Tag name is required')
      return
    }
    onSubmit(trimmed, tag?.id)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Edit tag' : 'Create tag'}
            </DialogTitle>
          </DialogHeader>
          <FieldGroup className="gap-4 py-4">
            <Field>
              <FieldLabel>Name</FieldLabel>
              <Input
                placeholder="e.g. Groceries, Travel"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setError(null)
                }}
                aria-invalid={!!error}
                autoComplete="off"
                data-1p-ignore
                data-lpignore="true"
              />
              <FieldError
                errors={error ? [{ message: error }] : undefined}
              />
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
              {isEditing ? 'Save changes' : 'Create tag'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
