-- 006_empresas_coordenadas.sql — Dónde está cada empresa de la caché.
--
-- POR QUÉ: la caché de empresas se busca por el TEXTO de la ciudad que escribió
-- el usuario ("tudela", "fustinana"), y al guardar, la ciudad de cada ficha se
-- sobrescribe con la última búsqueda. El 22 sep 2026 se vio el efecto: buscar
-- ETTs en Fustiñana devuelve (con razón) las de Tudela, y eso reetiquetaba esas
-- ETTs como de Fustiñana; la caché de Tudela pasó de 14 fichas a 5, así que la
-- siguiente búsqueda de Tudela volvía a pagarle a Google por lo que ya teníamos.
--
-- Con las coordenadas la caché deja de depender de cómo se escriba el pueblo:
-- se buscan las empresas que están A MENOS DE X KILÓMETROS del sitio, que es lo
-- que de verdad importa para mandar un CV.
--
-- Es aditiva: las 6.445 fichas que ya hay siguen funcionando por nombre y por
-- ciudad mientras no tengan coordenadas.

ALTER TABLE empresas ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS lon DOUBLE PRECISION;

-- Recorte rápido por caja antes de calcular distancias: sin él, cada búsqueda
-- por cercanía recorrería la tabla entera.
CREATE INDEX IF NOT EXISTS idx_empresas_coords
  ON empresas (lat, lon)
  WHERE lat IS NOT NULL AND lon IS NOT NULL;
