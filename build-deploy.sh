#!/bin/bash
# build-deploy.sh — Build y deploy de BuscayCurra con todos los --build-arg
# NUNCA usar "docker build -t buscaycurra:latest ." sin argumentos
set -e
cd "$(dirname "$0")"

# 🔐 CANDADOS — Verificación pre-deploy
echo "🔐 CANDADOS pre-deploy..."
if [ -f /root/candados.sh ]; then
  bash /root/candados.sh all || {
    echo "❌ CANDADOS FALLARON — deploy cancelado. Arregla los fallos primero."
    exit 1
  }
else
  echo "⚠️  /root/candados.sh no encontrado — saltando verificación"
fi

# 🧪 SELLO — las pruebas de cada fallo que ya pasó. Si alguna falla, NO se despliega.
#
# Hasta el 2 oct 2026 el sello solo se ejecutaba si alguien se acordaba de
# hacerlo en su ordenador: el despliegue no lo comprobaba. Ese día se subió un
# cambio con dos pruebas en rojo y nada lo paró. Aquí tarda unos 6 segundos.
# Sin ALERTS_SECRET ni ADMIN_SECRET a propósito: así la prueba que llama al
# envío de alertas se salta y el sello nunca manda nada a nadie.
echo "🧪 SELLO pre-deploy..."
if env -u ALERTS_SECRET -u ADMIN_SECRET node scripts/sello-verificacion.mjs > /tmp/sello-deploy.log 2>&1; then
  grep "Passed" /tmp/sello-deploy.log
else
  grep -E "FAIL" /tmp/sello-deploy.log | head -20
  grep "Passed" /tmp/sello-deploy.log
  echo "❌ EL SELLO HA FALLADO — deploy cancelado. Arregla las pruebas en rojo de arriba."
  exit 1
fi

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
# REDIS_URL viene de .env.local (lleva la contraseña del Redis Swarm — NO hardcodear
# aquí: este script está versionado y un -e sin password rompe el worker con NOAUTH)
# --restart unless-stopped: el 8 oct 2026 el servidor se reinició solo por una
# actualización del núcleo (10:22 UTC) y la aplicación no volvió: 7 horas con
# "Bad Gateway" y nadie se enteró, porque el centinela vive dentro de ella. La
# base de datos y Redis sí volvieron porque tenían esta política.
docker run -d --name buscaycurra-nextjs \
  --restart unless-stopped \
  --network busca-y-curra_default \
  --env-file .env.local \
  -e API_URL=http://buscaycurra-api:3001 \
  -p 8892:3000 \
  buscaycurra:latest

# REDIS VIVE EN OTRA RED. Lo gestiona Easypanel como servicio swarm, en la red
# overlay easypanel-buscaycurra, y este contenedor nace en busca-y-curra_default.
# Hasta el 22 sep 2026 lo encontraba por una linea fija en /etc/hosts del
# servidor (10.0.2.84 buscaycurra-redis). Easypanel recreo Redis, le dio otra IP,
# y la aplicacion se quedo hablando con la vieja: sin cola de envios de CV, sin
# busqueda de empresas ni de ETTs y sin limites anti-abuso, y ninguna pantalla
# daba error. Conectado a la red de Redis, Docker resuelve siempre su IP actual.
# docker rm pierde esta conexion, asi que hay que hacerla en cada despliegue.
docker network connect easypanel-buscaycurra buscaycurra-nextjs

sleep 4
echo "✅ HTTP: $(curl -s -o /dev/null -w '%{http_code}' https://buscaycurra.es)"

# Y se comprueba DESDE DENTRO de la aplicacion: un PING a Redis con la misma URL
# que usan la cola de envios y el resto. Que Redis este vivo no basta; lo que
# fallo fue que la aplicacion no llegaba.
if docker exec buscaycurra-nextjs node -e 'const m=require("module").createRequire("/app/package.json")("ioredis");const R=m.Redis||m.default||m;const r=new R(process.env.REDIS_URL,{lazyConnect:true,maxRetriesPerRequest:1,connectTimeout:4000});r.on("error",()=>{});r.connect().then(()=>r.ping()).then(p=>process.exit(p==="PONG"?0:1)).catch(()=>process.exit(1))' > /dev/null 2>&1; then
  echo "✅ Redis responde desde la aplicacion"
else
  echo "❌ LA APLICACION NO LLEGA A REDIS: sin envios de CV ni busqueda de empresas. Revisar la red easypanel-buscaycurra."
fi

# 🔐 CANDADOS post-deploy (rápidos: BUILD + DB + REDIS)
echo "🔐 CANDADOS post-deploy..."
bash /root/candados.sh build 2>/dev/null && echo "  ✅ BUILD OK"
bash /root/candados.sh db 2>/dev/null && echo "  ✅ DB OK"

# 🧹 La imagen anterior se queda sin etiqueta al construir la nueva (~2 GB cada
# vez). El 30 sep 2026 había 10 así y el disco iba por el 73 %. Solo se borran
# las que no usa ningún contenedor, así que la que está en marcha no se toca.
docker image prune -f > /dev/null 2>&1 && echo "🧹 Imágenes viejas borradas"
echo "✅ Deploy completo."

# 🔥 Precalentar las páginas del sitemap. Se guardan una hora en caché, pero la
# primera visita tras cada despliegue las construye desde cero: en la
# auditoría del 10 oct 2026 "/trabajar-en/us/developer" tardó 9,5 s. De una en
# una y en segundo plano, para no cargar el servidor ni retrasar este script.
# Proceso aparte (setsid bash -c) y con tope de 15 min: el vigilante busca
# "bash build-deploy.sh" para saber si hay un despliegue en marcha, y una copia
# de este script calentando páginas le haría creer que sí.
setsid timeout 900 bash -c '
  sleep 20
  curl -s https://buscaycurra.es/sitemap.xml | grep -o "<loc>[^<]*</loc>" | sed "s/<[^>]*>//g" |
    while read -r url; do curl -s -o /dev/null --max-time 30 "$url"; done
' > /dev/null 2>&1 < /dev/null &
