import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import dotenv from 'dotenv';
import path from 'path';
import * as schema from './schema';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const DEFAULT_NEON_URL = 'postgresql://neondb_owner:npg_USAVX1b4ueyr@ep-young-wildflower-agt8whdg-pooler.c-2.eu-central-1.aws.neon.tech/facturation_db?sslmode=require';

const getConnectionString = () => {
  const envUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING;
  const isValidEnvUrl = envUrl && envUrl.includes('@') && !envUrl.includes('user:password');
  return isValidEnvUrl ? envUrl! : DEFAULT_NEON_URL;
};

const connectionString = getConnectionString();
console.log('Initializing Neon PostgreSQL HTTP driver for serverless database connectivity...');

export const sql = neon(connectionString);
export const pool = {
  query: (text: string, params?: any[]) => sql.query(text, params)
};
export const db = drizzle(sql, { schema });




