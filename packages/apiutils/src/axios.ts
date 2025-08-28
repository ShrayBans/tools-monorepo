import axios, { AxiosRequestConfig } from "axios"
import qs from "qs"

import { reportErrorToSentry } from "./sentry"
import { blg } from "./logging"

/**
 * A wrapper around axios post. There are a couple of helpers to make this wrapper opinionated
 * - Adds a default timeout of 10 seconds
 * - Adds a default report to sentry (and axiom)
 * - Adds a default capture to posthog
 * - Extracts data out of response
 */
export const axiosPost = async <T>(
  url: string,
  payload: any,
  headers: any,
  uniqueId: string,
  opts?: { timeout?: number; queryParams?: any } & AxiosRequestConfig, // timeout in ms
): Promise<T | any> => {
  let response

  const finalUrl = `${url}${opts?.queryParams ? `?${qs.stringify(opts?.queryParams)}` : ""}`

  try {
    // @ts-ignore
    if (typeof EdgeRuntime !== "string") {
      response = (
        await axios.post(finalUrl, payload, {
          headers,
          timeout: 30000,
          ...opts,
        })
      )?.data
    } else {
      // Falls back to fetch. This is necessary in edge functions
      const fetchResp = await fetch(finalUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      })
      response = await fetchResp.json()
    }
  } catch (error) {
    if (error instanceof Error) {
      blg.error("[MONITOR] API ERROR", {
        message: error.message,
        context: uniqueId,
      })
    }
    reportErrorToSentry(error, uniqueId, {
      payload,
      axiosInnerError: JSON.stringify((error as any)?.response?.data || {}),
      url,
      headers,
    })

    return (error as any).response.data
  }

  return response
}

/**
 * A wrapper around axios post. There are a couple of helpers to make this wrapper opinionated
 * - Adds a default timeout of 10 seconds
 * - Adds a default report to sentry (and axiom)
 * - Adds a default capture to posthog
 * - Extracts data out of response
 */
export const axiosGet = async <T>(
  url: string,
  headers: any,
  uniqueId: string,
  opts?: { timeout?: number; queryParams?: any } & AxiosRequestConfig, // timeout in ms
): Promise<T> => {
  let response

  const finalUrl = `${url}${opts?.queryParams ? `?${qs.stringify(opts?.queryParams)}` : ""}`

  try {
    // @ts-ignore
    if (typeof EdgeRuntime !== "string") {
      response = (
        await axios.get(finalUrl, {
          headers,
          timeout: 10000,
          ...opts,
        })
      )?.data
    } else {
      // Falls back to fetch. This is necessary in edge functions
      const fetchResp = await fetch(finalUrl, {
        method: "get",
        headers,
      })
      response = await fetchResp.json()
    }
  } catch (error: any) {
    blg.error("[MONITOR] API ERROR", {
      message: error.message,
      context: uniqueId,
    })
    reportErrorToSentry(error, uniqueId, {
      url,
      axiosInnerError: JSON.stringify((error as any)?.response?.data || {}),
      headers,
    })
  }

  return response
}

/**
 * A wrapper around axios delete. There are a couple of helpers to make this wrapper opinionated
 * - Adds a default timeout of 10 seconds
 * - Adds a default report to sentry (and axiom)
 * - Adds a default capture to posthog
 * - Extracts data out of response
 */
export const axiosDelete = async <T>(
  url: string,
  headers: any,
  uniqueId: string,
  opts?: { timeout?: number; queryParams?: any } & AxiosRequestConfig, // timeout in ms
): Promise<T> => {
  let response

  const finalUrl = `${url}${opts?.queryParams ? `?${qs.stringify(opts?.queryParams)}` : ""}`

  try {
    // @ts-ignore
    if (typeof EdgeRuntime !== "string") {
      response = (
        await axios.delete(finalUrl, {
          headers,
          timeout: 10000,
          ...opts,
        })
      )?.data
    } else {
      // Falls back to fetch. This is necessary in edge functions
      const fetchResp = await fetch(finalUrl, {
        method: "DELETE",
        headers,
      })
      response = await fetchResp.json()
    }
  } catch (error: any) {
    blg.error("[MONITOR] API ERROR", {
      message: error.message,
      context: uniqueId,
    })
    reportErrorToSentry(error, uniqueId, {
      url,
      axiosInnerError: JSON.stringify((error as any)?.response?.data || {}),
      headers,
    })
  }

  return response
}

/**
 * A wrapper around axios put. There are a couple of helpers to make this wrapper opinionated
 * - Adds a default timeout of 30 seconds
 * - Adds a default report to sentry (and axiom)
 * - Adds a default capture to posthog
 * - Extracts data out of response
 */
export const axiosPut = async <T>(
  url: string,
  payload: any,
  headers: any,
  uniqueId: string,
  opts?: { timeout?: number; queryParams?: any } & AxiosRequestConfig, // timeout in ms
): Promise<T | any> => {
  let response

  const finalUrl = `${url}${opts?.queryParams ? `?${qs.stringify(opts?.queryParams)}` : ""}`

  try {
    // @ts-ignore
    if (typeof EdgeRuntime !== "string") {
      response = (
        await axios.put(finalUrl, payload, {
          headers,
          timeout: 30000,
          ...opts,
        })
      )?.data
    } else {
      // Falls back to fetch. This is necessary in edge functions
      const fetchResp = await fetch(finalUrl, {
        method: "PUT",
        headers,
        body: JSON.stringify(payload),
      })
      response = await fetchResp.json()
    }
  } catch (error) {
    if (error instanceof Error) {
      blg.error("[MONITOR] API ERROR", {
        message: error.message,
        context: uniqueId,
      })
    }
    reportErrorToSentry(error, uniqueId, {
      payload,
      axiosInnerError: JSON.stringify((error as any)?.response?.data || {}),
      url,
      headers,
    })

    return (error as any).response.data
  }

  return response
}

/**
 * A wrapper around axios patch. There are a couple of helpers to make this wrapper opinionated
 * - Adds a default timeout of 30 seconds
 * - Adds a default report to sentry (and axiom)
 * - Adds a default capture to posthog
 * - Extracts data out of response
 */
export const axiosPatch = async <T>(
  url: string,
  payload: any,
  headers: any,
  uniqueId: string,
  opts?: { timeout?: number; queryParams?: any } & AxiosRequestConfig, // timeout in ms
): Promise<T | any> => {
  let response

  const finalUrl = `${url}${opts?.queryParams ? `?${qs.stringify(opts?.queryParams)}` : ""}`

  try {
    // @ts-ignore
    if (typeof EdgeRuntime !== "string") {
      response = (
        await axios.patch(finalUrl, payload, {
          headers,
          timeout: 30000,
          ...opts,
        })
      )?.data
    } else {
      // Falls back to fetch. This is necessary in edge functions
      const fetchResp = await fetch(finalUrl, {
        method: "PATCH",
        headers,
        body: JSON.stringify(payload),
      })
      response = await fetchResp.json()
    }
  } catch (error) {
    if (error instanceof Error) {
      blg.error("[MONITOR] API ERROR", {
        message: error.message,
        context: uniqueId,
      })
    }
    reportErrorToSentry(error, uniqueId, {
      payload,
      axiosInnerError: JSON.stringify((error as any)?.response?.data || {}),
      url,
      headers,
    })

    return (error as any).response.data
  }

  return response
}
