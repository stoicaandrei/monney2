import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import { getCurrentUser } from './users'

const categoryTypeValidator = v.union(
  v.literal('income'),
  v.literal('expense')
)

export const list = query({
  args: {
    type: categoryTypeValidator,
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    if (!user) return []
    const docs = await ctx.db
      .query('categories')
      .withIndex('by_userId_type', (q) =>
        q.eq('userId', user._id).eq('type', args.type)
      )
      .collect()
    return docs.map((doc) => ({
      id: doc._id,
      name: doc.name,
      type: doc.type,
      color: doc.color,
      parentId: doc.parentId,
      order: doc.order,
    }))
  },
})

export const create = mutation({
  args: {
    name: v.string(),
    type: categoryTypeValidator,
    color: v.string(),
    parentId: v.optional(v.id('categories')),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    if (!user) throw new Error('Not authenticated')

    const allOfType = await ctx.db
      .query('categories')
      .withIndex('by_userId_type', (q) =>
        q.eq('userId', user._id).eq('type', args.type)
      )
      .collect()

    const siblings = allOfType.filter(
      (c) =>
        (c.parentId === undefined && args.parentId === undefined) ||
        (c.parentId !== undefined &&
          args.parentId !== undefined &&
          c.parentId === args.parentId)
    )

    const isDuplicate = siblings.some(
      (s) => s.name.toLowerCase().trim() === args.name.toLowerCase().trim()
    )
    if (isDuplicate) {
      throw new Error('A category with this name already exists')
    }

    const maxOrder =
      siblings.length > 0
        ? Math.max(...siblings.map((s) => s.order))
        : -1

    const id = await ctx.db.insert('categories', {
      userId: user._id,
      name: args.name,
      type: args.type,
      color: args.color,
      parentId: args.parentId,
      order: maxOrder + 1,
    })

    const doc = await ctx.db.get(id)
    if (!doc) throw new Error('Failed to create category')
    return {
      id: doc._id,
      name: doc.name,
      type: doc.type,
      color: doc.color,
      parentId: doc.parentId,
      order: doc.order,
    }
  },
})

export const update = mutation({
  args: {
    id: v.id('categories'),
    name: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    if (!user) throw new Error('Not authenticated')
    const { id, ...updates } = args
    const doc = await ctx.db.get(id)
    if (!doc) throw new Error('Category not found')
    if (doc.userId !== user._id) throw new Error('Unauthorized')

    if (updates.name !== undefined) {
      const allOfType = await ctx.db
        .query('categories')
        .withIndex('by_userId_type', (q) =>
          q.eq('userId', user._id).eq('type', doc.type)
        )
        .collect()

      const siblings = allOfType.filter(
        (c) =>
          (c.parentId === undefined && doc.parentId === undefined) ||
          (c.parentId !== undefined &&
            doc.parentId !== undefined &&
            c.parentId === doc.parentId)
      )

      const isDuplicate = siblings.some(
        (s) =>
          s._id !== id &&
          s.name.toLowerCase().trim() === updates.name!.toLowerCase().trim()
      )
      if (isDuplicate) {
        throw new Error('A category with this name already exists')
      }
    }

    const patch: Record<string, unknown> = {}
    if (updates.name !== undefined) patch.name = updates.name
    if (updates.color !== undefined) patch.color = updates.color
    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(id, patch)
    }
    const updated = await ctx.db.get(id)
    if (!updated) throw new Error('Category not found')
    return {
      id: updated._id,
      name: updated.name,
      type: updated.type,
      color: updated.color,
      parentId: updated.parentId,
      order: updated.order,
    }
  },
})

export const remove = mutation({
  args: { id: v.id('categories') },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    if (!user) throw new Error('Not authenticated')
    const doc = await ctx.db.get(args.id)
    if (!doc) throw new Error('Category not found')
    if (doc.userId !== user._id) throw new Error('Unauthorized')

    const children = await ctx.db
      .query('categories')
      .withIndex('by_parentId', (q) => q.eq('parentId', args.id))
      .collect()

    for (const child of children) {
      await ctx.db.patch(child._id, { parentId: doc.parentId })
    }

    await ctx.db.delete(args.id)
    return { success: true }
  },
})

export const reorder = mutation({
  args: {
    type: categoryTypeValidator,
    updates: v.array(
      v.object({
        id: v.id('categories'),
        parentId: v.optional(v.id('categories')),
        order: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    if (!user) throw new Error('Not authenticated')

    for (const { id, parentId, order } of args.updates) {
      const doc = await ctx.db.get(id)
      if (!doc) continue
      if (doc.userId !== user._id) continue
      if (doc.type !== args.type) continue

      await ctx.db.patch(id, {
        parentId: parentId ?? undefined,
        order,
      })
    }

    return { success: true }
  },
})
