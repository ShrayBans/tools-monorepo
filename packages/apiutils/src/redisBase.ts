import { isTestEnv } from "@shray/env"

import { blg } from "./logging"
import { getRedis } from "./redisUpstash"
import { reportErrorToSentry } from "./sentry"

export async function deleteRedisCache(redisKey: string) {
  const { primaryRedisInstance } = await getRedis()
  const prefixedKey = `${process.env.REDIS_PREFIX}:${redisKey}`
  blg.debug(`REDIS - primaryRedisInstance.del: ${redisKey}`)
  await primaryRedisInstance.del(prefixedKey)
}

export async function setRedisCache(
  redisKey: string,
  payload: any,
  expiry: number = 60 * 60 * 4,
  { noLog }: { noLog: boolean } = { noLog: false },
) {
  const { primaryRedisInstance } = await getRedis()
  const prefixedKey = `${process.env.REDIS_PREFIX}:${redisKey}`
  if (!noLog) {
    blg.debug(`REDIS:SET -> ${prefixedKey}`)
  }

  try {
    if (isTestEnv) {
      // uses ioredis instead
      // @ts-ignore
      await primaryRedisInstance.set(prefixedKey, JSON.stringify(payload), "EX", expiry)
    } else {
      await primaryRedisInstance.set(`${process.env.REDIS_PREFIX}:${redisKey}`, JSON.stringify(payload), {
        ex: expiry,
      })
    }
  } catch (err) {
    reportErrorToSentry(err, "setRedisCache", { redisKey, payload, expiry })
    throw err
  }
}
export async function getRedisCache(redisKey: string, { noLog }: { noLog: boolean } = { noLog: false }) {
  const { primaryRedisInstance } = await getRedis()
  const prefixedKey = `${process.env.REDIS_PREFIX}:${redisKey}`

  if (!noLog) {
    blg.debug(`REDIS:GET -> ${prefixedKey}`)
  }

  let output
  if (isTestEnv) {
    // uses ioredis instead
    try {
      output = JSON.parse((await primaryRedisInstance.get(prefixedKey)) as any)
    } catch (err) {
      blg.error(`Redis error: ${err instanceof Error ? err.message : String(err)}`)
      throw err
    }
  } else {
    try {
      output = await primaryRedisInstance.get(prefixedKey)
    } catch (err) {
      reportErrorToSentry(err, "getRedisCache", { redisKey })
      throw err
    }
  }

  return output
}

export async function decrByRedisCache(
  redisKey: string,
  decrNumber: number,
  fallbackValue = 0,
  { noLog }: { noLog: boolean } = { noLog: false },
) {
  const { primaryRedisInstance } = await getRedis()
  const prefixedKey = `${process.env.REDIS_PREFIX}:${redisKey}`

  if (!noLog) {
    blg.debug(`REDIS:DECRBY -> ${prefixedKey}`)
  }

  const exists = await primaryRedisInstance.exists(prefixedKey)

  if (exists) {
    const output = await primaryRedisInstance.decrby(prefixedKey, decrNumber)
    return output
  }
  blg.info(`REDIS:DECRBY - Key doesn't exist -> ${prefixedKey} -> Falling back to -> ${fallbackValue}`)
  // If the key doesn't exist in Redis, use the provided fallback value
  const newValue = fallbackValue - decrNumber
  await primaryRedisInstance.set(prefixedKey, newValue)
  return newValue
}

export async function incrByRedisCache(
  redisKey: string,
  incrNumber: number,
  fallbackValue = 0,
  { noLog }: { noLog: boolean } = { noLog: false },
) {
  const { primaryRedisInstance } = await getRedis()
  const prefixedKey = `${process.env.REDIS_PREFIX}:${redisKey}`

  if (!noLog) {
    blg.debug(`REDIS:INCRBY -> ${prefixedKey}`)
  }

  const exists = await primaryRedisInstance.exists(prefixedKey)

  if (exists) {
    const output = await primaryRedisInstance.incrby(prefixedKey, incrNumber)
    return output
  }
  blg.info(`REDIS:INCRBY - Key doesn't exist -> ${prefixedKey} -> Falling back to -> ${fallbackValue}`)
  // If the key doesn't exist in Redis, use the provided fallback value
  const newValue = fallbackValue + incrNumber
  await primaryRedisInstance.set(prefixedKey, newValue)
  return newValue
}
