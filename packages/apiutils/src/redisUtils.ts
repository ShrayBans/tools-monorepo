// @ts-nocheck
import { Promise as BPromise } from "bluebird"
import { get, isNil, replace, toLower, trim } from "lodash-es"

import { ELLMProvider } from "./llms/enums"
import { blg } from "./logging"
import { deleteRedisCache, getRedisCache, setRedisCache } from "./redisBase"
import { reportErrorToSentry } from "./sentry"

export const MAX_REDIS_JIITTER = 10
export const ARRAY_OF_JITTER_INDICIES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

const MAX_FAILURES = 3 // Can be adjusted to 5 if needed
const FAILURE_WINDOW = 60 * 5 // 5 minutes in seconds
const PROVIDER_FAILURE_KEY = "provider:failure:"

/**
 * High level overview:
 * getOrRefreshCacheHelper - useful for basic single key cache ()
 * getOrRefreshCacheDistributedMultiKey - useful for distributed multi key cache (Only use this for heavily hit keys - i.e. artistBrand/event/world)
 * getOrRefreshCacheDistributedSingleKey - useful for distributed single key cache (Only use this for heavily hit keys - i.e. artistBrand/event/world)
 * getOrRefreshMultiKey - Useful when you need to pass in multiple keys to refresh the cache
 * getOrRefreshCacheWithBackupHelper
 *
 */

/**
 * 1. Trims all blank spaces in the beginning and behind of the input
 * 2. Makes all letters lowercase
 */
/**
 * 1. Trims all blank spaces in the beginning and behind of the input
 * 2. Makes all letters lowercase
 * @param {string} inputString The string to normalize
 *
 * @returns {string} Cleaned string
 */
export const normalizeString = (inputString: string) => {
  if (!inputString) {
    return
  }
  return trim(toLower(inputString))
}

export const normalizeFileName = (fileName: string) => {
  if (!fileName) {
    return
  }
  // Replace spaces with underscores
  let formattedString = replace(fileName, /\s+/g, "_")

  // Remove special characters except for underscores and dot
  formattedString = replace(formattedString, /[^a-zA-Z0-9_.]/g, "")

  return formattedString
}

/**
 * Method that standardizes phone number IE
 * (123) 456 - 7890 => +1234567890
 * +33 123 456 129 => +33123456129
 * @param {string} phone The phone number you want to clean
 *
 * @returns {string} Cleaned phone number
 */
export const normalizePhone = (phone: string) => {
  if (!phone) {
    return
  }
  let cleanedPhone = phone.replace(/\-/g, "").replace(/\(/g, "").replace(/\)/g, "").replace(/\s/g, "")
  if (!cleanedPhone.startsWith("+")) {
    cleanedPhone = `+1${cleanedPhone}`
  }
  return cleanedPhone
}

/**
 * replaces [DYNAMIC_REPLACE] with a string to replace
 */
const replaceFlagWithValues = (origRedisKey: string, replaceString: string) => {
  const flagToReplace = "DYNAMIC_REPLACE"
  return trim(replace(origRedisKey, flagToReplace, normalizeString(replaceString) as string))
}

type CacheKeyPart = string | number | undefined | null

/**
 * Generates a cache key from an array of parts.
 * @param parts - The parts to include in the cache key.
 * @returns The generated cache key in the form of "part1:part2:part3"
 */
export const generateCacheKey = (parts: CacheKeyPart[]): string => {
  return parts
    .filter((part): part is string | number => {
      // Filter out undefined, null, empty strings
      return part !== undefined && part !== null && part !== ""
    })
    .map((part) => {
      // Convert numbers to strings and sanitize
      const sanitized = String(part)
        .trim()
        .toLowerCase()
        // Replace special characters that might cause issues in cache keys
        .replace(/[^a-z0-9-_]/g, "_")

      return sanitized
    })
    .join(":")
}

export const invalidate = async (keys: string[]) => {
  await BPromise.map(keys, async (key) => {
    await deleteRedisCache(key)
  })
}

