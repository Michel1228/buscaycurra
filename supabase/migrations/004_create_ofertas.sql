-- Tabla de índice masivo de ofertas de empleo
CREATE TABLE IF NOT EXISTS ofertas (
  id           TEXT PRIMARY KEY,
  titulo       TEXT NOT NULL,
  empresa      TEXT DEFAULT '',
  ubicacion    TEXT DEFAULT '',
  provincia    TEXT DEFAULT '',
  comunidad    TEXT DEFAULT '',
  salario      TEXT DEFAULT '',
  descripcion  TEXT DEFAULT '',
  fuente       TEXT NOT NULL,
  url          TEXT DEFAULT '',
  email_empresa TEXT DEFAULT '',
  sector       TEXT DEFAULT '',
  keywords     TEXT[] DEFAULT '{}',
  fecha        TIMESTAMPTZ DEFAULT NOW(),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsqueda rápida por texto, ubicación y sector
CREATE INDEX IF NOT EXISTS idx_ofertas_titulo        ON ofertas USING gin(to_tsvector('spanish', titulo));
CREATE INDEX IF NOT EXISTS idx_ofertas_descripcion   ON ofertas USING gin(to_tsvector('spanish', descripcion));
CREATE INDEX IF NOT EXISTS idx_ofertas_provincia     ON ofertas(provincia);
CREATE INDEX IF NOT EXISTS idx_ofertas_sector        ON ofertas(sector);
CREATE INDEX IF NOT EXISTS idx_ofertas_keywords      ON ofertas USING gin(keywords);
CREATE INDEX IF NOT EXISTS idx_ofertas_fecha         ON ofertas(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_ofertas_fuente        ON ofertas(fuente);

-- Función que actualiza updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ofertas_updated_at
  BEFORE UPDATE ON ofertas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS: solo lectura pública, escritura solo service role
ALTER TABLE ofertas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura pública de ofertas"
  ON ofertas FOR SELECT
  USING (true);

CREATE POLICY "Solo service role puede insertar/actualizar"
  ON ofertas FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Solo service role puede actualizar ofertas"
  ON ofertas FOR UPDATE
  USING (true);

-- Funciones RPC para estadísticas del indexador
CREATE OR REPLACE FUNCTION count_by_fuente()
RETURNS TABLE(fuente TEXT, total BIGINT) AS $$
  SELECT fuente, COUNT(*) AS total FROM ofertas GROUP BY fuente ORDER BY total DESC;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION count_by_sector()
RETURNS TABLE(sector TEXT, total BIGINT) AS $$
  SELECT sector, COUNT(*) AS total FROM ofertas GROUP BY sector ORDER BY total DESC;
$$ LANGUAGE sql SECURITY DEFINER;
