/**
 * Simple request context storage for database error handling
 * This allows us to associate database operations with the current request
 */

interface RequestContext {
  requestId?: string
  userId?: string
  operation?: string
}

// Per-request context storage (similar to how we handle the database connection)
let currentRequestContext: RequestContext | null = null

/**
 * Set context for the current request
 * Should be called from tRPC middleware
 */
export function setRequestContext(context: RequestContext) {
  currentRequestContext = context
}

/**
 * Get current request context
 * Returns context if available, otherwise generates a fallback
 */
export function getRequestContext(): RequestContext {
  if (currentRequestContext) {
    return currentRequestContext
  }
  
  // Fallback context if none is set
  return {
    requestId: `db_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

/**
 * Clear request context (called at end of request)
 */
export function clearRequestContext() {
  currentRequestContext = null
}