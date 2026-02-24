import { query } from './_generated/server'
import { v } from 'convex/values'
import { getCurrentUser } from './users'

export const stats = query({
  args: {
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    if (!user) return null

    const days = args.days ?? 30
    const now = Date.now()
    const start = now - days * 24 * 60 * 60 * 1000

    const transactions = await ctx.db
      .query('transactions')
      .withIndex('by_userId_date', (q) =>
        q.eq('userId', user._id).gte('date', start)
      )
      .collect()

    const income = transactions
      .filter((t) => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0)
    const expenses = transactions
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
    const balance = income - expenses

    return {
      income,
      expenses,
      balance,
      transactionCount: transactions.length,
    }
  },
})

export const dailyBreakdown = query({
  args: {
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    if (!user) return []

    const days = args.days ?? 30
    const now = Date.now()
    const start = now - days * 24 * 60 * 60 * 1000

    const transactions = await ctx.db
      .query('transactions')
      .withIndex('by_userId_date', (q) =>
        q.eq('userId', user._id).gte('date', start)
      )
      .collect()

    const byDay: Record<
      string,
      { date: string; income: number; expenses: number }
    > = {}

    for (let i = 0; i < days; i++) {
      const d = new Date(now)
      d.setDate(d.getDate() - (days - 1 - i))
      d.setHours(0, 0, 0, 0)
      const key = d.toISOString().slice(0, 10)
      byDay[key] = { date: key, income: 0, expenses: 0 }
    }

    for (const t of transactions) {
      const key = new Date(t.date).toISOString().slice(0, 10)
      if (!byDay[key]) byDay[key] = { date: key, income: 0, expenses: 0 }
      if (t.amount > 0) {
        byDay[key].income += t.amount
      } else {
        byDay[key].expenses += Math.abs(t.amount)
      }
    }

    return Object.values(byDay).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )
  },
})

export const expensesByCategory = query({
  args: {
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    if (!user) return []

    const days = args.days ?? 30
    const now = Date.now()
    const start = now - days * 24 * 60 * 60 * 1000

    const transactions = await ctx.db
      .query('transactions')
      .withIndex('by_userId_date', (q) =>
        q.eq('userId', user._id).gte('date', start)
      )
      .collect()

    const expenseTransactions = transactions.filter((t) => t.amount < 0)
    const byCategory: Record<string, { name: string; value: number; color: string }> =
      {}

    for (const t of expenseTransactions) {
      const category = await ctx.db.get(t.categoryId)
      const name = category?.name ?? 'Unknown'
      const color = category?.color ?? '#94a3b8'
      if (!byCategory[t.categoryId]) {
        byCategory[t.categoryId] = { name, value: 0, color }
      }
      byCategory[t.categoryId].value += Math.abs(t.amount)
    }

    return Object.entries(byCategory).map(([, v]) => v)
  },
})
