import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

type ProductListRow = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  base_price: number;
  sale_price: number;
  price: number;
  is_available: number;
  is_best_seller: number;
  best_seller_order: number;
  display_order: number;
  image_path: string | null;
  image_alt: string | null;
  category_slugs: string | null;
};

@Injectable()
export class ProductsService {
  constructor(private readonly databaseService: DatabaseService) {}

  private readonly listSelect = `
    SELECT
      p.id,
      p.name,
      p.slug,
      p.description,
      p.base_price,
      p.sale_price,
      p.is_available,
      p.is_best_seller,
      p.best_seller_order,
      p.display_order,
      COALESCE(NULLIF(p.sale_price, 0), dv.price, p.base_price) AS price,
      (
        SELECT pi.image_path
        FROM product_images pi
        WHERE pi.product_id = p.id
          AND pi.is_visible = 1
        ORDER BY pi.sort_order, pi.id
        LIMIT 1
      ) AS image_path,
      (
        SELECT pi.alt_text
        FROM product_images pi
        WHERE pi.product_id = p.id
          AND pi.is_visible = 1
        ORDER BY pi.sort_order, pi.id
        LIMIT 1
      ) AS image_alt,
      GROUP_CONCAT(DISTINCT c.slug ORDER BY c.name SEPARATOR ',') AS category_slugs
    FROM products p
    LEFT JOIN product_variant dv
      ON dv.product_id = p.id
      AND dv.is_default = 1
      AND dv.is_active = 1
    LEFT JOIN product_category pc ON pc.product_id = p.id
    LEFT JOIN categories c ON c.id = pc.category_id AND c.is_active = 1
  `;

  async findAll(): Promise<object[]> {
    const rows = await this.databaseService.query<ProductListRow[]>(`
      ${this.listSelect}
      WHERE p.is_active = 1
      GROUP BY p.id, dv.price
      ORDER BY p.display_order, p.name
    `);
    return rows.map((row) => this.mapListRow(row));
  }

  async findBestSellers(): Promise<object[]> {
    const rows = await this.databaseService.query<ProductListRow[]>(`
      ${this.listSelect}
      WHERE p.is_active = 1 AND p.is_best_seller = 1
      GROUP BY p.id, dv.price
      ORDER BY p.best_seller_order, p.name
    `);
    return rows.map((row) => this.mapListRow(row));
  }

  async search(query: string): Promise<object[]> {
    const normalizedQuery = query?.trim();
    if (!normalizedQuery) return this.findAll();

    const rows = await this.databaseService.query<ProductListRow[]>(
      `
      ${this.listSelect}
      WHERE p.is_active = 1 AND (p.name LIKE ? OR p.description LIKE ?)
      GROUP BY p.id, dv.price
      ORDER BY p.display_order, p.name
    `,
      [`%${normalizedQuery}%`, `%${normalizedQuery}%`],
    );
    return rows.map((row) => this.mapListRow(row));
  }

  async findByCategorySlug(categorySlug: string): Promise<object[]> {
    const rows = await this.databaseService.query<ProductListRow[]>(
      `
      ${this.listSelect}
      WHERE p.is_active = 1
        AND EXISTS (
          SELECT 1
          FROM product_category category_filter
          JOIN categories filtered_category ON filtered_category.id = category_filter.category_id
          WHERE category_filter.product_id = p.id
            AND filtered_category.slug = ?
            AND filtered_category.is_active = 1
        )
      GROUP BY p.id, dv.price
      ORDER BY p.display_order, p.name
    `,
      [categorySlug],
    );
    return rows.map((row) => this.mapListRow(row));
  }

