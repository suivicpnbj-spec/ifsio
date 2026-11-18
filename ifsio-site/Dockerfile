# =============================================================================
# Image de production pour IFSIO Site & Portail Étudiant
# =============================================================================

FROM node:22-slim
WORKDIR /app

# Copie des fichiers statiques du site
COPY refonte ./refonte

# Copie et installation du service portail
WORKDIR /app/portal-service
COPY portal-service/package.json portal-service/package-lock.json* ./
RUN npm ci --omit=dev || npm install --omit=dev --no-audit --no-fund

COPY portal-service/ ./

ENV NODE_ENV=production \
    PORT=8081 \
    HOST=0.0.0.0

EXPOSE 8081

CMD ["sh", "-c", "node scripts/migrate.js && node src/server.js"]
