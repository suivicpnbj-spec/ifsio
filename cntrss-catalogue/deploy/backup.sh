#!/usr/bin/env bash
# Sauvegarde quotidienne CNTRSS : base SQLite + PDF déposés.
# À planifier en cron : 0 3 * * * /opt/cntrss/deploy/backup.sh
set -euo pipefail

# Valeurs par défaut alignées sur deploy/env.production.example.
DATA_DIR="${DATA_DIR:-/var/lib/cntrss}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/cntrss}"
KEEP_DAYS="${KEEP_DAYS:-30}"

mkdir -p "$BACKUP_DIR"
stamp="$(date +%Y-%m-%d_%H%M%S)"

# 1. Base SQLite : copie fichier par fichier (le -journal peut exister).
if [ -d "$DATA_DIR/prisma" ]; then
  cp -a "$DATA_DIR/prisma" "$BACKUP_DIR/prisma_$stamp"
fi

# 2. PDF déposés : archive tar.gz incrémentale par jour.
if [ -d "$DATA_DIR/uploads" ]; then
  tar -czf "$BACKUP_DIR/uploads_$stamp.tar.gz" -C "$DATA_DIR" uploads
fi

# 3. Purge des sauvegardes plus vieilles que KEEP_DAYS jours.
find "$BACKUP_DIR" -maxdepth 1 -name 'prisma_*' -type d -mtime +"$KEEP_DAYS" -exec rm -rf {} +
find "$BACKUP_DIR" -maxdepth 1 -name 'uploads_*.tar.gz' -mtime +"$KEEP_DAYS" -delete

echo "Sauvegarde $stamp terminée dans $BACKUP_DIR"
