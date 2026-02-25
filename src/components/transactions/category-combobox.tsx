'use client'

import * as React from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from '@/components/ui/popover'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowDown01Icon } from '@hugeicons/core-free-icons'
import { cn } from '@/lib/utils'
import { DEFAULT_CATEGORY_COLORS } from '@/types/category'
import type { CategoryType } from '@/types/category'

type Category = { id: Id<'categories'>; name: string; type: CategoryType }

export function CategoryCombobox({
  value,
  onChange,
  categoryType,
  onCategoryTypeChange,
  placeholder = 'Search or select category',
  id,
  className,
  'aria-invalid': ariaInvalid,
}: {
  value: Id<'categories'> | ''
  onChange: (categoryId: Id<'categories'> | '') => void
  categoryType: CategoryType
  onCategoryTypeChange: (type: CategoryType) => void
  placeholder?: string
  id?: string
  className?: string
  'aria-invalid'?: boolean
}) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const inputRef = React.useRef<HTMLInputElement>(null)
  const anchorRef = React.useRef<HTMLDivElement>(null)

  const expenseCategories = useQuery(api.categories.list, { type: 'expense' }) ?? []
  const incomeCategories = useQuery(api.categories.list, { type: 'income' }) ?? []
  const createCategory = useMutation(api.categories.create)

  const categories = categoryType === 'expense' ? expenseCategories : incomeCategories
  const categoryMap = React.useMemo(
    () =>
      new Map([
        ...expenseCategories.map((c) => [c.id, c]),
        ...incomeCategories.map((c) => [c.id, c]),
      ]),
    [expenseCategories, incomeCategories]
  )

  const searchTrimmed = search.trim().toLowerCase()
  const filteredCategories = React.useMemo(
    () =>
      searchTrimmed
        ? categories.filter((c) => c.name.toLowerCase().includes(searchTrimmed))
        : categories,
    [categories, searchTrimmed]
  )

  const selectedCategory = value ? (categoryMap.get(value) as Category | undefined) : undefined
  const exactMatch = filteredCategories.find(
    (c) => c.name.toLowerCase() === searchTrimmed
  )
  const showCreateOption =
    searchTrimmed.length > 0 && !exactMatch

  const handleSelectCategory = (category: Category) => {
    onChange(category.id)
    setSearch('')
    setOpen(false)
  }

  const handleCreateCategory = async () => {
    if (!searchTrimmed) return
    try {
      const created = await createCategory({
        name: search.trim(),
        type: categoryType,
        color: DEFAULT_CATEGORY_COLORS[0],
      })
      handleSelectCategory({
        id: created.id,
        name: created.name,
        type: created.type,
      })
    } catch {
      // Error creating category - could show toast
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchTrimmed) {
      if (showCreateOption) {
        e.preventDefault()
        handleCreateCategory()
        return
      }
      if (exactMatch) {
        e.preventDefault()
        handleSelectCategory(exactMatch)
        return
      }
      const firstSelectable = filteredCategories[0]
      if (firstSelectable) {
        e.preventDefault()
        handleSelectCategory(firstSelectable)
      }
    }
  }

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (nextOpen) {
      setSearch(selectedCategory?.name ?? '')
    } else {
      setSearch('')
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverAnchor asChild>
        <div
          ref={anchorRef}
          className={cn(
            'border-input flex h-8 min-w-0 items-center rounded-none border bg-transparent transition-colors focus-within:ring-1 focus-within:ring-ring has-[aria-invalid=true]:border-destructive has-[aria-invalid=true]:ring-destructive/20',
            className
          )}
        >
          <input
            ref={inputRef}
            id={id}
            type="text"
            value={open ? search : (selectedCategory?.name ?? '')}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => handleOpenChange(true)}
            onKeyDown={handleKeyDown}
            placeholder={selectedCategory ? '' : placeholder}
            aria-invalid={ariaInvalid}
            className="placeholder:text-muted-foreground flex-1 shrink-0 border-0 bg-transparent px-2.5 py-1.5 text-sm outline-none"
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => handleOpenChange(true)}
            className="text-muted-foreground flex size-8 shrink-0 items-center justify-center"
            aria-hidden
          >
            <HugeiconsIcon
              icon={ArrowDown01Icon}
              strokeWidth={2}
              className="size-4"
            />
          </button>
        </div>
      </PopoverAnchor>
      <PopoverContent
        className="min-w-48 max-w-sm overflow-hidden p-0"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onFocusOutside={(e) => {
          if (anchorRef.current?.contains(e.target as Node)) {
            e.preventDefault()
          }
        }}
        onPointerDownOutside={(e) => {
          if (anchorRef.current?.contains(e.target as Node)) {
            e.preventDefault()
          }
        }}
      >
        <Tabs
          value={categoryType}
          onValueChange={(v) => onCategoryTypeChange(v as CategoryType)}
          className="flex flex-col"
        >
          <TabsList className="mx-2 mt-2 shrink-0">
            <TabsTrigger value="expense">Expense</TabsTrigger>
            <TabsTrigger value="income">Income</TabsTrigger>
          </TabsList>
          <TabsContent
            value={categoryType}
            className="mt-0 flex-1 overflow-hidden"
          >
            <div className="max-h-60 overflow-y-auto py-1">
              {filteredCategories.length === 0 && !showCreateOption ? (
                <div className="text-muted-foreground px-2 py-6 text-center text-sm">
                  {searchTrimmed
                    ? 'No categories found'
                    : 'Type to search or create'}
                </div>
              ) : (
                <>
                  {filteredCategories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => handleSelectCategory(category)}
                      className="hover:bg-accent hover:text-accent-foreground flex w-full items-center gap-2 px-2 py-2 text-left text-sm"
                    >
                      {category.name}
                    </button>
                  ))}
                  {showCreateOption && (
                    <button
                      type="button"
                      onClick={handleCreateCategory}
                      className="hover:bg-accent hover:text-accent-foreground flex w-full items-center gap-2 px-2 py-2 text-left text-sm text-muted-foreground"
                    >
                      <span>Create &quot;{search.trim()}&quot;</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  )
}
