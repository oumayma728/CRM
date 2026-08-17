#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# CRM AI Project - PostgreSQL Restore Script
# =============================================================================
# Usage: ./restore.sh <backup_file>
#   backup_file: fichier .dump (custom format) ou .sql.gz (plain SQL)
#
# Examples:
#   ./restore.sh backups/pfe_crm_ia_20260712_030000.dump
#   ./restore.sh backups/pfe_crm_ia_20260712_030000.sql.gz
# =============================================================================

if [ $# -lt 1 ]; then
    echo "Usage: $0 <backup_file>"
    echo ""
    echo "Available backups:"
    ls -lh "$(dirname "$0")/backups/" 2>/dev/null || echo "  (no backups found)"
    exit 1
fi

BACKUP_FILE="$1"
REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
DB_NAME="${DB_NAME:-pfe_crm_ia}"
DB_USER="${DB_USER:-postgres}"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "ERROR: Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "=== CRM AI - Database Restore ==="
echo "  Database  : $DB_NAME"
echo "  Backup    : $BACKUP_FILE"
echo "  Size      : $(du -h "$BACKUP_FILE" | cut -f1)"

# Confirmation
echo "----------------------------------------"
echo "WARNING: This will DROP and recreate the '$DB_NAME' database."
echo "         All current data will be LOST."
read -r -p "Are you sure? (yes/N): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "Restore cancelled."
    exit 1
fi

echo "----------------------------------------"
echo "Starting restore..."

case "$BACKUP_FILE" in
    *.dump)
        # Custom format (pg_restore)
        echo "Detected custom format dump. Using pg_restore..."

        # Copy backup file into postgres container
        docker cp "$BACKUP_FILE" crm-postgres:/tmp/backup.dump

        # Drop and recreate the database
        docker exec crm-postgres psql -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS \"$DB_NAME\";"
        docker exec crm-postgres psql -U "$DB_USER" -d postgres -c "CREATE DATABASE \"$DB_NAME\";"

        # Restore
        docker exec crm-postgres pg_restore -U "$DB_USER" -d "$DB_NAME" --clean --if-exists /tmp/backup.dump

        # Cleanup
        docker exec crm-postgres rm -f /tmp/backup.dump
        ;;
    *.sql.gz)
        # Gzipped SQL
        echo "Detected gzipped SQL. Using psql..."
        gunzip -c "$BACKUP_FILE" | docker exec -i crm-postgres psql -U "$DB_USER" -d postgres
        ;;
    *.sql)
        # Plain SQL
        echo "Detected plain SQL. Using psql..."
        docker exec -i crm-postgres psql -U "$DB_USER" -d postgres < "$BACKUP_FILE"
        ;;
    *)
        echo "ERROR: Unsupported backup format: $BACKUP_FILE"
        echo "Supported: .dump (custom), .sql.gz, .sql"
        exit 1
        ;;
esac

if [ $? -eq 0 ]; then
    echo "=== Restore Complete: $(date) ==="
    echo "  Database '$DB_NAME' has been restored from:"
    echo "  $BACKUP_FILE"
else
    echo "ERROR: Restore failed!"
    exit 1
fi
