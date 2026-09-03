#!/bin/bash
# Rellena "expiresAt" en las ofertas que se insertaron sin fecha de caducidad.
#
# POR QUE EN LOTES. Son casi 300.000 filas y el servidor tiene el 85% de la CPU
# robada por el hipervisor. Un UPDATE de golpe se come el statement_timeout y se
# queda a medias, que es como ya reventaron dos scripts en este proyecto.
#
# La fecha se calcula desde scrapedAt + 60 dias, que es el mismo criterio que ya
# usa el sincronizador principal. Para las ofertas de hace mas de tres meses eso
# significa que quedan caducadas, y es lo correcto: ese puesto ya no existe.
#
# No desactiva nada. Solo pone la fecha. Desactivar es otro paso y se decide
# aparte.
set -e
LOTE=${1:-20000}
TOTAL=0
echo "Rellenando la fecha de caducidad en lotes de $LOTE..."
while true; do
  N=$(docker exec buscaycurra-db psql -U buscaycurra -d buscaycurra -t -A -c "
    WITH lote AS (
      SELECT id FROM \"JobListing\"
      WHERE \"expiresAt\" IS NULL
      LIMIT $LOTE
    )
    UPDATE \"JobListing\" j
       SET \"expiresAt\" = COALESCE(j.\"scrapedAt\", j.\"createdAt\", now()) + interval '60 days'
      FROM lote
     WHERE j.id = lote.id;
  " 2>&1 | grep -oE '[0-9]+' | tail -1)
  N=${N:-0}
  [ "$N" -eq 0 ] && break
  TOTAL=$((TOTAL + N))
  echo "  $TOTAL rellenadas"
  sleep 1   # respiro para el servidor entre lotes
done
echo "Total: $TOTAL"
docker exec buscaycurra-db psql -U buscaycurra -d buscaycurra -c "
  SELECT COUNT(*) AS siguen_sin_fecha FROM \"JobListing\" WHERE \"expiresAt\" IS NULL;"
