import { initTRPC, TRPCError } from "@trpc/server"
import { randomUUID } from "crypto"
import { eq } from "drizzle-orm/sql"
import superjson from "superjson"
import { z } from "zod"

import { getDb } from "../db"
import { clearRequestContext, setRequestContext } from "../db/requestContext"
import { users } from "../db/schema"

// Import R2Bucket type from global types
declare global {
  interface R2Bucket {
    put(key: string, body: any, options?: any): Promise<any>
    head(key: string): Promise<any>
    delete(key: string): Promise<void>
    createMultipartUpload(key: string, options?: any): Promise<{ uploadId: string }>
  }
}

/**
 * User interface from Supabase Auth
 */
export interface AuthUser {
  id: string
  email: string
  user_metadata?: {
    name?: string
    full_name?: string
    avatar_url?: string
  }
}

/**
 * Session interface
 */
export interface Session {
  user: AuthUser
  access_token: string
  refresh_token?: string
  expires_at?: number
  aal?: string
}

/**
 * Database User interface (from our schema)
 */
export interface DbUser {
  id: string
  email: string
  name: string
  avatarUrl: string | null
  isActive: boolean
  accessibleCategories: string[]
  misc: Record<string, any>
  invitedBy: string | null
  invitedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

/**
 * tRPC context - available in all procedures
 */
export interface Context {
  // Auth session from Supabase
  session?: Session | null

  // Database user record
  dbUser?: DbUser | null

  // Request metadata
  req?: Request
  userAgent?: string
  authorization?: string
  supabaseAuth?: string

  // Request ID for logging
  requestId: string

