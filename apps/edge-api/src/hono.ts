import { trpcServer } from "@hono/trpc-server"
import { initSentry, reportErrorToSentry } from "@shray/apiutils/src/sentry"
import { Hono } from "hono"
import { cors } from "hono/cors"
import { logger } from "hono/logger"
import { Toucan } from "toucan-js"

import { createContext } from "./lib/trpc"
import { flushAxiomLogs, httpLoggingMiddleware } from "./middleware/axiom"
import { appRouter } from "./routers/_app"
import { CloudflareBindings } from "./types/cloudflare"

// import { openApiSpec } from "./lib/openapi"
// import { openApiDocument } from "./lib/openapi"
import type { Context as HonoContext } from "hono"

/**
 * Create the main Hono application with proper typing for Cloudflare Workers
 */
const app = new Hono<{ Bindings: CloudflareBindings; Variables: { sentry: Toucan } }>()

/**
 * Middleware setup
 */

app.use("*", async (c, next) => {
  if (c.env.NODE_ENV === "production") {
    // @ts-ignore
    const sentry = initSentry(c.req.raw, c.env, c.executionCtx)
    c.set("sentry", sentry)
  }
  await next()
})

// Enable CORS for frontend requests
app.use(
  "*",
  cors({
    origin: [
      "http://localhost:5173", // Vite dev server
      "http://localhost:5174", // Vite dev server
      "http://localhost:5175", // Vite dev server
      "http://localhost:8790", // Alternative dev port
      "https://localhost:8790", // HTTPS dev
      "http://127.0.0.1:5173", // Alternative localhost
      "http://127.0.0.1:5174", // Alternative localhost
      "http://127.0.0.1:5175", // Alternative localhost
      "http://127.0.0.1:8790", // Alternative localhost
      // Add your production frontend domains here
      "https://agent.shraylabs.co",
      "https://api-agent.shraylabs.co",
    ],
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowHeaders: ["Content-Type", "Authorization", "x-trpc-source", "x-supabase-auth", "user-agent"],
    exposeHeaders: ["x-trpc-source"],
  }),
)

// Add request logging
app.use("*", logger())

// Add HTTP logging middleware (after logger but before routes)
app.use("*", httpLoggingMiddleware)

// Serve OpenAPI spec
// app.get('/api/openapi.json', (c) => {
//   return c.json(openApiSpec);
// });

/**
 * Health check endpoint
 */
app.get("/health", (c) => {
  return c.json(
    {
      status: "ok",
      timestamp: new Date().toISOString(),
      region: c.env?.CF_REGION || process.env.VERCEL_REGION || "unknown",
      runtime: "edge",
      version: "1.0.0",
    },
    200,
    {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
    },
  )
})

/**
 * Root endpoint with API information
 */
app.get("/", (c) => {
  return c.json({
    message: "Hono + tRPC Edge API on Cloudflare Workers",
    endpoints: {
      health: "/health",
      trpc: "/api/trpc",
    },
    docs: "Visit /api/trpc for tRPC endpoints",
  })
})


/**
 * Mount tRPC on /api/trpc with database cleanup
 */
app.use(
  "/api/trpc/*",
  trpcServer({
    router: appRouter,
    endpoint: "/api/trpc",
    createContext: async (opts, c: HonoContext) => {
      // Create context with request information and Cloudflare env
      const context = createContext({
        req: opts.req || c.req.raw,
        env: c.env, // Pass Cloudflare environment variables
      })

      // Convert to the expected format
      return context as any
    },
    onError: (opts) => {
      console.error(`tRPC error on ${opts.path ?? "unknown"}:`, opts.error)
      // Cleanup database connection on error
    },
    responseMeta: () => {
      // Cleanup database connection after response
      // Flush Axiom logs
      flushAxiomLogs()
      return {}
    },
  }),
)

/**
 * Catch-all for undefined routes
 */
app.notFound((c) => {
  return c.json({ error: "Not found" }, 404)
})

/**
 * Global error handler
 */
app.onError((err, c) => {
  console.error("Hono error:", err)
  if (c.env.NODE_ENV === "production") {
    const sentry = c.get("sentry")
    if (sentry) {
      reportErrorToSentry(err)
    }
  }
  return c.json({ error: "Internal server error" }, 500)
})

export default app
