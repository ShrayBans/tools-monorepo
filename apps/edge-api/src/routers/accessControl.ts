import { TRPCError } from "@trpc/server"
import { and, count, desc, eq, ilike } from "drizzle-orm/sql"
import { z } from "zod"

import { isSuperAdmin, NAV_CATEGORIES, NavCategory, PRODUCT_DISPLAY_NAMES, PRODUCTS } from "../constants/accessControl"
import { getDb } from "../db"
import { seoProducts, userProductAccess, users } from "../db/schema"
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../lib/trpc"

// Legacy exports for backward compatibility
const MODULE_CATEGORIES = NAV_CATEGORIES
type ModuleCategory = NavCategory

export const accessControlRouter = createTRPCRouter({
  /**
   * Get current user's access information
   */
  getUserCategoryAccess: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb()
    try {
      const userEmail = ctx.user.email
      const isAdmin = isSuperAdmin(userEmail)

      // Get user's accessible nav categories from the database
      const user = await db.query.users.findFirst({
        where: eq(users.id, ctx.user.id),
      })

      // Handle the case where accessibleCategories might be null or undefined
      const rawCategories = user?.accessibleCategories
      const accessibleNavCategories = Array.isArray(rawCategories) ? rawCategories : []

      // Ensure categories is always an array
      const effectiveNavCategories = isAdmin
        ? Object.values(NAV_CATEGORIES)
        : Array.isArray(accessibleNavCategories)
          ? accessibleNavCategories
          : []

      const result = {
        success: true,
        user: {
          id: ctx.user.id,
          email: userEmail,
          isSuperAdmin: isAdmin,
        },
        access: {
          categories: effectiveNavCategories,
        },
      }

      return result
    } catch (error) {
      console.error("❌ Failed to get user access:", error)
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get user access",
      })
    }
  }),

  /**
   * Update user's accessible nav categories (super admin only)
   */
  updateNavCategoryAccess: protectedProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        categories: z.array(z.enum(Object.values(NAV_CATEGORIES) as [NavCategory, ...NavCategory[]])),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb()
      try {
        // Check if the current user is a super admin
        if (!isSuperAdmin(ctx.user.email)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only super admins can update nav category access",
          })
        }

        // Update user's accessible nav categories
        const [updatedUser] = await db
          .update(users)
          .set({
            accessibleCategories: input.categories,
            updatedAt: new Date(),
          })
          .where(eq(users.id, input.userId))
          .returning()

        if (!updatedUser) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
          })
        }

        return {
          success: true,
          user: updatedUser,
          message: "Nav category access updated successfully",
        }
      } catch (error) {
        if (error instanceof TRPCError) throw error
        console.error("❌ Failed to update nav category access:", error)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update nav category access",
        })
      }
    }),

  /**
   * Legacy method for backward compatibility
   */
  updateCategoryAccess: protectedProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        categories: z.array(z.enum(Object.values(MODULE_CATEGORIES) as [ModuleCategory, ...ModuleCategory[]])),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb()
      try {
        // Update user's accessible categories
        await db
          .update(users)
          .set({
            accessibleCategories: input.categories,
            updatedAt: new Date(),
          })
          .where(eq(users.id, input.userId))

        return { success: true }
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update category access",
        })
      }
    }),

  /**
   * Legacy methods for backward compatibility
   */
  getAllCategories: publicProcedure.query(async () => {
    // Return the module categories available
    const categories = [
      { id: NAV_CATEGORIES.AI_GROWTH, label: "AI Growth", itemCount: 2 },
      { id: NAV_CATEGORIES.CONTENT, label: "Content", itemCount: 3 },
      { id: NAV_CATEGORIES.AI_TOOLS, label: "AI Tools", itemCount: 2 },
      { id: NAV_CATEGORIES.SHRAY_PLANNING, label: "Shray Planning", itemCount: 7 },
      { id: NAV_CATEGORIES.FINANCE_TOOLS, label: "Finance Tools", itemCount: 1 },
      { id: NAV_CATEGORIES.BANSAL, label: "Bansal Labs", itemCount: 2 },
      { id: NAV_CATEGORIES.SUPER_ADMIN, label: "Super Admin", itemCount: 2 },
    ]

    return {
      success: true,
      categories,
    }
  }),

  getAllProducts: publicProcedure.query(async () => {
    return {
      success: true,
      products: Object.entries(PRODUCTS).map(([key, value]) => ({
        id: value,
        name: PRODUCT_DISPLAY_NAMES[value],
        key: key,
      })),
    }
  }),

  /**
   * Grant user SEO product access (super admin only)
   */
  grantSeoProductAccess: protectedProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        seoProductId: z.string().uuid(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb()
      try {
        // Check if the current user is a super admin
        if (!isSuperAdmin(ctx.user.email)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only super admins can grant SEO product access",
          })
        }

        // Verify the SEO product exists
        const seoProduct = await db.query.seoProducts.findFirst({
          where: eq(seoProducts.id, input.seoProductId),
        })

        if (!seoProduct) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "SEO product not found",
          })
        }

        // Check if access record already exists
        const existingAccess = await db.query.userProductAccess.findFirst({
          where: and(eq(userProductAccess.userId, input.userId), eq(userProductAccess.productId, input.seoProductId)),
        })

        if (existingAccess) {
          return {
            success: true,
            seoProductAccess: existingAccess,
            message: "User already has access to this SEO product",
          }
        }

        // Create new access record
        const [created] = await db
          .insert(userProductAccess)
          .values({
            userId: input.userId,
            productId: input.seoProductId,
          })
          .returning()

        return {
          success: true,
          seoProductAccess: created,
          message: "SEO product access granted successfully",
        }
      } catch (error) {
        if (error instanceof TRPCError) throw error
        console.error("❌ Failed to grant SEO product access:", error)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to grant SEO product access",
        })
      }
    }),

  /**
   * Revoke user SEO product access (super admin only)
   */
  revokeSeoProductAccess: protectedProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        seoProductId: z.string().uuid(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb()
      try {
        // Check if the current user is a super admin
        if (!isSuperAdmin(ctx.user.email)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only super admins can revoke SEO product access",
          })
        }

        // Find and delete the access record
        const deletedRows = await db
          .delete(userProductAccess)
          .where(and(eq(userProductAccess.userId, input.userId), eq(userProductAccess.productId, input.seoProductId)))
          .returning()

        if (deletedRows.length === 0) {
          return {
            success: true,
            message: "User already does not have access to this SEO product",
          }
        }

        return {
          success: true,
          message: "SEO product access revoked successfully",
        }
      } catch (error) {
        if (error instanceof TRPCError) throw error
        console.error("❌ Failed to revoke SEO product access:", error)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to revoke SEO product access",
        })
      }
    }),

  /**
   * Get current user's accessible routes
   */
  getMyAccessibleRoutes: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb()
    try {
      const userEmail = ctx.user.email
      const isAdmin = isSuperAdmin(userEmail)

      // Get user's accessible categories
      const user = await db.query.users.findFirst({
        where: eq(users.id, ctx.user.id),
      })

      const accessibleCategories = (user?.accessibleCategories as string[] | null) || []

      // For now, return a simple structure - will be enhanced with navigation integration
      const accessibleRoutes: string[] = []

      // TODO: Integrate with navigationConfig to generate actual routes
      // This will be implemented when we create the navigation integration

      return {
        success: true,
        routes: accessibleRoutes,
      }
    } catch (error) {
      console.error("❌ Failed to get accessible routes:", error)
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get accessible routes",
      })
    }
  }),

  /**
   * SEO Products CRUD - manages company/brand SEO products
   */
  seoProducts: createTRPCRouter({
    list: protectedProcedure
      .input(
        z.object({
          page: z.number().min(1).default(1),
          limit: z.number().min(1).max(100).default(20),
          search: z.string().optional(),
        }),
      )
      .query(async ({ input, ctx }) => {
        const db = await getDb()
        // TODO: Add user access control for SEO products
        // For now, all authenticated users can see all SEO products
        // Later, we'll filter based on user's assigned SEO products

        const offset = (input.page - 1) * input.limit
        const whereClause = input.search ? ilike(seoProducts.name, `%${input.search}%`) : undefined

        const [products, total] = await Promise.all([
          db.query.seoProducts.findMany({
            where: whereClause,
            limit: input.limit,
            offset,
            orderBy: [desc(seoProducts.createdAt)],
          }),
          db
            .select({ count: count() })
            .from(seoProducts)
            .where(whereClause)
            .then((r) => r[0]?.count || 0),
        ])

        return {
          products,
          pagination: {
            page: input.page,
            limit: input.limit,
            total,
            pages: Math.ceil(total / input.limit),
          },
        }
      }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1).max(100),
          slug: z.string().min(1).max(50),
          domain: z.string().min(1),
          rootPath: z.string().default("/blog"),
          defaultLanguage: z.string().default("en"),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        const db = await getDb()
        // Check if the current user is a super admin
        if (!isSuperAdmin(ctx.user.email)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only super admins can create SEO products",
          })
        }

        const [product] = await db
          .insert(seoProducts)
          .values(input as any) // TODO: Fix seo typing
          .returning()

        return product
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.string().uuid(),
          name: z.string().min(1).max(100).optional(),
          domain: z.string().min(1).optional(),
          rootPath: z.string().optional(),
          defaultLanguage: z.string().optional(),
          isActive: z.boolean().optional(),
          payloadCmsConfig: z.string().optional(),
          surferSeoApiKey: z.string().optional(),
          googleSearchConsoleConfig: z.string().optional(),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        const db = await getDb()
        // Check if the current user is a super admin
        if (!isSuperAdmin(ctx.user.email)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only super admins can update SEO products",
          })
        }

        const { id, ...updateData } = input
        const [product] = await db
          .update(seoProducts)
          .set({ ...updateData, updatedAt: new Date() })
          .where(eq(seoProducts.id, id))
          .returning()

        if (!product) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "SEO product not found",
          })
        }

        return product
      }),

    delete: protectedProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ input, ctx }) => {
      const db = await getDb()
      // Check if the current user is a super admin
      if (!isSuperAdmin(ctx.user.email)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only super admins can delete SEO products",
        })
      }

      await db.delete(seoProducts).where(eq(seoProducts.id, input.id))

      return { success: true }
    }),

    getById: protectedProcedure.input(z.object({ id: z.string().uuid() })).query(async ({ input, ctx }) => {
      const db = await getDb()
      // TODO: Add user access control for SEO products
      const product = await db.query.seoProducts.findFirst({
        where: eq(seoProducts.id, input.id),
      })

      if (!product) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "SEO product not found",
        })
      }

      return product
    }),
  }),
})
