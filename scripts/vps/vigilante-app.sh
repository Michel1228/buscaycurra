#!/usr/bin/env bash
# vigilante-app.sh — Que la web no pueda estar caída sin que nadie se entere.
#
# POR QUÉ EXISTE. El 8 oct 2026 el servidor se reinició solo (actualización del
# núcleo, 10:22 UTC) y el contenedor de la aplicación no volvió: no tenía
# política de reinicio. Siete horas de "Bad Gateway" hasta que Michel lo vio.
# El centinela no avisó porque vive DENTRO de la aplicación: si ella cae, él
# también. Esto corre en el servidor, fuera de la app.
#
# QUÉ HACE, cada 5 minutos:
#   - Si se está desplegando, no toca nada (la app está unos segundos parada a
#     propósito).
#   - Si la web responde 200: bien. Si venía de estar caída, avisa de que volvió.
#   - Si el contenedor no existe, lo crea con la última imagen, como el
#     despliegue. Si existe pero está parado, lo arranca.
#   - Si está en marcha pero no responde, NO lo reinicia a ciegas (puede estar
#     arrancando o con un pico de carga): solo avisa.
#   - Correo a ADMIN_EMAILS la primera vez que lo ve caído y cuando vuelve. No
#     repite el aviso cada 5 minutos.

set -uo pipefail

REPO=/root/.openclaw/workspace/buscaycurra-unified
ENV=$REPO/.env.local
leer() { grep -E "^$1=" "$ENV" | head -1 | cut -d= -f2- | tr -d '\r\042\047'; }
ESTADO=/root/.vigilante-app-estado
ahora() { date -u '+%Y-%m-%d %H:%M UTC'; }

# Solo el proceso del despliegue ("bash build-deploy.sh", lanzado tal cual o con
# ruta), no cualquier orden que mencione el nombre del fichero.
if pgrep -f "^bash (.*/)?build-deploy\.sh" > /dev/null; then exit 0; fi

web() { curl -s -o /dev/null -w '%{http_code}' --max-time 20 http://localhost:8892/; }

avisar() {  # $1 asunto, $2 texto
  RESEND_API_KEY=$(leer RESEND_API_KEY) DESTINO=$(leer ADMIN_EMAILS) ASUNTO="$1" TEXTO="$2" \
  python3 - <<'PY'
import json, os, urllib.request
clave = os.environ.get("RESEND_API_KEY", "")
destino = [d.strip() for d in os.environ.get("DESTINO", "").split(",") if d.strip()]
if not clave or not destino:
    print("  sin RESEND_API_KEY o ADMIN_EMAILS: aviso no enviado")
    raise SystemExit(0)
cuerpo = json.dumps({
    "from": "Vigilante BuscayCurra <noreply@buscaycurra.es>",
    "to": destino,
    "subject": os.environ["ASUNTO"],
    "text": os.environ["TEXTO"],
}).encode("utf-8")
# User-Agent propio: Cloudflare rechaza el de Python por defecto (ver centinela.sh).
req = urllib.request.Request("https://api.resend.com/emails", data=cuerpo, method="POST", headers={
    "Authorization": f"Bearer {clave}", "Content-Type": "application/json",
    "User-Agent": "buscaycurra-vigilante/1.0"})
try:
    with urllib.request.urlopen(req, timeout=30) as r:
        print(f"  aviso enviado (HTTP {r.status})")
except Exception as e:
    print(f"  el aviso no salió: {e}")
PY
}

CODIGO=$(web)
ANTES=$(cat "$ESTADO" 2>/dev/null || echo bien)

if [ "$CODIGO" = "200" ]; then
  if [ "$ANTES" != "bien" ]; then
    echo "$(ahora)  vuelve a responder (estaba: $ANTES)"
    avisar "BuscayCurra vuelve a funcionar" "La web vuelve a responder con normalidad ($(ahora)). Estaba caída desde: ${ANTES#caida:}."
  fi
  echo bien > "$ESTADO"
  exit 0
fi

ESTADO_CONTENEDOR=$(docker inspect -f '{{.State.Status}}' buscaycurra-nextjs 2>/dev/null || echo "no-existe")
ACCION="ninguna (el contenedor está en marcha pero no responde; no se reinicia a ciegas)"

if [ "$ESTADO_CONTENEDOR" = "no-existe" ]; then
  cd "$REPO" && docker run -d --name buscaycurra-nextjs \
    --restart unless-stopped \
    --network busca-y-curra_default \
    --env-file .env.local \
    -e API_URL=http://buscaycurra-api:3001 \
    -p 8892:3000 \
    buscaycurra:latest > /dev/null \
  && docker network connect easypanel-buscaycurra buscaycurra-nextjs \
  && ACCION="se ha creado de nuevo el contenedor con la última imagen"
elif [ "$ESTADO_CONTENEDOR" != "running" ]; then
  docker start buscaycurra-nextjs > /dev/null \
  && { docker network connect easypanel-buscaycurra buscaycurra-nextjs 2>/dev/null || true; } \
  && ACCION="se ha arrancado el contenedor, que estaba parado ($ESTADO_CONTENEDOR)"
fi

# Si se ha hecho algo, se le da tiempo a arrancar antes de volver a mirar.
case "$ACCION" in ninguna*) ;; *) sleep 40 ;; esac
CODIGO2=$(web)
echo "$(ahora)  web HTTP $CODIGO, contenedor $ESTADO_CONTENEDOR, acción: $ACCION, después HTTP $CODIGO2"

if [ "$CODIGO2" = "200" ]; then
  avisar "BuscayCurra se había caído y se ha levantado sola" "A las $(ahora) la web no respondía (HTTP $CODIGO, contenedor: $ESTADO_CONTENEDOR). Acción: $ACCION. Ya responde con normalidad."
  echo bien > "$ESTADO"
  exit 0
fi

# Sigue caída: aviso solo la primera vez.
if [ "$ANTES" = "bien" ]; then
  avisar "BuscayCurra está caída" "A las $(ahora) la web no responde (HTTP $CODIGO2). Contenedor: $ESTADO_CONTENEDOR. Acción: $ACCION. Hace falta mirarlo: registro en /root/vigilante-app.log y 'docker logs buscaycurra-nextjs'."
  echo "caida:$(ahora)" > "$ESTADO"
fi
