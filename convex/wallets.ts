import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import type { Id } from './_generated/dataModel'
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
          sectionId: doc.sectionId ?? null,
          order: doc.order,
        }
      }),
    )
    return results
  },
})

export const listSections = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx)
    if (!user) return []

    const sectionDocs = await ctx.db
      .query('walletSections')
      .withIndex('by_userId', (q) => q.eq('userId', user._id))
      .collect()
    sectionDocs.sort((a, b) => a.order - b.order)

    return sectionDocs.map((section) => ({
      id: section._id as string,
      name: section.name,
      order: section.order,
    }))
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
      sectionId: null,
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

export const remove = mutation({
  args: { id: v.id('wallets') },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    if (!user) throw new Error('Not authenticated')

    const wallet = await ctx.db.get(args.id)
    if (!wallet) throw new Error('Wallet not found')
    if (wallet.userId !== user._id) throw new Error('Unauthorized')

    const transactions = await ctx.db
      .query('transactions')
      .withIndex('by_walletId', (q) => q.eq('walletId', args.id))
      .collect()

    for (const transaction of transactions) {
      if (transaction.userId === user._id) {
        await ctx.db.delete(transaction._id)
      }
    }

    await ctx.db.delete(args.id)
    return { success: true }
  },
})

export const reorder = mutation({
  args: {
    updates: v.array(
      v.object({
        id: v.id('wallets'),
        sectionId: v.union(v.id('walletSections'), v.null()),
        order: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    if (!user) throw new Error('Not authenticated')

    const userSectionDocs = await ctx.db
      .query('walletSections')
      .withIndex('by_userId', (q) => q.eq('userId', user._id))
      .collect()
    const userSectionIds = new Set(
      userSectionDocs.map((section) => section._id as Id<'walletSections'>)
    )

    for (const { id, sectionId, order } of args.updates) {
      const doc = await ctx.db.get(id)
      if (!doc) continue
      if (doc.userId !== user._id) continue
      if (sectionId !== null && !userSectionIds.has(sectionId)) continue

      await ctx.db.patch(id, { sectionId, order })
    }

    return { success: true }
  },
})

export const createSection = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    if (!user) throw new Error('Not authenticated')

    const normalizedName = args.name.trim()
    if (!normalizedName) throw new Error('Section name is required')

    const existingSections = await ctx.db
      .query('walletSections')
      .withIndex('by_userId', (q) => q.eq('userId', user._id))
      .collect()

    const maxOrder = existingSections.reduce(
      (max, section) => Math.max(max, section.order),
      -1
    )
    const now = Date.now()

    const sectionId = await ctx.db.insert('walletSections', {
      userId: user._id,
      name: normalizedName,
      order: maxOrder + 1,
      createdAt: now,
      updatedAt: now,
    })

    return {
      id: sectionId as string,
      name: normalizedName,
      order: maxOrder + 1,
    }
  },
})

export const reorderSections = mutation({
  args: {
    updates: v.array(
      v.object({
        id: v.id('walletSections'),
        order: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    if (!user) throw new Error('Not authenticated')

    for (const { id, order } of args.updates) {
      const section = await ctx.db.get(id)
      if (!section) continue
      if (section.userId !== user._id) continue

      await ctx.db.patch(id, { order, updatedAt: Date.now() })
    }

    return { success: true }
  },
})

export const renameSection = mutation({
  args: {
    id: v.id('walletSections'),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    if (!user) throw new Error('Not authenticated')

    const section = await ctx.db.get(args.id)
    if (!section) throw new Error('Section not found')
    if (section.userId !== user._id) throw new Error('Unauthorized')

    const normalizedName = args.name.trim()
    if (!normalizedName) throw new Error('Section name is required')

    await ctx.db.patch(args.id, {
      name: normalizedName,
      updatedAt: Date.now(),
    })

    return { success: true }
  },
})
