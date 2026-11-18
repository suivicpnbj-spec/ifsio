#!/usr/bin/env bash
set -Eeuo pipefail
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PG_ROOT="${HOME}/.local/share/ifsio-postgres"
PG_DATA="$PG_ROOT/data"
PG_SOCKET="$PG_ROOT/socket"
PG_LOG="$PG_ROOT/postgres.log"
PG_BIN="/usr/lib/postgresql/16/bin"
SERVER_PID=""

cleanup() {
  local code=$?
  trap - EXIT INT TERM
  if [[ -n "$SERVER_PID" ]] && kill -0 "$SERVER_PID" 2>/dev/null; then
    kill -TERM "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi
  exit "$code"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

mkdir -p "$BASE_DIR/uploads" "$PG_SOCKET"
if [[ ! -f "$BASE_DIR/.env.local" ]]; then
  echo "Configuration manquante : créez .env.local à partir de .env.example." >&2
  exit 1
fi
PORT_VALUE="$(node -e 'require("dotenv").config({path:process.argv[1]}); process.stdout.write(process.env.PORT || "8080")' "$BASE_DIR/.env.local")"
DB_ROLE="$(id -un)"

start_db() {
  if ! pg_isready -q -h 127.0.0.1 -p 55432; then
    if [[ ! -d "$PG_DATA" ]]; then echo "PostgreSQL local non initialisé." >&2; exit 1; fi
    "$PG_BIN/pg_ctl" -D "$PG_DATA" -l "$PG_LOG" -o "-p 55432 -h 127.0.0.1 -k $PG_SOCKET" start
  fi
  if ! PGHOST="$PG_SOCKET" PGPORT=55432 "$PG_BIN/psql" -U "$DB_ROLE" -d postgres -Atqc "SELECT 1 FROM pg_database WHERE datname='ifsio_portal_local'" | grep -q 1; then
    PGHOST="$PG_SOCKET" PGPORT=55432 "$PG_BIN/createdb" -U "$DB_ROLE" ifsio_portal_local
  fi
}

case "${1:-up}" in
  start) start_db; trap - EXIT INT TERM; exit 0 ;;
  stop) "$PG_BIN/pg_ctl" -D "$PG_DATA" -m fast stop ;;
  up)
    start_db
    cd "$BASE_DIR"
    npm run db:migrate
    if (echo > "/dev/tcp/127.0.0.1/$PORT_VALUE") >/dev/null 2>&1; then
      echo "Le port $PORT_VALUE est déjà utilisé." >&2; exit 1
    fi
    node --watch src/server.js &
    SERVER_PID=$!
    echo "Site IFSIO et services : http://localhost:$PORT_VALUE"
    echo "Administration : http://localhost:$PORT_VALUE/administration.html"
    echo "Arrêt : Ctrl+C (le serveur PostgreSQL local reste disponible pour les autres projets)"
    wait "$SERVER_PID"
    ;;
  *) echo "Usage : npm run local | db:local:start | db:local:stop" >&2; exit 2 ;;
esac
