import * as schema from "./schema"

import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"

// Type definition for the database connection
export type DatabaseConnection = PostgresJsDatabase<typeof schema>

let db: DatabaseConnection | null = null

export async function getDb(): Promise<DatabaseConnection> {
  // if (db) return db
  const { drizzle } = await import("drizzle-orm/postgres-js")
  const { default: postgres } = await import("postgres")

  const connectionString = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error("SUPABASE_DATABASE_URL environment variable is required")
  }
  // Create postgres client
  const client = postgres(connectionString, {
    prepare: false, // Required for Vercel Edge Functions
    max: 1, // Limit connections for edge runtime
  })

  // Create Drizzle instance
  db = drizzle(client, { schema })
  return db
}

// Placeholder functions for request lifecycle management (if needed)
export function initRequestDatabase() {
  // Implementation placeholder - may not be needed with current architecture
}

export function cleanupRequestDatabase() {
  // Implementation placeholder - may not be needed with current architecture
}
