#!/usr/bin/env bash
# recordatorios-primer-dia.sh — Un aviso a quien se registro y se quedo a medias.
#
# POR QUE EXISTE
#
# A 23 sep 2026: 123 cuentas, 36 personas con el CV subido y solo SEIS que
# hubieran mandado un CV en 30 dias. Quien se registra y no termina no vuelve
# solo. Esto le recuerda UNA VEZ el paso que le falta (poner su ciudad, subir el
# CV o mandar el primero), con su enlace directo.
#
# LO QUE NO HACE, A PROPOSITO
#
#   - No insiste. Una sola vez por persona, nunca mas. La marca es una fila en
#     `notificaciones` con tipo recordatorio_primer_dia, y se escribe solo
#     cuando Resend confirma que el correo salio.
#   - No avisa a quien lleva menos de un dia registrado ni a quien lleva mas de
#     treinta: lo primero es pesado y lo segundo ya no es un recordatorio.
#   - No avisa a quien ya ha hecho los tres pasos.
#
# La logica esta en /api/onboarding/recordatorios. Para ver a quien se le
# mandaria sin mandar nada:
#   curl -s -X POST "http://localhost:8892/api/onboarding/recordatorios?probar=1" -H "x-admin-secret: $SECRET"

set -uo pipefail

ENV=/root/.openclaw/workspace/buscaycurra-unified/.env.local
SECRET=$(grep -E '^ADMIN_SECRET=' "$ENV" | head -1 | cut -d= -f2- | tr -d '\r\042\047')

RESPUESTA=$(curl -s --max-time 300 -X POST \
  "http://localhost:8892/api/onboarding/recordatorios" \
  -H "x-admin-secret: $SECRET")

echo "$(date -u '+%Y-%m-%d %H:%M UTC')  $RESPUESTA"
