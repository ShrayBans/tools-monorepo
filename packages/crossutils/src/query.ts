import { isEmpty, pick } from "lodash-es"
import qs from "qs"

export const FOLLOW_QUERY_PARAMS = ["ref"]

export const getNavUrlWithExistingQuery = (newPath: string, existingQuery: Record<string, string>) => {
  const newQuery = pick(existingQuery, FOLLOW_QUERY_PARAMS)

  const newUrl = isEmpty(newQuery) ? newPath : `${newPath}?${qs.stringify(newQuery)}`

  return newUrl
}

/**
 * Filters out query parameters that start with any of the provided prefixes
 * @param prefixes Array of string prefixes to filter out
 * @param queryParams Object containing query parameters
 * @returns Object with filtered query parameters
 */
export const filterQueryParamsByPrefix = (prefixes: string[], queryParams: Record<string, any>) => {
  if (!queryParams || typeof queryParams !== "object") {
    return {}
  }

  return Object.entries(queryParams).reduce(
    (filteredParams, [key, value]) => {
      const shouldRemove = prefixes.some((prefix) => {
        return key.startsWith(prefix)
      })

      if (!shouldRemove) {
        filteredParams[key] = value
      }

      return filteredParams
    },
    {} as Record<string, any>,
  )
}

/**
 * Removes query parameters until the total character count is under the specified limit
 * @param queryParams Object containing query parameters
 * @param maxLength Maximum allowed character length for the stringified query
 * @param priorityParams Array of parameter keys to prioritize keeping (optional)
 * @returns Object with reduced query parameters
 */
export const reduceQueryParamsToLength = (
  queryParams: Record<string, any>,
  maxLength: number,
  priorityParams: string[] = [],
) => {
  if (!queryParams || typeof queryParams !== "object") {
    return {}
  }

  // Create a copy of the query params to avoid modifying the original
  let reducedParams = { ...queryParams }

  // First stringify to check if we're already under the limit
  let stringified = qs.stringify(reducedParams)

  if (stringified.length <= maxLength) {
    return reducedParams
  }

  // Sort keys by priority (priority params first, then alphabetically)
  const sortedKeys = Object.keys(reducedParams).sort((a, b) => {
    const aIsPriority = priorityParams.includes(a)
    const bIsPriority = priorityParams.includes(b)

    if (aIsPriority && !bIsPriority) return -1
    if (!aIsPriority && bIsPriority) return 1
    return a.localeCompare(b)
  })

  // Remove params from the end of the list until we're under the limit
  for (let i = sortedKeys.length - 1; i >= 0; i--) {
    const key = sortedKeys[i] as string

    // Skip priority params if possible
    if (priorityParams.includes(key) && sortedKeys.length > priorityParams.length) {
      continue
    }

    delete reducedParams[key]
    stringified = qs.stringify(reducedParams)

    if (stringified.length <= maxLength) {
      break
    }
  }

  return reducedParams
}
