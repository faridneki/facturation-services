import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool as PgPool } from 'pg';
import { Pool as NeonPool } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import path from 'path';
import * as schema from './schema';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const DEFAULT_NEON_URL = 'postgresql://neondb_owner:npg_USAVX1b4ueyr@ep-young-wildflower-agt8whdg-pooler.c-2.eu-central-1.aws.neon.tech/facturation_db?sslmode=require';

declare global {
  var _postgresPool: any | undefined;
}

export const createPool = () => {
  if (!global._postgresPool) {
    const rawConnectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING || DEFAULT_NEON_URL;

    // Clean connection string for node-postgres & neon compatibility (e.g. remove unsupported channel_binding)
    let cleanConnectionString = rawConnectionString
      .replace(/([?&])channel_binding=[^&]*&?/g, '$1')
      .replace(/\?$/, '')
      .replace(/&$/, '');

    const isNeon = cleanConnectionString.includes('neon.tech');
    const isLocalhost = cleanConnectionString.includes('localhost') || cleanConnectionString.includes('127.0.0.1');

    if (isNeon) {
      console.log('Connecting to database via Neon Serverless Pool...');
      global._postgresPool = new NeonPool({
        connectionString: cleanConnectionString,
      });
    } else {
      console.log('Connecting to database via standard PostgreSQL Pool...');
      global._postgresPool = new PgPool({
        connectionString: cleanConnectionString,
        ssl: isLocalhost ? false : { rejectUnauthorized: false },
        max: 10,
        connectionTimeoutMillis: 15000,
      });
    }

    global._postgresPool.on('error', (err: any) => {
      console.error('Unexpected error on idle SQL pool client:', err);
    });
  }
  return global._postgresPool;
};

const pool = createPool();
export { pool };
export const db = drizzle(pool, { schema });

