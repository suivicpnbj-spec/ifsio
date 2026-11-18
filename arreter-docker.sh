#!/usr/bin/env bash
# =============================================================================
# Arrêt de la Suite Campus IFSIO via Docker Compose
# =============================================================================
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

echo "Arrêt des conteneurs Campus Numérique IFSIO..."

DOCKER_CMD="docker compose"
if ! docker compose version >/dev/null 2>&1; then
  if command -v docker-compose >/dev/null 2>&1; then
    DOCKER_CMD="docker-compose"
  fi
fi

if ! docker ps >/dev/null 2>&1; then
  DOCKER_CMD="sudo $DOCKER_CMD"
fi

$DOCKER_CMD down
echo "Tous les conteneurs ont été arrêtés avec succès."
