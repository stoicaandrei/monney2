import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./users";

export const list = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    const docs = await ctx.db
      .query("transactions")
      .withIndex("by_userId_date", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(args.limit ?? 100);
    return docs.map((doc) => ({
      id: doc._id,
      walletId: doc.walletId,
      categoryId: doc.categoryId,
      amount: doc.amount,
      note: doc.note,
      date: doc.date,
      tagIds: doc.tagIds ?? [],
    }));
  },
});

export const create = mutation({
  args: {
    walletId: v.id("wallets"),
    categoryId: v.id("categories"),
    amount: v.number(),
    note: v.optional(v.string()),
    date: v.number(),
    tagIds: v.optional(v.array(v.id("tags"))),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const wallet = await ctx.db.get(args.walletId);
    if (!wallet || wallet.userId !== user._id) {
      throw new Error("Wallet not found");
    }

    const category = await ctx.db.get(args.categoryId);
    if (!category || category.userId !== user._id) {
      throw new Error("Category not found");
    }

    const tagIds = args.tagIds ?? [];
    for (const tagId of tagIds) {
      const tag = await ctx.db.get(tagId);
      if (!tag || tag.userId !== user._id) {
        throw new Error("Tag not found");
      }
    }

    // User enters positive amount; we negate for expense categories
    const amount =
      category.type === "expense"
        ? -Math.abs(args.amount)
        : Math.abs(args.amount);

    const id = await ctx.db.insert("transactions", {
      userId: user._id,
      walletId: args.walletId,
      categoryId: args.categoryId,
      amount,
      note: args.note,
      date: args.date,
      tagIds: tagIds.length > 0 ? tagIds : undefined,
    });

    const doc = await ctx.db.get(id);
    if (!doc) throw new Error("Failed to create transaction");
    return {
      id: doc._id,
      walletId: doc.walletId,
      categoryId: doc.categoryId,
      amount: doc.amount,
      note: doc.note,
      date: doc.date,
      tagIds: doc.tagIds ?? [],
    };
  },
});

export const update = mutation({
  args: {
    id: v.id("transactions"),
    walletId: v.optional(v.id("wallets")),
    categoryId: v.optional(v.id("categories")),
    amount: v.optional(v.number()),
    note: v.optional(v.string()),
    date: v.optional(v.number()),
    tagIds: v.optional(v.array(v.id("tags"))),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const doc = await ctx.db.get(args.id);
    if (!doc) throw new Error("Transaction not found");
    if (doc.userId !== user._id) throw new Error("Unauthorized");

    if (args.walletId !== undefined) {
      const wallet = await ctx.db.get(args.walletId);
      if (!wallet || wallet.userId !== user._id) {
        throw new Error("Wallet not found");
      }
    }

    if (args.categoryId !== undefined) {
      const category = await ctx.db.get(args.categoryId);
      if (!category || category.userId !== user._id) {
        throw new Error("Category not found");
      }
    }

    if (args.tagIds !== undefined) {
      for (const tagId of args.tagIds) {
        const tag = await ctx.db.get(tagId);
        if (!tag || tag.userId !== user._id) {
          throw new Error("Tag not found");
        }
      }
    }

    const updates: Record<string, unknown> = {};
    if (args.walletId !== undefined) updates.walletId = args.walletId;
    if (args.categoryId !== undefined) updates.categoryId = args.categoryId;
    if (args.note !== undefined) updates.note = args.note;
    if (args.date !== undefined) updates.date = args.date;
    if (args.tagIds !== undefined) {
      updates.tagIds = args.tagIds.length > 0 ? args.tagIds : undefined;
    }

    if (args.amount !== undefined && args.categoryId !== undefined) {
      const category = await ctx.db.get(args.categoryId);
      const cat = category ?? (await ctx.db.get(doc.categoryId));
      if (cat) {
        updates.amount =
          cat.type === "expense"
            ? -Math.abs(args.amount)
            : Math.abs(args.amount);
      }
    } else if (args.amount !== undefined) {
      const category = await ctx.db.get(doc.categoryId);
      if (category) {
        updates.amount =
          category.type === "expense"
            ? -Math.abs(args.amount)
            : Math.abs(args.amount);
      }
    }

    await ctx.db.patch(args.id, updates);

    const updated = await ctx.db.get(args.id);
    if (!updated) throw new Error("Failed to update transaction");
    return {
      id: updated._id,
      walletId: updated.walletId,
      categoryId: updated.categoryId,
      amount: updated.amount,
      note: updated.note,
      date: updated.date,
      tagIds: updated.tagIds ?? [],
    };
  },
});

export const remove = mutation({
  args: { id: v.id("transactions") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const doc = await ctx.db.get(args.id);
    if (!doc) throw new Error("Transaction not found");
    if (doc.userId !== user._id) throw new Error("Unauthorized");

    await ctx.db.delete(args.id);
    return { success: true };
  },
});
