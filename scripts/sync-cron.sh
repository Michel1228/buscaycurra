#!/bin/bash
# Sync de ofertas — llama al endpoint de sincronización con cada combinación prioritaria
# Se ejecuta con cron: 0 3 * * * /root/sync-cron.sh >> /var/log/sync-cron.log 2>&1

ADMIN_SECRET="${BUSCAYCURRA_ADMIN_SECRET:-buscaycurra_sync_2024}"
BASE_URL="http://localhost:8892"

SECTORES=("HOSTELERIA" "TRANSPORTE" "INDUSTRIA" "COMERCIO" "CONSTRUCCION" "OFICINA")
KEYWORDS=("camarero" "conductor" "operario" "dependiente" "albanil" "administrativo" "cocinero" "repartidor" "soldador" "electricista")
CIUDADES=("Madrid" "Barcelona" "Valencia" "Sevilla" "Zaragoza" "Malaga" "Murcia" "Bilbao" "Alicante" "Cordoba" "Valladolid" "Vigo")
SOURCES=("careerjet" "adzuna" "jooble")

echo "[$(date)] Iniciando sync de ofertas..."
count=0

for sector in "${SECTORES[@]}"; do
  for keyword in "${KEYWORDS[@]}"; do
    for city in "${CIUDADES[@]}"; do
      for source in "${SOURCES[@]}"; do
        curl -s -X POST "${BASE_URL}/api/jobs/sync-batch" \
          -H "Content-Type: application/json" \
          -H "x-sync-secret: ${ADMIN_SECRET}" \
          -d "{\"source\":\"${source}\",\"sector\":\"${sector}\",\"keyword\":\"${keyword}\",\"city\":\"${city}\"}" \
          > /dev/null
        count=$((count + 1))
        sleep 0.5
      done
    done
  done
done

echo "[$(date)] Sync completado. ${count} batches procesados."
