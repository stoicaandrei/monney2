import type { Id } from '../../convex/_generated/dataModel'
import type { Category } from '@/types/category'
import type { TreeItem, TreeItems } from 'dnd-kit-sortable-tree'

export interface CategoryTreeValue {
  id: Id<'categories'>
  name: string
  type: Category['type']
  color: string
}

export function flatToTree(categories: Category[]): TreeItems<CategoryTreeValue> {
  const byParent = new Map<Id<'categories'> | 'root', Category[]>()
  byParent.set('root', [])

  for (const c of categories) {
    const key = c.parentId ?? ('root' as const)
    if (!byParent.has(key)) byParent.set(key, [])
    byParent.get(key)!.push(c)
  }

  for (const arr of byParent.values()) {
    arr.sort((a, b) => a.order - b.order)
  }

  function buildChildren(parentKey: Id<'categories'> | 'root'): TreeItem<CategoryTreeValue>[] {
    const children = byParent.get(parentKey) ?? []
    return children.map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type,
      color: c.color,
      children: buildChildren(c.id),
    }))
  }

  return buildChildren('root')
}

export function treeToFlat(
  items: TreeItems<CategoryTreeValue>,
  parentId?: Id<'categories'>
): { id: Id<'categories'>; parentId?: Id<'categories'>; order: number }[] {
  const result: { id: Id<'categories'>; parentId?: Id<'categories'>; order: number }[] = []
  items.forEach((item, index) => {
    result.push({
      id: item.id as Id<'categories'>,
      parentId: parentId,
      order: index,
    })
    if (item.children && item.children.length > 0) {
      result.push(...treeToFlat(item.children, item.id as Id<'categories'>))
    }
  })
  return result
}
