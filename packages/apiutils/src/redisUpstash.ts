import { isTestEnv } from "@shray/env"

import { blg } from "./logging"
import { reportErrorToSentry } from "./sentry"

let primaryRedisInstance: any
let upstashRedisInit = false

export const getRedis = async () => {
  if (upstashRedisInit) {
    return { primaryRedisInstance }
  }
  upstashRedisInit = true

  // @ts-ignore
  if (isTestEnv && typeof EdgeRuntime !== "string") {
    const { Redis } = (await import("ioredis")) as any
    const localRedis = new Redis({
      host: "0.0.0.0",
      port: 6379,
    })
    primaryRedisInstance = localRedis as any
  } else {
    try {
      const { Redis } = (await import("@upstash/redis/cloudflare")) as any
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      } as any)
      primaryRedisInstance = redis
      blg.info("Connected to Upstash Rate Limit redis..")
    } catch (err) {
      reportErrorToSentry(err, "connectRedisUpstash", {
        context: "Error connecting to Upstash",
      })
    }
  }

  return {
    primaryRedisInstance,
  }
}
