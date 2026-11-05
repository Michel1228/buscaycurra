#!/usr/bin/env bash
# sync-careerjet-barrido.sh — Barrido diario de Careerjet para Latinoamérica.
#
# Adzuna no cubre Colombia, Perú, Chile ni Argentina. Careerjet sí, y deja
# paginar su catálogo por fecha sin palabras clave (medido el 5 nov 2026: la
# página 100 sigue respondiendo). Así que cada noche se piden las páginas más
# nuevas de cada país, igual que hace sync-adzuna-barrido.sh con Adzuna.
#
# 20 páginas de 99 = unas 2.000 ofertas por país y noche, lo mismo que entra de
# México y Brasil por Adzuna. Más no compensa: la base vive en un servidor de
# dos núcleos y cada oferta dura 60 días si no se vuelve a ver.
#
# Para la primera carga, o para probar, se pasa otro plan:
#   bash /root/sync-careerjet-barrido.sh "co:100"
# Los países nuevos se añaden también en CAREERJET_BARRIDO
# (lib/job-search/sync-worker.ts): si no, la ruta los rechaza.

set -uo pipefail

ENV=/root/.openclaw/workspace/buscaycurra-unified/.env.local
SECRET=$(grep -E '^ADMIN_SECRET=' "$ENV" | head -1 | cut -d= -f2- | tr -d '\r\042\047')
BASE="http://localhost:8892/api/jobs/sync-careerjet-barrido"
PLAN=${1:-"co:20 pe:20 cl:20 ar:20"}

if [ -z "$SECRET" ]; then
  echo "$(date -u '+%F %T') ERROR: no hay ADMIN_SECRET en $ENV"
  exit 1
fi

echo "=== BARRIDO CAREERJET $(date -u '+%F %H:%M') UTC ==="
TOTAL=0
for entrada in $PLAN; do
  pais=${entrada%%:*}
  tope=${entrada##*:}
  desde=1 nuevas=0 traidas=0 motivo=""
  # De 40 en 40 páginas, que es el tope de la ruta por llamada.
  while [ "$desde" -le "$tope" ]; do
    lote=40
    resta=$((tope - desde + 1))
    if [ "$resta" -lt "$lote" ]; then lote=$resta; fi
    r=$(curl -s --max-time 295 -X POST "$BASE" -H "Content-Type: application/json" -H "x-sync-secret: $SECRET" \
      -d "{\"country\":\"$pais\",\"paginas\":$lote,\"desde\":$desde}")
    n=$(echo "$r" | grep -oE '"insertadas":[0-9]+' | cut -d: -f2)
    t=$(echo "$r" | grep -oE '"traidas":[0-9]+' | cut -d: -f2)
    a=$(echo "$r" | grep -oE '"agotado":(true|false)' | cut -d: -f2)
    m=$(echo "$r" | grep -oE '"motivoFallo":"[^"]*"' | cut -d'"' -f4)
    if [ -n "$m" ]; then motivo="$m"; fi
    if [ -z "$n" ]; then
      echo "  $pais desde $desde: respuesta inesperada, se corta: $(echo "$r" | head -c 160)"
      break
    fi
    nuevas=$((nuevas + n))
    traidas=$((traidas + ${t:-0}))
    if [ "$a" = "true" ]; then break; fi
    desde=$((desde + lote))
    sleep 2
  done
  echo "  $pais: $nuevas nuevas de $traidas traidas"
  # Cero en un país entero no es un día tranquilo: es que algo dejó de funcionar.
  if [ "$traidas" -eq 0 ]; then
    echo "  AVISO $pais: el barrido no trajo NINGUNA oferta. Motivo: ${motivo:-Careerjet no dio ninguno}"
  fi
  TOTAL=$((TOTAL + nuevas))
done
echo "=== TOTAL=$TOTAL  $(date -u '+%H:%M:%S') ==="
