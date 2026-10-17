-- 010 — Ofertas que nos mandan las empresas desde /empresas/publicar (17 oct 2026).
--
-- Antes se guardaban en la tabla "ofertas_empresas" de Supabase, que no existe:
-- a toda empresa que publicaba le salía "Error guardando la oferta". Ahora se
-- guardan aquí como pendientes y al equipo le llega un correo con los datos.
--
-- La ruta (app/api/empresas/publicar/route.ts) la crea si no existe; esto es
-- para que conste. Al borrar una cuenta se borran sus filas
-- (lib/cuenta/borrar-datos.ts, columna user_id).

CREATE TABLE IF NOT EXISTS oferta_empresa (
  id            BIGSERIAL PRIMARY KEY,
  user_id       UUID NOT NULL,
  empresa       TEXT NOT NULL,
  email_empresa TEXT NOT NULL,
  web_empresa   TEXT,
  titulo        TEXT NOT NULL,
  sector        TEXT,
  ciudad        TEXT NOT NULL,
  jornada       TEXT,
  salario       TEXT,
  descripcion   TEXT,
  requisitos    TEXT,
  estado        TEXT NOT NULL DEFAULT 'pendiente',
  creada_en     TIMESTAMPTZ NOT NULL DEFAULT now()
);
