-- Propaga el email entre ofertas de la MISMA empresa, POR LOTES.
-- Por lotes con SKIP LOCKED: en una sola sentencia chocaba con los syncs, que
-- escriben en esta tabla a todas horas.
--
-- IMPORTANTE: no se propagan los correos cuyo dominio ya aparece repartido
-- entre muchas empresas sin relacion. Sin este filtro, el mantenimiento se
-- mordia la cola: la propagacion extendia direcciones dudosas y la limpieza
-- las borraba en la pasada siguiente, una y otra vez.
WITH promiscuos AS (
  SELECT split_part("contactEmail",'@',2) AS dom
    FROM "JobListing"
   WHERE "isActive" = true AND "contactEmail" <> ''
   GROUP BY 1
  HAVING count(DISTINCT lower(company)) > 80
),
-- POR PAÍS (3 nov 2026): el correo de Amazon en Alemania (amazon.de) acababa en
-- las ofertas de Amazon en España. Ahora solo se reparte dentro del mismo país.
mejor_por_empresa AS (
  SELECT DISTINCT ON (lower(company), lower(country))
         lower(company) AS empresa, lower(country) AS pais, "contactEmail" AS email
    FROM "JobListing" j
   WHERE "contactEmail" IS NOT NULL AND "contactEmail" <> ''
     AND company IS NOT NULL AND company <> ''
     AND lower(trim(company)) NOT IN (
       'empresa europea','empresa','company','ver en oferta','confidencial',
       'confidential','n/a','na','sin especificar','no especificado','private',
       'empresa confidencial','recruiter','recruitment','agency','ett','-','.')
     AND NOT EXISTS (SELECT 1 FROM promiscuos p
                     WHERE p.dom = split_part(j."contactEmail",'@',2)
                       AND p.dom NOT IN ('gmail.com','hotmail.com','outlook.com','yahoo.com'))
   ORDER BY lower(company), lower(country),
            CASE "contactEmailConfianza" WHEN 'alta' THEN 0 WHEN 'media' THEN 1 ELSE 2 END,
            "scrapedAt" DESC
),
lote AS (
  SELECT j.id, m.email
    FROM "JobListing" j
    JOIN mejor_por_empresa m ON lower(j.company) = m.empresa AND lower(j.country) = m.pais
   WHERE j."isActive" = true
     AND (j."expiresAt" > now() OR j."expiresAt" IS NULL)
     AND (j."contactEmail" IS NULL OR j."contactEmail" = '')
   LIMIT 5000
   FOR UPDATE OF j SKIP LOCKED
)
UPDATE "JobListing" j
   SET "contactEmail" = l.email,
       "contactEmailConfianza" = COALESCE(j."contactEmailConfianza", 'media')
  FROM lote l
 WHERE j.id = l.id;
