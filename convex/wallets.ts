import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

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
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const docs = await ctx.db.query('wallets').collect()
    return docs.map((doc) => ({
      id: doc._id as string,
      name: doc.name,
      currency: doc.currency,
      color: doc.color,
      icon: doc.icon,
      totalAmount: doc.totalAmount,
    }))
  },
})

export const create = mutation({
  args: walletFormValidator,
  handler: async (ctx, args) => {
    const id = await ctx.db.insert('wallets', {
      name: args.name,
      currency: args.currency,
      color: args.color,
      icon: args.icon,
      totalAmount: 0,
    })
    const doc = await ctx.db.get(id)
    if (!doc) throw new Error('Failed to create wallet')
    return {
      id: doc._id as string,
      name: doc.name,
      currency: doc.currency,
      color: doc.color,
      icon: doc.icon,
      totalAmount: doc.totalAmount,
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
  },
  handler: async (ctx, args) => {
    const { id, name, currency, color, icon } = args
    const data = { name, currency, color, icon }
    await ctx.db.patch(id, data)
    const doc = await ctx.db.get(id)
    if (!doc) throw new Error('Wallet not found')
    return {
      id: doc._id as string,
      name: doc.name,
      currency: doc.currency,
      color: doc.color,
      icon: doc.icon,
      totalAmount: doc.totalAmount,
    }
  },
})
