START TRANSACTION;

SET @test_product_id = (
  SELECT id
  FROM products
  WHERE slug = 'ddd' AND name = 'aaaa'
  LIMIT 1
);

DELETE FROM product_ingredient
WHERE product_id = @test_product_id;

DELETE FROM product_category
WHERE product_id = @test_product_id;

DELETE FROM product_dietary_preference
WHERE product_id = @test_product_id;

DELETE FROM products
WHERE id = @test_product_id;

COMMIT;
