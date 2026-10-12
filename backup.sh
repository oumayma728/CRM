#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# CRM AI Project - PostgreSQL Backup Script
# =============================================================================
# Usage: ./backup.sh [retention_days]        (default: 30 days)
#
# Creates, in ./backups/ :
#   <db>_<date>_<time>.dump     custom PostgreSQL format (fast restore with pg_restore / restore.sh)
#   <db>_<date>_<time>.sql.gz   compressed SQL (portable)
# then deletes backups older than <retention_days> and CHECKS that the .dump can really be read back
# (a backup that was never verified is not a backup).
#
# Two modes:
#   - default (Docker): talks to the container "crm-postgres" (same as restore.sh)
#   - BACKUP_MODE=local: uses the pg_dump installed on this machine; connection through the standard
#     variables PGHOST / PGPORT / PGUSER / PGPASSWORD (useful for a managed database or a developer PC)
#
# Variables: DB_NAME (default pfe_crm_ia), DB_USER (default postgres)
# Cron (every day at 3:00, 30 days kept):
#   0 3 * * * /opt/crm/backup.sh 30 >> /var/log/crm-backup.log 2>&1
# =============================================================================

RETENTION_DAYS="${1:-30}"
REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$REPO_DIR/backups}"
DB_NAME="${DB_NAME:-pfe_crm_ia}"
DB_USER="${DB_USER:-postgres}"
MODE="${BACKUP_MODE:-docker}"
STAMP="$(date +%Y%m%d_%H%M%S)"
BASE="$BACKUP_DIR/${DB_NAME}_${STAMP}"

case "$RETENTION_DAYS" in ''|*[!0-9]*) echo "ERROR: retention must be a number of days (got '$RETENTION_DAYS')"; exit 1 ;; esac
mkdir -p "$BACKUP_DIR"

echo "=== CRM AI - Database Backup: $(date) ==="
echo "  Database  : $DB_NAME ($MODE mode)"
echo "  Target    : $BACKUP_DIR"

dump_custom() {   # writes the custom-format dump on stdout
    if [ "$MODE" = "local" ]; then pg_dump -U "$DB_USER" -d "$DB_NAME" -Fc
    else docker exec crm-postgres pg_dump -U "$DB_USER" -d "$DB_NAME" -Fc; fi
}
dump_sql() {      # writes plain SQL on stdout
    if [ "$MODE" = "local" ]; then pg_dump -U "$DB_USER" -d "$DB_NAME" --clean --if-exists --create
    else docker exec crm-postgres pg_dump -U "$DB_USER" -d "$DB_NAME" --clean --if-exists --create; fi
}

# 1) custom format, written to a temporary name first: a crash never leaves a half file that looks like a backup
if ! dump_custom > "$BASE.dump.part"; then
    rm -f "$BASE.dump.part"
    echo "ERROR: pg_dump failed - no backup was created"
    exit 1
fi
mv "$BASE.dump.part" "$BASE.dump"

# 2) compressed SQL
if ! dump_sql | gzip > "$BASE.sql.gz.part"; then
    rm -f "$BASE.sql.gz.part"
    echo "ERROR: SQL dump failed (the .dump file was created)"
    exit 1
fi
mv "$BASE.sql.gz.part" "$BASE.sql.gz"

# 3) verification: the .dump must be readable and contain tables
if [ "$MODE" = "local" ]; then CONTENT="$(pg_restore --list "$BASE.dump" 2>/dev/null || true)"
else CONTENT="$(docker exec -i crm-postgres pg_restore --list < "$BASE.dump" 2>/dev/null || true)"; fi
TABLES="$(printf '%s\n' "$CONTENT" | grep -c ' TABLE public ' || true)"
if [ "$TABLES" -lt 1 ]; then
    echo "ERROR: the backup $BASE.dump cannot be read back (no table found) - do NOT rely on it"
    exit 1
fi

# 4) retention
DELETED="$(find "$BACKUP_DIR" -maxdepth 1 -type f \( -name "${DB_NAME}_*.dump" -o -name "${DB_NAME}_*.sql.gz" \) -mtime +"$RETENTION_DAYS" -print -delete | wc -l | tr -d ' ')"

echo "=== Backup Complete ==="
echo "  $BASE.dump    ($(du -h "$BASE.dump" | cut -f1), $TABLES tables checked)"
echo "  $BASE.sql.gz  ($(du -h "$BASE.sql.gz" | cut -f1))"
echo "  Old backups deleted (> $RETENTION_DAYS days): $DELETED"
