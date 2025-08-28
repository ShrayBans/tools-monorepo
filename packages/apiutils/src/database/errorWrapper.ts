import { reportErrorToSentry } from "../sentry"
import { blg } from "../logging"
import { InternalServerError, BadDataError } from "../trpcErrors"

interface DatabaseErrorContext {
  operation: string
  table?: string
  query?: string
  params?: any[]
  userId?: string
  requestId?: string
}

/**
 * Database Error Types
 */
const DB_ERROR_PATTERNS = {
  // PostgreSQL constraint violations
  UNIQUE_VIOLATION: /violates unique constraint|duplicate key value/i,
  FOREIGN_KEY_VIOLATION: /violates foreign key constraint/i,
  NOT_NULL_VIOLATION: /violates not-null constraint|null value in column/i,
  CHECK_VIOLATION: /violates check constraint/i,
  
  // PostgreSQL syntax/query errors
  SYNTAX_ERROR: /syntax error|invalid input syntax/i,
  UNDEFINED_COLUMN: /column.*does not exist/i,
  UNDEFINED_TABLE: /relation.*does not exist/i,
  GROUP_BY_ERROR: /must appear in the GROUP BY clause or be used in an aggregate function/i,
  
  // Connection/timeout errors
  CONNECTION_ERROR: /connection|timeout|ECONNREFUSED|ETIMEDOUT/i,
  SERIALIZATION_ERROR: /could not serialize access|deadlock/i,
  
  // Drizzle specific errors
  DRIZZLE_ERROR: /DrizzleQueryError|DrizzleTypeError/i,
} as const

/**
 * Maps database error patterns to user-friendly messages and error types
 */
function categorizeError(error: any): { 
  category: string
  userMessage: string
  shouldRetry: boolean
  isUserError: boolean
} {
  const errorMessage = error?.message || error?.toString() || 'Unknown error'
  
  if (DB_ERROR_PATTERNS.UNIQUE_VIOLATION.test(errorMessage)) {
    return {
      category: 'UNIQUE_VIOLATION',
      userMessage: 'This record already exists. Please use a different value.',
      shouldRetry: false,
      isUserError: true
    }
  }
  
  if (DB_ERROR_PATTERNS.FOREIGN_KEY_VIOLATION.test(errorMessage)) {
    return {
      category: 'FOREIGN_KEY_VIOLATION', 
      userMessage: 'Invalid reference. The referenced record does not exist.',
      shouldRetry: false,
      isUserError: true
    }
  }
  
  if (DB_ERROR_PATTERNS.NOT_NULL_VIOLATION.test(errorMessage)) {
    return {
      category: 'NOT_NULL_VIOLATION',
      userMessage: 'Required field is missing. Please provide all required information.',
      shouldRetry: false,
      isUserError: true
    }
  }
  
  if (DB_ERROR_PATTERNS.GROUP_BY_ERROR.test(errorMessage)) {
    return {
      category: 'GROUP_BY_ERROR',
      userMessage: 'Database query error. Please try again.',
      shouldRetry: false,
      isUserError: false
    }
  }
  
  if (DB_ERROR_PATTERNS.SYNTAX_ERROR.test(errorMessage) || 
      DB_ERROR_PATTERNS.UNDEFINED_COLUMN.test(errorMessage) ||
      DB_ERROR_PATTERNS.UNDEFINED_TABLE.test(errorMessage)) {
    return {
      category: 'QUERY_ERROR',
      userMessage: 'Database query error. Please try again.',
      shouldRetry: false,
      isUserError: false
    }
  }
  
  if (DB_ERROR_PATTERNS.CONNECTION_ERROR.test(errorMessage)) {
    return {
      category: 'CONNECTION_ERROR',
      userMessage: 'Database connection failed. Please try again in a moment.',
      shouldRetry: true,
      isUserError: false
    }
  }
  
  if (DB_ERROR_PATTERNS.SERIALIZATION_ERROR.test(errorMessage)) {
    return {
      category: 'SERIALIZATION_ERROR',
      userMessage: 'Database operation failed due to concurrent access. Please try again.',
      shouldRetry: true,
      isUserError: false
    }
  }
  
  return {
    category: 'UNKNOWN_ERROR',
    userMessage: 'An unexpected database error occurred. Please try again.',
    shouldRetry: false,
    isUserError: false
  }
}

