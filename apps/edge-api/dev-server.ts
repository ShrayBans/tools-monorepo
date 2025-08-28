import { serve } from "@hono/node-server"

import app from "./src/hono"

const port = 8790

console.log(`🚀 Starting development server on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port,
})

console.log(`✅ Server running on http://localhost:${port}`)
console.log(`📋 Health check: http://localhost:${port}/health`)
console.log(`🔌 tRPC endpoint: http://localhost:${port}/api/trpc`)
