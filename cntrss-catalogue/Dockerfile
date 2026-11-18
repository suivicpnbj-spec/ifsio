# =============================================================================
# Image de production pour CNTRSS Catalogue (IFSIO)
# Vite compile le frontend, esbuild compile server.ts vers dist/server.mjs.
# =============================================================================

FROM node:22-slim AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci || npm install --no-audit --no-fund

COPY prisma ./prisma
RUN npx prisma generate

COPY . .
RUN npm run build

# ---- Runtime de production ----
FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3100 \
    DATABASE_URL="file:./data/dev.db" \
    UPLOADS_DIR="data/uploads"

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev || npm install --omit=dev --no-audit --no-fund

COPY prisma ./prisma
RUN npx prisma generate

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/data ./data

RUN mkdir -p /app/data/uploads

EXPOSE 3100
CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/server.mjs"]
