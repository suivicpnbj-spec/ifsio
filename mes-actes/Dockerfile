# =============================================================================
# Image de production pour MES ACTES (IFSIO)
# Multi-étapes : Vite compile l'interface React, TypeScript compile le serveur,
# puis Express sert l'API et les fichiers statiques de /dist.
# =============================================================================

FROM node:22-slim AS builder
WORKDIR /app

# Dépendances
COPY package.json package-lock.json* ./
RUN npm ci || npm install --no-audit --no-fund

# Code source et compilation (Vite + TypeScript backend)
COPY . .
RUN npm run build

# ---- Runtime de production ----
FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production \
    PORT=4000 \
    SERVE_STATIC=true \
    STATIC_DIR=/app/dist \
    DATABASE_FILE=/app/data/mes-actes.db \
    UPLOAD_DIR=/app/data/uploads

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev || npm install --omit=dev --no-audit --no-fund

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server-dist ./server-dist
COPY --from=builder /app/data ./data

RUN mkdir -p /app/data/uploads

EXPOSE 4000
CMD ["node", "server-dist/server/index.js"]
