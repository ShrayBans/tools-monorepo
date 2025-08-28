import crypto from "crypto"
import { and, count, desc, eq, ilike, or } from "drizzle-orm/sql"
import { z } from "zod"

import { getDb } from "../db"
import { integrations, seoProducts, userIntegrationAccounts, userProductAccess, userProfiles, users } from "../db/schema"
import { createTRPCRouter, DbUser, protectedProcedure, publicProcedure } from "../lib/trpc"

/**
 * User Management Router - handles user profile and integration account management
 */
export const userManagementRouter = createTRPCRouter({
  /**
   * Get all users with their profiles and integration accounts
   */
  getAllUsers: publicProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
        search: z.string().optional(),
        isActive: z.boolean().optional(),
      }),
    )
    .query(async ({ input }) => {
      const db = await getDb()

      try {
        const offset = (input.page - 1) * input.limit

        // Build where clause for users
        const userWhereClause = and(
          input.isActive !== undefined ? eq(users.isActive, input.isActive) : undefined,
          input.search
            ? or(ilike(users.name, `%${input.search}%`), ilike(users.email, `%${input.search}%`))
            : undefined,
        )

        // Get users with their profiles and integration accounts
        const usersList = await db
          .select({
            id: users.id,
            email: users.email,
            name: users.name,
            avatarUrl: users.avatarUrl,
            isActive: users.isActive,
            createdAt: users.createdAt,
            updatedAt: users.updatedAt,
            // Profile data
            profileId: userProfiles.id,
            firstName: userProfiles.firstName,
            lastName: userProfiles.lastName,
            title: userProfiles.title,
            department: userProfiles.department,
            location: userProfiles.location,
            timezone: userProfiles.timezone,
            phone: userProfiles.phone,
            lastActiveAt: userProfiles.lastActiveAt,
            profileCompleteness: userProfiles.profileCompleteness,
            isOnboarded: userProfiles.isOnboarded,
          })
          .from(users)
          .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
          .where(userWhereClause)
          .orderBy(desc(users.createdAt))
          .limit(input.limit)
          .offset(offset)

        // Get integration accounts for these users
        const userIds = usersList.map((user) => user.id)
        const integrationAccounts =
          userIds.length > 0
            ? await db
                .select({
                  userId: userIntegrationAccounts.userId,
                  integrationId: userIntegrationAccounts.integrationId,
                  integrationName: integrations.name,
                  externalUserId: userIntegrationAccounts.externalUserId,
                  externalUsername: userIntegrationAccounts.externalUsername,
                  externalEmail: userIntegrationAccounts.externalEmail,
                  externalDisplayName: userIntegrationAccounts.externalDisplayName,
                  isVerified: userIntegrationAccounts.isVerified,
                  isActive: userIntegrationAccounts.isActive,
                  syncStatus: userIntegrationAccounts.syncStatus,
                })
                .from(userIntegrationAccounts)
                .leftJoin(integrations, eq(userIntegrationAccounts.integrationId, integrations.id))
                .where(or(...userIds.map((id: string) => eq(userIntegrationAccounts.userId, id))))
            : []

        // Group integration accounts by user ID
        const integrationsByUser = integrationAccounts.reduce(
          (acc, integration) => {
            const userId = integration?.userId
            if (!userId) return acc
            if (!acc[userId]) {
              acc[userId] = []
            }
            acc[userId]!.push(integration)
            return acc
          },
          {} as Record<string, typeof integrationAccounts>,
        )

        // Combine users with their integration accounts
        const usersWithIntegrations = usersList.map((user) => ({
          ...user,
          integrationAccounts: integrationsByUser[user.id] || [],
        }))

        // Get total count
        const totalCount = await db
          .select({ count: count() })
          .from(users)
          .where(userWhereClause)
          .then((result) => result[0]?.count || 0)

        return {
          success: true,
          users: usersWithIntegrations,
          pagination: {
            page: input.page,
            limit: input.limit,
            total: totalCount,
            pages: Math.ceil(totalCount / input.limit),
          },
        }
      } catch (error) {
        console.error("❌ Failed to get users:", error)
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to fetch users",
        }
      }
    }),

  /**
   * Get user management dashboard stats
   */
  getDashboardStats: publicProcedure.query(async () => {
    const db = await getDb()

    try {
      // Get total users
      const totalUsers = await db
        .select({ count: count() })
        .from(users)
        .then((result) => result[0]?.count || 0)

      // Get active users
      const activeUsers = await db
        .select({ count: count() })
        .from(users)
        .where(eq(users.isActive, true))
        .then((result) => result[0]?.count || 0)

      return {
        success: true,
        stats: {
          totalUsers,
          activeUsers,
        },
      }
    } catch (error) {
      console.error("❌ Failed to get dashboard stats:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get dashboard stats",
      }
    }
  }),

  /**
   * Create user directly in users table (simple user creation)
   */
  createUser: protectedProcedure
    .input(
      z.object({
        email: z.string().email(),
        name: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb()

      try {
        console.log("👤 Creating user directly:", input)
        console.log("👤 Context user:", ctx.user?.id)

        // Ensure we have a valid user creating this
        if (!ctx.user?.id) {
          return {
            success: false,
            error: "Authentication required",
          }
        }

        // Check if user already exists
        const existingUser = await db.query.users.findFirst({
          where: eq(users.email, input.email),
        })

        if (existingUser) {
          return {
            success: false,
            error: "User with this email already exists",
          }
        }

        // Generate a new user ID
        const newUserId = crypto.randomUUID()

        // Create user directly in users table
        const [newUser] = await db
          .insert(users)
          .values({
            id: newUserId,
            email: input.email,
            name: input.name || input.email.split("@")[0],
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning()

        console.log("✅ User created successfully:", newUser?.id)

        return {
          success: true,
          user: newUser,
          message: "User created successfully",
        }
      } catch (error) {
        console.error("❌ Failed to create user:", error)
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to create user",
        }
      }
    }),

  /**
   * Add Linear integration account for a user
   */
  addLinearIntegration: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        externalUserId: z.string(),
        externalUsername: z.string().optional(),
        externalEmail: z.string().email().optional(),
        externalDisplayName: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb()

      try {
        console.log("🔗 Adding Linear integration for user:", input.userId)

        // Check if Linear integration exists, if not create it
        let linearIntegration = await db.query.integrations.findFirst({
          where: eq(integrations.name, "Linear"),
        })

        if (!linearIntegration) {
          const [newIntegration] = await db
            .insert(integrations)
            .values({
              name: "Linear",
              type: "project_management",
              baseUrl: "https://api.linear.app",
              isActive: true,
              settings: JSON.stringify({
                description: "Linear project management integration",
                supportsAuth: true,
                requiresUsername: true,
              }),
            })
            .returning()
          linearIntegration = newIntegration
          console.log("✅ Created Linear integration:", linearIntegration?.id)
        }

        if (!linearIntegration) {
          return {
            success: false,
            error: "Failed to create or find Linear integration",
          }
        }

        // Check if user already has a Linear integration
        const existingAccount = await db.query.userIntegrationAccounts.findFirst({
          where: and(
            eq(userIntegrationAccounts.userId, input.userId),
            eq(userIntegrationAccounts.integrationId, linearIntegration.id),
          ),
        })

        if (existingAccount) {
          return {
            success: false,
            error: "User already has a Linear integration account",
          }
        }

        // Create the integration account
        const [integrationAccount] = await db
          .insert(userIntegrationAccounts)
          .values({
            userId: input.userId,
            integrationId: linearIntegration.id,
            externalUserId: input.externalUserId,
            externalUsername: input.externalUsername,
            externalEmail: input.externalEmail,
            externalDisplayName: input.externalDisplayName,
            isVerified: true, // Manual setup, so mark as verified
            isActive: true,
            syncStatus: "connected",
            lastSyncAt: new Date(),
          })
          .returning()

        console.log("✅ Linear integration account created:", integrationAccount?.id)

        return {
          success: true,
          integrationAccount,
          message: "Linear integration added successfully",
        }
      } catch (error) {
        console.error("❌ Failed to add Linear integration:", error)
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to add Linear integration",
        }
      }
    }),

  /**
   * Update Linear integration account for a user
   */
  updateLinearIntegration: protectedProcedure
    .input(
      z.object({
        integrationAccountId: z.string(),
        externalUserId: z.string().optional(),
        externalUsername: z.string().optional(),
        externalEmail: z.string().email().optional(),
        externalDisplayName: z.string().optional(),
        isActive: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb()

      try {
        const updateData = {
          ...(input.externalUserId && { externalUserId: input.externalUserId }),
          ...(input.externalUsername && { externalUsername: input.externalUsername }),
          ...(input.externalEmail && { externalEmail: input.externalEmail }),
          ...(input.externalDisplayName && { externalDisplayName: input.externalDisplayName }),
          ...(input.isActive !== undefined && { isActive: input.isActive }),
          updatedAt: new Date(),
        }

        const [updatedAccount] = await db
          .update(userIntegrationAccounts)
          .set(updateData)
          .where(eq(userIntegrationAccounts.id, input.integrationAccountId))
          .returning()

        if (!updatedAccount) {
          return {
            success: false,
            error: "Integration account not found",
          }
        }

        return {
          success: true,
          integrationAccount: updatedAccount,
          message: "Linear integration updated successfully",
        }
      } catch (error) {
        console.error("❌ Failed to update Linear integration:", error)
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to update Linear integration",
        }
      }
    }),

  /**
   * Remove Linear integration account
   */
  removeLinearIntegration: protectedProcedure
    .input(
      z.object({
        integrationAccountId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb()

      try {
        await db.delete(userIntegrationAccounts).where(eq(userIntegrationAccounts.id, input.integrationAccountId))

        return {
          success: true,
          message: "Linear integration removed successfully",
        }
      } catch (error) {
        console.error("❌ Failed to remove Linear integration:", error)
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to remove Linear integration",
        }
      }
    }),

  /**
   * Get Linear team members for selection
   */
  getLinearTeamMembers: protectedProcedure.query(async () => {
    const db = await getDb()

    try {
      // This would typically call Linear API to get team members
      // For now, return mock data that represents Linear team members
      const teamMembers = [
        {
          id: "linear-user-001",
          name: "John Doe",
          email: "john@company.com",
          username: "john.doe",
          displayName: "John Doe",
          avatarUrl: null,
          isActive: true,
        },
        {
          id: "linear-user-002",
          name: "Jane Smith",
          email: "jane@company.com",
          username: "jane.smith",
          displayName: "Jane Smith",
          avatarUrl: null,
          isActive: true,
        },
        {
          id: "linear-user-003",
          name: "Mike Johnson",
          email: "mike@company.com",
          username: "mike.johnson",
          displayName: "Mike Johnson",
          avatarUrl: null,
          isActive: true,
        },
        {
          id: "linear-user-004",
          name: "Sarah Wilson",
          email: "sarah@company.com",
          username: "sarah.wilson",
          displayName: "Sarah Wilson",
          avatarUrl: null,
          isActive: true,
        },
        {
          id: "linear-user-005",
          name: "David Brown",
          email: "david@company.com",
          username: "david.brown",
          displayName: "David Brown",
          avatarUrl: null,
          isActive: true,
        },
      ]

      return {
        success: true,
        teamMembers,
      }
    } catch (error) {
      console.error("❌ Failed to get Linear team members:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch Linear team members",
      }
    }
  }),

  /**
   * Get integration accounts for all users
   */
  getUserIntegrations: protectedProcedure.query(async () => {
    const db = await getDb()

    try {
      const userIntegrationsData = await db
        .select({
          id: userIntegrationAccounts.id,
          userId: userIntegrationAccounts.userId,
          userName: users.name,
          userEmail: users.email,
          integrationId: userIntegrationAccounts.integrationId,
          integrationName: integrations.name,
          externalUserId: userIntegrationAccounts.externalUserId,
          externalUsername: userIntegrationAccounts.externalUsername,
          externalEmail: userIntegrationAccounts.externalEmail,
          externalDisplayName: userIntegrationAccounts.externalDisplayName,
          isVerified: userIntegrationAccounts.isVerified,
          isActive: userIntegrationAccounts.isActive,
          syncStatus: userIntegrationAccounts.syncStatus,
          lastSyncAt: userIntegrationAccounts.lastSyncAt,
          createdAt: userIntegrationAccounts.createdAt,
        })
        .from(userIntegrationAccounts)
        .leftJoin(users, eq(userIntegrationAccounts.userId, users.id))
        .leftJoin(integrations, eq(userIntegrationAccounts.integrationId, integrations.id))
        .orderBy(desc(userIntegrationAccounts.createdAt))

      return {
        success: true,
        integrations: userIntegrationsData,
      }
    } catch (error) {
      console.error("❌ Failed to get user integrations:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch user integrations",
      }
    }
  }),

  /**
   * Soft delete user (deactivate user account)
   */
  softDeleteUser: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        reason: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb()

      try {
        console.log("🗑️ Soft deleting user:", input.userId)
        console.log("🗑️ Context user:", ctx.user?.id)

        // Ensure we have a valid user performing this action
        if (!ctx.user?.id) {
          return {
            success: false,
            error: "Authentication required",
          }
        }

        // Prevent users from deleting themselves
        if (ctx.user.id === input.userId) {
          return {
            success: false,
            error: "You cannot delete your own account",
          }
        }

        // Check if user exists and is active
        const existingUser = await db.query.users.findFirst({
          where: eq(users.id, input.userId),
        })

        if (!existingUser) {
          return {
            success: false,
            error: "User not found",
          }
        }

        if (!existingUser.isActive) {
          return {
            success: false,
            error: "User is already deactivated",
          }
        }

        // Soft delete the user by setting isActive to false
        const [updatedUser] = await db
          .update(users)
          .set({
            isActive: false,
            updatedAt: new Date(),
          })
          .where(eq(users.id, input.userId))
          .returning()

        // Also deactivate all their integration accounts
        await db
          .update(userIntegrationAccounts)
          .set({
            isActive: false,
            updatedAt: new Date(),
          })
          .where(eq(userIntegrationAccounts.userId, input.userId))

        console.log("✅ User soft deleted successfully:", updatedUser?.id)

        return {
          success: true,
          user: updatedUser,
          message: `User "${existingUser.name || existingUser.email}" has been deactivated`,
        }
      } catch (error) {
        console.error("❌ Failed to soft delete user:", error)
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to deactivate user",
        }
      }
    }),

  /**
   * Hard delete user (permanently delete user account and all related data)
   */
  hardDeleteUser: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        reason: z.string().optional(),
        confirmationPhrase: z.string().min(1, "Confirmation phrase is required"),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb()

      try {
        console.log("💀 Hard deleting user:", input.userId)
        console.log("💀 Context user:", ctx.user?.id)

        // Ensure we have a valid user performing this action
        if (!ctx.user?.id) {
          return {
            success: false,
            error: "Authentication required",
          }
        }

        // Prevent users from deleting themselves
        if (ctx.user.id === input.userId) {
          return {
            success: false,
            error: "You cannot delete your own account",
          }
        }

        // Validate confirmation phrase
        if (input.confirmationPhrase !== "DELETE PERMANENTLY") {
          return {
            success: false,
            error: 'Invalid confirmation phrase. Must be "DELETE PERMANENTLY"',
          }
        }

        // Check if user exists
        const existingUser = await db.query.users.findFirst({
          where: eq(users.id, input.userId),
        })

        if (!existingUser) {
          return {
            success: false,
            error: "User not found",
          }
        }

        // Start transaction to ensure atomicity
        await db.transaction(async (tx) => {
          // Delete user integration accounts (cascades due to foreign key)
          await tx.delete(userIntegrationAccounts).where(eq(userIntegrationAccounts.userId, input.userId))

          // Delete user profile (cascades due to foreign key)
          await tx.delete(userProfiles).where(eq(userProfiles.userId, input.userId))

          // Delete user product access
          const { userProductAccess } = await import("../db/schema")
          await tx.delete(userProductAccess).where(eq(userProductAccess.userId, input.userId))

          // Finally delete the user record
          await tx.delete(users).where(eq(users.id, input.userId))
        })

        console.log("✅ User hard deleted successfully:", input.userId)

        return {
          success: true,
          message: `User "${existingUser.name || existingUser.email}" has been permanently deleted`,
        }
      } catch (error) {
        console.error("❌ Failed to hard delete user:", error)
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to permanently delete user",
        }
      }
    }),

  /**
   * Get all SEO products for permission management
   */
  getSeoProducts: protectedProcedure.query(async () => {
    const db = await getDb()

    try {
      const products = await db
        .select({
          id: seoProducts.id,
          name: seoProducts.name,
          slug: seoProducts.slug,
          domain: seoProducts.domain,
          isActive: seoProducts.isActive,
        })
        .from(seoProducts)
        .where(eq(seoProducts.isActive, true))
        .orderBy(seoProducts.name)

      return {
        success: true,
        products,
      }
    } catch (error) {
      console.error("❌ Failed to get SEO products:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch SEO products",
      }
    }
  }),

  /**
   * Get all available categories for permission management
   */
  getCategories: protectedProcedure.query(async () => {
    const db = await getDb()

    try {
      const categories = [
        { id: "ai-growth", name: "AI Growth" },
        { id: "content", name: "Content" },
        { id: "ai-tools", name: "AI Tools" },
        { id: "shray-planning", name: "Shray Planning" },
        { id: "finance-tools", name: "Finance Tools" },
        { id: "shrayesha", name: "Bansal Labs" },
        { id: "super-admin", name: "Super Admin" },
      ]

      return {
        success: true,
        categories,
      }
    } catch (error) {
      console.error("❌ Failed to get categories:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch categories",
      }
    }
  }),

  /**
   * Get user permissions (both categories and SEO products)
   */
  getUserPermissions: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const db = await getDb()

      try {
        // Get user with their accessible categories
        const user = await db.query.users.findFirst({
          where: eq(users.id, input.userId),
          columns: {
            id: true,
            accessibleCategories: true,
          },
        })

        if (!user) {
          return {
            success: false,
            error: "User not found",
          }
        }

        // Get user's SEO product access
        const seoProductAccess = await db
          .select({
            productId: userProductAccess.productId,
          })
          .from(userProductAccess)
          .where(eq(userProductAccess.userId, input.userId))

        return {
          success: true,
          permissions: {
            categories: user.accessibleCategories || [],
            seoProducts: seoProductAccess.map((access) => access.productId),
          },
        }
      } catch (error) {
        console.error("❌ Failed to get user permissions:", error)
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to fetch user permissions",
        }
      }
    }),

  /**
   * Update user permissions (both categories and SEO products)
   */
  updateUserPermissions: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        categories: z.array(z.string()),
        seoProducts: z.array(z.string()),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb()

      try {
        console.log("🔐 Updating user permissions:", input.userId)

        // Ensure we have a valid user performing this action
        if (!ctx.user?.id) {
          return {
            success: false,
            error: "Authentication required",
          }
        }

        // Check if user exists
        const existingUser = await db.query.users.findFirst({
          where: eq(users.id, input.userId),
        })

        if (!existingUser) {
          return {
            success: false,
            error: "User not found",
          }
        }

        // Start transaction to ensure atomicity
        await db.transaction(async (tx) => {
          // Update user's accessible categories
          await tx
            .update(users)
            .set({
              accessibleCategories: input.categories,
              updatedAt: new Date(),
            })
            .where(eq(users.id, input.userId))

          // Remove all existing SEO product access for this user
          await tx.delete(userProductAccess).where(eq(userProductAccess.userId, input.userId))

          // Add new SEO product access
          if (input.seoProducts.length > 0) {
            await tx.insert(userProductAccess).values(
              input.seoProducts.map((productId) => ({
                userId: input.userId,
                productId,
              })),
            )
          }
        })

        console.log("✅ User permissions updated successfully:", input.userId)

        return {
          success: true,
          message: "User permissions updated successfully",
        }
      } catch (error) {
        console.error("❌ Failed to update user permissions:", error)
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to update user permissions",
        }
      }
    }),
})
