FROM node:20-alpine

RUN apk add --no-cache openssl

WORKDIR /app

# Instalar dependencias primero (cache de Docker)
COPY package*.json ./
RUN npm install --production

# Copiar prisma schema y generar cliente
COPY prisma ./prisma/
RUN npx prisma generate

# Copiar código
COPY src ./src/

# Crear directorio de uploads
RUN mkdir -p uploads/photos uploads/pdfs

EXPOSE 3001

# Ejecutar migraciones y arrancar
CMD ["sh", "-c", "npx prisma migrate deploy && node src/index.js"]