/**
 * Wraps database operations with error handling, logging, and Sentry reporting
 * 
 * @param operation - Function that performs the database operation
 * @param context - Context information for debugging
 * @returns Promise that resolves to the operation result or throws a user-friendly tRPC error
 * 
 * @example
 * ```typescript
 * const result = await withDatabaseErrorHandling(
 *   () => db.select().from(users).where(eq(users.id, userId)),
 *   {
 *     operation: "getUserById",
 *     table: "users",
 *     userId: ctx.user.id,
 *     requestId: ctx.requestId
 *   }
 * )
 * ```
 */
export async function withDatabaseErrorHandling<T>(
  operation: () => Promise<T>,
  context: DatabaseErrorContext
): Promise<T> {
  const startTime = Date.now()
  
  try {
    const result = await operation()
    const duration = Date.now() - startTime
    
    // Log successful operations in development for debugging
    if (process.env.NODE_ENV === 'development' && duration > 1000) {
      blg.info(`Slow DB operation: ${context.operation}`, {
        duration,
        table: context.table,
        requestId: context.requestId
      })
    }
    
    return result
  } catch (error: any) {
    const duration = Date.now() - startTime
    const errorInfo = categorizeError(error)
    
    // Create detailed error context for Sentry
    const sentryContext = {
      tags: {
        operation: context.operation,
        table: context.table || 'unknown',
        errorCategory: errorInfo.category,
        isUserError: errorInfo.isUserError,
        shouldRetry: errorInfo.shouldRetry
      },
      extra: {
        originalError: {
          message: error?.message,
          code: error?.code,
          detail: error?.detail,
          hint: error?.hint,
          position: error?.position,
          internalPosition: error?.internalPosition,
          internalQuery: error?.internalQuery,
          where: error?.where,
          schema: error?.schema_name,
          table: error?.table_name,
          column: error?.column_name,
          dataType: error?.data_type,
          constraint: error?.constraint_name
        },
        context: {
          ...context,
          duration,
          timestamp: new Date().toISOString()
        },
        // Include first few lines of stack for debugging
        stack: error?.stack?.split('\n')?.slice(0, 10)?.join('\n')
      }
    }
    
    // Log error details
    blg.error(`Database error in ${context.operation}`, {
      category: errorInfo.category,
      userMessage: errorInfo.userMessage,
      originalError: error?.message,
      table: context.table,
      duration,
      requestId: context.requestId,
      userId: context.userId
    })
    
    // Report to Sentry unless it's a user error that doesn't need tracking
    if (!errorInfo.isUserError || errorInfo.category === 'UNKNOWN_ERROR') {
      reportErrorToSentry(
        error,
        `db_${context.operation}`,
        sentryContext
      )
    }
    
    // Throw appropriate tRPC error
    if (errorInfo.isUserError) {
      throw BadDataError(errorInfo.userMessage)
    } else {
      throw InternalServerError(errorInfo.userMessage)
    }
  }
}

/**
 * Convenience wrapper for simple database operations without detailed context
 */
export async function withDatabaseErrorHandlingSimple<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  return withDatabaseErrorHandling(operation, { operation: operationName })
}

/**
 * Type-safe wrapper that preserves the original function signature
 * while adding error handling
 */
export function createDatabaseWrapper<TArgs extends any[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  operationName: string
) {
  return async (...args: TArgs): Promise<TReturn> => {
    return withDatabaseErrorHandlingSimple(() => fn(...args), operationName)
  }
}