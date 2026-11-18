#!/usr/bin/env bash
set -Eeuo pipefail

PRESENTATION_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICE_DIR="$PRESENTATION_DIR/ifsio-site/portal-service"
ENV_FILE="$SERVICE_DIR/.env.local"

if [[ ! -f "$ENV_FILE" ]]; then
  umask 077
  SOCKET_PATH="$HOME/.local/share/ifsio-postgres/socket"
  SOCKET_ENCODED="$(node -e 'process.stdout.write(encodeURIComponent(process.argv[1]))' "$SOCKET_PATH")"
  SESSION_SECRET="$(node -e 'process.stdout.write(require("node:crypto").randomBytes(48).toString("base64url"))')"
  cat > "$ENV_FILE" <<EOF
NODE_ENV=development
HOST=0.0.0.0
PORT=8082
DATABASE_URL=postgresql://$(id -un)@localhost/ifsio_portal_local?host=$SOCKET_ENCODED&port=55432
SESSION_SECRET=$SESSION_SECRET
UPLOAD_DIR=$SERVICE_DIR/uploads
MAX_UPLOAD_MB=15
EOF
  chmod 600 "$ENV_FILE"
fi

if [[ ! -d "$SERVICE_DIR/node_modules" ]]; then
  npm ci --prefix "$SERVICE_DIR"
fi

cd "$SERVICE_DIR"
npm run db:local:start
npm run db:migrate
npm run demo:seed
npm run local
