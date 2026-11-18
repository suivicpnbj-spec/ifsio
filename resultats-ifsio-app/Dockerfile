# =============================================================================
# Image de production — déployable sur Render / Railway / Fly.io / tout PaaS
# multi-étapes : le frontend Vite est compilé puis servi par le backend Express.
# =============================================================================

# ---- Étape 1 : compilation du frontend ----
# node:20-slim (Debian/glibc) plutôt qu'alpine : bcrypt (module natif) dispose
# alors de binaires précompilés — pas de compilation node-gyp ni d'outils à installer.
FROM node:20-slim AS frontend
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci || npm install --no-audit --no-fund
COPY frontend/ ./
RUN npm run build

# ---- Étape 2 : runtime de l'API (produit final) ----
FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev || npm install --omit=dev --no-audit --no-fund
COPY . .
COPY --from=frontend /app/frontend/dist ./frontend/dist
EXPOSE 3000
# Les migrations SQL (db/migrate.js) sont idempotentes : elles s'appliquent
# à chaque démarrage avant de lancer l'API (pas besoin de preDeployCommand).
CMD ["sh", "-c", "node db/migrate.js && node src/server.js"]
