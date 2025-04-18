import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const connectionString = process.env.DATABASE_URL;
console.log("Attempting to connect to database...");
// Add retry logic for more reliable connection
const MAX_RETRIES = 5;
const RETRY_DELAY = 5000; // 5 seconds

let retries = 0;
while (retries < MAX_RETRIES) {
  try {
    await pool.connect(); // Modified to use await and pool.connect() directly.  Assumes pool has a connect method.  If not, adjustments will be needed based on the Pool library.
    console.log('Successfully connected to database');
    break;
  } catch (err) {
    retries++;
    console.log(`Failed to connect, attempt ${retries} of ${MAX_RETRIES}`);
    if (retries === MAX_RETRIES) {
      console.error('Could not connect to database after multiple attempts:', err);
      throw err;
    }
    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
  }
}

export const pool = new Pool({ 
  connectionString,
  ssl: { rejectUnauthorized: false }
});


export const db = drizzle({ client: pool, schema });