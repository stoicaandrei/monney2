import type { Id } from './_generated/dataModel'
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

export type SankeyNode = { id: string; label?: string; color?: string }
export type SankeyLink = { source: string; target: string; value: number }

type CatInfo = { name: string; color: string; parentId?: string }

/** Build full path from root to category, e.g. "Food › Groceries › Organic" */
function getNodeId(
  categoryId: string,
  categoryById: Map<string, CatInfo>
): string {
  const path: string[] = []
  let currentId: string | undefined = categoryId
  while (currentId) {
    const cat = categoryById.get(currentId)
    if (!cat) break
    path.unshift(cat.name)
    currentId = cat.parentId
  }
  return path.length > 0 ? path.join(' › ') : categoryId
}

/** Walk from category up to root, return path [root, ..., leaf] as { nodeId, categoryId } */
function getPathFromRootToLeaf(
  categoryId: string,
  categoryById: Map<string, CatInfo>
): { nodeId: string; categoryId: string }[] {
  const chain: string[] = []
  let currentId: string | undefined = categoryId
  while (currentId) {
    const cat = categoryById.get(currentId)
    if (!cat) break
    chain.unshift(currentId)
    currentId = cat.parentId
  }
  return chain.map((id) => ({
    nodeId: getNodeId(id, categoryById),
    categoryId: id,
  }))
}

export const expensesBySubcategorySankey = query({
  args: {
    days: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<{ nodes: SankeyNode[]; links: SankeyLink[] }> => {
    const user = await getCurrentUser(ctx)
    if (!user) return { nodes: [], links: [] }

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
    if (expenseTransactions.length === 0) {
      return { nodes: [], links: [] }
    }

    const expenseCategories = await ctx.db
      .query('categories')
      .withIndex('by_userId_type', (q) =>
        q.eq('userId', user._id).eq('type', 'expense')
      )
      .collect()

    const categoryById = new Map(
      expenseCategories.map((c) => [
        c._id,
        { name: c.name, color: c.color ?? '#94a3b8', parentId: c.parentId },
      ])
    )

    const linkValues = new Map<string, number>()
    const seenNodes = new Set<string>(['Total Spending'])
    const nodeColors = new Map<string, string>()

    for (const t of expenseTransactions) {
      if (!categoryById.get(t.categoryId)) continue

      const amount = Math.abs(t.amount)
      const path = getPathFromRootToLeaf(t.categoryId, categoryById)
      if (path.length === 0) continue

      for (let i = 0; i < path.length; i++) {
        const { nodeId: targetNodeId, categoryId: targetCatId } = path[i]
        seenNodes.add(targetNodeId)
        const targetCat = categoryById.get(targetCatId as Id<'categories'>)
        if (targetCat) nodeColors.set(targetNodeId, targetCat.color)

        const sourceNodeId = i === 0 ? 'Total Spending' : path[i - 1].nodeId
        const key = `${sourceNodeId}→${targetNodeId}`
        linkValues.set(key, (linkValues.get(key) ?? 0) + amount)
      }
    }

    const links: SankeyLink[] = []
    for (const [key, value] of linkValues) {
      const [source, target] = key.split('→')
      links.push({ source, target, value })
    }

    const nodes: SankeyNode[] = [{ id: 'Total Spending', label: 'Total Spending' }]
    for (const id of seenNodes) {
      if (id === 'Total Spending') continue
      const label = id.includes(' › ') ? id.split(' › ').pop()! : id
      nodes.push({
        id,
        label,
        color: nodeColors.get(id),
      })
    }

    return { nodes, links }
  },
})
