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

# BORRAR LAS QUE LLEVAN MÁS DE 90 DÍAS CADUCADAS.
#
# Hasta el 30 sep 2026 aquí solo se desactivaban, nunca se borraban: había
# 2,49 millones inactivas (la mitad de la tabla) y el disco del VPS llegó al
# aviso del 80 % de Hostinger. Michel decidió borrar las de más de 90 días. Se
# respetan las que alguien tiene guardadas o en candidaturas (SavedJob tiene
# una clave que impide borrarlas, y Application se quedaría sin enlace).
BORRADAS=0
for i in $(seq 1 100); do
  N=$(docker exec buscaycurra-db psql -U buscaycurra -d buscaycurra -t -A -c \
    "WITH lote AS (
       SELECT id FROM \"JobListing\" j
       WHERE NOT \"isActive\" AND \"scrapedAt\" < now() - interval '90 days'
         AND NOT EXISTS (SELECT 1 FROM \"SavedJob\" s WHERE s.\"jobId\" = j.id)
         AND NOT EXISTS (SELECT 1 FROM \"Application\" a WHERE a.\"jobId\" = j.id)
         AND NOT EXISTS (SELECT 1 FROM saved_jobs g WHERE g.job_id::text = j.id)
       LIMIT 20000
     )
     DELETE FROM \"JobListing\" j USING lote WHERE j.id = lote.id;" 2>/dev/null | grep -oE '[0-9]+' | tail -1)
  N=${N:-0}
  BORRADAS=$((BORRADAS+N))
  [ "$N" -eq 0 ] && break
  sleep 2
done
echo "Borradas (caducadas hace +90 días): $BORRADAS"
docker exec buscaycurra-db psql -U buscaycurra -d buscaycurra -t -c \
  "SELECT count(*) FILTER (WHERE \"isActive\") AS activas_ok FROM \"JobListing\";"
echo "=== FIN $(date -u +%H:%M) ==="