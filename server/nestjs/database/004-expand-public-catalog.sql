START TRANSACTION;

-- Only categories with a theme are rendered as primary menu sections.
UPDATE categories
SET name = 'Hamburgers', theme = 'burgers', display_order = 10, is_active = 1
WHERE slug = 'burger-classici';

INSERT INTO categories
  (name, slug, description, is_active, theme, display_order, created_at, updated_at)
VALUES
  ('Fritti e insalatone', 'fritti-insalatone', 'Fritti preparati al momento e insalatone.', 1, 'sides', 20, NOW(), NOW()),
  ('Dolci', 'dolci', 'I dessert della cucina Bourmet.', 1, 'desserts', 30, NOW(), NOW()),
  ('Bibite', 'bibite', 'Bevande fresche per accompagnare il menu.', 1, 'drinks', 40, NOW(), NOW())
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  is_active = VALUES(is_active),
  theme = VALUES(theme),
  display_order = VALUES(display_order),
  updated_at = NOW();

INSERT INTO products
  (name, slug, description, base_price, sale_price, sku, is_active, is_best_seller, display_order, created_at, updated_at)
VALUES
  ('Onion rings', 'onion-rings', 'Anelli di cipolla dorati e croccanti, serviti caldi con la nostra salsa.', 6.00, 0, 'SIDE-ONION-RINGS', 1, 0, 10, NOW(), NOW()),
  ('Fiori fritti', 'fiori-fritti', 'Fiori di zucca avvolti in una pastella leggera e fritti al momento.', 7.00, 0, 'SIDE-FIORI-FRITTI', 1, 0, 20, NOW(), NOW()),
  ('Salvia crunch', 'salvia-crunch', 'Foglie di salvia croccanti, profumate e perfette da condividere.', 6.50, 0, 'SIDE-SALVIA-CRUNCH', 1, 0, 30, NOW(), NOW()),
  ('Chick salad', 'chick-salad', 'Un’insalata fresca e completa con pollo, verdure e condimento della casa.', 10.00, 0, 'SIDE-CHICK-SALAD', 1, 0, 40, NOW(), NOW()),
  ('Veggie mix', 'veggie-mix', 'Una selezione di verdure croccanti preparate al momento.', 7.50, 0, 'SIDE-VEGGIE-MIX', 1, 0, 50, NOW(), NOW()),
  ('Fritto Bourmet', 'fritto-bourmet', 'Il nostro fritto misto: sfizioso, abbondante e ideale da condividere.', 9.00, 0, 'SIDE-FRITTO-BOURMET', 1, 0, 60, NOW(), NOW()),
  ('Amarena cake', 'amarena-cake', 'Cheesecake cremosa con amarene, dolce e piacevolmente acidula.', 6.00, 0, 'DESSERT-AMARENA', 1, 0, 10, NOW(), NOW()),
  ('Choco cake', 'choco-cake', 'Una cheesecake golosa ricoperta da una generosa crema al cioccolato.', 6.00, 0, 'DESSERT-CHOCO', 1, 0, 20, NOW(), NOW()),
  ('Pistacchio cake', 'pistacchio-cake', 'Cheesecake vellutata con crema e granella di pistacchio.', 6.50, 0, 'DESSERT-PISTACCHIO', 1, 0, 30, NOW(), NOW()),
  ('Pistacchio pop', 'pistacchio-pop', 'Un dessert al pistacchio dal cuore morbido e dal gusto intenso.', 6.50, 0, 'DESSERT-PISTACCHIO-POP', 1, 0, 40, NOW(), NOW()),
  ('Coca-Cola', 'coca-cola', 'Coca-Cola servita fresca.', 3.50, 0, 'DRINK-COCA-COLA', 1, 0, 10, NOW(), NOW()),
  ('Coca-Cola Zero', 'coca-cola-zero', 'Coca-Cola Zero servita fresca.', 3.50, 0, 'DRINK-COCA-ZERO', 1, 0, 20, NOW(), NOW()),
  ('Fanta', 'fanta', 'Bibita all’arancia servita fresca.', 3.50, 0, 'DRINK-FANTA', 1, 0, 30, NOW(), NOW()),
  ('Sprite', 'sprite', 'Bibita al gusto limone e lime servita fresca.', 3.50, 0, 'DRINK-SPRITE', 1, 0, 40, NOW(), NOW()),
  ('Acqua naturale', 'acqua-naturale', 'Acqua minerale naturale.', 1.50, 0, 'DRINK-WATER-STILL', 1, 0, 50, NOW(), NOW()),
  ('Acqua frizzante', 'acqua-frizzante', 'Acqua minerale frizzante.', 1.50, 0, 'DRINK-WATER-SPARKLING', 1, 0, 60, NOW(), NOW()),
  ('Tè al limone', 'te-limone', 'Tè freddo al limone.', 3.50, 0, 'DRINK-TEA-LEMON', 1, 0, 70, NOW(), NOW()),
  ('Birra bionda', 'birra-bionda', 'Birra bionda fresca.', 5.00, 0, 'DRINK-BEER-BLONDE', 1, 0, 80, NOW(), NOW())
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  base_price = VALUES(base_price),
  sale_price = VALUES(sale_price),
  sku = VALUES(sku),
  is_active = VALUES(is_active),
  display_order = VALUES(display_order),
  updated_at = NOW();

