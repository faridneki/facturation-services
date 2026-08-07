import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import * as schema from './schema';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const DEFAULT_NEON_URL = 'postgresql://neondb_owner:npg_USAVX1b4ueyr@ep-young-wildflower-agt8whdg-pooler.c-2.eu-central-1.aws.neon.tech/facturation_db?sslmode=require';

declare global {
  var _postgresPool: Pool | undefined;
}

export const createPool = () => {
  if (!global._postgresPool) {
    const envUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING;
    const isValidEnvUrl = envUrl && envUrl.includes('@') && !envUrl.includes('user:password');
    const rawConnectionString = isValidEnvUrl ? envUrl! : DEFAULT_NEON_URL;

    // Clean connection string for node-postgres compatibility
    let cleanConnectionString = rawConnectionString
      .replace(/([?&])channel_binding=[^&]*&?/g, '$1')
      .replace(/\?$/, '')
      .replace(/&$/, '');

    const isLocalhost = cleanConnectionString.includes('localhost') || cleanConnectionString.includes('127.0.0.1');

    console.log('Connecting to PostgreSQL database via PgPool...');
    global._postgresPool = new Pool({
      connectionString: cleanConnectionString,
      ssl: isLocalhost ? false : { rejectUnauthorized: false },
      max: 10,
      connectionTimeoutMillis: 15000,
    });

    global._postgresPool.on('error', (err: any) => {
      console.error('Unexpected error on idle SQL pool client:', err);
    });
  }
  return global._postgresPool;
};

const pool = createPool();
export { pool };
export const db = drizzle(pool, { schema });


