# Imagen de producción — el build ya viene hecho desde GitHub Actions
FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production

# El .next/standalone ya está compilado antes de hacer docker build
COPY .next/standalone ./
COPY .next/static ./.next/static
COPY public ./public

EXPOSE 3000

CMD ["node", "server.js"]
