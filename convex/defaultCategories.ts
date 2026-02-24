export interface DefaultCategoryNode {
  name: string
  color: string
  children?: DefaultCategoryChild[]
}

export interface DefaultCategoryChild {
  name: string
  color: string
}

export type CategoryType = 'income' | 'expense'

export const DEFAULT_CATEGORIES: Record<CategoryType, DefaultCategoryNode[]> = {
  income: [
    {
      name: 'Salary & Wages',
      color: '#10b981',
      children: [
        { name: 'Regular Salary', color: '#10b981' },
        { name: 'Bonuses', color: '#34d399' },
        { name: 'Overtime', color: '#6ee7b7' },
      ],
    },
    {
      name: 'Freelance & Business',
      color: '#3b82f6',
      children: [
        { name: 'Freelance Work', color: '#3b82f6' },
        { name: 'Consulting', color: '#60a5fa' },
        { name: 'Side Projects', color: '#93c5fd' },
      ],
    },
    {
      name: 'Investments',
      color: '#8b5cf6',
      children: [
        { name: 'Dividends', color: '#8b5cf6' },
        { name: 'Interest', color: '#a78bfa' },
        { name: 'Capital Gains', color: '#c4b5fd' },
      ],
    },
    {
      name: 'Passive Income',
      color: '#f59e0b',
      children: [
        { name: 'Rental Income', color: '#f59e0b' },
        { name: 'Royalties', color: '#fbbf24' },
      ],
    },
    { name: 'Gifts & Awards', color: '#f43f5e' },
    { name: 'Other Income', color: '#64748b' },
  ],

  expense: [
    {
      name: 'Food & Dining',
      color: '#10b981',
      children: [
        { name: 'Groceries', color: '#10b981' },
        { name: 'Restaurants & Cafes', color: '#34d399' },
        { name: 'Coffee & Snacks', color: '#6ee7b7' },
        { name: 'Delivery & Takeout', color: '#a7f3d0' },
      ],
    },
    {
      name: 'Housing',
      color: '#3b82f6',
      children: [
        { name: 'Rent / Mortgage', color: '#3b82f6' },
        { name: 'Home Insurance', color: '#60a5fa' },
        { name: 'Repairs & Maintenance', color: '#93c5fd' },
        { name: 'Furniture & Decor', color: '#bfdbfe' },
      ],
    },
    {
      name: 'Transportation',
      color: '#8b5cf6',
      children: [
        { name: 'Fuel', color: '#8b5cf6' },
        { name: 'Public Transit', color: '#a78bfa' },
        { name: 'Car Insurance', color: '#c4b5fd' },
        { name: 'Maintenance & Repairs', color: '#ddd6fe' },
        { name: 'Parking & Tolls', color: '#ede9fe' },
        { name: 'Ride Sharing', color: '#7c3aed' },
      ],
    },
    {
      name: 'Utilities',
      color: '#f59e0b',
      children: [
        { name: 'Electricity', color: '#f59e0b' },
        { name: 'Water', color: '#fbbf24' },
        { name: 'Gas / Heating', color: '#fcd34d' },
        { name: 'Internet', color: '#fde68a' },
        { name: 'Phone', color: '#d97706' },
      ],
    },
    {
      name: 'Healthcare',
      color: '#06b6d4',
      children: [
        { name: 'Doctor & Dentist', color: '#06b6d4' },
        { name: 'Pharmacy', color: '#22d3ee' },
        { name: 'Health Insurance', color: '#67e8f9' },
        { name: 'Gym & Fitness', color: '#0891b2' },
      ],
    },
    {
      name: 'Entertainment',
      color: '#f43f5e',
      children: [
        { name: 'Movies & Shows', color: '#f43f5e' },
        { name: 'Games', color: '#fb7185' },
        { name: 'Hobbies', color: '#fda4af' },
        { name: 'Books & Magazines', color: '#e11d48' },
        { name: 'Music & Concerts', color: '#be123c' },
      ],
    },
    {
      name: 'Shopping',
      color: '#f97316',
      children: [
        { name: 'Clothing & Shoes', color: '#f97316' },
        { name: 'Electronics', color: '#fb923c' },
        { name: 'Gifts', color: '#fdba74' },
        { name: 'Personal Care', color: '#ea580c' },
      ],
    },
    {
      name: 'Education',
      color: '#14b8a6',
      children: [
        { name: 'Courses & Tuition', color: '#14b8a6' },
        { name: 'Books & Supplies', color: '#2dd4bf' },
        { name: 'Certifications', color: '#5eead4' },
      ],
    },
    {
      name: 'Subscriptions',
      color: '#a855f7',
      children: [
        { name: 'Streaming Services', color: '#a855f7' },
        { name: 'Software', color: '#c084fc' },
        { name: 'News & Magazines', color: '#d8b4fe' },
      ],
    },
    {
      name: 'Travel',
      color: '#ec4899',
      children: [
        { name: 'Flights', color: '#ec4899' },
        { name: 'Hotels & Accommodation', color: '#f472b6' },
        { name: 'Activities & Tours', color: '#f9a8d4' },
        { name: 'Travel Insurance', color: '#db2777' },
      ],
    },
    {
      name: 'Financial',
      color: '#64748b',
      children: [
        { name: 'Bank Fees', color: '#64748b' },
        { name: 'Taxes', color: '#94a3b8' },
        { name: 'Loan Payments', color: '#475569' },
        { name: 'Insurance (Other)', color: '#cbd5e1' },
      ],
    },
    {
      name: 'Family & Pets',
      color: '#eab308',
      children: [
        { name: 'Childcare', color: '#eab308' },
        { name: 'Pet Care', color: '#facc15' },
        { name: 'Family Activities', color: '#fde047' },
      ],
    },
    { name: 'Other Expense', color: '#64748b' },
  ],
}
