# Imagen de producción para Fly.io (Node 22.13+ incluye node:sqlite).
FROM node:22-slim

WORKDIR /app
ENV NODE_ENV=production

# Instalar solo dependencias de producción (aprovecha la caché de capas).
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY server ./server
COPY public ./public

# data/ es el volumen persistente de Fly (ver fly.toml); aquí vive app.db.
RUN mkdir -p /app/data

EXPOSE 3000
CMD ["node", "server/index.js"]
