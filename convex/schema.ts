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

const categoryTypeValidator = v.union(
  v.literal('income'),
  v.literal('expense')
)

export default defineSchema({
  users: defineTable({
    name: v.string(),
    tokenIdentifier: v.string(),
  }).index('by_token', ['tokenIdentifier']),

  wallets: defineTable({
    userId: v.id('users'),
    name: v.string(),
    currency: currencyValidator,
    color: walletColorValidator,
    icon: walletIconValidator,
    initialAmount: v.number(),
  }).index('by_userId', ['userId']),

  categories: defineTable({
    userId: v.id('users'),
    name: v.string(),
    type: categoryTypeValidator,
    color: v.string(), // hex color e.g. #10b981
    parentId: v.optional(v.id('categories')),
    order: v.number(),
  })
    .index('by_userId', ['userId'])
    .index('by_userId_type', ['userId', 'type'])
    .index('by_parentId', ['parentId']),

  tags: defineTable({
    userId: v.id('users'),
    name: v.string(),
  })
    .index('by_userId', ['userId'])
    .index('by_userId_name', ['userId', 'name']),

  transactions: defineTable({
    userId: v.id('users'),
    walletId: v.id('wallets'),
    categoryId: v.id('categories'),
    amount: v.number(), // positive = income, negative = expense
    note: v.optional(v.string()),
    date: v.number(), // timestamp in ms
    tagIds: v.optional(v.array(v.id('tags'))),
  })
    .index('by_userId', ['userId'])
    .index('by_userId_date', ['userId', 'date'])
    .index('by_walletId', ['walletId']),

  userPreferences: defineTable({
    userId: v.id('users'),
    defaultCurrency: currencyValidator,
  }).index('by_userId', ['userId']),
})
