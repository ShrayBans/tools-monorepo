import { TRPCError } from "@trpc/server"
import { eq } from "drizzle-orm/sql"
import { z } from "zod"

import { getDb } from "../db"
import { users } from "../db/schema"
import { createTRPCRouter, protectedProcedure } from "../lib/trpc"

/**
 * Users router - handles user data operations
 */
export const usersRouter = createTRPCRouter({
  /**
   * Update user data (for frontend compatibility)
   */
  update: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100).optional(),
        avatarUrl: z.string().url().optional(),
        misc: z.record(z.any()).optional(),
        accessibleCategories: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb()

      try {
        // Merge misc data with existing misc data
        let updatedMisc = input.misc
        if (input.misc && ctx.dbUser?.misc) {
          updatedMisc = { ...ctx.dbUser.misc, ...input.misc }
        }

        // Update in our database
        const [updatedUser] = await db
          .update(users)
          .set({
            ...(input.name && { name: input.name }),
            ...(input.avatarUrl && { avatarUrl: input.avatarUrl }),
            ...(updatedMisc && { misc: updatedMisc }),
            ...(input.accessibleCategories && { accessibleCategories: input.accessibleCategories }),
            updatedAt: new Date(),
          })
          .where(eq(users.id, ctx.user.id))
          .returning()

        return {
          success: true,
          user: updatedUser,
        }
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to update user",
        })
      }
    }),

  /**
   * Get current user data
   */
  getCurrentUser: protectedProcedure.query(async ({ ctx }) => {
    return {
      success: true,
      user: ctx.dbUser,
    }
  }),
})