/**
 * Method that attempts to fetch something from Redis cache or refreshes the aforementioned cache.
 *
 * NOTE: If you return undefined, it will throw the error (expected)
 *
 * @param {string} redisKey The key you want to fetch.
 * @param {any} refreshFunction The function to refresh the cache in case of cache miss.
 * @param {any} functionParam What you want to pass in to the refresh function
 * @param {any} errantError If unable to refresh the cache (artist not found) throw this type of error
 * @param {number} expiry How long you want the cache to live for (IN SECONDS). Optional, defaults to 4 hours
 * @param {boolean} forceRefresh If you want to force a cache miss and always refresh (useful for developing)
 *
 * @returns An object with two items.
 * 1. result - whatever the cache or refresh function returns
 * 2. refreshed - if the refresh function was called
 */
export async function getOrRefreshCacheHelper<T>(
  redisKey: string,
  refreshFunction: any,
  functionParam: any,
  errantError: any,
  expiry?: number,
  forceRefresh?: boolean,
  timesError = 3,
): Promise<{ result: T | any; refreshed: boolean }> {
  const normalizedRedisKey = trim(redisKey)
  // blg.info(`[getOrRefreshCacheHelper] ${normalizedRedisKey} - start`);
  let result: any
  let cacheResult: any
  let refreshed = false
  try {
    if (!forceRefresh) {
      // console.time(`[getOrRefreshCacheHelper] ${normalizedRedisKey} - start`)
      cacheResult = await getRedisCache(normalizedRedisKey)
      result = cacheResult
      // console.timeEnd(`[getOrRefreshCacheHelper] ${normalizedRedisKey} - start`)
      // blg.info("redisValue", redisValue);
      // result = redisValue;
    }
  } catch (err) {
    blg.error(`Redis error for key(${normalizedRedisKey}): ${err.message}`)
  }
  if (cacheResult?.errant && cacheResult?.times >= timesError) {
    blg.error(`errant key: ${normalizedRedisKey} - ${cacheResult?.times} times`)
    throw errantError
  }
  if (cacheResult?.errant || isNil(result) || result === "undefined" || result === "null") {
    // tagCustomNrMetric(EMetric.REDIS_CACHE_REFRESH);

    try {
      blg.debug(`[getOrRefreshCacheHelper] Attempting to refresh key: ${normalizedRedisKey}`)
      // console.time(`[getOrRefreshCacheHelper] ${normalizedRedisKey} - refresh`)

      result = await refreshFunction(functionParam)

      // console.timeEnd(`[getOrRefreshCacheHelper] ${normalizedRedisKey} - refresh`)
      refreshed = true
    } catch (err) {
      blg.error(err, "context - getOrRefreshCacheHelper")
    }
    // console.time(`[getOrRefreshCacheHelper] ${normalizedRedisKey} - setRedisCache`)
    if (!isNil(result)) {
      await setRedisCache(normalizedRedisKey, result, expiry)
    } else {
      blg.error(`[getOrRefreshCacheHelper] ${normalizedRedisKey} - errant key (${cacheResult?.times})`)

      // Not having custom expiry to requery more frequently if something is errant
      await setRedisCache(normalizedRedisKey, { errant: true, times: (cacheResult?.times || 0) + 1 }, 60 * 10)
      //   tagCustomNrMetric(EMetric.REDIS_SETTING_ERRANT);

      throw errantError
    }
    // console.timeEnd(`[getOrRefreshCacheHelper] ${normalizedRedisKey} - setRedisCache`)
  } else {
    // blg.info(`[getOrRefreshCacheHelper] ${normalizedRedisKey} - cache hit`);
  }
  // blg.info(`[getOrRefreshCacheHelper] ${normalizedRedisKey} - end`);

  const sizeInKB = (JSON.stringify(result).length / 1024).toFixed(2)
  // console.log(`[getOrRefreshCacheHelper] Size of Redis output for key ${normalizedRedisKey}: ${sizeInKB} KB`)

  return { result, refreshed }
}

