import { relations } from "drizzle-orm"
import { boolean, index, integer, json, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

import { brainTasks } from "./brain.schema"
import { seoProducts } from "./seo.schema"

/**
 * Users table - stores user account information
 */
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey(),
    email: text("email").notNull().unique(),
    name: text("name").notNull(),
    avatarUrl: text("avatar_url"),
    passwordHash: text("password_hash"),
    isActive: boolean("is_active").default(true).notNull(),
    accessibleCategories: json("accessible_categories").$type<string[]>().default([]),
    misc: json("misc").$type<Record<string, any>>().default({}),
    invitedBy: uuid("invited_by").references(() => users.id), // User who sent the invitation
    invitedAt: timestamp("invited_at"), // When the invitation was sent
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: index("email_idx").on(table.email),
    createdAtIdx: index("created_at_idx").on(table.createdAt),
    invitedByIdx: index("invited_by_idx").on(table.invitedBy),
  }),
)

/**
 * User Invitations table - tracks pending user invitations
 */
export const userInvitations = pgTable(
  "user_invitations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    invitedBy: uuid("invited_by")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(), // Unique invitation token
    status: text("status").notNull().default("pending"), // pending, accepted, expired
    expiresAt: timestamp("expires_at").notNull(),
    acceptedAt: timestamp("accepted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: index("user_invitations_email_idx").on(table.email),
    tokenIdx: index("user_invitations_token_idx").on(table.token),
    statusIdx: index("user_invitations_status_idx").on(table.status),
    invitedByIdx: index("user_invitations_invited_by_idx").on(table.invitedBy),
    expiresAtIdx: index("user_invitations_expires_at_idx").on(table.expiresAt),
  }),
)

/**
 * User Profiles table - extended user information and preferences
 */
export const userProfiles = pgTable(
  "user_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    firstName: text("first_name"),
    lastName: text("last_name"),
    title: text("title"), // Job title
    department: text("department"),
    location: text("location"),
    timezone: text("timezone").default("UTC").notNull(),
    phone: text("phone"),
    bio: text("bio"), // User biography/description
    preferences: text("preferences"), // JSON string for user preferences
    notificationSettings: text("notification_settings"), // JSON for notification preferences
    lastActiveAt: timestamp("last_active_at"),
    profileCompleteness: integer("profile_completeness").default(0).notNull(), // 0-100 percentage
    isOnboarded: boolean("is_onboarded").default(false).notNull(),
    metadata: text("metadata"), // JSON for additional metadata
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("user_profiles_user_idx").on(table.userId),
    lastActiveIdx: index("user_profiles_last_active_idx").on(table.lastActiveAt),
    departmentIdx: index("user_profiles_department_idx").on(table.department),
    onboardedIdx: index("user_profiles_onboarded_idx").on(table.isOnboarded),
  }),
)

/**
 * Integrations table - stores third-party API integration definitions (simplified for hardcoded integrations)
 */
export const integrations = pgTable(
  "integrations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(), // e.g., "Geekbot", "Slack", "GitHub"
    type: text("type").notNull(), // e.g., "standup", "communication", "code"
    baseUrl: text("base_url"), // API base URL
    isActive: boolean("is_active").default(true).notNull(),
    settings: text("settings"), // JSON string for integration-specific settings
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    nameIdx: index("integrations_name_idx").on(table.name),
    typeIdx: index("integrations_type_idx").on(table.type),
    activeIdx: index("integrations_active_idx").on(table.isActive),
  }),
)

/**
 * User Integration Accounts table - stores linked third-party accounts for users
 * This is the core table for OAuth storage and username mapping
 */
