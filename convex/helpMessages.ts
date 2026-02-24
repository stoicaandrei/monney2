import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    name: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("helpMessages", {
      name: args.name,
      message: args.message,
      createdAt: Date.now(),
    });
  },
});