  // Environment variables and Cloudflare bindings
  env: {

  }
}

/**
 * Create tRPC context from request
 * This runs on every tRPC call and handles auth
 */
export const createContext = async (opts: { req?: Request; env?: any }): Promise<Context> => {
  const userAgent = opts.req?.headers.get("user-agent") || undefined
  const authorization = opts.req?.headers.get("authorization") || undefined
  const supabaseAuth = opts.req?.headers.get("x-supabase-auth") || undefined
  const requestId = opts.req?.headers.get("x-request-id") || randomUUID()

  // Base context - use Cloudflare env if available, fallback to process.env
  const baseContext: Context = {
    env: {
    },
    req: opts.req,
    userAgent,
    authorization,
    supabaseAuth,
    requestId,
  }

  // Test token authentication for Playwright tests
  if (authorization?.startsWith("Bearer test_")) {
    console.log("🧪 Test token authentication detected")
    try {
      const testToken = authorization.replace("Bearer test_", "")
      const tokenData = JSON.parse(Buffer.from(testToken, "base64").toString())

      // Verify token hasn't expired
      if (new Date(tokenData.expiresAt) < new Date()) {
        console.warn("⚠️ Test token has expired")
        return baseContext
      }

      const db = await getDb()

      const testDbUser = await db.query.users.findFirst({
        where: eq(users.id, tokenData.userId),
      })

      if (testDbUser && tokenData.isTestUser) {
        // Construct a test session object
        const session: Session = {
          user: {
            id: testDbUser.id,
            email: testDbUser.email,
            user_metadata: {
              name: testDbUser.name,
              avatar_url: testDbUser.avatarUrl || undefined,
            },
          },
          access_token: `test_${testToken}`,
          aal: "aal1", // Test sessions default to aal1
        }

        console.log("✅ Test authentication successful for:", testDbUser.email)
        return {
          ...baseContext,
          session,
          dbUser: testDbUser as DbUser,
        }
      } else {
        console.warn("⚠️ Test token validation failed: User not found or not a test user")
      }
    } catch (error) {
      console.warn("Failed to validate test token:", error)
    }
  }

  // API Key Impersonation for internal tools/testing
  if (authorization === "Bearer lomin7") {
    console.log("🔑 API Key authentication detected. Impersonating user shray@shraylabs.co.")
    try {
      const db = await getDb()
      const impersonatedDbUser = await db.query.users.findFirst({
        where: eq(users.email, "shray@shraylabs.co"),
      })

      if (impersonatedDbUser) {
        // Construct a fake session object
        const session: Session = {
          user: {
            id: impersonatedDbUser.id,
            email: impersonatedDbUser.email,
            user_metadata: {
              name: impersonatedDbUser.name,
              avatar_url: impersonatedDbUser.avatarUrl || undefined,
            },
          },
          access_token: "api-key-lomin7",
          aal: "aal2", // API key sessions get highest AAL
        }

        return {
          ...baseContext,
          session,
          dbUser: impersonatedDbUser as DbUser,
        }
      } else {
        console.warn("⚠️ API Key impersonation failed: User shray@shraylabs.co not found in the database.")
      }
    } catch (dbError) {
      console.warn("Failed to fetch user for API key impersonation:", dbError)
    }
  }

  // If we have a Supabase auth token, validate it and get user info
  if (supabaseAuth) {
    try {
      // Import Supabase client here to avoid circular dependencies
      const { createClient } = await import("@supabase/supabase-js")

      if (!baseContext.env.VITE_SUPABASE_URL || !baseContext.env.VITE_SUPABASE_ANON_KEY) {
        console.warn("Missing Supabase environment variables")
        return baseContext
      }

      const supabase = createClient(baseContext.env.VITE_SUPABASE_URL, baseContext.env.VITE_SUPABASE_ANON_KEY, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      })

      // Get user from access token
      const { data: userData, error } = await supabase.auth.getUser(supabaseAuth)

      if (!error && userData.user) {
        // Extract AAL level from JWT
        let aal: string | undefined
        try {
          // Decode JWT to get AAL claim (without verification since Supabase already verified it)
          const [, payload] = supabaseAuth.split(".")
          if (payload) {
            const decodedPayload = JSON.parse(Buffer.from(payload, "base64url").toString())
            aal = decodedPayload.aal
          }
        } catch (jwtError) {
          console.warn("Failed to decode JWT for AAL:", jwtError)
        }

        // Create session object
        const session: Session = {
          user: {
            id: userData.user.id,
            email: userData.user.email || "",
            user_metadata: userData.user.user_metadata,
          },
          access_token: supabaseAuth,
          aal,
        }

        // Try to get database user record, create if doesn't exist
        let dbUser: DbUser | null = null
        try {
          const db = await getDb()

          let dbUserResult = await db.query.users.findFirst({
            where: eq(users.id, userData.user.id),
          })

          // If not found by ID, try to find by email and update the ID
          if (!dbUserResult) {
            const existingUserByEmail = await db.query.users.findFirst({
              where: eq(users.email, userData.user.email!),
            })

            if (existingUserByEmail) {
              // Update the existing user's ID to match Supabase
              console.log("🔄 Updating user ID to match Supabase:", {
                oldId: existingUserByEmail.id,
                newId: userData.user.id,
                email: userData.user.email,
              })

              const [updatedUser] = await db
                .update(users)
                .set({ id: userData.user.id })
                .where(eq(users.email, userData.user.email!))
                .returning()

              dbUserResult = updatedUser
            }
          }

          // Create user if doesn't exist (for users who signed up via OAuth or other means)
          if (!dbUserResult) {
            const [newUser] = await db
              .insert(users)
              .values({
                id: userData.user.id,
                email: userData.user.email!,
                name:
                  userData.user.user_metadata?.name ||
                  userData.user.user_metadata?.full_name ||
                  userData.user.email!.split("@")[0],
                avatarUrl: userData.user.user_metadata?.avatar_url || null,
              })
              .returning()

            dbUserResult = newUser
          }

          if (dbUserResult) {
            dbUser = dbUserResult as DbUser
          }
        } catch (dbError) {
          console.warn("Failed to fetch or create database user:", dbError)
        }

        return {
          ...baseContext,
          session,
          dbUser,
        }
      }
    } catch (error) {
      console.warn("Failed to validate Supabase auth token:", error)
    }
  }

  return baseContext
}

/**
 * Initialize tRPC with context and error formatting
 */
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter(opts) {
    const { shape, error } = opts

    // Enhanced error formatting
    return {
      ...shape,
      data: {
        ...shape.data,
        code: error.code,
        httpStatus: getHTTPStatusCodeFromError(error),
        requestId: opts.ctx?.requestId,
      },
    }
  },
})

/**
 * Helper to get HTTP status code from tRPC error
 */
