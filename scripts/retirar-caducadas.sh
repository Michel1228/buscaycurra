#!/bin/bash
# Retira de la circulación las ofertas que ya han caducado.
#
# POR QUE HACE FALTA. La columna "expiresAt" existía y se rellenaba, pero NADIE
# la miraba: no había ningún trabajo que actuara sobre ella y solo 1 de las 33
# consultas que leen JobListing la tenía en cuenta. Resultado: las ofertas se
# acumulaban para siempre. Había 163.503 con más de tres meses enseñándose como
# activas.
#
# Y eso es justo lo que le criticamos a la competencia en nuestra propia tabla
# comparativa de la portada: "ofertas caducadas y empresas fantasma". No se
# puede vender eso y hacer lo mismo.
#
# POR QUE ASI Y NO TOCANDO LAS CONSULTAS. Las 33 consultas ya filtran por
# "isActive". Marcando la oferta como inactiva se arreglan todas de golpe, sin
# editar ni una. Menos superficie, menos riesgo.
#
# ES REVERSIBLE: no borra nada, solo marca. Para deshacerlo:
#   UPDATE "JobListing" SET "isActive"=true
#    WHERE "isActive"=false AND "expiresAt" <= now();
#
# Medido antes de la primera pasada: se retiraban 194.921 de 2.311.405 (8,4%),
# la más nueva con 60 días y 96 de media. Quedaban 2.116.484 vivas.
set -e
LOTE=${1:-20000}
TOTAL=0
echo "Retirando ofertas caducadas, en lotes de $LOTE..."
while true; do
  N=$(docker exec buscaycurra-db psql -U buscaycurra -d buscaycurra -t -A -c "
    WITH lote AS (
      SELECT id FROM \"JobListing\"
      WHERE \"isActive\" = true AND \"expiresAt\" <= now()
      LIMIT $LOTE
    )
    UPDATE \"JobListing\" j SET \"isActive\" = false
      FROM lote WHERE j.id = lote.id;
  " 2>&1 | grep -oE '[0-9]+' | tail -1)
  N=${N:-0}
  [ "$N" -eq 0 ] && break
  TOTAL=$((TOTAL + N))
  echo "  $TOTAL retiradas"
  sleep 1   # respiro entre lotes: el servidor va justo de CPU
done
echo "Total retiradas: $TOTAL"
docker exec buscaycurra-db psql -U buscaycurra -d buscaycurra -c "
  SELECT COUNT(*) AS ofertas_vivas FROM \"JobListing\" WHERE \"isActive\" = true;"
