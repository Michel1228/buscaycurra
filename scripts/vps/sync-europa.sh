#!/bin/bash
# sync-europa.sh v4 — Barrido masivo de ofertas europeas via Careerjet
# 20 países EU × ~38 combos = 750 combos totales
# Fuente: /api/jobs/sync-careerjet-global (Careerjet + API pool con circuit breaker)
#
# Crontab: 0 */6 * * * bash /root/sync-europa.sh

ADMIN_SECRET=$(grep -E '^ADMIN_SECRET=' /root/.openclaw/workspace/buscaycurra-unified/.env.local | head -1 | cut -d= -f2- | tr -d '[:cntrl:]')
LOG="/root/sync-europa.log"
DATE=$(date '+%Y-%m-%d %H:%M')

echo "=== $DATE — Sync Europa v4 (20 países × 30-40 combos) ===" >> $LOG

# Países europeos en CAREERJET_COUNTRIES
EU_COUNTRIES=(
  "at" "be" "ch" "cz" "de" "dk" "es" "fi" "fr" "gr"
  "hu" "ie" "it" "nl" "no" "pl" "pt" "ro" "se" "uk"
)

GRAN_TOTAL_INSERTED=0
GRAN_TOTAL_FETCHED=0
BATCH=3  # combos por país (3 combos × ~30s = ~90s, dentro del timeout)
BREAKER_RESET_INTERVAL=7  # resetea breaker cada N países

COUNTER=0
for COUNTRY in "${EU_COUNTRIES[@]}"; do
  COUNTER=$((COUNTER + 1))
  
  # Reset circuit breaker cada BREAKER_RESET_INTERVAL países
  if [ $((COUNTER % BREAKER_RESET_INTERVAL)) -eq 0 ]; then
    REDIS_CT=$(docker ps --filter "name=buscaycurra.*redis" --format "{{.Names}}" | head -1)
    REDIS_PASS='9tateikic492s8mggp03'
    if [ -n "$REDIS_CT" ]; then
      docker exec "$REDIS_CT" redis-cli -a "$REDIS_PASS" --no-auth-warning DEL "api:usage:careerjet:0:$(date +%Y%m%d)" "api:breaker:careerjet:0" >> $LOG 2>&1
    fi
    echo "  [breaker] Careerjet reset (country $COUNTER)" >> $LOG
  fi

  RESULT=$(curl -s --max-time 180 --connect-timeout 30 -X POST "http://localhost:8892/api/jobs/sync-careerjet-global" \
    -H "x-sync-secret: $ADMIN_SECRET" \
    -H "Content-Type: application/json" \
    -d "{\"country\":\"$COUNTRY\",\"batchSize\":$BATCH}")

  if [ -z "$RESULT" ]; then
    echo "  [$COUNTRY] → ERROR: respuesta vacía" >> $LOG
    sleep 3
    continue
  fi

  INS=$(echo "$RESULT" | python3 -c "import json,sys; print(json.load(sys.stdin).get('inserted',0))" 2>/dev/null || echo "PARSE_ERROR")
  FETCH=$(echo "$RESULT" | python3 -c "import json,sys; print(json.load(sys.stdin).get('fetched',0))" 2>/dev/null || echo "PARSE_ERROR")
  COUNTRY_NAME=$(echo "$RESULT" | python3 -c "import json,sys; print(json.load(sys.stdin).get('country','?'))" 2>/dev/null || echo "?")
  NEXT_OFFSET=$(echo "$RESULT" | python3 -c "import json,sys; print(json.load(sys.stdin).get('nextOffset','?'))" 2>/dev/null || echo "?")
  TOTAL_COMBOS=$(echo "$RESULT" | python3 -c "import json,sys; print(json.load(sys.stdin).get('totalCombos','?'))" 2>/dev/null || echo "?")

  GRAN_TOTAL_INSERTED=$((GRAN_TOTAL_INSERTED + INS))
  GRAN_TOTAL_FETCHED=$((GRAN_TOTAL_FETCHED + FETCH))

  echo "  [$COUNTER/20] $COUNTRY ($COUNTRY_NAME) → +$INS insertados / $FETCH fetched | offset=$NEXT_OFFSET/$TOTAL_COMBOS | Acum: $GRAN_TOTAL_INSERTED" >> $LOG

  sleep 2
done

# Resumen final desde la DB
TOTAL_DB=$(docker exec buscaycurra-db psql -U buscaycurra -d buscaycurra -t -c "SELECT COUNT(*) FROM \"JobListing\";" 2>/dev/null | tr -d ' ' || echo "DB_ERROR")

echo "" >> $LOG
echo "  ✅ Resumen final:" >> $LOG
echo "     Insertados esta ronda: $GRAN_TOTAL_INSERTED" >> $LOG
echo "     Fetched esta ronda:    $GRAN_TOTAL_FETCHED" >> $LOG
echo "     Total DB:              $TOTAL_DB" >> $LOG
echo "" >> $LOG