function getHTTPStatusCodeFromError(error: any): number {
  if (error.code === "UNAUTHORIZED") return 401
  if (error.code === "FORBIDDEN") return 403
  if (error.code === "NOT_FOUND") return 404
  if (error.code === "BAD_REQUEST") return 400
  if (error.code === "CONFLICT") return 409
  if (error.code === "PRECONDITION_FAILED") return 412
  if (error.code === "PAYLOAD_TOO_LARGE") return 413
  if (error.code === "METHOD_NOT_SUPPORTED") return 405
  if (error.code === "TIMEOUT") return 408
  if (error.code === "CLIENT_CLOSED_REQUEST") return 499
  if (error.code === "INTERNAL_SERVER_ERROR") return 500
  return 500
}

/**
 * Middleware for request cleanup and logging
 */
const requestCleanupMiddleware = t.middleware(async ({ ctx, next }) => {
  const start = Date.now()

  // Set request context for database error handling
  setRequestContext({
    requestId: ctx.requestId,
    userId: ctx.session?.user?.id,
  })

  try {
    const result = await next()

    // Log successful requests in development
    if (ctx.env.NODE_ENV === "development") {
      console.log(`✅ tRPC ${ctx.req?.method || "UNKNOWN"} - ${Date.now() - start}ms`)
    }

    return result
  } catch (error) {
    // Log errors
    console.error(`❌ tRPC Error - ${Date.now() - start}ms:`, error)
    throw error
  } finally {
    // Clear request context at the end of the request
    clearRequestContext()
  }
})

/**
 * Middleware that enforces authentication
 */
const enforceAuth = t.middleware(async ({ ctx, next }) => {
  // Standard session-based authentication
  if (!ctx.session?.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be signed in to access this resource",
    })
  }

  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
      user: ctx.session.user,
    },
  })
})

/**
 * Middleware that optionally includes auth (for procedures that work with or without auth)
 */
const optionalAuth = t.middleware(({ ctx, next }) => {
  return next({
    ctx: {
      ...ctx,
      // Session might be null, but that's okay
      session: ctx.session,
      user: ctx.session?.user || null,
    },
  })
})

/**
 * Middleware that enforces MFA (AAL2) authentication
 */
const enforceMFA = t.middleware(async ({ ctx, next }) => {
  // First ensure user is authenticated
  if (!ctx.session?.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be signed in to access this resource",
    })
  }

  // Check if session has AAL2 level
  if (ctx.session.aal !== "aal2") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "This operation requires two-factor authentication. Please complete MFA verification.",
    })
  }

  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
      user: ctx.session.user,
    },
  })
})

/**
 * MCP API Key Authentication Middleware
 * Validates hardcoded API key for MCP server access
 */
const mcpApiKeyAuth = t.middleware(({ ctx, next }) => {
  const authHeader = ctx.authorization

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Missing or invalid Authorization header",
    })
  }

  const token = authHeader.split(" ")[1]
  if (token !== "lomin7") {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid API key",
    })
  }

  return next({
    ctx: {
      ...ctx,
      apiKey: token,
    },
  })
})

/**
 * Export reusable router and procedure builders
 */
export const createTRPCRouter = t.router

/**
 * Public procedure - no authentication required
 */
export const publicProcedure = t.procedure.use(requestCleanupMiddleware)

/**
 * Procedure with optional authentication - works with or without auth
 */
export const optionalAuthProcedure = t.procedure.use(requestCleanupMiddleware).use(optionalAuth)

/**
 * Protected procedure - requires authentication
 */
export const protectedProcedure = t.procedure.use(requestCleanupMiddleware).use(enforceAuth)

/**
 * MFA-protected procedure - requires two-factor authentication (AAL2)
 */
export const mfaProtectedProcedure = t.procedure.use(requestCleanupMiddleware).use(enforceMFA)

/**
 * Legacy alias for backward compatibility
 */
export const apiKeyOrSessionProcedure = protectedProcedure

/**
 * MCP API Key procedure - requires valid API key authentication
 */
export const mcpApiKeyProcedure = t.procedure.use(requestCleanupMiddleware).use(mcpApiKeyAuth)

/**
 * Input validation schemas
 */
export const authSchemas = {
  signUp: z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(1).max(100),
  }),
  signIn: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
  resetPassword: z.object({
    email: z.string().email(),
  }),
  refreshToken: z.object({
    refreshToken: z.string(),
  }),
}

/**
 * Helper types for procedures
 */
export type AuthenticatedContext = Context & {
  session: Session
  user: AuthUser
}

export type OptionalAuthContext = Context & {
  session: Session | null
  user: AuthUser | null
}
