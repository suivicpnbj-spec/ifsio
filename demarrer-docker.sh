#!/usr/bin/env bash
# =============================================================================
# Démarrage de la Suite Campus IFSIO via Docker Compose
# =============================================================================
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

echo "=== CAMPUS NUMÉRIQUE IFSIO (PARAKOU) ==="
echo "Démarrage des conteneurs via Docker Compose..."

# Détection de la commande Docker
DOCKER_CMD="docker compose"
if ! docker compose version >/dev/null 2>&1; then
  if command -v docker-compose >/dev/null 2>&1; then
    DOCKER_CMD="docker-compose"
  else
    echo "Erreur : Docker Compose n'est pas disponible." >&2
    exit 1
  fi
fi

# Vérification des droits d'accès au socket Docker
if ! docker ps >/dev/null 2>&1; then
  echo "Attention : l'utilisateur courant n'a pas accès direct à /var/run/docker.sock."
  echo "Tentative d'exécution avec sudo..."
  DOCKER_CMD="sudo $DOCKER_CMD"
fi

$DOCKER_CMD up -d --build

echo ""
echo "Les plateformes sont en cours d'initialisation :"
echo "  1. IFSIO Site & Hub       : http://localhost:8081"
echo "  2. Mes Résultats          : http://localhost:5174 (API: http://localhost:3000)"
echo "  3. Mes Actes              : http://localhost:5173 (API: http://localhost:4000)"
echo "     * Portail Anti-Fraude  : http://localhost:5173/#/verifier"
echo "  4. CNTRSS Catalogue       : http://localhost:3100"
echo "  5. PostgreSQL unifié      : localhost:5432 (utilisateur: ifsio)"
echo ""
echo "Pour consulter les journaux : $DOCKER_CMD logs -f"
echo "Pour arrêter la suite       : ./arreter-docker.sh"