/**
 * Function that adds a jitter (random number less than MAX_REDIS_JIITTER)
 * This is needed because redis cluster seperates by node across all clusters. IE it will distribute all keys randomly across nodes, but the node with the justin bieber artist
 * or the just beiber event cache will get hit order of magnitudes more than other nodes. Essentially this is how to force even distrbution across all clusters and nodes
 *
 * @param {string} redisKey The key you want to fetch
 * @returns  {string} Redis key with jitter less than MAX_REDIS_JIITTER
 */
export function getRandomJitterForKey(redisKey: string) {
  const jitter = Math.floor(Math.random() * MAX_REDIS_JIITTER)
  return `${redisKey}_${jitter}`
}

export async function runCacheFunctionForAllJitterOfKey(
  functionToRun: any,
  redisKey: string,
  optionalItemToCache?: any,
  optionalExpiry?: number,
) {
  // NO jitter first for backwards compatibilty
  if (optionalItemToCache) {
    if (optionalExpiry) {
      await functionToRun(`${redisKey}`, optionalItemToCache, optionalExpiry)
    } else {
      await functionToRun(`${redisKey}`, optionalItemToCache)
    }
  } else {
    await functionToRun(`${redisKey}`)
  }
  // JITTER

  await BPromise.map(ARRAY_OF_JITTER_INDICIES, async (jitterIdentifier) => {
    if (optionalItemToCache) {
      if (optionalExpiry) {
        await functionToRun(`${redisKey}_${jitterIdentifier}`, optionalItemToCache, optionalExpiry)
      } else {
        await functionToRun(`${redisKey}_${jitterIdentifier}`, optionalItemToCache)
      }
    } else {
      await functionToRun(`${redisKey}_${jitterIdentifier}`)
    }
  })
}

/**
 * Method that attempts to fetch something from Redis cache or refreshes the aforementioned cache WITH JITTER.
 *
 * Note adds jitter: This is needed because redis cluster seperates by node across all clusters.
 * IE it will distribute all keys randomly across nodes, but the node with the justin bieber artist
 * or the just beiber event cache will get hit order of magnitudes more than other nodes.
 * Essentially this is how to force even distrbution across all clusters and nodes
 *
 * Example => calling this for an artist brand would look like this:
 *   const { result, refreshed } = await getOrRefreshCacheDistibutedMultiKey(
    `event:DYNAMIC_REPLACE:cache`,
    getEvent,
    trimmedEventIdOrSlug,
    EventModel.createNotFoundError(),
    ["id", "slug"],
    60 * 60 * 4, //4 hour cache refresh
    refreshCache
  );
 *
 * this will cache event:{X}:cache_{Y}
 * where x is the ID, and then the SlUG, and Y is every number between 0 and 10.
 * IE both event:{ID}:cache_4 and event:{slug}:cache_1 will be cached by this function.
 * Then when we call the function we will hit a random number for jitter to distribute load.
 *
 * DOC HERE: https://momenthouse.atlassian.net/wiki/spaces/MH/pages/72286209/Distributed+Redis
 *
 * @param {string} redisKey The key you want to fetch. NOTE: You can add the string `[DYNAMIC_REPLACE]` to the key. View fn: createDynamicRedisKey for more details
 * @param {any} refreshFunction The function to refresh the cache in case of cache miss.
 * @param {any} functionParam What you want to pass in to the refresh function
 * @param {any} errantError If unable to refresh the cache (artist not found) throw this type of error
 * @param {number} expiry How long you want the cache to live for (IN SECONDS). Optional, defaults to 4 hours
 * @param {string[]} identifiersToCache allows you to set the keys that should be cached (i.e. passing in ['slug', 'id'] to cache both `user:${user?.id}:cache` and `user:${user?.username}:cache`)
 * @param {boolean} forceRefresh If you want to force a cache miss and always refresh (useful for developing)
 *
 *
 * @returns An object with two items.
 * 1. result - whatever the cache or refresh function returns
 * 2. refreshed - if the refresh function was called
 */
