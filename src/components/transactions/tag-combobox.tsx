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
import { Badge } from '@/components/ui/badge'
import { HugeiconsIcon } from '@hugeicons/react'
import { Cancel01Icon } from '@hugeicons/core-free-icons'
import { cn } from '@/lib/utils'

type Tag = { id: Id<'tags'>; name: string }

export function TagCombobox({
  value,
  onChange,
  placeholder = 'Search or create tags',
  className,
}: {
  value: Id<'tags'>[]
  onChange: (tagIds: Id<'tags'>[]) => void
  placeholder?: string
  className?: string
}) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const inputRef = React.useRef<HTMLInputElement>(null)
  const anchorRef = React.useRef<HTMLDivElement>(null)

  const allTags = useQuery(api.tags.list) ?? []
  const createTag = useMutation(api.tags.create)

  const searchTrimmed = search.trim().toLowerCase()
  const tags = React.useMemo(
    () =>
      searchTrimmed
        ? allTags.filter((t) =>
            t.name.toLowerCase().includes(searchTrimmed)
          )
        : allTags,
    [allTags, searchTrimmed]
  )
  const tagMap = React.useMemo(
    () => new Map(allTags.map((t: { id: Id<'tags'>; name: string }) => [t.id, t])),
    [allTags]
  )

  const selectedTags = React.useMemo(
    () => value.map((id) => tagMap.get(id)).filter(Boolean) as Tag[],
    [value, tagMap]
  )

  const exactMatch = tags.find(
    (t: { id: Id<'tags'>; name: string }) => t.name.toLowerCase() === searchTrimmed
  )
  const showCreateOption =
    searchTrimmed.length > 0 &&
    !exactMatch &&
    !selectedTags.some((tag: Tag) => tag.name.toLowerCase() === searchTrimmed)

  const handleSelectTag = (tag: Tag) => {
    if (!value.includes(tag.id)) {
      onChange([...value, tag.id])
    }
    setSearch('')
    inputRef.current?.focus()
  }

  const handleCreateTag = async () => {
    if (!searchTrimmed) return
    try {
      const created = await createTag({ name: search.trim() })
      handleSelectTag({ id: created.id, name: created.name })
    } catch {
      // Error creating tag - could show toast
    }
  }

  const handleRemoveTag = (tagId: Id<'tags'>) => {
    onChange(value.filter((id) => id !== tagId))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchTrimmed) {
      if (showCreateOption) {
        e.preventDefault()
        handleCreateTag()
        return
      }
      if (exactMatch && !value.includes(exactMatch.id)) {
        e.preventDefault()
        handleSelectTag(exactMatch)
        return
      }
      const firstSelectable = tags.find((t) => !value.includes(t.id))
      if (firstSelectable) {
        e.preventDefault()
        handleSelectTag(firstSelectable)
      }
    }
    if (e.key === 'Backspace' && !search && value.length > 0) {
      e.preventDefault()
      handleRemoveTag(value[value.length - 1])
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div
          ref={anchorRef}
          className={cn(
            'flex min-h-9 flex-wrap items-center gap-1.5 rounded-none border border-input bg-transparent px-2.5 py-1.5 text-sm transition-colors focus-within:ring-1 focus-within:ring-ring',
            className
          )}
        >
          {selectedTags.map((tag) => (
            <Badge
              key={tag.id}
              variant="secondary"
              className="gap-1 pr-1 font-normal"
            >
              {tag.name}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag.id)}
                className="rounded-full p-0.5 hover:bg-muted-foreground/20"
                aria-label={`Remove ${tag.name}`}
              >
                <HugeiconsIcon
                  icon={Cancel01Icon}
                  strokeWidth={2}
                  className="size-3"
                />
              </button>
            </Badge>
          ))}
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={selectedTags.length === 0 ? placeholder : ''}
            className="min-w-24 flex-1 shrink-0 border-0 bg-transparent p-0 text-sm outline-none placeholder:text-muted-foreground"
          />
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
        <div className="max-h-60 overflow-y-auto py-1">
          {tags.length === 0 && !showCreateOption ? (
            <div className="text-muted-foreground px-2 py-6 text-center text-sm">
              {searchTrimmed ? 'No tags found' : 'Type to search or create'}
            </div>
          ) : (
            <>
              {tags
                .filter((t: { id: Id<'tags'>; name: string }) => !value.includes(t.id))
                .map((tag: { id: Id<'tags'>; name: string }) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleSelectTag(tag)}
                    className="hover:bg-accent hover:text-accent-foreground flex w-full items-center gap-2 px-2 py-2 text-left text-sm"
                  >
                    {tag.name}
                  </button>
                ))}
              {showCreateOption && (
                <button
                  type="button"
                  onClick={handleCreateTag}
                  className="hover:bg-accent hover:text-accent-foreground flex w-full items-center gap-2 px-2 py-2 text-left text-sm text-muted-foreground"
                >
                  <span>Create &quot;{search.trim()}&quot;</span>
                </button>
              )}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
