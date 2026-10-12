import { Client, neon } from "@neondatabase/serverless";
import type { ExtractTablesWithRelations } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import {
  drizzle as drizzleTransaction,
  type NeonTransaction,
} from "drizzle-orm/neon-serverless";

import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not set. Add it to .env.local (Neon connection string).",
  );
}

const sql = neon(process.env.DATABASE_URL);

export const db = drizzle({ client: sql, schema });

/** Interactive transactions need a connection scoped to this request. */
export async function withTransaction<T>(
  action: (
    tx: NeonTransaction<
      typeof schema,
      ExtractTablesWithRelations<typeof schema>
    >,
  ) => Promise<T>,
): Promise<T> {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    return await drizzleTransaction({ client, schema }).transaction(action);
  } finally {
    await client.end();
  }
}
