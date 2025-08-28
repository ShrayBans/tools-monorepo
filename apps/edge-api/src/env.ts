import { z } from "zod"

/**
 * @deprecated This file is being phased out in favor of Cloudflare Workers environment handling.
 * New code should use the environment from tRPC context (ctx.env) instead of importing from this file.
 * For migration guidance, see CLAUDE.md
 */
const serverSchema = z.object({
})

export type Env = z.infer<typeof serverSchema>

function createEnv(cloudflareEnv?: any) {
  // Use Cloudflare env if available, otherwise use process.env
  const source = cloudflareEnv || (typeof process !== "undefined" ? process.env : {})

  const envVars = {
  }

  // Skip validation in CI, development, or if explicitly requested
  // if (source.CI || source.SKIP_ENV_VALIDATION || source.NODE_ENV === 'development') {
  //   return envVars as Env
  // }

  try {
    return serverSchema.parse(envVars)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map((err) => `${err.path.join(".")}: ${err.message}`).join("\n")
      throw new Error(`❌ Invalid environment variables:\n${missingVars}`)
    }
    throw error
  }
}

// For Cloudflare Workers
export function getEnv(cloudflareEnv?: any): Env {
  return createEnv(cloudflareEnv)
}

// For backward compatibility
export const env = createEnv()
