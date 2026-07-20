#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$(cd -- "$SCRIPT_DIR/.." && pwd)"
NEST_DIR="$SERVER_DIR/nestjs"
RETENTION_DAYS="${BOURMET_AUDIT_RETENTION_DAYS:-365}"
CONTAINER_NAME="${BOURMET_DB_CONTAINER:-db_jds_ok}"

if [[ ! "$RETENTION_DAYS" =~ ^[1-9][0-9]*$ ]]; then
  echo "BOURMET_AUDIT_RETENTION_DAYS must be a positive integer" >&2
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

docker exec -i -e MYSQL_PWD="$ROOT_PASSWORD" "$CONTAINER_NAME" \
  mysql -uroot hamburgeria <<SQL
START TRANSACTION;
INSERT IGNORE INTO admin_audit_log_archive
  (id, user_id, username, user_role, action, resource_type, resource_id,
   before_data, after_data, ip_address, user_agent, created_at, restored_at,
   restored_by_user_id, restore_log_id, archived_at)
SELECT
  id, user_id, username, user_role, action, resource_type, resource_id,
  before_data, after_data, ip_address, user_agent, created_at, restored_at,
  restored_by_user_id, restore_log_id, NOW(3)
FROM admin_audit_log
WHERE created_at < DATE_SUB(NOW(), INTERVAL ${RETENTION_DAYS} DAY);

DELETE FROM admin_audit_log
WHERE created_at < DATE_SUB(NOW(), INTERVAL ${RETENTION_DAYS} DAY);
COMMIT;
SQL

echo "Audit logs older than $RETENTION_DAYS days archived."
