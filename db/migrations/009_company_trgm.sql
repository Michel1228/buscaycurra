-- Migration: índice de trigramas sobre "company" (el que la 001 ya preveía)
-- Date: 2026-10-16
-- Run: psql -d buscaycurra -f db/migrations/009_company_trgm.sql
--
-- POR QUÉ. La 001 lo creaba sobre LOWER(company), pero en producción no estaba
-- (se perdió al reconstruir la tabla) y, además, las consultas usan
-- `company ILIKE ...` sobre la columna tal cual, que no aprovecha un índice
-- sobre LOWER(company). Sin él, "ofertas de la marca" de la cámara
-- (lib/camara/ficha-marca.ts) recorría 3,6 millones de filas, se pasaba del
-- tiempo máximo de 15 s y contestaba "No tenemos ofertas suyas" con Coca-Cola
-- o John Deere (16 oct 2026).
--
-- CONCURRENTLY: se crea sin bloquear las escrituras de la tabla.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_joblisting_company_trgm
  ON "JobListing" USING gin (company gin_trgm_ops);
