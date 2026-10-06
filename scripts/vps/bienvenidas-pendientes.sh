#!/usr/bin/env bash
# bienvenidas-pendientes.sh — Completa las bienvenidas que el navegador no pidió.
#
# Cada 10 minutos. La lógica está en /api/auth/bienvenidas-pendientes: cuentas
# confirmadas de la última semana sin bienvenida (ficha, ciudad, alerta, correo).
# Una sola vez por cuenta. Para ver cuántas hay sin hacer nada:
#   curl -s -X POST "http://localhost:8892/api/auth/bienvenidas-pendientes?probar=1" -H "x-sync-secret: $SECRET"

set -uo pipefail

ENV=/root/.openclaw/workspace/buscaycurra-unified/.env.local
SECRET=$(grep -E '^ADMIN_SECRET=' "$ENV" | head -1 | cut -d= -f2- | tr -d '\r\042\047')

RESPUESTA=$(curl -s --max-time 110 -X POST \
  "http://localhost:8892/api/auth/bienvenidas-pendientes" \
  -H "x-sync-secret: $SECRET")

# Solo se apunta cuando hay algo que contar, para no llenar el registro.
case "$RESPUESTA" in
  *'"pendientes":0'*) ;;
  *) echo "$(date -u '+%Y-%m-%d %H:%M UTC')  $RESPUESTA" ;;
esac
