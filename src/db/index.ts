import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import * as schema from './schema';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

declare global {
  var _postgresPool: Pool | undefined;
}

export const createPool = () => {
  if (!global._postgresPool) {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING;

    if (connectionString) {
      const isLocalhost = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
      global._postgresPool = new Pool({
        connectionString,
        ssl: isLocalhost ? false : { rejectUnauthorized: false },
        max: 10,
        connectionTimeoutMillis: 15000,
      });
    } else {
      const host = process.env.SQL_HOST || 'localhost';
      const port = Number(process.env.SQL_PORT || 5432);
      const user = process.env.SQL_USER || process.env.SQL_ADMIN_USER || 'postgres';
      const password = String(process.env.SQL_PASSWORD || process.env.SQL_ADMIN_PASSWORD || '');
      const database = process.env.SQL_DB_NAME || 'facturation_db';

      if (!process.env.SQL_PASSWORD && !process.env.DATABASE_URL) {
        console.warn('⚠️ ATTENTION : SQL_PASSWORD ou DATABASE_URL n\'est pas renseigné dans le fichier .env de votre projet local.');
      }

      const useSsl = host !== 'localhost' && host !== '127.0.0.1';

      global._postgresPool = new Pool({
        host,
        port,
        user,
        password,
        database,
        ssl: useSsl ? { rejectUnauthorized: false } : false,
        max: 10,
        connectionTimeoutMillis: 15000,
      });
    }

    global._postgresPool.on('error', (err) => {
      console.error('Unexpected error on idle SQL pool client:', err);
    });
  }
  return global._postgresPool;
};

const pool = createPool();
export const db = drizzle(pool, { schema });
