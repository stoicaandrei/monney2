import { mutation, query } from './_generated/server'
import type { MutationCtx } from './_generated/server'
import { v } from 'convex/values'
import type { Id } from './_generated/dataModel'
import { getCurrentUser } from './users'

const currencyValidator = v.union(
  v.literal('USD'),
  v.literal('EUR'),
  v.literal('GBP'),
  v.literal('RON'),
  v.literal('JPY'),
  v.literal('CHF')
)

const netWorthAssetTypeValidator = v.union(v.literal('retirement_account'))

type SnapshotPoint = {
  id: string
  portfolioValue: number
  investedAmount: number
  createdAt: number
}

function toUtcDayStartTimestamp(timestamp: number): number {
  const date = new Date(timestamp)
  return Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate()
  )
}

async function getLatestSnapshotValues(
  ctx: MutationCtx,
  assetId: Id<'netWorthAssets'>
) {
  const snapshots = await ctx.db
    .query('netWorthSnapshots')
    .withIndex('by_assetId_createdAt', (q) => q.eq('assetId', assetId))
    .collect()

  const latestSnapshot = snapshots[snapshots.length - 1]
  return {
    portfolioValue: latestSnapshot?.portfolioValue ?? 0,
    investedAmount: latestSnapshot?.investedAmount ?? 0,
  }
}

export const listAssets = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx)
    if (!user) return []

    const assets = await ctx.db
      .query('netWorthAssets')
      .withIndex('by_userId', (q) => q.eq('userId', user._id))
      .collect()

    assets.sort((a, b) => (a.order ?? 1e9) - (b.order ?? 1e9))

    const assetsWithSnapshots = await Promise.all(
      assets.map(async (asset) => {
        const snapshotDocs = await ctx.db
          .query('netWorthSnapshots')
          .withIndex('by_assetId_createdAt', (q) => q.eq('assetId', asset._id))
          .collect()

        const snapshots: SnapshotPoint[] = snapshotDocs.map((snapshot) => ({
          id: snapshot._id as string,
          portfolioValue: snapshot.portfolioValue,
          investedAmount: snapshot.investedAmount,
          createdAt: snapshot.createdAt,
        }))

        const latestSnapshot = snapshots[snapshots.length - 1]
        const currentPortfolioValue = latestSnapshot?.portfolioValue ?? 0
        const currentInvestedAmount = latestSnapshot?.investedAmount ?? 0

        return {
          id: asset._id as string,
          name: asset.name,
          type: asset.type,
          currency: asset.currency,
          order: asset.order,
          createdAt: asset.createdAt,
          updatedAt: asset.updatedAt,
          currentPortfolioValue,
          currentInvestedAmount,
          gainAmount: currentPortfolioValue - currentInvestedAmount,
          snapshots,
        }
      })
    )

    return assetsWithSnapshots
  },
})

export const createAsset = mutation({
  args: {
    name: v.string(),
    type: netWorthAssetTypeValidator,
    currency: currencyValidator,
    initialPortfolioValue: v.number(),
    initialInvestedAmount: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    if (!user) throw new Error('Not authenticated')

    const normalizedName = args.name.trim()
    if (!normalizedName) throw new Error('Asset name is required')

    const existingAssets = await ctx.db
      .query('netWorthAssets')
      .withIndex('by_userId', (q) => q.eq('userId', user._id))
      .collect()

    const maxOrder = existingAssets.reduce(
      (max, asset) => Math.max(max, asset.order ?? -1),
      -1
    )

    const now = Date.now()
    const assetId = await ctx.db.insert('netWorthAssets', {
      userId: user._id,
      name: normalizedName,
      type: args.type,
      currency: args.currency,
      order: maxOrder + 1,
      createdAt: now,
      updatedAt: now,
    })

    await ctx.db.insert('netWorthSnapshots', {
      userId: user._id,
      assetId,
      portfolioValue: args.initialPortfolioValue,
      investedAmount: args.initialInvestedAmount,
      createdAt: now,
    })

    return assetId
  },
})

export const addSnapshot = mutation({
  args: {
    assetId: v.id('netWorthAssets'),
    portfolioValue: v.number(),
    investedAmount: v.number(),
    createdAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    if (!user) throw new Error('Not authenticated')

    const asset = await ctx.db.get(args.assetId)
    if (!asset) throw new Error('Asset not found')
    if (asset.userId !== user._id) throw new Error('Unauthorized')

    const timestamp = args.createdAt ?? Date.now()
    const snapshotId = await ctx.db.insert('netWorthSnapshots', {
      userId: user._id,
      assetId: args.assetId,
      portfolioValue: args.portfolioValue,
      investedAmount: args.investedAmount,
      createdAt: timestamp,
    })

    await ctx.db.patch(args.assetId, { updatedAt: timestamp })

    return snapshotId
  },
})

