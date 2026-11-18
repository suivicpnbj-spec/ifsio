#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DATA_DIR="${HOME}/.local/share/ifsio-postgres/data"
API_PID=""
FRONTEND_PID=""

port_is_open() {
  (echo > "/dev/tcp/127.0.0.1/$1") >/dev/null 2>&1
}

cleanup() {
  local exit_code=$?
  trap - EXIT INT TERM
  for pid in "$FRONTEND_PID" "$API_PID"; do
    if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
      kill -TERM "$pid" 2>/dev/null || true
    fi
  done
  for pid in "$FRONTEND_PID" "$API_PID"; do
    if [[ -n "$pid" ]]; then wait "$pid" 2>/dev/null || true; fi
  done
  exit "$exit_code"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

cd "$ROOT_DIR"
if [[ ! -f .env.offline ]]; then
  echo "Configuration locale absente : .env.offline" >&2
  exit 1
fi
if [[ ! -d "$DATA_DIR" ]]; then
  echo "Base locale non initialisée. Consultez la section hors ligne du README." >&2
  exit 1
fi

for port in 3000 5174; do
  if port_is_open "$port"; then
    echo "Le port $port est déjà occupé. Fermez son application ou vérifiez les services actifs." >&2
    exit 1
  fi
done

if ! pg_isready -q -h 127.0.0.1 -p 55432; then
  npm run db:offline:start
fi

DOTENV_CONFIG_PATH=.env.offline npm run migrate:db

(
  cd "$ROOT_DIR"
  export DOTENV_CONFIG_PATH=.env.offline
  exec node src/server.js
) &
API_PID=$!
(
  cd "$ROOT_DIR/frontend"
  exec ./node_modules/.bin/vite --host 0.0.0.0 --port 5174 --strictPort
) &
FRONTEND_PID=$!

printf '\nMES RESULTATS est lancé : http://localhost:5174\n'
printf 'API locale : http://localhost:3000/api/sante\n'
printf 'Arrêt des serveurs : Ctrl+C (PostgreSQL reste actif pour les autres projets)\n\n'

while kill -0 "$API_PID" 2>/dev/null && kill -0 "$FRONTEND_PID" 2>/dev/null; do
  sleep 1
done

echo "Un des serveurs s’est arrêté. Fermeture du service restant." >&2
exit 1
