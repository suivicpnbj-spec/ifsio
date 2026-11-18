#!/usr/bin/env bash
set -Eeuo pipefail

PRESENTATION_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IFSIO_START="$PRESENTATION_DIR/start-presentation.sh"
RESULTS_DIR="$(cd "$PRESENTATION_DIR/../../resultats-ifsio-app" && pwd)"
IFSIO_PID=""
RESULTS_PID=""

cleanup() {
  local code=$?
  trap - EXIT INT TERM
  for pid in "$RESULTS_PID" "$IFSIO_PID"; do
    if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then kill -TERM "$pid" 2>/dev/null || true; fi
  done
  for pid in "$RESULTS_PID" "$IFSIO_PID"; do
    if [[ -n "$pid" ]]; then wait "$pid" 2>/dev/null || true; fi
  done
  exit "$code"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

wait_for_url() {
  local url="$1" label="$2" timeout="$3"
  for ((second=0; second<timeout; second++)); do
    if curl -fsS --max-time 2 "$url" >/dev/null 2>&1; then
      printf '%s est prêt.\n' "$label"
      return 0
    fi
    if [[ -n "$IFSIO_PID" ]] && ! kill -0 "$IFSIO_PID" 2>/dev/null; then
      echo 'Le service IFSIO s’est arrêté pendant le démarrage.' >&2; return 1
    fi
    if [[ -n "$RESULTS_PID" ]] && ! kill -0 "$RESULTS_PID" 2>/dev/null; then
      echo 'MES RESULTATS s’est arrêté pendant le démarrage.' >&2; return 1
    fi
    sleep 1
  done
  printf 'Délai dépassé au démarrage de %s.\n' "$label" >&2
  return 1
}

echo 'Démarrage du portail IFSIO…'
"$IFSIO_START" &
IFSIO_PID=$!
wait_for_url 'http://127.0.0.1:8082/api/health' 'IFSIO' 240

echo 'Démarrage de MES RESULTATS…'
(
  cd "$RESULTS_DIR"
  exec bash scripts/start-local.sh
) &
RESULTS_PID=$!
wait_for_url 'http://127.0.0.1:3000/api/sante' 'API MES RESULTATS' 120
wait_for_url 'http://127.0.0.1:5174/' 'Interface MES RESULTATS' 60

LAN_IP="$(ip -4 route get 8.8.8.8 2>/dev/null | awk '{for(i=1;i<=NF;i++) if($i=="src"){print $(i+1); exit}}')"

printf '\nIFSIO : http://localhost:8082\nAdministration : http://localhost:8082/administration.html\nEspace étudiant : http://localhost:8082/espace-apprenants.html\nMES RESULTATS : http://localhost:5174\nArrêt des deux applications : Ctrl+C\n\n'
if [[ -n "$LAN_IP" ]]; then
  printf 'Depuis un téléphone connecté au même Wi-Fi :\nIFSIO : http://%s:8082\nAdministration : http://%s:8082/administration.html\nEspace étudiant : http://%s:8082/espace-apprenants.html\nMES RESULTATS : http://%s:5174\n\n' "$LAN_IP" "$LAN_IP" "$LAN_IP" "$LAN_IP"
fi

while kill -0 "$IFSIO_PID" 2>/dev/null && kill -0 "$RESULTS_PID" 2>/dev/null; do sleep 1; done
echo 'Un des services s’est arrêté. Arrêt de l’autre service.' >&2
exit 1
