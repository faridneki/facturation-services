import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import dotenv from 'dotenv';
import path from 'path';
import ws from 'ws';
import * as schema from './schema';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

neonConfig.webSocketConstructor = ws;

const DEFAULT_NEON_URL = 'postgresql://neondb_owner:npg_USAVX1b4ueyr@ep-young-wildflower-agt8whdg-pooler.c-2.eu-central-1.aws.neon.tech/facturation_db?sslmode=require';

declare global {
  var _postgresPool: Pool | undefined;
}

export const createPool = () => {
  if (!global._postgresPool) {
    const envUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING;
    const isValidEnvUrl = envUrl && envUrl.includes('@') && !envUrl.includes('user:password');
    const rawConnectionString = isValidEnvUrl ? envUrl! : DEFAULT_NEON_URL;

    console.log('Connecting to Neon PostgreSQL database via @neondatabase/serverless...');
    global._postgresPool = new Pool({
      connectionString: rawConnectionString,
    });

    global._postgresPool.on('error', (err: any) => {
      console.error('Unexpected error on idle Neon SQL pool client:', err);
    });
  }
  return global._postgresPool;
};

const pool = createPool();
export { pool };
export const db = drizzle(pool, { schema });



