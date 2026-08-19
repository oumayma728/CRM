#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# CRM AI Project - PostgreSQL Backup Script
# =============================================================================
# Usage: ./backup.sh [rotation_days]
#   rotation_days: nombre de jours de rétention (défaut: 30)
#
# Automatisation (cron) :
#   sudo crontab -e
#   # Backup quotidien à 3h du matin
#   0 3 * * * /opt/crm/backup.sh 30 >> /var/log/crm-backup.log 2>&1
# =============================================================================

RETENTION_DAYS="${1:-30}"
REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKUP_DIR="${REPO_DIR}/backups"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
DB_NAME="${DB_NAME:-pfe_crm_ia}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-postgres}"
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "=== CRM AI - Database Backup ==="
echo "  Database : $DB_NAME"
echo "  Output   : $BACKUP_FILE"
echo "  Retention : $RETENTION_DAYS days"

# Backup with pg_dump via docker exec
echo "----------------------------------------"
echo "Starting pg_dump..."
docker exec crm-postgres \
    pg_dump -U "$DB_USER" "$DB_NAME" \
    --clean \
    --if-exists \
    --no-owner \
    --no-privileges \
    --format=custom \
    --compress=9 \
    --file="/tmp/backup.dump"

if [ $? -ne 0 ]; then
    echo "ERROR: pg_dump failed!"
    exit 1
fi

# Copy from container to host
docker cp "crm-postgres:/tmp/backup.dump" "$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.dump"
docker exec crm-postgres rm -f /tmp/backup.dump

# Also export SQL version for portability (gzipped)
docker exec crm-postgres \
    pg_dump -U "$DB_USER" "$DB_NAME" \
    --clean \
    --if-exists \
    --no-owner \
    --no-privileges \
    | gzip > "$BACKUP_FILE"

echo "  Backup complete: $(du -h "$BACKUP_FILE" | cut -f1)"

# Rotation: delete files older than retention period
echo "----------------------------------------"
echo "Cleaning backups older than ${RETENTION_DAYS} days..."
find "$BACKUP_DIR" -name "${DB_NAME}_*.dump" -type f -mtime "+$RETENTION_DAYS" -delete
find "$BACKUP_DIR" -name "${DB_NAME}_*.sql.gz" -type f -mtime "+$RETENTION_DAYS" -delete

# Summary
echo "----------------------------------------"
echo "=== Backup Summary ==="
echo "  Latest: ${DB_NAME}_${TIMESTAMP}.dump"
echo "  Size:   $(du -h "$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.dump" | cut -f1)"
echo "  Total backups: $(find "$BACKUP_DIR" -name "${DB_NAME}_*" -type f | wc -l)"
echo "  Backup dir: $BACKUP_DIR"
echo "=== Backup Complete: $(date) ==="
