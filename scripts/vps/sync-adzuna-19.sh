#!/bin/bash
# sync-adzuna-19.sh — barrido de los 19 paises de Adzuna.
#
# Contexto: hay 12 claves de Adzuna (pool con rotacion en api-pool.ts) = 2.640
# peticiones/dia a 50 ofertas cada una. Antes solo se recorrian 6 paises y se
# usaba la mitad de la cuota. Adzuna cubre 19 paises con estas claves y suman
# ~12,3M de ofertas.
#
# El reparto es proporcional al volumen de cada mercado: no tiene sentido dar
# los mismos lotes a Nueva Zelanda (7k ofertas) que a EE.UU. (6M).
#
# Cada pais guarda su posicion en /root/.adzuna-19-state para CONTINUAR donde
# lo dejo: sin eso se reextraerian siempre los mismos combos.
#
# OJO: no lanzar deploy mientras corre (el contenedor se reinicia y las
# llamadas a localhost:8892 fallan en seco).
cd /root/.openclaw/workspace/buscaycurra-unified
SECRET=$(grep -E '^ADMIN_SECRET=' .env.local | cut -d= -f2-)
B="http://localhost:8892/api/jobs/sync-adzuna-global"
EST=/root/.adzuna-19-state
touch $EST

leer()    { local v=$(grep "^$1=" $EST 2>/dev/null | tail -1 | cut -d= -f2); echo "${v:-0}"; }
guardar() { sed -i "/^$1=/d" $EST 2>/dev/null; echo "$1=$2" >> $EST; }
num()     { local v=$(echo "$1" | grep -oP "\"$2\":\s*\K\d+" | head -1); echo "${v:-0}"; }

# pais:vueltas — proporcional al volumen de ofertas de cada mercado
PLAN="us:6 fr:4 de:4 br:4 uk:3 it:3 ca:2 in:2 au:2 nl:2 mx:2 pl:2 es:2 za:1 ch:1 be:1 at:1 sg:1 nz:1"

echo "=== ADZUNA 19 PAISES $(date -u +%Y-%m-%d\ %H:%M) ==="
TOTAL=0

for entrada in $PLAN; do
  pais="${entrada%%:*}"
  vueltas="${entrada##*:}"
  pos=$(leer "off_$pais")
  suma=0

  for i in $(seq 1 "$vueltas"); do
    r=$(curl -s --max-time 290 -X POST "$B" -H "x-sync-secret: ${SECRET}" \
        -H 'Content-Type: application/json' \
        -d "{\"country\":\"$pais\",\"batchSize\":15,\"offset\":$pos}" 2>/dev/null)
    ins=$(num "$r" inserted); suma=$((suma + ins))
    nxt=$(num "$r" nextOffset)
    # done=true o sin avance => se completo la vuelta: volver a empezar
    if echo "$r" | grep -q '"done":true' || [ "$nxt" -le "$pos" ]; then pos=0; break; fi
    pos=$nxt
  done

  guardar "off_$pais" "$pos"
  TOTAL=$((TOTAL + suma))
  printf "  %-3s +%-6s (siguiente: %s)  %s\n" "$pais" "$suma" "$pos" "$(date -u +%H:%M:%S)"
done

echo "=== TOTAL=$TOTAL  $(date -u +%H:%M:%S) ==="
docker exec buscaycurra-db psql -U buscaycurra -d buscaycurra -t -c "SELECT count(*) FILTER (WHERE \"isActive\" AND (\"expiresAt\">now() OR \"expiresAt\" IS NULL)) AS vivas FROM \"JobListing\";"
