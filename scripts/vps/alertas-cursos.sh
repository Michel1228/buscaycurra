#!/usr/bin/env bash
# alertas-cursos.sh — Avisa a quien encendió el aviso de un curso de que hay
# ofertas que lo piden (y cuántas plazas gratis hay para sacarlo).
#
# Una vez al día, a las 09:00 UTC (11:00 en España). La lógica está en
# /api/cursos/alertas: como mucho un aviso cada 14 días por curso y persona,
# 40 por pasada, y respetando el presupuesto diario de correo. Para contar sin
# enviar nada:
#   curl -s -X POST "http://localhost:8892/api/cursos/alertas?simular=1" -H "x-sync-secret: $SECRET"

set -uo pipefail

ENV=/root/.openclaw/workspace/buscaycurra-unified/.env.local
SECRET=$(grep -E '^ADMIN_SECRET=' "$ENV" | head -1 | cut -d= -f2- | tr -d '\r\042\047')

RESPUESTA=$(curl -s --max-time 290 -w ' HTTP %{http_code}' -X POST \
  "http://localhost:8892/api/cursos/alertas" \
  -H "x-sync-secret: $SECRET")

echo "$(date -u '+%Y-%m-%d %H:%M UTC')  $RESPUESTA"
