#!/bin/bash
# limpiar-caducadas.sh — desactiva por LOTES las ofertas realmente caducadas.
# Seguro desde que el worker refresca expiresAt al re-escrapear: si sigue caducada
# es que hace >60 dias que no aparece en la fuente.
LOTE=50000
TOTAL=0
echo "=== LIMPIEZA CADUCADAS $(date -u +%Y-%m-%d\ %H:%M) ==="
for i in $(seq 1 60); do
  N=$(docker exec buscaycurra-db psql -U buscaycurra -d buscaycurra -t -A -c \
    "WITH lote AS (
       SELECT id FROM \"JobListing\"
       WHERE \"isActive\" AND \"expiresAt\" < now()
       LIMIT $LOTE
     )
     UPDATE \"JobListing\" j SET \"isActive\" = false
     FROM lote WHERE j.id = lote.id;" 2>/dev/null | grep -oE '[0-9]+' | tail -1)
  N=${N:-0}
  TOTAL=$((TOTAL+N))
  [ "$N" -eq 0 ] && break
  sleep 2
done
echo "Desactivadas: $TOTAL"
docker exec buscaycurra-db psql -U buscaycurra -d buscaycurra -t -c \
  "SELECT count(*) FILTER (WHERE \"isActive\") AS activas_ok FROM \"JobListing\";"
echo "=== FIN $(date -u +%H:%M) ==="