#!/bin/sh
start_worker() {
  while true; do
    echo "[docker-start] Iniciando worker de CV..."
    ./node_modules/.bin/tsx scripts/worker-entry.ts 2>&1 || true
    echo "[docker-start] Worker detenido. Reiniciando en 10s..."
    sleep 10
  done
}

start_worker &

# Que escuche en TODAS las direcciones del contenedor. Docker pone en HOSTNAME
# el identificador del contenedor y Next.js escuchaba solo en 172.20.0.2: las
# llamadas internas a 127.0.0.1 o localhost fallaban con "fetch failed", y
# enviar el CV desde Guzzi no funcionó nunca en producción (4 oct 2026).
export HOSTNAME=0.0.0.0
exec node server.js
