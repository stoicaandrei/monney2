export interface DefaultCategoryNode {
  name: string
  color: string
}

export type CategoryType = 'income' | 'expense'

export const DEFAULT_CATEGORIES: Record<CategoryType, DefaultCategoryNode[]> = {
  income: [
    { name: 'Salary & Wages', color: '#10b981' },
    { name: 'Freelance & Business', color: '#3b82f6' },
    { name: 'Investments', color: '#8b5cf6' },
    { name: 'Passive Income', color: '#f59e0b' },
    { name: 'Gifts & Awards', color: '#f43f5e' },
    { name: 'Other Income', color: '#64748b' },
  ],

  expense: [
    { name: 'Food & Dining', color: '#10b981' },
    { name: 'Housing', color: '#3b82f6' },
    { name: 'Transportation', color: '#8b5cf6' },
    { name: 'Utilities', color: '#f59e0b' },
    { name: 'Healthcare', color: '#06b6d4' },
    { name: 'Entertainment', color: '#f43f5e' },
    { name: 'Shopping', color: '#f97316' },
    { name: 'Education', color: '#14b8a6' },
    { name: 'Subscriptions', color: '#a855f7' },
    { name: 'Travel', color: '#ec4899' },
    { name: 'Financial', color: '#64748b' },
    { name: 'Family & Pets', color: '#eab308' },
    { name: 'Other Expense', color: '#64748b' },
  ],
}
