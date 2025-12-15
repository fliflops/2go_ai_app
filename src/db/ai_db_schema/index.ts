import { config } from 'dotenv'

import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

import * as schema from './schema.ts';

config()
const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl:true
})

export const db = drizzle(pool, { schema })
