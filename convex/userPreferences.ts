import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import { getCurrentUser } from './users'

const currencyValidator = v.union(
  v.literal('USD'),
  v.literal('EUR'),
  v.literal('GBP'),
  v.literal('RON'),
  v.literal('JPY'),
  v.literal('CHF')
)

export const get = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx)
    if (!user) return null
    const prefs = await ctx.db
      .query('userPreferences')
      .withIndex('by_userId', (q) => q.eq('userId', user._id))
      .unique()
    return prefs
  },
})

export const updateDefaultCurrency = mutation({
  args: {
    defaultCurrency: currencyValidator,
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    if (!user) throw new Error('Not authenticated')
    const existing = await ctx.db
      .query('userPreferences')
      .withIndex('by_userId', (q) => q.eq('userId', user._id))
      .unique()
    if (existing) {
      await ctx.db.patch(existing._id, {
        defaultCurrency: args.defaultCurrency,
      })
      return existing._id
    }
    return await ctx.db.insert('userPreferences', {
      userId: user._id,
      defaultCurrency: args.defaultCurrency,
    })
  },
})
