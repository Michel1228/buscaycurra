// @ts-nocheck
import { Pool } from "pg";

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    // Support DATABASE_URL as fallback when PGPORT isn't defined
    if (process.env.DATABASE_URL && !process.env.PGPORT) {
      pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 10,
        idleTimeoutMillis: 30000,
        // Sin esto, cerrar la pagina no cancela la consulta: sigue corriendo en
        // la base de datos aunque nadie espere la respuesta. Una busqueda lenta
        // (regex sin indice) dejo 6 consultas huerfanas quemando los dos nucleos
        // 5h24min y la carga del servidor a 14,31.
        statement_timeout: 15000,
      });
    } else {
      pool = new Pool({
        host: process.env.PGHOST || "buscaycurra-db",
        port: parseInt(process.env.PGPORT || "5432"),
        database: "buscaycurra",
        user: "buscaycurra",
        password: process.env.DATABASE_PASSWORD || process.env.VPS_DB_PASSWORD,
        max: 10,
        idleTimeoutMillis: 30000,
        statement_timeout: 15000,
      });
    }
  }
  return pool;
}
