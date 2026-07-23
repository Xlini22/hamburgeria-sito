CREATE TABLE IF NOT EXISTS restaurant_tables (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  table_number INT UNSIGNED NOT NULL,
  name VARCHAR(80) NOT NULL,
  public_token_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_restaurant_tables_number (table_number),
  UNIQUE KEY uq_restaurant_tables_token_hash (public_token_hash),
  KEY idx_restaurant_tables_active (is_active, table_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS table_sessions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  table_id BIGINT UNSIGNED NOT NULL,
  status ENUM('open', 'closed') NOT NULL DEFAULT 'open',
  opened_by_user_id INT NOT NULL,
  closed_by_user_id INT NULL,
  opened_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  closed_at DATETIME(3) NULL,
  open_table_id BIGINT UNSIGNED GENERATED ALWAYS AS (
    CASE WHEN status = 'open' THEN table_id ELSE NULL END
  ) STORED,
  PRIMARY KEY (id),
  UNIQUE KEY uq_table_sessions_one_open (open_table_id),
  KEY idx_table_sessions_table_history (table_id, opened_at),
  CONSTRAINT fk_table_sessions_table FOREIGN KEY (table_id) REFERENCES restaurant_tables (id),
  CONSTRAINT fk_table_sessions_opened_by FOREIGN KEY (opened_by_user_id) REFERENCES users (id),
  CONSTRAINT fk_table_sessions_closed_by FOREIGN KEY (closed_by_user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS guest_sessions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  table_session_id BIGINT UNSIGNED NOT NULL,
  guest_token_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  display_name VARCHAR(40) NOT NULL,
  is_revoked TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  last_seen_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  expires_at DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_guest_sessions_token_hash (guest_token_hash),
  KEY idx_guest_sessions_active (table_session_id, is_revoked, expires_at),
  CONSTRAINT fk_guest_sessions_table_session FOREIGN KEY (table_session_id) REFERENCES table_sessions (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
