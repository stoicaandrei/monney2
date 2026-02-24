import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import { getCurrentUser } from './users'

const walletIconValidator = v.union(
  v.literal('wallet'),
  v.literal('bank'),
  v.literal('credit-card'),
  v.literal('piggy-bank'),
  v.literal('safe'),
  v.literal('vault')
)

const walletColorValidator = v.union(
  v.literal('emerald'),
  v.literal('blue'),
  v.literal('violet'),
  v.literal('amber'),
  v.literal('rose'),
  v.literal('cyan'),
  v.literal('slate'),
  v.literal('orange')
)

const currencyValidator = v.union(
  v.literal('USD'),
  v.literal('EUR'),
  v.literal('GBP'),
  v.literal('RON'),
  v.literal('JPY'),
  v.literal('CHF')
)

const walletFormValidator = {
  name: v.string(),
  currency: currencyValidator,
  color: walletColorValidator,
  icon: walletIconValidator,
  initialAmount: v.number(),
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx)
    if (!user) return []
    const walletDocs = await ctx.db
      .query('wallets')
      .withIndex('by_userId', (q) => q.eq('userId', user._id))
      .collect()
    // Sort by order (undefined last for backward compatibility)
    walletDocs.sort((a, b) => {
      const orderA = a.order ?? 1e9
      const orderB = b.order ?? 1e9
      return orderA - orderB
    })
    // NOTE: For higher scale, consider a denormalized balance field on wallets.
    const results = await Promise.all(
      walletDocs.map(async (doc) => {
        const transactions = await ctx.db
          .query('transactions')
          .withIndex('by_walletId', (q) => q.eq('walletId', doc._id))
          .collect()
        const transactionSum = transactions.reduce((sum, t) => sum + t.amount, 0)
        const balance = doc.initialAmount + transactionSum
        return {
          id: doc._id as string,
          name: doc.name,
          currency: doc.currency,
          color: doc.color,
          icon: doc.icon,
          initialAmount: doc.initialAmount,
          balance,
          order: doc.order,
        }
      }),
    )
    return results
  },
})

export const create = mutation({
  args: walletFormValidator,
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    if (!user) throw new Error('Not authenticated')
    const existing = await ctx.db
      .query('wallets')
      .withIndex('by_userId', (q) => q.eq('userId', user._id))
      .collect()
    const maxOrder = existing.reduce(
      (max, w) => Math.max(max, w.order ?? -1),
      -1
    )
    const id = await ctx.db.insert('wallets', {
      userId: user._id,
      name: args.name,
      currency: args.currency,
      color: args.color,
      icon: args.icon,
      initialAmount: args.initialAmount,
      order: maxOrder + 1,
    })
    const doc = await ctx.db.get(id)
    if (!doc) throw new Error('Failed to create wallet')
    return {
      id: doc._id as string,
      name: doc.name,
      currency: doc.currency,
      color: doc.color,
      icon: doc.icon,
      initialAmount: doc.initialAmount,
    }
  },
})

export const update = mutation({
  args: {
    id: v.id('wallets'),
    name: v.string(),
    currency: currencyValidator,
    color: walletColorValidator,
    icon: walletIconValidator,
    initialAmount: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    if (!user) throw new Error('Not authenticated')
    const { id, name, currency, color, icon, initialAmount } = args
    const doc = await ctx.db.get(id)
    if (!doc) throw new Error('Wallet not found')
    if (doc.userId !== user._id) throw new Error('Unauthorized')
    const data = { name, currency, color, icon, initialAmount }
    await ctx.db.patch(id, data)
    const updatedDoc = await ctx.db.get(id)
    if (!updatedDoc) throw new Error('Wallet not found')
    return {
      id: updatedDoc._id as string,
      name: updatedDoc.name,
      currency: updatedDoc.currency,
      color: updatedDoc.color,
      icon: updatedDoc.icon,
      initialAmount: updatedDoc.initialAmount,
    }
  },
})

export const reorder = mutation({
  args: {
    updates: v.array(
      v.object({
        id: v.id('wallets'),
        order: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    if (!user) throw new Error('Not authenticated')

    for (const { id, order } of args.updates) {
      const doc = await ctx.db.get(id)
      if (!doc) continue
      if (doc.userId !== user._id) continue

      await ctx.db.patch(id, { order })
    }

    return { success: true }
  },
})
