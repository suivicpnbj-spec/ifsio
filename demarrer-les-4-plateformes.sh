#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IFSIO_DIR="$ROOT/ifsio-site/portal-service"
RESULTATS_DIR="$ROOT/resultats-ifsio-app"
CATALOGUE_DIR="$ROOT/cntrss-catalogue"
ACTES_DIR="$ROOT/mes-actes"
STATE_DIR="${XDG_STATE_HOME:-$HOME/.local/state}/ifsio-suite"
mkdir -p "$STATE_DIR"

OWNED_PIDS=()
OWNED_NAMES=()
IFSIO_URL=""
LAUNCHED_PID=""

port_open() {
  local port="$1"
  (exec 3<>"/dev/tcp/127.0.0.1/$port") >/dev/null 2>&1
}

url_up() {
  curl -fsS --max-time 5 "$1" >/dev/null 2>&1
}


cleanup() {
  local code=$?
  trap - EXIT INT TERM
  if ((${#OWNED_PIDS[@]})); then
    printf '\nArrêt des services lancés…\n' >&2
    for pid in "${OWNED_PIDS[@]}"; do
      if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
        kill -TERM -"$pid" 2>/dev/null || kill -TERM "$pid" 2>/dev/null || true
      fi
    done
  fi
  exit "$code"
}

trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

launch() {
  local name="$1" directory="$2" log="$3"
  shift 3
  printf 'Démarrage de %s…\n' "$name" >&2
  setsid bash -c 'cd "$1"; shift; exec "$@"' launcher "$directory" "$@" >>"$log" 2>&1 </dev/null &
  LAUNCHED_PID=$!
  OWNED_PIDS+=("$LAUNCHED_PID")
  OWNED_NAMES+=("$name")
}

wait_for() {
  local url="$1" name="$2" pid="$3" timeout="$4"
  for ((second=0; second<timeout; second++)); do
    if url_up "$url"; then printf '%s prêt.\n' "$name"; return 0; fi
    if [[ -n "$pid" ]] && ! kill -0 "$pid" 2>/dev/null; then
      echo "$name s’est arrêté au démarrage. Journal : $STATE_DIR/$(printf '%s' "$name" | tr '[:upper:] ' '[:lower:]_').log" >&2
      return 1
    fi
    sleep 1
  done
  printf 'Délai dépassé au démarrage de %s (%s).\n' "$name" "$url" >&2
  return 1
}

printf 'Préparation des quatre plateformes locales…\n\n'

# IFSIO utilise sa configuration locale sur 8081 ; la copie de présentation
# sur 8082 reste reconnue si elle est déjà active.
if url_up http://127.0.0.1:8081/api/health; then
  IFSIO_URL="http://localhost:8081"
  echo 'IFSIO est déjà prêt sur le port 8081.'
elif url_up http://127.0.0.1:8082/api/health; then
  IFSIO_URL="http://localhost:8082"
  echo 'IFSIO est déjà prêt sur le port 8082.'
else
  if port_open 8081; then echo 'Le port 8081 est occupé par un service qui ne répond pas comme IFSIO.' >&2; exit 1; fi
  launch IFSIO "$IFSIO_DIR" "$STATE_DIR/ifsio.log" npm run local
  IFSIO_PID="$LAUNCHED_PID"
  wait_for http://127.0.0.1:8081/api/health IFSIO "$IFSIO_PID" 180
  IFSIO_URL="http://localhost:8081"
fi

# MES RESULTATS utilise PostgreSQL local, l’API sur 3000 et le front sur 5174.
if url_up http://127.0.0.1:3000/api/sante && url_up http://127.0.0.1:5174/; then
  echo 'MES RESULTATS est déjà prêt.'
else
  if port_open 3000 || port_open 5174; then
    echo 'MES RESULTATS est partiellement démarré : vérifie les ports 3000 et 5174 avant de relancer.' >&2
    exit 1
  fi
  launch 'MES RESULTATS' "$RESULTATS_DIR" "$STATE_DIR/mes-resultats.log" bash scripts/start-local.sh
  RESULTATS_PID="$LAUNCHED_PID"
  wait_for http://127.0.0.1:3000/api/sante 'API MES RESULTATS' "$RESULTATS_PID" 120
  wait_for http://127.0.0.1:5174/ 'Interface MES RESULTATS' "$RESULTATS_PID" 90
fi

# CNTRSS Catalogue : port 3100 pour éviter le conflit avec l’API MES RESULTATS (3000).
if url_up http://127.0.0.1:3100/api/health; then
  wait_for http://127.0.0.1:3100/ 'Interface CNTRSS Catalogue' '' 60
  echo 'CNTRSS Catalogue est déjà prêt sur le port 3100.'
else
  if port_open 3100; then echo 'Le port 3100 est occupé par un service qui ne répond pas comme CNTRSS Catalogue.' >&2; exit 1; fi
  launch 'CNTRSS Catalogue' "$CATALOGUE_DIR" "$STATE_DIR/catalogue.log" env PORT=3100 npm run dev
  CATALOGUE_PID="$LAUNCHED_PID"
  wait_for http://127.0.0.1:3100/api/health 'API CNTRSS Catalogue' "$CATALOGUE_PID" 120
  wait_for http://127.0.0.1:3100/ 'Interface CNTRSS Catalogue' "$CATALOGUE_PID" 120
fi

# MES ACTES : Vite sur 5173 et l’API Express sur 4000.
if url_up http://127.0.0.1:5173/ && url_up http://127.0.0.1:4000/api/health; then
  echo 'MES ACTES est déjà prêt.'
else
  if port_open 5173 || port_open 4000; then
    echo 'MES ACTES est partiellement démarré : vérifie les ports 5173 et 4000 avant de relancer.' >&2
    exit 1
  fi
  launch 'MES ACTES' "$ACTES_DIR" "$STATE_DIR/mes-actes.log" npm run dev
  ACTES_PID="$LAUNCHED_PID"
  wait_for http://127.0.0.1:4000/api/health 'API MES ACTES' "$ACTES_PID" 90
  wait_for http://127.0.0.1:5173/ 'Interface MES ACTES' "$ACTES_PID" 90
fi

printf '\nLes quatre plateformes sont prêtes :\n'
printf '  IFSIO             %s\n' "$IFSIO_URL"
printf '  MES RESULTATS     http://localhost:5174\n'
printf '  CNTRSS Catalogue  http://localhost:3100\n'
printf '  MES ACTES         http://localhost:5173\n'
printf '\nLes journaux sont dans %s\n' "$STATE_DIR"
if ((${#OWNED_PIDS[@]})); then
  printf 'Garde cette fenêtre ouverte. Ctrl+C arrête uniquement les services lancés par ce bouton.\n'
else
  printf 'Les services étaient déjà actifs ; cette fenêtre peut être fermée.\n'
  exit 0
fi

if [[ "${OPEN_BROWSER:-1}" == 1 ]] && command -v xdg-open >/dev/null 2>&1; then
  for url in "$IFSIO_URL" http://localhost:5174 http://localhost:3100 http://localhost:5173; do
    xdg-open "$url" >/dev/null 2>&1 || true
    sleep 0.4
  done
fi

while :; do sleep 60; done
