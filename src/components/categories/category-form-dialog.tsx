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
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { ColorPicker } from '@/components/categories/color-picker'
import {
  DEFAULT_CATEGORY_COLORS,
  type Category,
  type CategoryFormData,
  type CategoryType,
} from '@/types/category'

interface CategoryFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: Category | null
  type: CategoryType
  onSubmit: (data: CategoryFormData, existingId?: string) => void
}

const defaultFormData: CategoryFormData = {
  name: '',
  type: 'expense',
  color: DEFAULT_CATEGORY_COLORS[0],
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
  type,
  onSubmit,
}: CategoryFormDialogProps) {
  const [formData, setFormData] =
    React.useState<CategoryFormData>(defaultFormData)
  const [errors, setErrors] = React.useState<
    Partial<Record<keyof CategoryFormData, string>>
  >({})

  const isEditing = !!category

  React.useEffect(() => {
    if (open) {
      if (category) {
        setFormData({
          name: category.name,
          type: category.type,
          color: category.color,
        })
      } else {
        setFormData({
          ...defaultFormData,
          type,
          color: DEFAULT_CATEGORY_COLORS[0],
        })
      }
      setErrors({})
    }
  }, [open, category, type])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Partial<Record<keyof CategoryFormData, string>> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    onSubmit(formData, category?.id)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Edit category' : 'Create category'}
            </DialogTitle>
          </DialogHeader>
          <FieldGroup className="gap-4 py-4">
            <Field>
              <FieldLabel>Name</FieldLabel>
              <Input
                placeholder="e.g. Groceries"
                value={formData.name}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                  setErrors((prev) => ({ ...prev, name: undefined }))
                }}
                aria-invalid={!!errors.name}
                autoComplete="off"
              />
              <FieldError
                errors={errors.name ? [{ message: errors.name }] : undefined}
              />
            </Field>

            <Field>
              <FieldLabel>Color</FieldLabel>
              <ColorPicker
                color={formData.color}
                onChange={(color) =>
                  setFormData((prev) => ({ ...prev, color }))
                }
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
              {isEditing ? 'Save changes' : 'Create category'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
