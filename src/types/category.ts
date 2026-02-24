import type { Id } from '../../convex/_generated/dataModel'

export type CategoryType = 'income' | 'expense'

export const CATEGORY_TYPES: { id: CategoryType; label: string }[] = [
  { id: 'income', label: 'Income' },
  { id: 'expense', label: 'Expense' },
]

export const DEFAULT_CATEGORY_COLORS = [
  '#10b981', // emerald
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#f59e0b', // amber
  '#f43f5e', // rose
  '#06b6d4', // cyan
  '#64748b', // slate
  '#f97316', // orange
] as const

export interface Category {
  id: Id<'categories'>
  name: string
  type: CategoryType
  color: string
  parentId?: Id<'categories'>
  order: number
}

export interface CategoryFormData {
  name: string
  type: CategoryType
  color: string
}
