#!/bin/bash
# build-deploy.sh — Build y deploy de BuscayCurra con todos los --build-arg
# NUNCA usar "docker build -t buscaycurra:latest ." sin argumentos
set -e
cd "$(dirname "$0")"

# Cargar vars de .env.local
source <(grep -E '^NEXT_PUBLIC_SUPABASE_URL=|^NEXT_PUBLIC_SUPABASE_ANON_KEY=|^NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=|^VAPID_PUBLIC_KEY=|^STRIPE_SECRET_KEY=' .env.local)

echo "🔨 Build con --build-arg..."
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="$NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  --build-arg NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" \
  --build-arg NEXT_PUBLIC_VAPID_PUBLIC_KEY="$VAPID_PUBLIC_KEY" \
  --build-arg STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY" \
  -t buscaycurra:latest .

echo "🚀 Deploy..."
docker stop buscaycurra-nextjs 2>/dev/null || true
docker rm buscaycurra-nextjs 2>/dev/null || true
docker run -d --name buscaycurra-nextjs \
  --network busca-y-curra_default \
  --env-file .env.local \
  -e REDIS_URL=redis://buscaycurra-redis:6379 \
  -e API_URL=http://buscaycurra-api:3001 \
  -p 8892:3000 \
  buscaycurra:latest

sleep 4
echo "✅ Test: $(curl -s -o /dev/null -w '%{http_code}' https://buscaycurra.es)"
