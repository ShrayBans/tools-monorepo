import { IS_CLOUDFLARE_DEPLOYED, IS_ENV_DEPLOYED, IS_RENDER_DEPLOYED, IS_VERCEL_DEPLOYED } from "@shray/env"

import { axiomLogger } from "./axiom/logger"

// import { Logger } from "next-axiom"

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

export interface BackendLoggingContext {
  userId?: string
  userEmail?: string
  reqParams?: any
  reqBody?: any
  requestId: string
  path?: string

  // Note: should be used sparingly as this will override the existing misc
  misc?: any
}

type RequestContextAccessors = {
  getRequestContext: () => BackendLoggingContext
  addToRequestContext: (context: Partial<BackendLoggingContext>) => void
  clearRequestContext: () => void
}

// Default no-op functions that will be replaced during request lifecycle
let currentGetRequestContext: (() => BackendLoggingContext) | null = null
let currentAddToRequestContext: ((context: Partial<BackendLoggingContext>) => void) | null = null
let currentClearRequestContext: (() => void) | null = null

export const createRequestContext = (): RequestContextAccessors => {
  let context: BackendLoggingContext | null = null

  return {
    getRequestContext: () => {
      if (!context) {
        return {} as BackendLoggingContext
      }
      return context
    },
    addToRequestContext: (newContext: Partial<BackendLoggingContext>) => {
      context = {
        ...context,
        ...newContext,
      } as BackendLoggingContext
    },
    clearRequestContext: () => {
      context = null
    },
  }
}

// Global accessor functions that delegate to current request's context
export const getRequestContext = () => {
  if (!currentGetRequestContext) {
    return {} // Return empty object for non-request contexts (e.g. cron jobs)
  }
  return currentGetRequestContext()
}

export const addToRequestContext = (context: Partial<BackendLoggingContext>) => {
  if (currentAddToRequestContext) {
    currentAddToRequestContext(context)
  }
}

export const clearRequestContext = () => {
  if (currentClearRequestContext) {
    currentClearRequestContext()
  }
}

export const setRequestContextAccessors = (accessors: RequestContextAccessors | null) => {
  currentGetRequestContext = accessors ? accessors.getRequestContext : null
  currentAddToRequestContext = accessors ? accessors.addToRequestContext : null
  currentClearRequestContext = accessors ? accessors.clearRequestContext : null
}

// Default to INFO level if not set
const currentLogLevel = (process.env.NEXT_PUBLIC_LOG_LEVEL || "INFO") as keyof typeof LogLevel
const LOG_LEVEL = LogLevel[currentLogLevel] ?? LogLevel.DEBUG

// Function to determine the deployment environment
export const getDeploymentLocation = (): string => {
  if (IS_ENV_DEPLOYED) {
    if (IS_CLOUDFLARE_DEPLOYED) {
      return "backend-cloudflare"
    }
    if (IS_RENDER_DEPLOYED) {
      return "backend-render"
    }
    return "unknown-deployed"
  }
  return "local"
}

// Import Axiom logger
// Base logger instance - now uses Axiom
const baseLogger = axiomLogger

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

// ANSI color codes for console logging
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",

  // Text colors
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",

  // Background colors
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgBlue: "\x1b[44m",
}

/**
 * Batched Logging
 * Splits the input into chunks of 2000 characters
 * and logs each chunk with the same context in order to get around axiom
 */
export const blg = {
  info: (input: string, jsonContext?, context?) => {
    if (!shouldLog(LogLevel.INFO)) return

    const requestContext = getRequestContext()
    const callerInfo = getCallerInfo()

    const contextMsgObj = jsonContext
      ? { contextMsg: typeof jsonContext === "string" ? jsonContext : [jsonContext] }
      : {}
    const enrichedContext = {
      ...contextMsgObj,
      ...(typeof context === "string" ? { context: context } : context),
      ...requestContext,
      caller: callerInfo,
    }

    if (IS_ENV_DEPLOYED) {
      baseLogger.info(input, enrichedContext, {
        caller: callerInfo,
        requestContext,
        environment: getDeploymentLocation()
      })
    } else {
      console.log(`${colors.blue}[blg.info]${colors.reset}`, `${input}: ${JSON.stringify(contextMsgObj)}`, context || "")
    }
    return
  },
  debug: (input: string, jsonContext?, context?) => {
    if (!shouldLog(LogLevel.DEBUG)) return

    const requestContext = getRequestContext()
    const callerInfo = getCallerInfo()

    const contextMsgObj = jsonContext
      ? { contextMsg: typeof jsonContext === "string" ? jsonContext : [jsonContext] }
      : {}
    const enrichedContext = {
      ...contextMsgObj,
      ...(typeof context === "string" ? { context: context } : context),
      ...requestContext,
      caller: callerInfo,
    }

    if (IS_ENV_DEPLOYED) {
      baseLogger.debug(input, enrichedContext, {
        caller: callerInfo,
        requestContext,
        environment: getDeploymentLocation()
      })
    } else {
      console.log(`${colors.cyan}[blg.debug]${colors.reset}`, `${input}: ${JSON.stringify(contextMsgObj)}`, context || "")
    }
    return
  },
  warn: (input: string, jsonContext?, context?) => {
    if (!shouldLog(LogLevel.WARN)) return

    const requestContext = getRequestContext()
    const callerInfo = getCallerInfo()

    const contextMsgObj = jsonContext
      ? { contextMsg: typeof jsonContext === "string" ? jsonContext : [jsonContext] }
      : {}
    const enrichedContext = {
      ...contextMsgObj,
      ...(typeof context === "string" ? { context: context } : context),
      ...requestContext,
      caller: callerInfo,
    }

    if (IS_ENV_DEPLOYED) {
      baseLogger.warn(input, enrichedContext, {
        caller: callerInfo,
        requestContext,
        environment: getDeploymentLocation()
      })
    } else {
      console.warn(`${colors.yellow}[blg.warn]${colors.reset}`, `${input}: ${JSON.stringify(contextMsgObj)}`, context || "")
    }
    return
  },
  error: (input: string, jsonContext?, context?) => {
    if (!shouldLog(LogLevel.ERROR)) return

    const requestContext = getRequestContext()
    const callerInfo = getCallerInfo()

    const contextMsgObj = jsonContext
      ? { contextMsg: typeof jsonContext === "string" ? jsonContext : [jsonContext] }
      : {}
    const enrichedContext = {
      ...contextMsgObj,
      ...(typeof context === "string" ? { context: context } : context),
      ...requestContext,
      caller: callerInfo,
    }

    if (IS_ENV_DEPLOYED) {
      baseLogger.error(input, enrichedContext, {
        caller: callerInfo,
        requestContext,
        environment: getDeploymentLocation()
      })
      console.error(`${colors.red}[blg.error]${colors.reset}`, `${input}: ${JSON.stringify(contextMsgObj)}`, context || "")

    } else {
      console.error(`${colors.red}[blg.error]${colors.reset}`, `${input}: ${JSON.stringify(contextMsgObj)}`, context || "")
    }
  },
}
