#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# RESTAURACIÓN COMPLETA BUSCAYCURRA — Desde backup al 100%
# Uso: bash /root/restore-bc.sh /root/backups/buscaycurra-20250625_XXXX
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
green() { echo -e "${GREEN}✅ $1${NC}"; }
red() { echo -e "${RED}❌ $1${NC}"; exit 1; }
info() { echo -e "${YELLOW}📦 $1${NC}"; }

BACKUP_DIR="${1:?Uso: bash restore-bc.sh <directorio_backup>}"
[ -d "$BACKUP_DIR" ] || red "Directorio $BACKUP_DIR no existe"

info "RESTAURACIÓN COMPLETA desde $BACKUP_DIR"
info "Fecha backup: $(stat -c %y $BACKUP_DIR/db.dump 2>/dev/null || echo 'N/A')"

# 1. Restaurar código
echo ""
info "[1/6] Restaurando código fuente..."
WORKDIR="/root/.openclaw/workspace/buscaycurra-unified"
rm -rf "$WORKDIR" 2>/dev/null || true
mkdir -p "$WORKDIR"
cd "$WORKDIR"
tar xzf "$BACKUP_DIR/source.tar.gz" 2>/dev/null || red "Fallo al extraer source"
# Restaurar .env.local
cp "$BACKUP_DIR/env.local" "$WORKDIR/.env.local" 2>/dev/null || true
green "Código restaurado en $WORKDIR"

# 2. Restaurar DB PostgreSQL
echo ""
info "[2/6] Restaurando base de datos..."
docker exec -i buscaycurra-db pg_restore -U buscaycurra -d buscaycurra --clean --if-exists < "$BACKUP_DIR/db.dump" 2>&1 | tail -5 || info "pg_restore con warnings (normal si hay objetos existentes)"
green "DB restaurada"

# 3. Restaurar Redis (limpiar colas)
echo ""
info "[3/6] Limpiando Redis..."
docker exec buscaycurra-redis redis-cli FLUSHALL 2>/dev/null || true
green "Redis limpio"

# 4. Reconstruir Docker
echo ""
info "[4/6] Reconstruyendo imagen Docker..."
cd "$WORKDIR"
docker build --no-cache \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="$(grep NEXT_PUBLIC_SUPABASE_URL .env.local | cut -d= -f2)" \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="$(grep NEXT_PUBLIC_SUPABASE_ANON_KEY .env.local | cut -d= -f2)" \
  --build-arg NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="$(grep NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY .env.local | cut -d= -f2)" \
  --build-arg NEXT_PUBLIC_VAPID_PUBLIC_KEY="$(grep VAPID_PUBLIC_KEY .env.local | cut -d= -f2)" \
  --build-arg STRIPE_SECRET_KEY="$(grep STRIPE_SECRET_KEY .env.local | cut -d= -f2)" \
  -t buscaycurra:latest . || red "Fallo docker build"
green "Imagen Docker reconstruida"

# 5. Desplegar
echo ""
info "[5/6] Desplegando..."
docker stop buscaycurra-nextjs 2>/dev/null || true
docker rm buscaycurra-nextjs 2>/dev/null || true
timeout 15 docker run -d --name buscaycurra-nextjs \
  --network busca-y-curra_default \
  --env-file "$WORKDIR/.env.local" \
  -e REDIS_URL=redis://buscaycurra-redis:6379 \
  -e API_URL=http://buscaycurra-api:3001 \
  -p 8892:3000 buscaycurra:latest || red "Fallo docker run"

sleep 5
curl -s -o /dev/null -w "%{http_code}" http://localhost:8892/ | grep -q 200 || red "App no responde 200"
green "Desplegado y respondiendo"

# 6. Restaurar crontab
echo ""
info "[6/6] Restaurando crontab..."
[ -f "$BACKUP_DIR/crontab.txt" ] && crontab "$BACKUP_DIR/crontab.txt" && green "Crontab restaurado" || info "Sin crontab en backup"

# Verificación final
echo ""
bash /root/candados.sh all 2>&1 | tail -3

echo ""
echo "═══════════════════════════════════════"
green "RESTAURACIÓN COMPLETA — App al 100%"
echo "═══════════════════════════════════════"
