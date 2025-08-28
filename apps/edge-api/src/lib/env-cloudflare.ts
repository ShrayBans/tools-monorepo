import { z } from "zod"

// Define the environment schema
const envSchema = z.object({

})

export type Env = z.infer<typeof envSchema>

/**
 * Validate environment variables for Cloudflare Workers
 * This function is called with the Cloudflare env object
 */
export function validateEnv(env: Record<string, any>): Env {
  try {
    return envSchema.parse(env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join('\n')
      throw new Error(`❌ Invalid environment variables:\n${missingVars}`)
    }
    throw error
  }
}

/**
 * Get environment variables with validation
 * For development, this uses process.env
 * For production, this uses the Cloudflare env object
 */
export function getEnv(cloudflareEnv?: Record<string, any>): Env {
  // In Cloudflare Workers, use the provided env
  if (cloudflareEnv) {
    return validateEnv(cloudflareEnv)
  }

  // In development, use process.env
  if (typeof process !== 'undefined' && process.env) {
    return validateEnv(process.env as any)
  }

  throw new Error('No environment variables available')
}