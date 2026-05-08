#!/bin/sh
# Arranca el worker de BullMQ en segundo plano con reinicio automático
start_worker() {
  while true; do
    echo "[docker-start] Iniciando worker de CV..."
    node worker.js 2>&1 || true
    echo "[docker-start] Worker detenido. Reiniciando en 10s..."
    sleep 10
  done
}

start_worker &

# Arranca Next.js en primer plano (si muere, el contenedor se reinicia)
exec node server.js
