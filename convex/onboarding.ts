import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { DEFAULT_CATEGORIES } from "./defaultCategories";
import { DEFAULT_TAGS } from "./defaultTags";

/**
 * Creates all default data for a newly registered user.
 * Add new default seeding logic here as the app grows.
 */
export async function createDefaultsForUser(
  ctx: MutationCtx,
  userId: Id<"users">,
): Promise<void> {
  await createDefaultCategories(ctx, userId);
  await createDefaultTags(ctx, userId);
  await createDefaultUserPreferences(ctx, userId);
}

async function createDefaultUserPreferences(
  ctx: MutationCtx,
  userId: Id<"users">,
): Promise<void> {
  await ctx.db.insert("userPreferences", {
    userId,
    defaultCurrency: "EUR",
  });
}

async function createDefaultCategories(
  ctx: MutationCtx,
  userId: Id<"users">,
): Promise<void> {
  for (const type of ["income", "expense"] as const) {
    const categories = DEFAULT_CATEGORIES[type];
    for (let i = 0; i < categories.length; i++) {
      const node = categories[i];
      await ctx.db.insert("categories", {
        userId,
        name: node.name,
        type,
        color: node.color,
        order: i,
      });
    }
  }
}

async function createDefaultTags(
  ctx: MutationCtx,
  userId: Id<"users">,
): Promise<void> {
  for (const name of DEFAULT_TAGS) {
    await ctx.db.insert("tags", {
      userId,
      name,
    });
  }
}
