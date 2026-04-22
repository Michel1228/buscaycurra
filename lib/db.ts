import { Pool } from "pg";

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      host: "buscaycurra-db",
      port: 5432,
      database: "buscaycurra",
      user: "buscaycurra",
      password: "ByCurra2026Secure!",
      max: 5,
      idleTimeoutMillis: 30000,
    });
  }
  return pool;
}
