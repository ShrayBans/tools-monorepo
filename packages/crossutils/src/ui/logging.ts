import { IS_ENV_DEPLOYED, IS_VERCEL_DEPLOYED, IS_RENDER_DEPLOYED } from "@shray/env"
import { Logger } from "next-axiom"

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

// Default to INFO level if not set
const currentLogLevel = (process.env.NEXT_PUBLIC_LOG_LEVEL || "INFO") as keyof typeof LogLevel
const LOG_LEVEL = LogLevel[currentLogLevel] ?? LogLevel.DEBUG

// Base logger instance
let baseLogger = new Logger().with({
  env: process.env.NEXT_PUBLIC_ENV,
  appName: process.env.NEXT_PUBLIC_OVERWRITE_APP_NAME || process.env.NEXT_PUBLIC_APP_NAME,
  location: "frontend-ui",
  browser:
    typeof window !== "undefined"
      ? {
          userAgent: window.navigator.userAgent,
          language: window.navigator.language,
          platform: window.navigator.platform,
          screenSize: `${window.innerWidth}x${window.innerHeight}`,
        }
      : undefined,
})

// Keep track of the current context
let currentContext = {}

export interface FrontendLoggingContext {
  path: string
  fullUrl: string
  query: any
  pathname: string

  userId?: string
  userEmail?: string

  // Note: should be used sparingly as this will override the existing misc
  misc?: any
}

export const enrichLoggingWithParams = (params: FrontendLoggingContext) => {
  // Merge new params with existing context
  currentContext = {
    ...currentContext,
    ...params,
  }

  // Create a new logger instance with the merged context
  baseLogger = baseLogger.with({
    ...currentContext,
  })
}

export const logFlush = async () => {
  await baseLogger.flush()
}

const shouldLog = (level: LogLevel): boolean => {
  return level <= LOG_LEVEL
}

const getCallerInfo = () => {
  // Create an Error to capture the stack trace
  const err = new Error()

  // Get the stack trace and split it into lines
  const stack = err.stack?.split("\n")

  if (!stack) return null

  // Skip first 3 lines (Error creation, getCallerInfo, and the logger function)
  // Format: "    at FunctionName (file:line:column)"
  const callerLine = stack[3]

  if (!callerLine) return null

  // Extract function name and location
  const match = callerLine.match(/at\s+(.*)\s+\((.*):(\d+):(\d+)\)/)
  if (!match) {
    // Handle anonymous functions
    const anonMatch = callerLine.match(/at\s+(.*):(\d+):(\d+)/)
    if (!anonMatch) return null

    return {
      function: "<anonymous>",
      file: anonMatch[1],
      line: anonMatch[2],
      column: anonMatch[3],
    }
  }

  return {
    function: match[1],
    file: match[2],
    line: match[3],
    column: match[4],
  }
}

/**
 * flg - Frontend log
 */
export const flg = {
  info: (input: string, context?) => {
    if (!shouldLog(LogLevel.INFO)) return

    const callerInfo = getCallerInfo()
    const performanceInfo =
      typeof window !== "undefined"
        ? {
            loadTime: window.performance?.timing?.loadEventEnd - window.performance?.timing?.navigationStart,
            domContentLoaded:
              window.performance?.timing?.domContentLoadedEventEnd - window.performance?.timing?.navigationStart,
          }
        : undefined

    const enrichedContext = {
      ...(typeof context === "string" ? { contextMsg: context } : context),
      caller: callerInfo,
      performance: performanceInfo,
      timestamp: new Date().toISOString(),
    }

    if (IS_ENV_DEPLOYED) {
      baseLogger.info(input, enrichedContext)
    } else {
      console.log("[flg.info]", input, context || "")
    }
    return
  },
  debug: (input: string, context?) => {
    if (!shouldLog(LogLevel.DEBUG)) return

    const callerInfo = getCallerInfo()
    const enrichedContext = {
      ...(typeof context === "string" ? { contextMsg: context } : context),
      caller: callerInfo,
    }

    if (IS_ENV_DEPLOYED) {
      baseLogger.debug(input, enrichedContext)
    } else {
      console.log("[flg.debug]", input, context || "")
    }
    return
  },
  warn: (input: string, context?) => {
    if (!shouldLog(LogLevel.WARN)) return

    const callerInfo = getCallerInfo()
    const enrichedContext = {
      ...(typeof context === "string" ? { contextMsg: context } : context),
      caller: callerInfo,
    }

    if (IS_ENV_DEPLOYED) {
      baseLogger.warn(input, enrichedContext)
    } else {
      console.warn("[flg.warn]", input, context || "")
    }
    return
  },
  error: (input: string, context?) => {
    if (!shouldLog(LogLevel.ERROR)) return

    const callerInfo = getCallerInfo()
    const enrichedContext = {
      ...(typeof context === "string" ? { contextMsg: context } : context),
      caller: callerInfo,
    }

    if (IS_ENV_DEPLOYED) {
      baseLogger.error(input, enrichedContext)
    } else {
      console.error("[flg.error]", input, context || "")
    }
  },
}
