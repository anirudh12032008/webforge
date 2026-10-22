import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { env } from "@/env";
import * as schema from "./schema";

/**
 * Drizzle client over Neon's HTTP driver: one stateless fetch per query,
 * which suits serverless functions (no connection pool to exhaust).
 */
export const db = drizzle(neon(env.DATABASE_URL), { schema });
