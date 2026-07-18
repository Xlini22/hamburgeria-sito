-- Bourmet website catalog fields.
-- This migration is intentionally not applied automatically.
-- Back up the database before running it.

ALTER TABLE products
  ADD COLUMN is_best_seller TINYINT(1) NOT NULL DEFAULT 0 AFTER is_active,
  ADD COLUMN display_order INT NOT NULL DEFAULT 0 AFTER is_best_seller;

ALTER TABLE categories
  ADD COLUMN theme VARCHAR(50) NULL AFTER is_active,
  ADD COLUMN display_order INT NOT NULL DEFAULT 0 AFTER theme;

CREATE INDEX idx_products_public_order
  ON products (is_active, display_order, name);

CREATE INDEX idx_products_best_sellers
  ON products (is_active, is_best_seller, display_order);

CREATE INDEX idx_categories_public_order
  ON categories (is_active, display_order, name);

ALTER TABLE products
  ADD CONSTRAINT uq_products_slug UNIQUE (slug);

ALTER TABLE categories
  ADD CONSTRAINT uq_categories_slug UNIQUE (slug);
