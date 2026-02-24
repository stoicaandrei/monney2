'use client'

import * as React from 'react'
import { SimpleTreeItemWrapper } from 'dnd-kit-sortable-tree'
import type { TreeItemComponentProps } from 'dnd-kit-sortable-tree'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import type { CategoryTreeValue } from '@/lib/category-tree'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  MoreVerticalCircle01Icon,
  Edit02Icon,
  Delete02Icon,
  DragDropVerticalIcon,
} from '@hugeicons/core-free-icons'
import { cn } from '@/lib/utils'

import './category-tree.css'

export interface CategoryTreeItemHandlers {
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}

const CategoryTreeItemContext = React.createContext<CategoryTreeItemHandlers>({})

export function useCategoryTreeItemHandlers() {
  return React.useContext(CategoryTreeItemContext)
}

function CategoryTreeItemInner(
  {
    item,
    depth,
    onCollapse,
    childCount,
    clone,
    ghost,
    disableSorting,
    style,
    indentationWidth,
    ...props
  }: TreeItemComponentProps<CategoryTreeValue>,
  ref: React.Ref<HTMLDivElement>
) {
  const { onEdit, onDelete } = useCategoryTreeItemHandlers()
    return (
      <SimpleTreeItemWrapper
        {...props}
        ref={ref}
        item={item}
        depth={depth}
        onCollapse={onCollapse}
        childCount={childCount}
        clone={clone}
        ghost={ghost}
        disableSorting={disableSorting}
        style={style}
        indentationWidth={indentationWidth}
        className={cn(
          '!border-border !bg-background rounded-none',
          clone && '!shadow-lg',
          ghost && 'opacity-50'
        )}
        contentClassName="!border !rounded-none gap-2 !py-2 !px-3"
        manualDrag={true}
        showDragHandle={false}
      >
        <div
          className={cn(
            'dnd-sortable-tree_simple_handle flex shrink-0 cursor-grab items-center text-muted-foreground active:cursor-grabbing',
            disableSorting && 'cursor-default'
          )}
          {...(props.handleProps ?? {})}
        >
          <HugeiconsIcon
            icon={DragDropVerticalIcon}
            strokeWidth={2}
            className="size-4"
          />
        </div>
        <div
          className="size-5 shrink-0 rounded-none border border-input"
          style={{ backgroundColor: item.color }}
        />
        <span className="min-w-0 flex-1 truncate text-sm font-medium">
          {item.name}
        </span>
        <div className="flex shrink-0 items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground"
                onClick={(e) => e.stopPropagation()}
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
                onClick={() => onEdit?.(item.id as string)}
              >
                <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} className="mr-2 size-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onDelete?.(item.id as string)}
              >
                <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="mr-2 size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SimpleTreeItemWrapper>
    )
}

const CategoryTreeItemComponent = React.forwardRef(CategoryTreeItemInner)
CategoryTreeItemComponent.displayName = 'CategoryTreeItemComponent'

export { CategoryTreeItemComponent, CategoryTreeItemContext }
