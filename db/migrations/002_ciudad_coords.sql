-- 002_ciudad_coords.sql — Dónde está cada ciudad, para calcular desplazamientos.
--
-- Guzzi necesita saber a cuántos kilómetros está una ciudad de otra para poder
-- decirle a alguien si le compensa trabajar en el pueblo de al lado. Las
-- coordenadas vienen de OpenStreetMap, que es gratis pero pide como máximo una
-- consulta por segundo: sin esta tabla habría que esperar a Nominatim en mitad
-- de cada búsqueda, y con 727 ciudades españolas eso no se sostiene.
--
-- Se guardan TAMBIÉN las ciudades que OpenStreetMap no reconoce, con lat y lon
-- nulos. Así no se vuelve a preguntar una y otra vez por lo mismo.

CREATE TABLE IF NOT EXISTS ciudad_coords (
  ciudad   TEXT NOT NULL,
  pais     TEXT NOT NULL,
  lat      DOUBLE PRECISION,
  lon      DOUBLE PRECISION,
  buscada  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (ciudad, pais)
);

-- La búsqueda siempre llega en minúsculas desde el chat, y sin este índice
-- cada consulta recorría la tabla entera.
CREATE INDEX IF NOT EXISTS idx_ciudad_coords_lower
  ON ciudad_coords (LOWER(ciudad), pais);
