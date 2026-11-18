#!/usr/bin/env bash
set -euo pipefail
DATA_DIR="${HOME}/.local/share/ifsio-postgres/data"
LOG_FILE="${HOME}/.local/share/ifsio-postgres/postgres.log"
PG_CTL="/usr/lib/postgresql/16/bin/pg_ctl"
case "${1:-status}" in
  start) "$PG_CTL" -D "$DATA_DIR" -l "$LOG_FILE" -o "-p 55432 -h 127.0.0.1 -k ${HOME}/.local/share/ifsio-postgres/socket" start ;;
  stop) "$PG_CTL" -D "$DATA_DIR" -m fast stop ;;
  status) "$PG_CTL" -D "$DATA_DIR" status ;;
  *) echo "Usage: $0 {start|stop|status}" >&2; exit 2 ;;
esac
