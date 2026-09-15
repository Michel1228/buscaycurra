#!/usr/bin/env bash
# centinela.sh — Pregunta cada mañana al centinela si la aplicacion dice la
# verdad, y AVISA POR CORREO cuando algo cambia.
#
# POR QUE EXISTE
#
# /api/admin/centinela hace 12 comprobaciones contra los datos reales de
# produccion: paises vacios, fuentes calladas, envios colgados, CVs vacios...
# Cada una nace de un fallo que paso de verdad y que devolvia 200 con buena
# pinta, asi que ningun chequeo de "esta caido" lo habria visto.
#
# Se programo primero como workflow de GitHub y nunca llego a ejecutarse:
# GitHub solo lanza calendarios programados desde la rama main, y alli se
# desactivaron el 5 jul 2026. Todas las tareas viven en el crontab de root del
# VPS; la copia versionada esta en scripts/vps/crontab.txt.
#
# POR QUE CORREO Y NO UN LOG
#
# El vigilante que ya habia (watchdog-bc.sh) solo escribe en
# /tmp/watchdog-alerts.log, que no lee nadie. Un aviso que nadie ve es el mismo
# fallo silencioso que el centinela intenta cazar.
#
# CUANDO AVISA, y cuando NO, a proposito
#
#   - Cuando el resultado CAMBIA respecto a la ultima vez: aparece un fallo
#     nuevo, desaparece uno, o todo vuelve a estar bien.
#   - Los LUNES, mientras sigan los fallos, como recordatorio.
#   - NO repite el mismo aviso cada dia. Una alarma que suena a diario se acaba
#     ignorando, y entonces tampoco se ve la que importa.
#
# El resultado anterior se guarda en /root/.centinela-ultimo-estado.
# Si el correo no sale, se marca para reintentarlo al dia siguiente en vez de
# darse por avisado.

set -uo pipefail

ENV=/root/.openclaw/workspace/buscaycurra-unified/.env.local
leer() { grep -E "^$1=" "$ENV" | head -1 | cut -d= -f2- | tr -d '\r\042\047'; }

SECRET=$(leer ADMIN_SECRET)
DESTINO=$(leer ADMIN_EMAILS)
[ -n "$DESTINO" ] || DESTINO=$(leer NEXT_PUBLIC_ADMIN_EMAIL)
ESTADO=/root/.centinela-ultimo-estado
RESPUESTA=$(mktemp)
trap 'rm -f "$RESPUESTA"' EXIT

CODIGO=$(curl -s -o "$RESPUESTA" -w '%{http_code}' --max-time 150 \
  "http://localhost:8892/api/admin/centinela" -H "x-admin-secret: $SECRET")

# La clave de Resend viaja en el entorno del proceso y no como argumento: los
# argumentos se ven en `ps` mientras el script corre.
RESEND_API_KEY=$(leer RESEND_API_KEY) \
DESTINO="$DESTINO" CODIGO="$CODIGO" ESTADO="$ESTADO" RESPUESTA="$RESPUESTA" \
python3 - <<'PY'
import datetime, json, os, sys, urllib.request

utc = datetime.timezone.utc
codigo = os.environ.get("CODIGO", "")
estado = os.environ["ESTADO"]
destino = [d.strip() for d in os.environ.get("DESTINO", "").split(",") if d.strip()]
clave = os.environ.get("RESEND_API_KEY", "")
ahora = datetime.datetime.now(utc).strftime("%Y-%m-%d %H:%M UTC")

try:
    with open(os.environ["RESPUESTA"], encoding="utf-8") as fh:
        comprobaciones = json.load(fh)["comprobaciones"]
except Exception:
    # Sin respuesta legible el centinela no ha podido mirar. Eso NO es un
    # aprobado: es no haber mirado, y se trata como un fallo mas.
    comprobaciones = [{
        "nombre": "el centinela responde",
        "bien": False,
        "detalle": f"no hubo respuesta legible (HTTP {codigo or 'sin conexion'})",
        "nacioDe": "no haber podido mirar no es un aprobado",
    }]

fallos = sorted(c["nombre"] for c in comprobaciones if not c.get("bien"))
huella = "|".join(fallos)
anterior = None
if os.path.exists(estado):
    with open(estado, encoding="utf-8") as fh:
        anterior = fh.read().strip()
es_lunes = datetime.datetime.now(utc).weekday() == 0

if anterior is None:
    avisar, motivo = bool(fallos), "primera ejecucion"
elif huella != anterior:
    avisar, motivo = True, "el resultado ha cambiado respecto a la ultima vez"
elif fallos and es_lunes:
    avisar, motivo = True, "recordatorio de los lunes: siguen los mismos fallos"
else:
    avisar, motivo = False, "sin cambios"

pasan = len(comprobaciones) - len(fallos)
print(f"{ahora}  {pasan} pasan, {len(fallos)} fallan  ·  aviso: {'SI' if avisar else 'no'} ({motivo})")

with open(estado, "w", encoding="utf-8") as fh:
    fh.write(huella)
if not avisar:
    sys.exit(0)

if fallos:
    plural = "s" if len(fallos) != 1 else ""
    asunto = f"Centinela BuscayCurra: {len(fallos)} fallo{plural} — {fallos[0]}"
else:
    asunto = "Centinela BuscayCurra: todo vuelve a estar bien"

lineas = [f"Centinela de BuscayCurra · {ahora}", f"Motivo del aviso: {motivo}.", ""]
for c in comprobaciones:
    if not c.get("bien"):
        lineas += [
            f"MAL  {c['nombre']}",
            f"     {c.get('detalle', '')}",
            f"     nacio de: {c.get('nacioDe') or '-'}",
            "",
        ]
lineas.append("Lo que esta bien:")
lineas += [f"  OK  {c['nombre']}" for c in comprobaciones if c.get("bien")]
lineas += ["", "Solo recibes este correo cuando cambia algo, y los lunes si siguen los fallos."]

if not clave or not destino:
    print("  ERROR: falta RESEND_API_KEY o ADMIN_EMAILS en .env.local; el aviso NO se ha enviado")
    with open(estado, "w", encoding="utf-8") as fh:
        fh.write("__aviso_no_enviado__")
    sys.exit(1)

cuerpo = json.dumps({
    "from": "Centinela BuscayCurra <noreply@buscaycurra.es>",
    "to": destino,
    "subject": asunto,
    "text": "\n".join(lineas),
}).encode("utf-8")
peticion = urllib.request.Request(
    "https://api.resend.com/emails",
    data=cuerpo,
    method="POST",
    headers={"Authorization": f"Bearer {clave}", "Content-Type": "application/json"},
)
try:
    with urllib.request.urlopen(peticion, timeout=30) as r:
        print(f"  correo enviado a {len(destino)} destinatario(s) (HTTP {r.status})")
except Exception as e:
    # Si el correo no sale no se da por avisado: se deja una huella imposible
    # para que la proxima ejecucion vea "cambio" y lo vuelva a intentar.
    with open(estado, "w", encoding="utf-8") as fh:
        fh.write("__aviso_no_enviado__")
    print(f"  ERROR enviando el correo: {e}")
    sys.exit(1)
PY
