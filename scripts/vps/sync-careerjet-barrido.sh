#!/usr/bin/env bash
# sync-careerjet-barrido.sh — Barrido diario de Careerjet para Latinoamérica.
#
# Adzuna no cubre Latinoamérica (salvo México y Brasil; y en México Careerjet
# publica siete veces más, así que México también va aquí). Careerjet sí, pero cada
# búsqueda da como mucho unas 1.000 ofertas distintas (medido el 5 nov 2026: a
# partir de la página 10 repite). Así que cada noche se piden las más nuevas
# del país y de cada ciudad grande, un lugar por llamada. La lista de lugares
# vive en CAREERJET_BARRIDO (lib/job-search/sync-worker.ts); la ruta dice
# cuántos hay en "totalLugares".
#
# Para probar con un solo país:   bash /root/sync-careerjet-barrido.sh "co"

set -uo pipefail

ENV=/root/.openclaw/workspace/buscaycurra-unified/.env.local
SECRET=$(grep -E '^ADMIN_SECRET=' "$ENV" | head -1 | cut -d= -f2- | tr -d '\r\042\047')
BASE="http://localhost:8892/api/jobs/sync-careerjet-barrido"
PLAN=${1:-"mx co pe cl ar ec gt cr ve pa uy sv hn ni do py bo br in za sk si mt cy"}

if [ -z "$SECRET" ]; then
  echo "$(date -u '+%F %T') ERROR: no hay ADMIN_SECRET en $ENV"
  exit 1
fi

echo "=== BARRIDO CAREERJET $(date -u '+%F %H:%M') UTC ==="
TOTAL=0
for pais in $PLAN; do
  i=0 total_lugares=1 nuevas=0 traidas=0 motivo=""
  while [ "$i" -lt "$total_lugares" ]; do
    r=$(curl -s --max-time 295 -X POST "$BASE" -H "Content-Type: application/json" -H "x-sync-secret: $SECRET" \
      -d "{\"country\":\"$pais\",\"lugar\":$i}")
    n=$(echo "$r" | grep -oE '"insertadas":[0-9]+' | cut -d: -f2)
    t=$(echo "$r" | grep -oE '"traidas":[0-9]+' | cut -d: -f2)
    tl=$(echo "$r" | grep -oE '"totalLugares":[0-9]+' | cut -d: -f2)
    m=$(echo "$r" | grep -oE '"motivoFallo":"[^"]*"' | cut -d'"' -f4)
    if [ -n "$m" ]; then motivo="$m"; fi
    if [ -z "$n" ] || [ -z "$tl" ]; then
      echo "  $pais lugar $i: respuesta inesperada, se corta: $(echo "$r" | head -c 160)"
      break
    fi
    total_lugares=$tl
    nuevas=$((nuevas + n))
    traidas=$((traidas + ${t:-0}))
    i=$((i + 1))
    sleep 2
  done
  echo "  $pais: $nuevas nuevas de $traidas traidas en $i lugares"
  # Cero en un país entero no es un día tranquilo: es que algo dejó de funcionar.
  if [ "$traidas" -eq 0 ]; then
    echo "  AVISO $pais: el barrido no trajo NINGUNA oferta. Motivo: ${motivo:-Careerjet no dio ninguno}"
  fi
  TOTAL=$((TOTAL + nuevas))
done
echo "=== TOTAL=$TOTAL  $(date -u '+%H:%M:%S') ==="
