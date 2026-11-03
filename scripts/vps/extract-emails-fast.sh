#!/bin/bash
MAX=${1:-300}
echo "[extract-emails-v17.3] $(date) - MAX=$MAX"

# NO REPETIR LAS MISMAS EMPRESAS CADA DOS HORAS.
#
# Se elegian siempre las 300 empresas con mas ofertas sin correo. Como esas
# casi nunca lo tienen (Superprof, "US Gov Careers", Randstad Italia...), al
# no encontrarlo seguian siendo las primeras y volvian a salir en la siguiente
# pasada. Comprobado el 30 sep 2026: las mismas 300 cada 2 horas durante
# semanas, unos 6 minutos de CPU y red por pasada en un servidor que va justo,
# para 0-3 correos por pasada.
#
# Ahora cada empresa elegida se anota en email_busqueda_intentos en la misma
# consulta que la elige, y no vuelve a salir en 30 dias. Si se encuentra su
# correo, ya no sale nunca porque sus ofertas dejan de estar "sin correo".
docker exec buscaycurra-db psql -U buscaycurra -d buscaycurra -t -A -q -c "
  CREATE TABLE IF NOT EXISTS email_busqueda_intentos (
    company TEXT PRIMARY KEY,
    intentado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
" > /dev/null

echo "[extract-emails] Fetching companies..."
# v18 (3 nov 2026): por empresa Y país. La misma empresa se busca aparte en cada
# país, con los dominios de ese país, y su correo solo va a sus ofertas de allí:
# antes Amazon España recibía amazon.de. En email_busqueda_intentos la clave pasa
# a ser "empresa|pais"; las anotaciones viejas (solo empresa) caducan solas.
# El worker necesita /root/correo-oferta.cjs: lib/job-search/correo-oferta.ts
# compilado con esbuild, la misma comprobación que hace la app.
docker exec buscaycurra-db psql -U buscaycurra -d buscaycurra -t -A -q -c "
  WITH elegidas AS (
    SELECT company, country, jobs FROM (
      SELECT company, lower(country) AS country, COUNT(*) as jobs
      FROM \"JobListing\"
      WHERE company IS NOT NULL AND company != ''
        AND lower(trim(company)) NOT IN ('empresa europea','empresa','company','ver en oferta','confidencial','confidential','n/a','na','sin especificar','no especificado','private','empresa confidencial','recruiter','recruitment','agency','ett','-','.')
        AND (\"contactEmail\" IS NULL OR \"contactEmail\" = '')
        AND \"isActive\" = true
        AND country IS NOT NULL AND country != ''
      GROUP BY company, lower(country)
    ) g
    WHERE NOT EXISTS (
      SELECT 1 FROM email_busqueda_intentos i
      WHERE i.company = g.company || '|' || g.country AND i.intentado_en > NOW() - INTERVAL '30 days'
    )
    ORDER BY jobs DESC LIMIT $MAX
  ),
  anotadas AS (
    INSERT INTO email_busqueda_intentos (company)
    SELECT company || '|' || country FROM elegidas
    ON CONFLICT (company) DO UPDATE SET intentado_en = NOW()
  )
  SELECT json_agg(row_to_json(elegidas)) FROM elegidas
" > /root/.companies.json

node /root/extract-emails-worker.js 2>&1
