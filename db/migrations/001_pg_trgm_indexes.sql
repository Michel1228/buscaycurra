-- Migration: Add pg_trgm GIN indexes for full-text search performance
-- Date: 2026-06-30
-- Run: psql -d buscaycurra -f db/migrations/001_pg_trgm_indexes.sql

-- Enable pg_trgm extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- GIN index on LOWER(title) for case-insensitive trigram matching
-- This enables fast ILIKE '%keyword%' queries using trigram similarity
CREATE INDEX IF NOT EXISTS idx_joblisting_title_trgm
  ON "JobListing" USING gin (LOWER(title) gin_trgm_ops);

-- GIN index on LOWER(description) 
CREATE INDEX IF NOT EXISTS idx_joblisting_description_trgm
  ON "JobListing" USING gin (LOWER(description) gin_trgm_ops);

-- GIN index on LOWER(company)
CREATE INDEX IF NOT EXISTS idx_joblisting_company_trgm
  ON "JobListing" USING gin (LOWER(company) gin_trgm_ops);

-- GIN index on LOWER(city) for location searches
CREATE INDEX IF NOT EXISTS idx_joblisting_city_trgm
  ON "JobListing" USING gin (LOWER(city) gin_trgm_ops);

-- GIN index on LOWER(province) for location searches
CREATE INDEX IF NOT EXISTS idx_joblisting_province_trgm
  ON "JobListing" USING gin (LOWER(province) gin_trgm_ops);

-- Composite GIN index on country for faster country filtering
CREATE INDEX IF NOT EXISTS idx_joblisting_country_trgm
  ON "JobListing" USING gin (LOWER(country) gin_trgm_ops);