export async function getOrRefreshCacheDistributedMultiKey(
  redisKey: string,
  refreshFunction: any,
  functionParam: any,
  errantError: any,
  identifiersToCache: string[],
  expiry: number,
  forceRefresh: boolean,
) {
  const replacedRedisKey = trim(replace(redisKey, "DYNAMIC_REPLACE", normalizeString(functionParam) as string))
  const normalizedRedisKey = getRandomJitterForKey(replacedRedisKey)
  // blg.info(`[getOrRefreshCacheDistributedMultiKey] ${normalizedRedisKey} - start`);

  let result: any
  let refreshed = false
  try {
    if (!forceRefresh) {
      result = await getRedisCache(normalizedRedisKey)
    }
  } catch (err) {
    reportErrorToSentry(err, "", `Redis error for key(${normalizedRedisKey}): ${err.message}`)
  }

  if (result?.errant) {
    blg.info("[getOrRefreshCacheDistributedMultiKey] errant key found: ", normalizedRedisKey)
    throw errantError
  }

  if (isNil(result) || result === "undefined" || result === "null") {
    // tagCustomNrMetric(EMetric.REDIS_CACHE_REFRESH);
    try {
      blg.info(`[getOrRefreshCacheDistributedMultiKey] ${normalizedRedisKey} - cache miss, refreshing`)
      result = await refreshFunction(functionParam)
      refreshed = true
    } catch (err) {
      blg.info(`[getOrRefreshCacheDistributedMultiKey]: Cache Refresh err: ${ex?.message}`, normalizedRedisKey)
    }

    for (let i = 0; i < MAX_REDIS_JIITTER; ++i) {
      if (!isNil(result)) {
        await BPromise.map(identifiersToCache, async (identifier) => {
          // i.e. setRedisCache(`user:${user?.id}:cache_0`, user, 60 * 10), setRedisCache(`user:${user?.username}:cache_0`, user, 60 * 10)
          const keyWithJitter = `${replaceFlagWithValues(redisKey, get(result, identifier))}_${i}`
          // blg.info(`[getOrRefreshCacheDistributedMultiKey] Setting cache ${keyWithJitter}`);
          await setRedisCache(keyWithJitter, result, expiry)
        })
      } else {
        // Not having custom expiry to requery more frequently if something is errant
        blg.info(`[getOrRefreshCacheDistributedMultiKey] Setting ERRANT cache ${replacedRedisKey}_${i}`)
        await setRedisCache(`${replacedRedisKey}_${i}`, { errant: true }, 60 * 10)
      }
    }

    if (isNil(result)) {
      blg.info(`[getOrRefreshCacheDistibutedMultiKey] ${normalizedRedisKey} - ERROR`)
      // throw error after setting all the errant caches
      throw errantError
    }
  } else {
    // blg.info( `[getOrRefreshCacheDistibutedMultiKey] ${normalizedRedisKey} - cache hit`, );
  }
  // blg.info(`[getOrRefreshCacheDistibutedMultiKey] ${normalizedRedisKey} - end`);

  return { result, refreshed }
}

