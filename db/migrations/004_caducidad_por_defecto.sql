-- 004_caducidad_por_defecto.sql
--
-- EL PROBLEMA. De los 2,3 millones de ofertas marcadas como activas, 296.833 no
-- tienen fecha de caducidad, asi que NADA las va a retirar nunca. De esas,
-- 153.681 llevan mas de tres meses publicadas: puestos que a estas alturas estan
-- cubiertos casi con seguridad.
--
-- Y crece solo: de los diez extractores que escriben en JobListing, OCHO no
-- ponen "expiresAt" en su INSERT. Solo el sincronizador principal y el de
-- France Travail lo hacen. Arbeitsagentur, el mayor de todos, lleva 206.347
-- ofertas inmortales.
--
-- POR QUE UN DEFAULT Y NO TOCAR LOS OCHO EXTRACTORES. Cada uno tiene su propio
-- INSERT con columnas distintas; editarlos de uno en uno es la via de romper
-- alguno sin enterarse, que es exactamente como se metio el fallo del extractor
-- aleman (un INSERT al que le faltaba una columna dejaba las ofertas invisibles).
-- Con un DEFAULT en la columna, el que no la ponga recibe una caducidad
-- razonable, incluido cualquier extractor que se escriba manana.
--
-- Sesenta dias es lo que ya usa el sincronizador principal, asi que esto no
-- introduce un criterio nuevo: lo extiende a todos.
--
-- Es un cambio de metadatos: instantaneo y sin reescribir la tabla.

ALTER TABLE "JobListing"
  ALTER COLUMN "expiresAt" SET DEFAULT (now() + interval '60 days');
