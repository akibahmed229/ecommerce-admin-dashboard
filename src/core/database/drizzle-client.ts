import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "../config/env";

const pool: Pool = new Pool({
    connectionString: env.DATABASE_URL!,
    ssl: {
        ssl: env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    }
})

export const db: NodePgDatabase = drizzle({ client: pool, });