export const renameAsset = mutation({
  args: {
    assetId: v.id('netWorthAssets'),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    if (!user) throw new Error('Not authenticated')

    const asset = await ctx.db.get(args.assetId)
    if (!asset) throw new Error('Asset not found')
    if (asset.userId !== user._id) throw new Error('Unauthorized')

    const normalizedName = args.name.trim()
    if (!normalizedName) throw new Error('Asset name is required')

    await ctx.db.patch(args.assetId, {
      name: normalizedName,
      updatedAt: Date.now(),
    })

    return { success: true }
  },
})

export const deleteAsset = mutation({
  args: {
    assetId: v.id('netWorthAssets'),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    if (!user) throw new Error('Not authenticated')

    const asset = await ctx.db.get(args.assetId)
    if (!asset) throw new Error('Asset not found')
    if (asset.userId !== user._id) throw new Error('Unauthorized')

    const snapshots = await ctx.db
      .query('netWorthSnapshots')
      .withIndex('by_assetId_createdAt', (q) => q.eq('assetId', args.assetId))
      .collect()

    for (const snapshot of snapshots) {
      await ctx.db.delete(snapshot._id)
    }

    await ctx.db.delete(args.assetId)

    return { success: true }
  },
})

export const registerPayment = mutation({
  args: {
    assetId: v.id('netWorthAssets'),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    if (!user) throw new Error('Not authenticated')

    const asset = await ctx.db.get(args.assetId)
    if (!asset) throw new Error('Asset not found')
    if (asset.userId !== user._id) throw new Error('Unauthorized')
    if (args.amount <= 0) throw new Error('Payment amount must be positive')

    const latestValues = await getLatestSnapshotValues(ctx, args.assetId)
    const now = Date.now()

    const snapshotId = await ctx.db.insert('netWorthSnapshots', {
      userId: user._id,
      assetId: args.assetId,
      portfolioValue: latestValues.portfolioValue + args.amount,
      investedAmount: latestValues.investedAmount + args.amount,
      createdAt: now,
    })

    await ctx.db.patch(args.assetId, { updatedAt: now })

    return snapshotId
  },
})

export const netWorthEvolution = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx)
    if (!user) return []

    const assets = await ctx.db
      .query('netWorthAssets')
      .withIndex('by_userId', (q) => q.eq('userId', user._id))
      .collect()

    const allEvents: Array<{
      assetId: Id<'netWorthAssets'>
      createdAt: number
      portfolioValue: number
      investedAmount: number
    }> = []

    for (const asset of assets) {
      const snapshots = await ctx.db
        .query('netWorthSnapshots')
        .withIndex('by_assetId_createdAt', (q) => q.eq('assetId', asset._id))
        .collect()

      for (const snapshot of snapshots) {
        allEvents.push({
          assetId: asset._id,
          createdAt: snapshot.createdAt,
          portfolioValue: snapshot.portfolioValue,
          investedAmount: snapshot.investedAmount,
        })
      }
    }

    allEvents.sort((a, b) => a.createdAt - b.createdAt)

    const latestValuesByAsset = new Map<
      string,
      { portfolioValue: number; investedAmount: number }
    >()
    const pointsByDay = new Map<
      number,
      {
        createdAt: number
        totalPortfolioValue: number
        totalInvestedAmount: number
        gainAmount: number
      }
    >()

    const points: Array<{
      createdAt: number
      totalPortfolioValue: number
      totalInvestedAmount: number
      gainAmount: number
    }> = []

    let eventIndex = 0
    while (eventIndex < allEvents.length) {
      const currentTimestamp = allEvents[eventIndex].createdAt

      while (
        eventIndex < allEvents.length &&
        allEvents[eventIndex].createdAt === currentTimestamp
      ) {
        const event = allEvents[eventIndex]
        latestValuesByAsset.set(event.assetId, {
          portfolioValue: event.portfolioValue,
          investedAmount: event.investedAmount,
        })
        eventIndex += 1
      }

      let totalPortfolioValue = 0
      let totalInvestedAmount = 0
      for (const values of latestValuesByAsset.values()) {
        totalPortfolioValue += values.portfolioValue
        totalInvestedAmount += values.investedAmount
      }

      const dayStartTimestamp = toUtcDayStartTimestamp(currentTimestamp)
      pointsByDay.set(dayStartTimestamp, {
        createdAt: dayStartTimestamp,
        totalPortfolioValue,
        totalInvestedAmount,
        gainAmount: totalPortfolioValue - totalInvestedAmount,
      })
    }

    points.push(...pointsByDay.values())
    points.sort((a, b) => a.createdAt - b.createdAt)

    return points
  },
})
