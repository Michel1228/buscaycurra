# ── Build stage ──────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

COPY . .

ARG NEXT_PUBLIC_SUPABASE_URL=https://ojesordjedovnpyxspxi.supabase.co
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_YCsE2bdWgmtR8U9AvmfRCA_n09gvZyN
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

# Redis no está disponible en build time — usar placeholder para que BullMQ no falle
ENV REDIS_URL=redis://localhost:6379

# Build Next.js
RUN npm run build

# ── Production stage ─────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN apk add --no-cache poppler-utils chromium nss freetype harfbuzz ca-certificates ttf-freefont

ENV CHROMIUM_PATH=/usr/bin/chromium-browser
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

# Next.js standalone
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Worker: fuentes + dependencias (tsx disponible en node_modules/.bin/tsx)
COPY --from=builder /app/scripts/ ./scripts/
COPY --from=builder /app/lib/ ./lib/
COPY --from=builder /app/node_modules/ ./node_modules/
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/tsconfig.json ./tsconfig.json

RUN chmod +x ./scripts/docker-start.sh

EXPOSE 3000

CMD ["./scripts/docker-start.sh"]
