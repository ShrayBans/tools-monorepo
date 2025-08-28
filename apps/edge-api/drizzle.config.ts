import { defineConfig } from "drizzle-kit"
import { replace } from "lodash-es"

import { env } from "./src/env"

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: replace(env.SUPABASE_DATABASE_URL, "6543", "5432"),
  },
  verbose: true,
  strict: true,
});