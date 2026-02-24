import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import { getCurrentUser } from './users'

export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx)
    if (!user) return []
    const docs = await ctx.db
      .query('tags')
      .withIndex('by_userId', (q) => q.eq('userId', user._id))
      .collect()
    return docs.map((doc) => ({
      id: doc._id,
      name: doc.name,
    }))
  },
})

export const search = query({
  args: {
    search: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    if (!user) return []
    const searchLower = args.search.trim().toLowerCase()
    if (!searchLower) {
      const docs = await ctx.db
        .query('tags')
        .withIndex('by_userId', (q) => q.eq('userId', user._id))
        .collect()
      return docs.map((doc) => ({
        id: doc._id,
        name: doc.name,
      }))
    }
    const docs = await ctx.db
      .query('tags')
      .withIndex('by_userId', (q) => q.eq('userId', user._id))
      .collect()
    return docs
      .filter((doc) => doc.name.toLowerCase().includes(searchLower))
      .map((doc) => ({
        id: doc._id,
        name: doc.name,
      }))
  },
})

export const create = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    if (!user) throw new Error('Not authenticated')

    const name = args.name.trim()
    if (!name) throw new Error('Tag name is required')

    const existing = await ctx.db
      .query('tags')
      .withIndex('by_userId_name', (q) =>
        q.eq('userId', user._id).eq('name', name)
      )
      .unique()

    if (existing) {
      return {
        id: existing._id,
        name: existing.name,
      }
    }

    const id = await ctx.db.insert('tags', {
      userId: user._id,
      name,
    })

    const doc = await ctx.db.get(id)
    if (!doc) throw new Error('Failed to create tag')
    return {
      id: doc._id,
      name: doc.name,
    }
  },
})
