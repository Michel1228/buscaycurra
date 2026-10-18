# Build stage — instala deps y compila Next.js
FROM node:20.19.0-alpine AS builder
# NO COMPILAR EN /app (17 oct 2026). Con el proyecto en una carpeta llamada
# "app", Next.js confundía app/empresas (la página para empresas) con
# app/app/empresas (enviar CV): /empresas salía con la página equivocada, y
# lo mismo /admin. Comprobado con dos compilaciones iguales salvo la carpeta:
# en /app sale mal, en /srv/web sale bien. La imagen final sigue en /app.
WORKDIR /srv/web

ENV NEXT_TELEMETRY_DISABLED=1
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

COPY package.json package-lock.json ./
RUN npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 5 && \
    npm install --legacy-peer-deps

COPY . .

# Variables necesarias en tiempo de build
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_VAPID_PUBLIC_KEY
ARG STRIPE_SECRET_KEY

# ⚠️ NEXT_PUBLIC_* deben ser ENV (no solo export en RUN) para que Next.js las inlinee en el bundle
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}
ENV NEXT_PUBLIC_VAPID_PUBLIC_KEY=${NEXT_PUBLIC_VAPID_PUBLIC_KEY}
ENV STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}

RUN echo "BUILD: SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL:0:30}..." && \
    npm run build

# Production stage
FROM node:20.19.0-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Chromium para generación de PDFs con Playwright (plantillas CV y Au Pair)
# poppler-utils da el binario pdftotext que pide app/api/cv/extraer/route.ts.
# Nunca estuvo instalado, asi que TODA extraccion de CV caia siempre al
# fallback en JS (regex sobre los bytes crudos del PDF): con PDFs modernos
# (streams comprimidos, fuentes con subconjunto de glifos, que es casi
# cualquier PDF de Word/LibreOffice/Canva) ese fallback produce texto
# corrupto: nombre y apellidos salian como basura binaria ilegible aunque el
# telefono a veces sobrevivia por casualidad.
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    font-noto \
    font-noto-emoji \
    poppler-utils
ENV CHROMIUM_PATH=/usr/bin/chromium-browser

# Standalone Next.js output
COPY --from=builder /srv/web/.next/standalone ./
COPY --from=builder /srv/web/.next/static ./.next/static
COPY --from=builder /srv/web/public ./public

# node_modules necesarios para el worker (tsx + bullmq + ioredis + supabase)
COPY --from=builder /srv/web/node_modules ./node_modules

# Scripts del worker
COPY --from=builder /srv/web/scripts ./scripts
COPY --from=builder /srv/web/lib ./lib
COPY --from=builder /srv/web/tsconfig.json ./tsconfig.json

EXPOSE 3000

CMD ["/bin/sh", "./scripts/docker-start.sh"]
