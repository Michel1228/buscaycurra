-- 008_ofertas_visibles_por_defecto.sql
-- Ninguna oferta puede volver a entrar invisible.
--
-- El 30 sep 2026 había 290.707 ofertas con "isActive" vacío (NULL): ni activas
-- ni inactivas. El buscador solo enseña isActive = true, así que no las veía
-- nadie, y la limpieza de caducadas (que mira isActive y scrapedAt) tampoco
-- las tocaba. Venían de lib/job-search/european-apis.ts, que insertaba sin esas
-- columnas (arreglado en el mismo commit), y de una versión antigua de la
-- sincronización de Arbeitsagentur:
--   JobTech_SE      70.732 (20.195 del último mes)
--   NFJ_PL           9.972 ( 2.333 del último mes)
--   Arbeitsagentur 210.003 (junio-agosto; la versión actual no las ha vuelto a ver)

ALTER TABLE "JobListing" ALTER COLUMN "isActive" SET DEFAULT true;
ALTER TABLE "JobListing" ALTER COLUMN "scrapedAt" SET DEFAULT now();

-- Suecia y Polonia: visibles si no ha pasado su caducidad (createdAt + 60 días,
-- migración 004), con su país y su fecha de alta como "visto por última vez".
UPDATE "JobListing"
SET "isActive"  = ("expiresAt" > now()),
    "scrapedAt" = COALESCE("scrapedAt", "createdAt"),
    country     = COALESCE(country, CASE "sourceName" WHEN 'JobTech_SE' THEN 'se' ELSE 'pl' END)
WHERE "isActive" IS NULL AND "sourceName" IN ('JobTech_SE', 'NFJ_PL', 'JJIT_PL');

-- Arbeitsagentur antiguas: caducadas. Activarlas podría duplicar las que la
-- sincronización actual ya tiene con otro id; la limpieza diaria las borra a
-- los 90 días de su alta.
UPDATE "JobListing"
SET "isActive"  = false,
    "scrapedAt" = COALESCE("scrapedAt", "createdAt"),
    country     = COALESCE(country, 'de')
WHERE "isActive" IS NULL AND "sourceName" = 'Arbeitsagentur';
