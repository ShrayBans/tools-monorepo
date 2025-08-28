import { createTRPCRouter } from "../lib/trpc"
import { accessControlRouter } from "./accessControl"
import { infoRouter } from "./info"
import { schwabRouter } from "./schwab"
import { usersRouter } from "./users"

// MCP routers
/**
 * Main application router
 *
 * This is the central router that combines all sub-routers.
 * Add new routers here as your API grows.
 *
 * The shape of this router is what gets inferred as `AppRouter` type
 * and used by the tRPC client for end-to-end type safety.
 */
export const appRouter = createTRPCRouter({
  info: infoRouter,
  accessControl: accessControlRouter,
  users: usersRouter,
  schwab: schwabRouter,
  })

// Export the router type for use in client
export type AppRouter = typeof appRouter
