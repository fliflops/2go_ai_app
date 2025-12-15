import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

config()

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/ai_db_schema/schema.ts',
  out: './src/db/ai_db_schema/migrations',
  dbCredentials:{
    url: process.env.DATABASE_URL as string,
    ssl: false
  }
})

