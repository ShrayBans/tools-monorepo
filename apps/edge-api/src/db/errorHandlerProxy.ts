import { withDatabaseErrorHandling } from "@shray/apiutils/src/database"
import type { DatabaseConnection } from "./index"
import { getRequestContext } from "./requestContext"

// Methods that should be wrapped with error handling
const DATABASE_METHODS = [
  'select', 'insert', 'update', 'delete',
  'query', 'execute', 'transaction', 'batch'
] as const

// Methods that return query builders (need to wrap their execution methods)
const QUERY_BUILDER_METHODS = [
  'select', 'insert', 'update', 'delete'
] as const


/**
 * Wraps query builder methods to add error handling to their execution
 */
function wrapQueryBuilder(queryBuilder: any, operation: string, tableName?: string): any {
  if (!queryBuilder || typeof queryBuilder !== 'object') {
    return queryBuilder
  }

  return new Proxy(queryBuilder, {
    get(target, prop) {
      const value = target[prop]

      // Wrap execution methods
      if (typeof value === 'function' && (prop === 'then' || prop === 'execute' || prop === 'catch' || prop === 'finally')) {
        return function(...args: any[]) {
          const context = getRequestContext()

          // If this is a thenable (Promise-like), wrap the execution
          if (prop === 'then') {
            return withDatabaseErrorHandling(
              () => target.then(...args),
              {
                operation,
                table: tableName,
                requestId: context.requestId,
                userId: context.userId
              }
            )
          }

          // For other execution methods, wrap them too
          return withDatabaseErrorHandling(
            () => value.apply(target, args),
            {
              operation,
              table: tableName,
              requestId: context.requestId,
              userId: context.userId
            }
          )
        }
      }

      // For chaining methods, continue proxying
      if (typeof value === 'function') {
        return function(...args: any[]) {
          const result = value.apply(target, args)
          // If the result looks like another query builder, wrap it too
          if (result && typeof result === 'object' && ('then' in result || 'execute' in result)) {
            return wrapQueryBuilder(result, operation, tableName)
          }
          return result
        }
      }

      return value
    }
  })
}

/**
 * Extracts table name from a query builder or operation
 */
function extractTableName(target: any, prop: string | symbol, args: any[]): string | undefined {
  // Try to extract table name from the first argument if it's a table reference
  if (args && args[0] && typeof args[0] === 'object') {
    // Drizzle table objects have a schema property with table name
    if (args[0]._.name) {
      return args[0]._.name
    }
    // Alternative: check for tableName property
    if (args[0].tableName) {
      return args[0].tableName
    }
  }

  return undefined
}

/**
 * Creates a proxy around the database connection that automatically
 * wraps all operations with error handling
 */
export function createErrorHandlingProxy(db: DatabaseConnection): DatabaseConnection {
  return new Proxy(db, {
    get(target, prop) {
      const value = target[prop as keyof DatabaseConnection]

      // If it's not a function, return as-is
      if (typeof value !== 'function') {
        return value
      }

      const propName = String(prop)

      // Wrap database operation methods
      if (DATABASE_METHODS.includes(propName as any)) {
        return function(...args: any[]) {
          const context = getRequestContext()
          const tableName = extractTableName(target, prop, args)
          const operation = `db.${propName}`

          // For query builder methods, we need to wrap the returned builder
          if (QUERY_BUILDER_METHODS.includes(propName as any)) {
            const queryBuilder = value.apply(target, args)
            return wrapQueryBuilder(queryBuilder, operation, tableName)
          }

          // For direct execution methods, wrap immediately
          return withDatabaseErrorHandling(
            () => value.apply(target, args),
            {
              operation,
              table: tableName,
              requestId: context.requestId,
              userId: context.userId
            }
          )
        }
      }

      // For the 'query' property (drizzle's query object), wrap each table accessor
      if (propName === 'query' && value && typeof value === 'object') {
        return new Proxy(value, {
          get(queryTarget, queryProp) {
            if (!queryTarget) return undefined
            const queryValue = queryTarget[queryProp as keyof typeof queryTarget]

            if (typeof queryValue === 'object' && queryValue) {
              // This is likely a table query object, wrap its methods
              return new Proxy(queryValue, {
                get(tableTarget, tableProp) {
                  const tableValue = tableTarget[tableProp as keyof typeof tableTarget]

                  if (typeof tableValue === 'function') {
                    return function(...args: any[]) {
                      const context = getRequestContext()
                      const operation = `query.${String(queryProp)}.${String(tableProp)}`

                      return withDatabaseErrorHandling(
                        () => (tableValue as Function).apply(tableTarget, args),
                        {
                          operation,
                          table: String(queryProp),
                          requestId: context.requestId,
                          userId: context.userId
                        }
                      )
                    }
                  }

                  return tableValue
                }
              })
            }

            return queryValue
          }
        })
      }

      // For all other methods, return as-is but bind the context
      if (typeof value === 'function') {
        return value.bind(target)
      }

      return value
    }
  })
}