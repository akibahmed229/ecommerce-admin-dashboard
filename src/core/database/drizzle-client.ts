import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const pool: Pool = new Pool({
    connectionString: process.env.DATABASE_URL!
})

export const db: NodePgDatabase = drizzle({ client: pool });

