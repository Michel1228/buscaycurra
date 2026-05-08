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

exec node server.js