INSERT IGNORE INTO product_category (product_id, category_id)
SELECT p.id, c.id
FROM products p
JOIN categories c
  ON c.slug = CASE
    WHEN p.slug IN ('onion-rings', 'fiori-fritti', 'salvia-crunch', 'chick-salad', 'veggie-mix', 'fritto-bourmet')
      THEN 'fritti-insalatone'
    WHEN p.slug IN ('amarena-cake', 'choco-cake', 'pistacchio-cake', 'pistacchio-pop')
      THEN 'dolci'
    ELSE 'bibite'
  END
WHERE p.slug IN (
  'onion-rings', 'fiori-fritti', 'salvia-crunch', 'chick-salad', 'veggie-mix', 'fritto-bourmet',
  'amarena-cake', 'choco-cake', 'pistacchio-cake', 'pistacchio-pop',
  'coca-cola', 'coca-cola-zero', 'fanta', 'sprite', 'acqua-naturale', 'acqua-frizzante', 'te-limone', 'birra-bionda'
);

INSERT INTO product_images (product_id, image_path, alt_text, sort_order, created_at, updated_at)
SELECT p.id, source.image_path, source.alt_text, 0, NOW(), NOW()
FROM (
  SELECT 'onion-rings' slug, 'images/catalog/sides/onion-rings.jpg' image_path, 'Anelli di cipolla' alt_text
  UNION ALL SELECT 'fiori-fritti', 'images/catalog/sides/fiori-fritti.jpeg', 'Fiori di zucca fritti'
  UNION ALL SELECT 'salvia-crunch', 'images/catalog/sides/salvia-crunch.jpg', 'Salvia fritta croccante'
  UNION ALL SELECT 'chick-salad', 'images/catalog/sides/chick-salad.jpg', 'Insalata di pollo'
  UNION ALL SELECT 'veggie-mix', 'images/catalog/sides/veggie-mix.jpeg', 'Verdure fritte'
  UNION ALL SELECT 'fritto-bourmet', 'images/catalog/sides/fritto-bourmet.jpeg', 'Fritto misto Bourmet'
  UNION ALL SELECT 'amarena-cake', 'images/catalog/desserts/amarena-cake.jpg', 'Cheesecake alle amarene'
  UNION ALL SELECT 'choco-cake', 'images/catalog/desserts/choco-cake.jpg', 'Cheesecake al cioccolato'
  UNION ALL SELECT 'pistacchio-cake', 'images/catalog/desserts/pistacchio-cake.jpg', 'Cheesecake al pistacchio'
  UNION ALL SELECT 'pistacchio-pop', 'images/catalog/desserts/pistacchio-pop.jpg', 'Dolce al pistacchio'
) source
JOIN products p ON p.slug = source.slug
WHERE NOT EXISTS (
  SELECT 1 FROM product_images pi
  WHERE pi.product_id = p.id AND pi.image_path = source.image_path
);

INSERT INTO ingredients (name, description, is_active)
SELECT source.name, NULL, 1
FROM (
  SELECT 'Pastella croccante' name
  UNION ALL SELECT 'Salsa Bourmet'
  UNION ALL SELECT 'Fiori di zucca'
  UNION ALL SELECT 'Pastella'
  UNION ALL SELECT 'Olio di semi'
  UNION ALL SELECT 'Salvia'
  UNION ALL SELECT 'Sale'
  UNION ALL SELECT 'Pollo'
  UNION ALL SELECT 'Verdure'
  UNION ALL SELECT 'Verdure di stagione'
  UNION ALL SELECT 'Selezione di fritti'
  UNION ALL SELECT 'Salse della casa'
  UNION ALL SELECT 'Crema al formaggio'
  UNION ALL SELECT 'Biscotto'
  UNION ALL SELECT 'Amarene'
  UNION ALL SELECT 'Crema al cioccolato'
  UNION ALL SELECT 'Pistacchio'
  UNION ALL SELECT 'Crema'
  UNION ALL SELECT 'Base soffice'
) source
WHERE NOT EXISTS (SELECT 1 FROM ingredients i WHERE i.name = source.name);

