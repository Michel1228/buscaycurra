-- ═══════════════════════════════════════════════════════════════════════════
-- Migración 002: Añadir columnas del sistema de evolución del usuario
-- ═══════════════════════════════════════════════════════════════════════════
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- Columna que registra si el usuario ha encontrado trabajo
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trabajo_encontrado BOOLEAN DEFAULT false;

-- Columna que registra cuándo encontró trabajo
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trabajo_encontrado_at TIMESTAMP;

-- Columna que almacena el id de especie revelada al encontrar trabajo (1-50)
-- NULL hasta que el usuario pulse "He encontrado trabajo"
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS especie_id INTEGER;
