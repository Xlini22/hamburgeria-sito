#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$(cd -- "$SCRIPT_DIR/.." && pwd)"
NEST_DIR="$SERVER_DIR/nestjs"
BACKUP_DIR="${BOURMET_BACKUP_DIR:-$SERVER_DIR/backups/database}"
RETENTION_DAYS="${BOURMET_BACKUP_RETENTION_DAYS:-14}"
CONTAINER_NAME="${BOURMET_DB_CONTAINER:-db_jds_ok}"

if [[ ! "$RETENTION_DAYS" =~ ^[0-9]+$ ]]; then
  echo "BOURMET_BACKUP_RETENTION_DAYS must be a non-negative integer" >&2
  exit 1
fi

set -a
source "$NEST_DIR/.env"
set +a

ROOT_PASSWORD="${DB_ROOT_PASSWORD:-${DB_ROOT:-}}"
if [[ -z "$ROOT_PASSWORD" ]]; then
  echo "DB_ROOT or DB_ROOT_PASSWORD is missing from server/nestjs/.env" >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"
umask 077

timestamp="$(date -u +'%Y-%m-%dT%H-%M-%SZ')"
final_path="$BACKUP_DIR/hamburgeria-$timestamp.sql.gz"
temporary_path="$final_path.partial"

cleanup() {
  rm -f -- "$temporary_path"
}
trap cleanup EXIT

docker exec -e MYSQL_PWD="$ROOT_PASSWORD" "$CONTAINER_NAME" \
  mysqldump -uroot \
  --single-transaction \
  --quick \
  --routines \
  --triggers \
  --events \
  --default-character-set=utf8mb4 \
  hamburgeria |
  gzip -9 >"$temporary_path"

gzip -t "$temporary_path"
mv -- "$temporary_path" "$final_path"
trap - EXIT

find "$BACKUP_DIR" -maxdepth 1 -type f \
  -name 'hamburgeria-*.sql.gz' \
  -mtime "+$RETENTION_DAYS" -delete

echo "Backup created: $final_path"