/**
 * Method that attempts to fetch something from Redis cache or refreshes the aforementioned cache WITH JITTER.
 *
 * Note adds jitter: This is needed because redis cluster seperates by node across all clusters.
 * IE it will distribute all keys randomly across nodes, but the node with the justin bieber artist
 * or the just beiber event cache will get hit order of magnitudes more than other nodes.
 * Essentially this is how to force even distrbution across all clusters and nodes
 *
 * Example => calling this for an artist brand would look like this:
 *   const { result, refreshed } = await getOrRefreshCacheDistibutedMultiKey(
    `event:${event.id}:cache`,
    getEvent,
    trimmedEventIdOrSlug,
    EventModel.createNotFoundError(),
    60 * 60 * 4, //4 hour cache refresh
    refreshCache
  );
 *
 * this will cache event:{ID}:cache_{Y}
 * Then when we call the function we will hit a random number for jitter to distribute load.
 *
 * DOC HERE: https://momenthouse.atlassian.net/wiki/spaces/MH/pages/72286209/Distributed+Redis
 *
 * @param {string} redisKey The key you want to fetch. NOTE: You can add the string `[DYNAMIC_REPLACE]` to the key. View fn: createDynamicRedisKey for more details
 * @param {any} refreshFunction The function to refresh the cache in case of cache miss.
 * @param {any} functionParam What you want to pass in to the refresh function
 * @param {any} errantError If unable to refresh the cache (artist not found) throw this type of error
 * @param {number} expiry How long you want the cache to live for (IN SECONDS). Optional, defaults to 4 hours
 * @param {string[]} identifiersToCache allows you to set the keys that should be cached (i.e. passing in ['slug', 'id'] to cache both `user:${user?.id}:cache` and `user:${user?.username}:cache`)
 * @param {boolean} forceRefresh If you want to force a cache miss and always refresh (useful for developing)
 *
 *
 * @returns An object with two items.
 * 1. result - whatever the cache or refresh function returns
 * 2. refreshed - if the refresh function was called
 */
export async function getOrRefreshCacheDistributedSingleKey<T>(
  redisKey: string,
  refreshFunction: any,
  functionParam: any,
  errantError: any,
  expiry: number,
  forceRefresh: boolean,
): Promise<{ result: T | any; refreshed: boolean }> {
  const normalizedRedisKey = trim(normalizeString(redisKey))
  const normalizedRedisKeyWithJitter = getRandomJitterForKey(normalizedRedisKey)
  // blg.info(`[getOrRefreshCacheDistributedSingleKey] ${normalizedRedisKeyWithJitter} - start`);

  let result: any
  let refreshed = false

  try {
    if (!forceRefresh) {
      result = await redisGet(normalizedRedisKeyWithJitter)
    }
  } catch (err) {
    reportErrorToSentry(err, "", `Redis error for key(${normalizedRedisKeyWithJitter}): ${err.message}`)
  }

  if (result?.errant) {
    blg.info("errant key", normalizedRedisKeyWithJitter)
    throw errantError
  }

  if (isNil(result) || result === "undefined" || result === "null") {
    // tagCustomNrMetric(EMetric.REDIS_CACHE_REFRESH);
    try {
      blg.info(`[getOrRefreshCacheDistributedSingleKey] ${normalizedRedisKeyWithJitter} - cache miss, refreshing`)
      result = await refreshFunction(functionParam)
      refreshed = true
    } catch (err) {
      blg.info(normalizedRedisKeyWithJitter, { err })
    }

    if (!isNil(result)) {
      await runCacheFunctionForAllJitterOfKey(setRedisCache, normalizedRedisKey, result, expiry)
    } else {
      // Not having custom expiry to requery more frequently if something is errant
      blg.info(`[getOrRefreshCacheDistributedSingleKey] Setting ERRANT cache ${normalizedRedisKey}`)
      await runCacheFunctionForAllJitterOfKey(setRedisCache, normalizedRedisKey, { errant: true }, 60 * 10)
    }

    if (isNil(result)) {
      // throw error after setting all the errant caches
      throw errantError
    }
  } else {
    // blg.info( `[getOrRefreshCacheDistributedSingleKey] ${normalizedRedisKeyWithJitter} - cache hit`, );
  }
  // blg.info(`[getOrRefreshCacheDistributedSingleKey] ${normalizedRedisKey} - end`);

  return { result, refreshed }
}

