#!/bin/bash
# Prioridad baja: este mantenimiento NO debe competir con las peticiones de
# usuarios. El servidor solo tiene 2 nucleos y llego a carga 8.5 por esto.
renice -n 19 -p $$ >/dev/null 2>&1
# Ciclo completo de emails de las ofertas. El orden importa:
#   1. RECOGER  los que la empresa escribe en el texto de la oferta (los mejores)
#   2. LIMPIAR  placeholders, dominios mal repartidos y empresas sin nombre real
#   3. PROPAGAR el email bueno al resto de ofertas de esa misma empresa
# Limpiar ANTES de propagar evita repartir un email equivocado por toda la tabla.
cd /root
log() { echo "$(date '+%F %T') $*"; }

docker cp /root/extraer-desc.sql       buscaycurra-db:/extraer.sql >/dev/null 2>&1
docker cp /root/limpiar-emails.sql     buscaycurra-db:/limp.sql    >/dev/null 2>&1
docker cp /root/limpiar-genericos.sql  buscaycurra-db:/gen.sql     >/dev/null 2>&1
docker cp /root/propagar-emails.sql    buscaycurra-db:/prop.sql    >/dev/null 2>&1

N1=$(docker exec buscaycurra-db psql -U buscaycurra -d buscaycurra -f /extraer.sql 2>&1 | grep -oP 'UPDATE \K[0-9]+' | tail -1)
log "recogidos del texto de la oferta: ${N1:-0}"

N2=$(docker exec buscaycurra-db psql -U buscaycurra -d buscaycurra -f /limp.sql 2>&1 | grep -oP 'UPDATE \K[0-9]+' | paste -sd+ | bc 2>/dev/null)
N3=$(docker exec buscaycurra-db psql -U buscaycurra -d buscaycurra -f /gen.sql 2>&1 | grep -oP 'UPDATE \K[0-9]+' | tail -1)
log "descartados por no fiables: ${N2:-0} + ${N3:-0} de empresas sin nombre real"

TOTAL=0
for i in $(seq 1 12); do
  N=$(docker exec buscaycurra-db psql -U buscaycurra -d buscaycurra -f /prop.sql 2>&1 | grep -oP 'UPDATE \K[0-9]+' | tail -1)
  N=${N:-0}; TOTAL=$((TOTAL+N)); [ "$N" -lt 100 ] && break
done
log "propagados a otras ofertas de la misma empresa: $TOTAL"

COB=$(docker exec buscaycurra-db psql -U buscaycurra -d buscaycurra -tAc "SELECT round(100.0*count(*) FILTER (WHERE \"contactEmail\" <> '')/NULLIF(count(*),0),1) FROM \"JobListing\" WHERE \"isActive\"=true AND (\"expiresAt\" > now() OR \"expiresAt\" IS NULL)")
log "cobertura de email: ${COB}%"
