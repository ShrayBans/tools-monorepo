import { httpBatchLink } from "@trpc/client"
import { createTRPCReact } from "@trpc/react-query"
import superjson from "superjson"

import { supabase } from "./supabase"

// Type-only import - this won't include runtime code in the bundle
import type { AppRouter } from "../../../edge-api/src/routers/_app"

/**
 * Create tRPC React hooks with proper typing
 */
// @ts-ignore
export const trpc = createTRPCReact<AppRouter>()

/**
 * Get the API base URL based on environment
 */
function getApiBaseUrl(): string {
  // In development, use local Vercel dev server
  if (import.meta.env.DEV) {
    return "http://localhost:8790"
  }

  // In production, use environment variable or default to api subdomain
  const apiUrl = import.meta.env.VITE_API_URL
  if (apiUrl) {
    return apiUrl
  }

  // Default to api subdomain
  const currentUrl = new URL(window.location.href)
  return `https://api-${currentUrl.hostname.replace("www.", "")}`
}

/**
 * Helper to create tRPC client for React apps
 * Call this in your main.tsx to setup ReactQuery + tRPC
 */
// @ts-ignore
export const createTRPCReactClient = () => {
  const baseUrl = getApiBaseUrl()
  console.log("tRPC Client: Using API URL:", baseUrl)

  return trpc.createClient({
    transformer: superjson,
    links: [
      httpBatchLink({
        url: `${baseUrl}/api/trpc`,
        headers: async () => {
          const headers: Record<string, string> = {}

          // Add API key from environment
          const apiKey = import.meta.env.VITE_API_KEY
          if (apiKey) {
            headers.Authorization = `Bearer ${apiKey}`
          }

          // Add Supabase auth token if available
          try {
            const {
              data: { session },
            } = await supabase.auth.getSession()
            if (session?.access_token) {
              headers["x-supabase-auth"] = session.access_token
              // console.log('tRPC Client: Added Supabase auth header');
            }
          } catch (error) {
            console.warn("Failed to get Supabase session for tRPC headers:", error)
          }

          // Add source header for debugging
          headers["x-trpc-source"] = "web-app"

          // console.log('tRPC Client: Request headers:', Object.keys(headers));
          return headers
        },
      }),
    ],
  })
}