/**
 * Method that attempts to fetch something from Redis cache or refreshes the aforementioned cache.
 * NO JITTER - use this if you want to cache something that has a high cardinality (i.e. lots of different user IDs)
 *
 * @param {string} redisKey The key you want to fetch. NOTE: You can add the string `[DYNAMIC_REPLACE]` to the key. View fn: createDynamicRedisKey for more details
 * @param {any} refreshFunction The function to refresh the cache in case of cache miss.
 * @param {any} functionParam What you want to pass in to the refresh function
 * @param {any} errantError If unable to refresh the cache (artist not found) throw this type of error
 * @param {number} expiry How long you want the cache to live for (IN SECONDS). Optional, defaults to 4 hours
 * @param {string[]} identifiersToCache allows you to set the keys that should be cached (i.e. passing in ['slug', 'id'] to cache both `user:${user?.id}:cache` and `user:${user?.username}:cache`)
 * @param {boolean} forceRefresh If you want to force a cache miss and always refresh (useful for developing)
 *
 *
 * @returns An object with two items.
 * 1. result - whatever the cache or refresh function returns
 * 2. refreshed - if the refresh function was called
 */
export async function getOrRefreshMultiKey(
  redisKey: string,
  refreshFunction: any,
  functionParam: { redisKeyParam: string; payload: any },
  errantError: any,
  identifiersToCache: string[],
  expiry: number,
  forceRefresh: boolean,
) {
  const normalizedRedisKey = trim(replace(redisKey, "DYNAMIC_REPLACE", normalizeString(functionParam?.redisKeyParam)))
  // blg.info(`[getOrRefreshMultiKey] ${normalizedRedisKey} - start`);

  let result: any
  let refreshed = false
  try {
    if (!forceRefresh) {
      result = await getRedisCache(normalizedRedisKey)
    }
  } catch (err) {
    reportErrorToSentry(err, "", `getOrRefreshMultiKey - Redis error for key(${normalizedRedisKey}): ${err.message}`)
  }

  if (result?.errant) {
    blg.info("[getOrRefreshMultiKey] errant key", normalizedRedisKey)
    throw errantError
  }

  if (isNil(result) || result === "undefined" || result === "null") {
    // tagCustomNrMetric(EMetric.REDIS_CACHE_MULTIKEY_REFRESH);
    try {
      blg.info(`[getOrRefreshMultiKey] ${normalizedRedisKey} - cache miss, refreshing`)
      result = await refreshFunction(functionParam?.payload)
      refreshed = true
    } catch (err) {
      blg.info(normalizedRedisKey, { err })
    }

    await BPromise.map(identifiersToCache, async (identifier) => {
      const keyToSet = `${replaceFlagWithValues(redisKey, get(result, identifier))}`
      // i.e. setRedisCache(`user:${user?.id}:cache_0`, user, 60 * 10), setRedisCache(`user:${user?.username}:cache_0`, user, 60 * 10)

      if (result) {
        blg.info(`[getOrRefreshMultiKey] Setting cache ${keyToSet}`)
        await setRedisCache(keyToSet, result, expiry)
      } else {
        // Not having custom expiry to requery more frequently if something is errant
        blg.info(`[getOrRefreshMultiKey] Setting ERRANT cache ${keyToSet}`)
        await setRedisCache(`${keyToSet}`, { errant: true }, 60 * 10)
      }
    })
  } else {
    // blg.info(`[getOrRefreshMultiKey] ${normalizedRedisKey} - cache hit`);
  }

  if (isNil(result)) {
    // throw error after setting all the errant caches
    throw errantError
  }

  // blg.info(`[getOrRefreshMultiKey] ${normalizedRedisKey} - end`);

  return { result, refreshed }
}

/**
 * a counter method that allows you to increment a counter in redis
 * If the counter is greater than the totalCount, it will return false, otherwise true
 *
 * @param redisKey
 * @param expirySeconds
 * @param totalCount
 */
export async function checkRedisCounter(redisKey: string, expirySeconds: number, totalCount: number) {
  const { primaryRedisInstance } = await getRedis()
  const counter = (await getRedisCache(redisKey)) || 0
  if (counter > totalCount) {
    return false
  }
  await primaryRedisInstance.set(redisKey, counter + 1, {
    ex: expirySeconds,
  })
  return true
}

