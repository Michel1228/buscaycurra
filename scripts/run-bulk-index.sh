#!/bin/bash
# scripts/run-bulk-index.sh
# Llama al bulk indexer en bucle hasta cubrir todas las combinaciones.
#
# Uso desde el VPS:
#   chmod +x scripts/run-bulk-index.sh
#   ADMIN_SECRET=ByCurra2026Secure! BASE_URL=https://buscaycurra.es ./scripts/run-bulk-index.sh
#
# O directamente:
#   bash scripts/run-bulk-index.sh
#
# Parámetros (variables de entorno):
#   BASE_URL        URL base de la app (default: https://buscaycurra.es)
#   ADMIN_SECRET    Secret de admin (default: ByCurra2026Secure!)
#   LIMIT           Combinaciones por batch (default: 200)
#   START_OFFSET    Offset inicial (default: 0, para continuar desde donde se dejó)

BASE_URL="${BASE_URL:-https://buscaycurra.es}"
SECRET="${ADMIN_SECRET:-ByCurra2026Secure!}"
LIMIT="${LIMIT:-200}"
OFFSET="${START_OFFSET:-0}"
TOTAL_COMBINACIONES=24360  # 203 puestos × 120 ciudades

echo "=============================================="
echo "  BuscayCurra — Bulk Indexer"
echo "  Objetivo: 400.000+ ofertas"
echo "  Base URL: $BASE_URL"
echo "  Batch size: $LIMIT combinaciones"
echo "  Inicio: offset $OFFSET"
echo "=============================================="
echo ""

# Primero, cargar fuentes gratuitas (Arbeitnow + Remotive) — son dumps completos
echo "▶ Cargando Arbeitnow + Remotive (fuentes libres)..."
RESULT=$(curl -s -X POST "$BASE_URL/api/jobs/bulk-index" \
  -H "Content-Type: application/json" \
  -d "{\"secret\":\"$SECRET\",\"source\":\"all-free\"}")
echo "  $RESULT"
echo ""

# Luego, Jooble en bucle por offset
echo "▶ Iniciando bulk Jooble (puestos × ciudades)..."
echo ""

while [ "$OFFSET" -lt "$TOTAL_COMBINACIONES" ]; do
  RESPONSE=$(curl -s -X POST "$BASE_URL/api/jobs/bulk-index" \
    -H "Content-Type: application/json" \
    -d "{\"secret\":\"$SECRET\",\"source\":\"jooble\",\"offset\":$OFFSET,\"limit\":$LIMIT}")

  INSERTADOS=$(echo "$RESPONSE" | grep -o '"insertados":[0-9]*' | cut -d: -f2)
  TOTAL_BD=$(echo "$RESPONSE" | grep -o '"totalEnBD":[0-9]*' | cut -d: -f2)
  PCT=$(echo "$RESPONSE" | grep -o '"progresoPct":[0-9]*' | cut -d: -f2)
  SIGUIENTE=$(echo "$RESPONSE" | grep -o '"siguiente":[0-9]*' | cut -d: -f2)

  echo "[offset=$OFFSET] +$INSERTADOS nuevas | Total BD: $TOTAL_BD | Progreso: $PCT%"

  # Si ya llegamos a 400k, parar
  if [ -n "$TOTAL_BD" ] && [ "$TOTAL_BD" -ge 400000 ]; then
    echo ""
    echo "🎉 ¡OBJETIVO ALCANZADO! $TOTAL_BD ofertas en BD"
    break
  fi

  # Si no hay siguiente, hemos terminado
  if [ -z "$SIGUIENTE" ] || [ "$SIGUIENTE" = "null" ]; then
    echo ""
    echo "✅ Todas las combinaciones procesadas. Total: $TOTAL_BD ofertas"
    break
  fi

  OFFSET="$SIGUIENTE"

  # Pequeña pausa para no sobrecargar (2 seg entre batches)
  sleep 2
done

echo ""
echo "=============================================="
echo "  RESUMEN FINAL"
FINAL=$(curl -s "$BASE_URL/api/jobs/bulk-index?secret=$SECRET")
echo "  $FINAL"
echo "=============================================="
