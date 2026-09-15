#!/bin/bash
# sync-arbeitsagentur.sh — Sync de ofertas Arbeitsagentur (Alemania)
# v6 API (ago 2026). Recorre todas las keywords en lotes de 5.
# Cada lote procesa 5 keywords × 200 ofertas = ~90s. Total ~80 llamadas.
# El endpoint es stateful: devuelve nextIdx para continuar.

set -e
ADMIN_SECRET=$(grep -E '^ADMIN_SECRET=' /root/.openclaw/workspace/buscaycurra-unified/.env.local | head -1 | cut -d= -f2- | tr -d '[:cntrl:]')
LOG="/root/sync-arbeitsagentur.log"
ENDPOINT="http://localhost:8892/api/jobs/sync-arbeitsagentur"

echo "[$(date -Iseconds)] Iniciando sync Arbeitsagentur (v6)..." | tee -a "$LOG"

TOTAL_FETCHED=0
TOTAL_INSERTED=0
TOTAL_ERRORS=0
START_IDX=0
ROUNDS=0
MAX_ROUNDS=100  # safety: ~397 keywords / 5 per batch

while [ $ROUNDS -lt $MAX_ROUNDS ]; do
  RESP=$(curl -s --max-time 300 -X POST "$ENDPOINT" \
    -H "x-sync-secret: $ADMIN_SECRET" \
    -H "Content-Type: application/json" \
    -d "{\"startIdx\":$START_IDX,\"batchSize\":5,\"maxPerKeyword\":200}")

  FETCHED=$(echo "$RESP" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('fetched',0))" 2>/dev/null || echo 0)
  INSERTED=$(echo "$RESP" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('inserted',0))" 2>/dev/null || echo 0)
  ERRORS=$(echo "$RESP" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('errors',0))" 2>/dev/null || echo 0)
  NEXT=$(echo "$RESP" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('nextIdx',0))" 2>/dev/null || echo 0)
  DONE=$(echo "$RESP" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('done',False))" 2>/dev/null || echo "False")

  TOTAL_FETCHED=$((TOTAL_FETCHED + FETCHED))
  TOTAL_INSERTED=$((TOTAL_INSERTED + INSERTED))
  TOTAL_ERRORS=$((TOTAL_ERRORS + ERRORS))
  ROUNDS=$((ROUNDS + 1))

  echo "[Arbeitsagentur v6] round=$ROUNDS startIdx=$START_IDX fetched=$FETCHED inserted=$INSERTED next=$NEXT done=$DONE" | tee -a "$LOG"

  if [ "$DONE" = "True" ] || [ "$NEXT" -eq 0 ] && [ "$ROUNDS" -gt 1 ]; then
    break
  fi

  START_IDX=$NEXT
  sleep 1  # pequeño respiro entre lotes
done

echo "[$(date -Iseconds)] Sync Arbeitsagentur (v6) FIN: rounds=$ROUNDS total_fetched=$TOTAL_FETCHED total_inserted=$TOTAL_INSERTED total_errors=$TOTAL_ERRORS" | tee -a "$LOG"
