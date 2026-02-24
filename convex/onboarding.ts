import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { DEFAULT_CATEGORIES } from "./defaultCategories";

/**
 * Creates all default data for a newly registered user.
 * Add new default seeding logic here as the app grows.
 */
export async function createDefaultsForUser(
  ctx: MutationCtx,
  userId: Id<"users">,
): Promise<void> {
  await createDefaultCategories(ctx, userId);
}

async function createDefaultCategories(
  ctx: MutationCtx,
  userId: Id<"users">,
): Promise<void> {
  for (const type of ["income", "expense"] as const) {
    const roots = DEFAULT_CATEGORIES[type];
    for (let i = 0; i < roots.length; i++) {
      const node = roots[i];
      const parentId = await ctx.db.insert("categories", {
        userId,
        name: node.name,
        type,
        color: node.color,
        order: i,
      });
      if (node.children) {
        for (let j = 0; j < node.children.length; j++) {
          const child = node.children[j];
          await ctx.db.insert("categories", {
            userId,
            name: child.name,
            type,
            color: child.color,
            parentId,
            order: j,
          });
        }
      }
    }
  }
}
