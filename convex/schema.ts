import { defineSchema, defineTable } from 'convex/server'
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

export default defineSchema({
  wallets: defineTable({
    name: v.string(),
    currency: currencyValidator,
    color: walletColorValidator,
    icon: walletIconValidator,
    totalAmount: v.number(),
  }),
})
