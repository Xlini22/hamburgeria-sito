ALTER TABLE guest_sessions
  ADD COLUMN ready_at DATETIME(3) NULL AFTER last_seen_at;

CREATE TABLE IF NOT EXISTS table_orders (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  table_session_id BIGINT UNSIGNED NOT NULL,
  order_number INT UNSIGNED NOT NULL,
  status ENUM('new', 'accepted', 'preparing', 'ready', 'delivered', 'cancelled')
    NOT NULL DEFAULT 'new',
  submitted_by_guest_id BIGINT UNSIGNED NULL,
  idempotency_key CHAR(36) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
    ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_table_order_number (table_session_id, order_number),
  UNIQUE KEY uq_table_order_idempotency (table_session_id, idempotency_key),
  KEY idx_table_orders_status_created (status, created_at),
  CONSTRAINT fk_table_orders_session FOREIGN KEY (table_session_id)
    REFERENCES table_sessions (id),
  CONSTRAINT fk_table_orders_submitter FOREIGN KEY (submitted_by_guest_id)
    REFERENCES guest_sessions (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS table_order_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NULL,
  product_name VARCHAR(160) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  quantity SMALLINT UNSIGNED NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  sort_order INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_table_order_items_order (order_id, sort_order, id),
  CONSTRAINT fk_table_order_items_order FOREIGN KEY (order_id)
    REFERENCES table_orders (id) ON DELETE CASCADE,
  CONSTRAINT fk_table_order_items_product FOREIGN KEY (product_id)
    REFERENCES products (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS table_order_item_preferences (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_item_id BIGINT UNSIGNED NOT NULL,
  preference VARCHAR(300) NOT NULL,
  quantity SMALLINT UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  KEY idx_order_item_preferences_item (order_item_id),
  CONSTRAINT fk_order_item_preferences_item FOREIGN KEY (order_item_id)
    REFERENCES table_order_items (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS table_order_status_history (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL,
  status ENUM('new', 'accepted', 'preparing', 'ready', 'delivered', 'cancelled')
    NOT NULL,
  changed_by_user_id INT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_order_status_history_order (order_id, created_at),
  CONSTRAINT fk_order_status_history_order FOREIGN KEY (order_id)
    REFERENCES table_orders (id) ON DELETE CASCADE,
  CONSTRAINT fk_order_status_history_user FOREIGN KEY (changed_by_user_id)
    REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
