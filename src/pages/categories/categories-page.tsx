'use client'

import * as React from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { AppSidebar } from '@/components/layout/sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SortableTree } from 'dnd-kit-sortable-tree'
import type { TreeItems } from 'dnd-kit-sortable-tree'
import {
  CategoryTreeItemComponent,
  CategoryTreeItemContext,
} from '@/components/categories/category-tree-item'
import { CategoryFormDialog } from '@/components/categories/category-form-dialog'
import {
  flatToTree,
  treeToFlat,
  type CategoryTreeValue,
} from '@/lib/category-tree'
import type { Category, CategoryFormData, CategoryType } from '@/types/category'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon } from '@hugeicons/core-free-icons'

const CATEGORY_TABS: { id: CategoryType; label: string }[] = [
  { id: 'income', label: 'Income' },
  { id: 'expense', label: 'Expense' },
]

export default function CategoriesPage() {
  const [activeType, setActiveType] = React.useState<CategoryType>('expense')
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editingCategory, setEditingCategory] = React.useState<Category | null>(
    null
  )
  const [parentIdForCreate, setParentIdForCreate] = React.useState<
    Id<'categories'> | undefined
  >(undefined)

  const categories = useQuery(api.categories.list, { type: activeType }) ?? []
  const createCategory = useMutation(api.categories.create)
  const updateCategory = useMutation(api.categories.update)
  const removeCategory = useMutation(api.categories.remove)
  const reorderCategories = useMutation(api.categories.reorder)

  const treeItems = React.useMemo(
    () => flatToTree(categories),
    [categories]
  )

  const [localItems, setLocalItems] = React.useState<TreeItems<CategoryTreeValue>>(
    treeItems
  )

  React.useEffect(() => {
    setLocalItems(treeItems)
  }, [treeItems])

  const handleCreate = (parentId?: Id<'categories'>) => {
    setEditingCategory(null)
    setParentIdForCreate(parentId)
    setDialogOpen(true)
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setParentIdForCreate(undefined)
    setDialogOpen(true)
  }

  const handleSubmit = (
    data: CategoryFormData,
    existingId?: string
  ) => {
    if (existingId) {
      updateCategory({
        id: existingId as Id<'categories'>,
        name: data.name,
        color: data.color,
      }).then(() => {
        setDialogOpen(false)
        setEditingCategory(null)
      })
    } else {
      createCategory({
        name: data.name,
        type: activeType,
        color: data.color,
        parentId: parentIdForCreate,
      }).then(() => {
        setDialogOpen(false)
        setParentIdForCreate(undefined)
      })
    }
  }

  const handleDelete = (id: string) => {
    removeCategory({ id: id as Id<'categories'> })
  }

  const handleItemsChanged = (
    newItems: TreeItems<CategoryTreeValue>,
    reason: { type: string }
  ) => {
    if (reason.type !== 'dropped') return
    setLocalItems(newItems)
    const updates = treeToFlat(newItems)
    reorderCategories({
      type: activeType,
      updates: updates.map((u) => ({
        id: u.id,
        parentId: u.parentId,
        order: u.order,
      })),
    })
  }

  const treeHandlers = React.useMemo(
    () => ({
      onEdit: (id: string) => {
        const cat = categories.find((c) => c.id === id)
        if (cat) handleEdit(cat)
      },
      onDelete: handleDelete,
    }),
    [categories]
  )

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
        <SiteHeader title="Categories" />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="flex flex-col gap-4 px-4 lg:px-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h1 className="text-xl font-semibold tracking-tight">
                      Categories
                    </h1>
                    <p className="text-muted-foreground text-sm">
                      Organize transactions with infinite hierarchy
                    </p>
                  </div>
                  <Button onClick={() => handleCreate()} className="w-fit">
                    <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
                    Add category
                  </Button>
                </div>

                <Tabs
                  value={activeType}
                  onValueChange={(v) => setActiveType(v as CategoryType)}
                >
                  <TabsList>
                    {CATEGORY_TABS.map((tab) => (
                      <TabsTrigger key={tab.id} value={tab.id}>
                        {tab.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  <TabsContent
                    value={activeType}
                    className="mt-4 rounded-lg border"
                  >
                    {localItems.length > 0 ? (
                      <CategoryTreeItemContext.Provider value={treeHandlers}>
                        <SortableTree
                          items={localItems}
                          onItemsChanged={handleItemsChanged}
                          TreeItemComponent={CategoryTreeItemComponent}
                          indentationWidth={24}
                          canRootHaveChildren={true}
                        />
                      </CategoryTreeItemContext.Provider>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-4 py-16">
                        <p className="text-muted-foreground text-sm">
                          No {activeType} categories yet
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => handleCreate()}
                        >
                          <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
                          Add first category
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>

      <CategoryFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={editingCategory}
        type={activeType}
        onSubmit={handleSubmit}
      />
    </SidebarProvider>
  )
}
