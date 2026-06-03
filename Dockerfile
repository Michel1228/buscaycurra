# Build stage — instala deps y compila Next.js
FROM node:20.19.0-alpine AS builder
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

COPY package.json package-lock.json ./
RUN npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 5 && \
    npm ci

COPY . .

# Variables públicas necesarias en tiempo de build
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

RUN npm run build

# Compilar el worker de BullMQ como bundle Node.js standalone
RUN node_modules/.bin/esbuild scripts/start-worker.ts \
    --bundle \
    --platform=node \
    --target=node20 \
    --packages=external \
    --tsconfig=tsconfig.json \
    --outfile=.next/standalone/worker.js

# Production stage — imagen mínima con el standalone output
FROM node:20.19.0-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Script de inicio: worker BullMQ con auto-restart + servidor Next.js
RUN printf '#!/bin/sh\n(while true; do node worker.js || true; sleep 3; done) &\nexec node server.js\n' > /app/start.sh \
    && chmod +x /app/start.sh

EXPOSE 3000

CMD ["/bin/sh", "/app/start.sh"]
