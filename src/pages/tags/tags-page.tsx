'use client'

import * as React from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { AppSidebar } from '@/components/layout/sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { TagFormDialog } from '@/components/tags/tag-form-dialog'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Add01Icon,
  MoreVerticalCircle01Icon,
  Edit02Icon,
  Delete02Icon,
} from '@hugeicons/core-free-icons'
type Tag = { id: Id<'tags'>; name: string }

export default function TagsPage() {
  const tags = useQuery(api.tags.list) ?? []
  const createTag = useMutation(api.tags.create)
  const updateTag = useMutation(api.tags.update)
  const removeTag = useMutation(api.tags.remove)

  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editingTag, setEditingTag] = React.useState<Tag | null>(null)
  const [deleteTag, setDeleteTag] = React.useState<Tag | null>(null)

  const handleCreate = () => {
    setEditingTag(null)
    setDialogOpen(true)
  }

  const handleEdit = (tag: Tag) => {
    setEditingTag(tag)
    setDialogOpen(true)
  }

  const handleSubmit = (name: string, existingId?: Id<'tags'>) => {
    if (existingId) {
      updateTag({ id: existingId, name }).then(() => {
        setDialogOpen(false)
        setEditingTag(null)
      })
    } else {
      createTag({ name }).then(() => {
        setDialogOpen(false)
      })
    }
  }

  const handleDeleteClick = (tag: Tag) => {
    setDeleteTag(tag)
  }

  const handleDeleteConfirm = () => {
    if (deleteTag) {
      removeTag({ id: deleteTag.id })
      setDeleteTag(null)
    }
  }

  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 72)',
          '--header-height': 'calc(var(--spacing) * 12)',
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader title="Tags" />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="flex flex-col gap-4 px-4 lg:px-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h1 className="text-xl font-semibold tracking-tight">
                      Tags
                    </h1>
                    <p className="text-muted-foreground text-sm">
                      Label and organize your transactions
                    </p>
                  </div>
                  <Button onClick={handleCreate} className="w-fit">
                    <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
                    Add tag
                  </Button>
                </div>

                {tags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <div
                        key={tag.id}
                        className="flex items-center gap-1 rounded-none border border-input bg-background px-3 py-2"
                      >
                        <Badge
                          variant="secondary"
                          className="font-normal"
                        >
                          {tag.name}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 text-muted-foreground"
                            >
                              <HugeiconsIcon
                                icon={MoreVerticalCircle01Icon}
                                strokeWidth={2}
                                className="size-4"
                              />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem
                              onClick={() => handleEdit(tag)}
                            >
                              <HugeiconsIcon
                                icon={Edit02Icon}
                                strokeWidth={2}
                                className="mr-2 size-4"
                              />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => handleDeleteClick(tag)}
                            >
                              <HugeiconsIcon
                                icon={Delete02Icon}
                                strokeWidth={2}
                                className="mr-2 size-4"
                              />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-4 rounded-none border border-dashed border-input py-16">
                    <p className="text-muted-foreground text-sm">
                      No tags yet. Create tags to label your transactions.
                    </p>
                    <Button variant="outline" onClick={handleCreate}>
                      <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
                      Add first tag
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>

      <TagFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        tag={editingTag}
        onSubmit={handleSubmit}
      />

      <AlertDialog open={!!deleteTag} onOpenChange={() => setDeleteTag(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete tag</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteTag?.name}&quot;? This
              will remove the tag from all transactions that use it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  )
}
