# ── Build stage ──────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Herramientas necesarias para módulos nativos (ioredis, ws, etc.)
RUN apk add --no-cache python3 make g++

# Copiar package files e instalar dependencias
COPY package.json package-lock.json* ./
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
RUN npm ci

# Build args para las variables públicas de Next.js (se basan en build time)
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

# Copiar código fuente y compilar
COPY . .
RUN npm run build

# ── Production stage ─────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copiar archivos del build standalone
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