/**
 * Method that attempts to fetch something from Redis cache or a backup cache or a refresh function.
 * Backup cache is a longer expiring cache to use in case there is an issue with refreshing the cache (use for third party vendors)
 *
 * @param {string} redisKey The key you want to fetch
 * @param {any} refreshFunction The function to refresh the cache in case of cache miss.
 * @param {any} functionParam What you want to pass in to the refresh function
 * @param {any} errantError If unable to refresh the cache (artist not found) throw this type of error
 * @param {number} expiry How long you want the cache to live for (IN SECONDS)
 * @param {number} backupExpiry How long you want the backup cache to live for (IN SECONDS)
 * @param {boolean} forceRefresh If you want to force a cache miss and always refresh (useful for developing)

 * @returns An object with two items.
 * 1. result - whatever the cache or refresh function returns
 * 2. refreshed {boolean} - if the refresh function was called
 */
export async function getOrRefreshCacheWithBackupHelper<T>(
  redisKey: string,
  refreshFunction: any,
  functionParam: any,
  errantError: any,
  expiry: number,
  backupExpiry: number,
  forceRefresh?: boolean,
): Promise<{ result: T | any; refreshed: boolean }> {
  let result: any
  let refreshed = false
  try {
    if (!forceRefresh) {
      blg.info(`[getOrRefreshCacheWithBackupHelper] REDIS - getRedisCache: ${redisKey}`)
      result = await getRedisCache(redisKey)
    }
  } catch (err) {
    reportErrorToSentry(err, "", `Redis error for key(${redisKey}): ${err.message}`)
  }
  if (result?.errant) {
    blg.info("errant key", redisKey)
    throw errantError
  }

  if (!result || result === "undefined" || result === "null") {
    try {
      try {
        blg.info(`[getOrRefreshCacheWithBackupHelper] ${redisKey} - cache miss, refreshing`)
        result = await refreshFunction(functionParam)
      } catch {}
      refreshed = true
    } catch (err) {
      reportErrorToSentry(err, "", `Redis refreshFunction error for key(${redisKey}): ${err.message}`)
    }

    if (result) {
      await setRedisCache(redisKey, result, expiry)
      await setRedisCache(`${redisKey}:backup`, result, backupExpiry)
    } else {
      result = await setFromBackup(redisKey, expiry, backupExpiry)
    }
  } else {
    // blg.info(`[getOrRefreshCacheWithBackupHelper] ${redisKey} - cache hit`);
  }

  return { result, refreshed }
}

export async function redisGet(redisKey: string) {
  let result
  try {
    result = await getRedisCache(redisKey)
    try {
      return result
    } catch (_err) {}
  } catch (_err) {}
  return result
}
const setFromBackup = async (key: string, expiry: number, backupExpiry: number) => {
  const backupKey = `${key}:backup`
  let result
  try {
    result = await getRedisCache(backupKey)
    if (result) {
      await setRedisCache(key, result, expiry)
      await setRedisCache(backupKey, result, backupExpiry)
    } else {
      // Not having custom expiry to requery more frequently if something is errant
      await setRedisCache(key, { errant: true }, 60 * 10)
    }
  } catch (err) {
    reportErrorToSentry(err, "", `Redis setFromBackup error for key(${key}): ${err.message}`)
    throw err
  }
  return result
}

async function incrementProviderFailures(provider: ELLMProvider): Promise<number> {
  const key = `${PROVIDER_FAILURE_KEY}${provider}`
  let failures = Number(await getRedisCache(key)) || 0
  failures++

  await setRedisCache(key, failures, FAILURE_WINDOW)
  return failures
}

async function resetProviderFailures(provider: ELLMProvider): Promise<void> {
  const key = `${PROVIDER_FAILURE_KEY}${provider}`
  await setRedisCache(key, 0, FAILURE_WINDOW)
}

async function getProviderFailures(provider: ELLMProvider): Promise<number> {
  const key = `${PROVIDER_FAILURE_KEY}${provider}`
  return Number(await getRedisCache(key)) || 0
}