INSERT IGNORE INTO product_ingredient (product_id, ingredient_id, is_optional)
SELECT p.id, i.id, 0
FROM (
  SELECT 'onion-rings' slug, 'Cipolla' ingredient
  UNION ALL SELECT 'onion-rings', 'Pastella croccante'
  UNION ALL SELECT 'onion-rings', 'Salsa Bourmet'
  UNION ALL SELECT 'fiori-fritti', 'Fiori di zucca'
  UNION ALL SELECT 'fiori-fritti', 'Pastella'
  UNION ALL SELECT 'fiori-fritti', 'Olio di semi'
  UNION ALL SELECT 'salvia-crunch', 'Salvia'
  UNION ALL SELECT 'salvia-crunch', 'Pastella'
  UNION ALL SELECT 'salvia-crunch', 'Sale'
  UNION ALL SELECT 'chick-salad', 'Pollo'
  UNION ALL SELECT 'chick-salad', 'Insalata'
  UNION ALL SELECT 'chick-salad', 'Verdure'
  UNION ALL SELECT 'chick-salad', 'Salsa Bourmet'
  UNION ALL SELECT 'veggie-mix', 'Verdure di stagione'
  UNION ALL SELECT 'veggie-mix', 'Pastella'
  UNION ALL SELECT 'veggie-mix', 'Olio di semi'
  UNION ALL SELECT 'fritto-bourmet', 'Selezione di fritti'
  UNION ALL SELECT 'fritto-bourmet', 'Verdure'
  UNION ALL SELECT 'fritto-bourmet', 'Salse della casa'
  UNION ALL SELECT 'amarena-cake', 'Crema al formaggio'
  UNION ALL SELECT 'amarena-cake', 'Biscotto'
  UNION ALL SELECT 'amarena-cake', 'Amarene'
  UNION ALL SELECT 'choco-cake', 'Crema al formaggio'
  UNION ALL SELECT 'choco-cake', 'Biscotto'
  UNION ALL SELECT 'choco-cake', 'Crema al cioccolato'
  UNION ALL SELECT 'pistacchio-cake', 'Crema al formaggio'
  UNION ALL SELECT 'pistacchio-cake', 'Biscotto'
  UNION ALL SELECT 'pistacchio-cake', 'Pistacchio'
  UNION ALL SELECT 'pistacchio-pop', 'Pistacchio'
  UNION ALL SELECT 'pistacchio-pop', 'Crema'
  UNION ALL SELECT 'pistacchio-pop', 'Base soffice'
) links
JOIN products p ON p.slug = links.slug
JOIN ingredients i ON i.name = links.ingredient;

INSERT IGNORE INTO ingredient_allergen (ingredient_id, allergen_id)
SELECT i.id, a.id
FROM (
  SELECT 'Pastella croccante' ingredient, 'Glutine' allergen
  UNION ALL SELECT 'Pastella croccante', 'Uova'
  UNION ALL SELECT 'Pastella', 'Glutine'
  UNION ALL SELECT 'Salsa Bourmet', 'Uova'
  UNION ALL SELECT 'Salsa Bourmet', 'Senape'
  UNION ALL SELECT 'Salse della casa', 'Glutine'
  UNION ALL SELECT 'Salse della casa', 'Latte'
  UNION ALL SELECT 'Salse della casa', 'Uova'
  UNION ALL SELECT 'Crema al formaggio', 'Latte'
  UNION ALL SELECT 'Biscotto', 'Glutine'
  UNION ALL SELECT 'Biscotto', 'Uova'
  UNION ALL SELECT 'Crema al cioccolato', 'Latte'
  UNION ALL SELECT 'Crema al cioccolato', 'Frutta a Guscio'
  UNION ALL SELECT 'Pistacchio', 'Frutta a Guscio'
  UNION ALL SELECT 'Crema', 'Latte'
  UNION ALL SELECT 'Base soffice', 'Glutine'
  UNION ALL SELECT 'Base soffice', 'Uova'
) links
JOIN ingredients i ON i.name = links.ingredient
JOIN allergens a ON a.name = links.allergen;

-- Reset the previous selection, then choose 5 burgers, 2 fried products and 1 dessert.
UPDATE products SET is_best_seller = 0;
UPDATE products
SET is_best_seller = 1
WHERE slug IN (
  'affumicato-americano',
  'amante-del-bacon',
  'avocado-deluxe',
  'black-edition-limitata',
  'croccante-di-pollo',
  'onion-rings',
  'fritto-bourmet',
  'pistacchio-cake'
);

COMMIT;