export const userIntegrationAccounts = pgTable(
  "user_integration_accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    integrationId: uuid("integration_id")
      .notNull()
      .references(() => integrations.id, { onDelete: "cascade" }),
    externalUserId: text("external_user_id").notNull(), // User ID in the external service
    externalUsername: text("external_username"), // Username in the external service (e.g., @slackuser)
    externalEmail: text("external_email"), // Email in the external service
    externalDisplayName: text("external_display_name"), // Display name in the external service
    accountData: text("account_data"), // JSON string for OAuth tokens and service-specific data
    isVerified: boolean("is_verified").default(false).notNull(), // Has the connection been verified
    isActive: boolean("is_active").default(true).notNull(),
    lastSyncAt: timestamp("last_sync_at"), // Last successful connection verification
    syncStatus: text("sync_status").default("idle").notNull(), // idle, connected, error
    syncError: text("sync_error"), // Last connection error message
    connectionMetadata: text("connection_metadata"), // JSON for connection-specific metadata
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("user_integration_accounts_user_idx").on(table.userId),
    integrationIdx: index("user_integration_accounts_integration_idx").on(table.integrationId),
    externalUserIdx: index("user_integration_accounts_external_user_idx").on(table.externalUserId),
    externalUsernameIdx: index("user_integration_accounts_external_username_idx").on(table.externalUsername),
    activeIdx: index("user_integration_accounts_active_idx").on(table.isActive),
    verifiedIdx: index("user_integration_accounts_verified_idx").on(table.isVerified),
    syncStatusIdx: index("user_integration_accounts_sync_status_idx").on(table.syncStatus),
    // Composite unique index to prevent duplicate accounts per user per integration
    uniqueUserIntegration: index("user_integration_accounts_unique_user_integration").on(
      table.userId,
      table.integrationId,
      table.externalUserId,
    ),
  }),
)

/**
 * User Product Access table - tracks which users have access to which SEO products
 * SEO products are company/brand products stored in seoProducts table
 */
export const userProductAccess = pgTable(
  "user_product_access",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => seoProducts.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("user_product_access_user_idx").on(table.userId),
    productIdx: index("user_product_access_product_idx").on(table.productId),
    uniqueUserProduct: index("user_product_access_unique").on(table.userId, table.productId),
  }),
)

// Import needed for relations
// User management relationships
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(userProfiles),
  integrationAccounts: many(userIntegrationAccounts),
  invitedBy: one(users, {
    fields: [users.invitedBy],
    references: [users.id],
  }),
  invitedUsers: many(users),
  sentInvitations: many(userInvitations),
  assignedTasks: many(brainTasks),
  // productAccess: many(userProductAccess),
}))

export const userInvitationsRelations = relations(userInvitations, ({ one }) => ({
  invitedBy: one(users, {
    fields: [userInvitations.invitedBy],
    references: [users.id],
  }),
}))

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  user: one(users, {
    fields: [userProfiles.userId],
    references: [users.id],
  }),
}))

export const integrationsRelations = relations(integrations, ({ many }) => ({
  userAccounts: many(userIntegrationAccounts),
}))

export const userIntegrationAccountsRelations = relations(userIntegrationAccounts, ({ one }) => ({
  user: one(users, {
    fields: [userIntegrationAccounts.userId],
    references: [users.id],
  }),
  integration: one(integrations, {
    fields: [userIntegrationAccounts.integrationId],
    references: [integrations.id],
  }),
}))

export const userProductAccessRelations = relations(userProductAccess, ({ one }) => ({
  user: one(users, {
    fields: [userProductAccess.userId],
    references: [users.id],
  }),
  seoProduct: one(seoProducts, {
    fields: [userProductAccess.productId],
    references: [seoProducts.id],
  }),
}))

// Export types
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type UserInvitation = typeof userInvitations.$inferSelect
export type NewUserInvitation = typeof userInvitations.$inferInsert
export type UserProfile = typeof userProfiles.$inferSelect
export type NewUserProfile = typeof userProfiles.$inferInsert
export type Integration = typeof integrations.$inferSelect
export type NewIntegration = typeof integrations.$inferInsert
export type UserIntegrationAccount = typeof userIntegrationAccounts.$inferSelect
export type NewUserIntegrationAccount = typeof userIntegrationAccounts.$inferInsert
export type UserProductAccess = typeof userProductAccess.$inferSelect
export type NewUserProductAccess = typeof userProductAccess.$inferInsert
