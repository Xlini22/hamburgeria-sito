CREATE TABLE IF NOT EXISTS guest_cart_items (
  guest_session_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL,
  quantity SMALLINT UNSIGNED NOT NULL,
  preference VARCHAR(300) NOT NULL DEFAULT '',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
    ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (guest_session_id, product_id),
  KEY idx_guest_cart_product (product_id),
  CONSTRAINT fk_guest_cart_guest FOREIGN KEY (guest_session_id)
    REFERENCES guest_sessions (id) ON DELETE CASCADE,
  CONSTRAINT fk_guest_cart_product FOREIGN KEY (product_id)
    REFERENCES products (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
