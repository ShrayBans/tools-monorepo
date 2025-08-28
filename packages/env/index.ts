export const isTestEnv =
  process.env.VITEST === "true" || process.env.ENVIRONMENT === "test" || process.env.ENVIRONMENT === "ci"

export const isPreviewVercelEnv = process.env.NEXT_PUBLIC_ENV === "preview"
// process.env.VERCEL_ENV === "preview" && process.env.NEXT_PUBLIC_VERCEL === "1";
export const isDevelopVercelEnv = process.env.NEXT_PUBLIC_ENV === "dev"
// process.env.VERCEL_ENV === "development" && process.env.NEXT_PUBLIC_VERCEL === "1";
export const isProdVercelEnv = process.env.NEXT_PUBLIC_ENV === "prod"
// process.env.VERCEL_ENV === "production" && process.env.NEXT_PUBLIC_VERCEL === "1";

/**
 *
 */

export const IS_VERCEL_DEPLOYED = process.env.VERCEL === "1" || process.env.NEXT_PUBLIC_VERCEL === "1"
export const IS_RENDER_DEPLOYED =
  process.env.NEXT_PUBLIC_RENDER_EXTERNAL_URL && process.env.NEXT_PUBLIC_RENDER_EXTERNAL_URL !== "http://localhost:3000"
// Cloudflare Workers detection
export const IS_CLOUDFLARE_DEPLOYED = isProdVercelEnv
// Is deployed to any environment (Vercel, Render, etc.)
export const IS_ENV_DEPLOYED = IS_VERCEL_DEPLOYED || IS_RENDER_DEPLOYED || IS_CLOUDFLARE_DEPLOYED || isProdVercelEnv

export const UI_HOST = process.env.NEXT_PUBLIC_UI_HOST
export const UI_HTTP_HOST = `${IS_VERCEL_DEPLOYED ? "https" : "http"}://${process.env.NEXT_PUBLIC_UI_HOST}`

export const VIDMAX_UI_HOST = `${IS_VERCEL_DEPLOYED ? "https" : "http"}://${process.env.NEXT_PUBLIC_VIDMAX_UI_HOST}`
export const UNTANGLE_UI_HOST = `${IS_VERCEL_DEPLOYED ? "https" : "http"}://${process.env.NEXT_PUBLIC_UNTANGLE_UI_HOST}`

export const VOICE_ASSET_S3_BUCKET_URL = "https://ghost-voice-assets.s3.us-west-2.amazonaws.com"
