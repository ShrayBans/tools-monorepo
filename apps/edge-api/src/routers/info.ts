import { reportErrorToSentry } from "@shray/apiutils"
import { getRedis } from "@shray/apiutils/src/redisUpstash"
import * as crypto from "crypto"
import { sql } from "drizzle-orm"
import { z } from "zod"

import { getDb } from "../db"
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../lib/trpc"

/**
 * Minimal info router for testing deployment
 * This demonstrates a basic tRPC procedure running on Cloudflare Workers
 */
export const infoRouter = createTRPCRouter({
  health: publicProcedure.query(() => {
    return {
      status: "ok",
      iso: new Date().toISOString(),
      unix: Date.now(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      version: {
        gitHash: process.env.GIT_COMMIT_SHA || "unknown",
        branch: process.env.GIT_BRANCH || "unknown",
        lastDeployedAt: process.env.LAST_DEPLOYED_AT || "unknown",
      },
    }
  }),
  protected: protectedProcedure.query(() => {
    return {
      status: "ok",
    }
  }),
  protectedMutation: protectedProcedure
    .input(
      z.object({
        message: z.string(),
      }),
    )
    .mutation(({ input }) => {
      return {
        message: input.message,
        status: "ok",
      }
    }),

  // Example echo endpoint with input validation
  echo: publicProcedure
    .input(
      z.object({
        message: z.string().min(1).max(1000),
        metadata: z
          .object({
            userId: z.string().optional(),
            source: z.string().default("api"),
          })
          .optional(),
      }),
    )
    .mutation(({ input }) => {
      const startTime = Date.now()

      return {
        echo: input.message,
        timestamp: new Date().toISOString(),
        metadata: input.metadata,
        processingTime: Date.now() - startTime,
      }
    }),

  sentry: publicProcedure.query(() => {
    try {
      throw new Error("This is a test error from the Sentry endpoint.")
      // reportErrorToSentry(error, "should-not-reach-this-error");
    } catch (err) {
      reportErrorToSentry(err, "sentry-test-error")
      return "ok"
    }
    return {
      status: "error",
      message: "Sentry is not initialized.",
      iso: new Date().toISOString(),
    }
  }),

  // Database health check
  dbHealth: publicProcedure.query(async () => {
    const db = await getDb()
    const startTime = Date.now()

    try {
      // Simple query to test database connectivity
      const result = await db.execute(sql`SELECT 1 as health_check`)
      const responseTime = Date.now() - startTime

      return {
        status: "ok",
        responseTime: `${responseTime}ms`,
        connected: true,
        timestamp: new Date().toISOString(),
        result: result[0],
      }
    } catch (error: any) {
      const responseTime = Date.now() - startTime

      // Report to Sentry but don't throw - we want to return status info
      reportErrorToSentry(error, "db-health-check-error")

      return {
        status: "error",
        responseTime: `${responseTime}ms`,
        connected: false,
        error: error?.message || "Unknown database error",
        timestamp: new Date().toISOString(),
      }
    }
  }),

  // Redis health check
  redisHealth: publicProcedure.query(async () => {
    const startTime = Date.now()

    try {
      // Ensure Redis connection is initialized
      const { primaryRedisInstance } = await getRedis()

      // Test Redis connectivity with a simple ping
      const testKey = `health_check_${Date.now()}`
      const testValue = "ok"

      // Set a test value with 60 second expiry
      await primaryRedisInstance.set(testKey, testValue, { ex: 60 })

      // Get the value back to verify it worked
      const retrievedValue = await primaryRedisInstance.get(testKey)

      // Clean up test key
      await primaryRedisInstance.del(testKey)

      const responseTime = Date.now() - startTime

      return {
        status: "ok",
        responseTime: `${responseTime}ms`,
        connected: true,
        testPassed: retrievedValue === testValue,
        timestamp: new Date().toISOString(),
      }
    } catch (error: any) {
      const responseTime = Date.now() - startTime

      // Report to Sentry but don't throw - we want to return status info
      reportErrorToSentry(error, "redis-health-check-error")

      return {
        status: "error",
        responseTime: `${responseTime}ms`,
        connected: false,
        error: error?.message || "Unknown Redis error",
        timestamp: new Date().toISOString(),
      }
    }
  }),

  // Comprehensive health check that combines all services
  healthCheck: publicProcedure.query(async () => {
    const db = await getDb()
    const startTime = Date.now()
    const results = {
      overall: "ok" as "ok" | "degraded" | "error",
      timestamp: new Date().toISOString(),
      services: {
        api: { status: "ok" as "ok" | "error", responseTime: "0ms" },
        database: { status: "unknown" as "ok" | "error" | "unknown", responseTime: "0ms" },
        redis: { status: "unknown" as "ok" | "error" | "unknown", responseTime: "0ms" },
      },
    }

    // API is working since we got here
    results.services.api = {
      status: "ok",
      responseTime: `${Date.now() - startTime}ms`,
    }

    // Test database
    const dbStartTime = Date.now()
    try {
      await db.execute(sql`SELECT 1`)
      results.services.database = {
        status: "ok",
        responseTime: `${Date.now() - dbStartTime}ms`,
      }
    } catch (error) {
      results.services.database = {
        status: "error",
        responseTime: `${Date.now() - dbStartTime}ms`,
      }
      results.overall = "error"
    }

    // Test Redis
    const redisStartTime = Date.now()
    try {
      const { primaryRedisInstance } = await getRedis()
      const testKey = `health_${Date.now()}`
      await primaryRedisInstance.set(testKey, "test", { ex: 10 })
      await primaryRedisInstance.get(testKey)
      await primaryRedisInstance.del(testKey)

      results.services.redis = {
        status: "ok",
        responseTime: `${Date.now() - redisStartTime}ms`,
      }
    } catch (error) {
      results.services.redis = {
        status: "error",
        responseTime: `${Date.now() - redisStartTime}ms`,
      }
      // Redis failure is degraded, not full error
      if (results.overall === "ok") {
        results.overall = "degraded"
      }
    }

    const totalResponseTime = Date.now() - startTime

    return {
      ...results,
      totalResponseTime: `${totalResponseTime}ms`,
    }
  }),

  mobileUpgrade: publicProcedure.query(async ({}) => {
    const VERSION = {
      messages: [
        {
          platform: "ios",
          env: "prod",
          minBuild: 50,
          maxBuild: 60,
          force: true,
          title: "New Update Available",
          message: "We've added exciting new features! Please update your app to continue.",
        },
        {
          platform: "android",
          env: "prod",
          minBuild: 1,
          maxBuild: 5,
          force: true,
          title: "Critical Update Required",
          message: "A critical update is available. Please update your app to continue using Sway.",
        },
      ],
      updates: [
        {
          platform: "ios",
          env: "dev",
          runtime: "1.0",
          id: "abc123",
        },
        {
          platform: "android",
          env: "prod",
          runtime: "1.1",
          id: "def456",
        },
      ],
    }

    return VERSION
  }),

})
