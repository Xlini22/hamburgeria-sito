#!/bin/bash
set -e

if [ -z "${MYSQL_USER:-}" ] || [ -z "${MYSQL_DATABASE:-}" ]; then
  echo "MYSQL_USER and MYSQL_DATABASE are required" >&2
  exit 1
fi

mysql --protocol=socket -uroot -p"${MYSQL_ROOT_PASSWORD}" <<SQL
REVOKE ALL PRIVILEGES, GRANT OPTION FROM \`${MYSQL_USER}\`@'%';
GRANT SELECT, INSERT, UPDATE, DELETE
  ON \`${MYSQL_DATABASE}\`.* TO \`${MYSQL_USER}\`@'%';
FLUSH PRIVILEGES;
SQL
