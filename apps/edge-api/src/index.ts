import app from './hono'
import { handleScheduledEvent } from './handlers/scheduled'

// Export for Cloudflare Workers (Module Worker mode)
// This binds the fetch method to the app instance for proper context
export default {
  fetch: app.fetch.bind(app),
  scheduled: handleScheduledEvent
}