  async findOneBySlug(slug: string): Promise<object> {
    const products = await this.databaseService.query<any[]>(
      `
      SELECT
        p.*,
        COALESCE(NULLIF(p.sale_price, 0), dv.price, p.base_price) AS price
      FROM products p
      LEFT JOIN product_variant dv
        ON dv.product_id = p.id
        AND dv.is_default = 1
        AND dv.is_active = 1
      WHERE p.slug = ? AND p.is_active = 1
      LIMIT 1
    `,
      [slug],
    );

    if (!products.length) {
      throw new NotFoundException(`Product '${slug}' not found`);
    }

    const product = products[0];
    const [images, categories, ingredientRows, preferences, variants] =
      await Promise.all([
        this.databaseService.query<any[]>(
          `
        SELECT id, image_path AS path, alt_text AS alt, sort_order
        FROM product_images
        WHERE product_id = ? AND is_visible = 1
        ORDER BY sort_order, id
      `,
          [product.id],
        ),
        this.databaseService.query<any[]>(
          `
        SELECT c.id, c.name, c.slug, c.description, c.theme, c.display_order
        FROM categories c
        JOIN product_category pc ON pc.category_id = c.id
        WHERE pc.product_id = ? AND c.is_active = 1
        ORDER BY c.display_order, c.name
      `,
          [product.id],
        ),
        this.databaseService.query<any[]>(
          `
        SELECT
          i.id,
          i.name,
          i.description,
          pi.is_optional,
          a.id AS allergen_id,
          a.name AS allergen_name,
          a.description AS allergen_description
        FROM product_ingredient pi
        JOIN ingredients i ON i.id = pi.ingredient_id AND i.is_active = 1
        LEFT JOIN ingredient_allergen ia ON ia.ingredient_id = i.id
        LEFT JOIN allergens a ON a.id = ia.allergen_id
        WHERE pi.product_id = ?
        ORDER BY i.name, a.name
      `,
          [product.id],
        ),
        this.databaseService.query<any[]>(
          `
        SELECT dp.id, dp.name, dp.slug, dp.description
        FROM dietary_preferences dp
        JOIN product_dietary_preference pdp ON pdp.dietary_preference_id = dp.id
        WHERE pdp.product_id = ?
        ORDER BY dp.name
      `,
          [product.id],
        ),
        this.databaseService.query<any[]>(
          `
        SELECT id, sku, price, weight_grams, is_default
        FROM product_variant
        WHERE product_id = ? AND is_active = 1
        ORDER BY is_default DESC, price, id
      `,
          [product.id],
        ),
      ]);

    const ingredients = new Map<number, any>();
    const allergens = new Map<number, any>();
    for (const row of ingredientRows) {
      if (!ingredients.has(row.id)) {
        ingredients.set(row.id, {
          id: row.id,
          name: row.name,
          description: row.description,
          isOptional: Boolean(row.is_optional),
          allergens: [],
        });
      }
      if (row.allergen_id) {
        const allergen = {
          id: row.allergen_id,
          name: row.allergen_name,
          description: row.allergen_description,
        };
        ingredients.get(row.id).allergens.push(allergen);
        allergens.set(row.allergen_id, allergen);
      }
    }

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      basePrice: Number(product.base_price),
      salePrice: Number(product.sale_price),
      price: Number(product.price),
      isAvailable: Boolean(product.is_available),
      sku: product.sku,
      images,
      categories: categories.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        theme: category.theme,
        displayOrder: Number(category.display_order),
      })),
      ingredients: [...ingredients.values()],
      allergens: [...allergens.values()],
      dietaryPreferences: preferences,
      variants: variants.map((variant) => ({
        ...variant,
        price: Number(variant.price),
        isDefault: Boolean(variant.is_default),
      })),
    };
  }

  private mapListRow(row: ProductListRow): object {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      basePrice: Number(row.base_price),
      salePrice: Number(row.sale_price),
      price: Number(row.price),
      isAvailable: Boolean(row.is_available),
      isBestSeller: Boolean(row.is_best_seller),
      bestSellerOrder: Number(row.best_seller_order),
      displayOrder: Number(row.display_order),
      image: row.image_path
        ? { path: row.image_path, alt: row.image_alt }
        : null,
      categorySlugs: row.category_slugs ? row.category_slugs.split(',') : [],
    };
  }
}
