#!/usr/bin/env bash
# sync-adzuna-barrido.sh — Barrido diario del catalogo de Adzuna (ultimas 24 h).
#
# POR QUE VIVE EN EL CRONTAB DEL VPS Y NO EN GITHUB ACTIONS
#
# Se escribio primero como .github/workflows/sync-adzuna-barrido.yml y no llego
# a ejecutarse nunca: GitHub solo lanza los calendarios programados desde la
# rama por defecto (main), y el 5 de julio de 2026 se desactivaron alli a
# proposito ("VPS ya tiene crons locales"). Todas las tareas programadas de
# BuscayCurra viven en el crontab de root del VPS; ver scripts/vps/crontab.txt.
#
# POR QUE ESTE Y NO sync-adzuna-19.sh / sync-adzuna-loop.sh
#
# Esos recorren combinaciones de palabra clave por ciudad y de cada una piden
# solo la pagina 1, asi que cada pasada vuelve a bajarse lo mismo. Este pagina
# el catalogo sin palabras clave. Medido contra produccion el 5 sep 2026:
#
#   metodo              peticiones   ofertas nuevas   por peticion
#   palabra x ciudad        2.088           16.000            7,7
#   barrido paginado           35            1.366           39,0
#
# `dias=1` pide lo publicado en las ultimas 24 h: lanzarlo mas de una vez al dia
# solo volveria a bajarse las mismas paginas.
#
# NO estan Brasil, Mexico, India ni Sudafrica aunque Adzuna los cubra: no son
# ninguno de los 26 paises de la aplicacion y sus ofertas no las ve nadie.

set -uo pipefail

ENV=/root/.openclaw/workspace/buscaycurra-unified/.env.local
SECRET=$(grep -E '^ADMIN_SECRET=' "$ENV" | head -1 | cut -d= -f2- | tr -d '\r\042\047')
BASE="http://localhost:8892/api/jobs/sync-adzuna-barrido"

# pais:paginas maximas. Tope ajustado a lo que publica cada pais al dia: Espana
# publica ~3.900 ofertas diarias = 78 paginas, se dejan 120 de margen.
# Como primer argumento se puede pasar otro plan, para probar sin gastar la
# cuota del dia:   bash /root/sync-adzuna-barrido.sh "es:2"
PLAN=${1:-"es:120 de:100 fr:100 uk:100 it:60 nl:60 ch:60 be:60 at:60 us:40 ca:40 au:40 nz:40 pl:40 sg:40"}

if [ -z "$SECRET" ]; then
  echo "$(date -u '+%F %T') ERROR: no hay ADMIN_SECRET en $ENV"
  exit 1
fi

echo "=== BARRIDO ADZUNA $(date -u '+%F %H:%M') UTC ==="
TOTAL=0
for entrada in $PLAN; do
  pais=${entrada%%:*}
  tope=${entrada##*:}
  desde=1; nuevas=0; traidas=0

  # De 60 en 60 paginas (el tope por llamada) hasta agotar lo del dia o llegar
  # al limite del pais. "agotado" llega a true cuando una pagina vuelve vacia,
  # que es tanto el final como el momento en que se acaba la cuota de Adzuna:
  # en los dos casos toca parar.
  while [ "$desde" -le "$tope" ]; do
    lote=60
    resta=$((tope - desde + 1))
    if [ "$resta" -lt "$lote" ]; then lote=$resta; fi

    r=$(curl -s --max-time 290 -X POST "$BASE" \
          -H "Content-Type: application/json" \
          -H "x-sync-secret: $SECRET" \
          -d "{\"country\":\"$pais\",\"paginas\":$lote,\"dias\":1,\"desde\":$desde}")

    n=$(echo "$r" | grep -oE '"insertadas":[0-9]+' | cut -d: -f2)
    t=$(echo "$r" | grep -oE '"traidas":[0-9]+' | cut -d: -f2)
    a=$(echo "$r" | grep -oE '"agotado":(true|false)' | cut -d: -f2)

    # Respuesta ilegible (caida, 502, tiempo agotado): parar en vez de seguir
    # pidiendo a ciegas.
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
  # Cero en un pais entero no es "un dia tranquilo": es que algo dejo de
  # funcionar. Una fuente estuvo 74 dias devolviendo cero sin que nada avisara.
  # Esto solo queda en el log; quien avisa de verdad es el centinela, que mira
  # cada dia si las fuentes de Adzuna siguen insertando.
  if [ "$traidas" -eq 0 ]; then
    echo "  AVISO $pais: el barrido no trajo NINGUNA oferta (cuota de Adzuna o clave)"
  fi
  TOTAL=$((TOTAL + nuevas))
done
echo "=== TOTAL=$TOTAL  $(date -u '+%H:%M:%S') ==="
