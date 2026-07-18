import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { ProductsService } from '../products/products.service';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly productsService: ProductsService,
  ) {}

  async findAll() {
    const rows = await this.databaseService.query<any[]>(`
      SELECT
        c.id,
        c.name,
        c.slug,
        c.description,
        c.theme,
        c.display_order,
        COUNT(DISTINCT CASE WHEN p.is_active = 1 THEN p.id END) AS product_count
      FROM categories c
      LEFT JOIN product_category pc ON pc.category_id = c.id
      LEFT JOIN products p ON p.id = pc.product_id
      WHERE c.is_active = 1
      GROUP BY c.id
      ORDER BY c.display_order, c.name
    `);
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      theme: row.theme,
      displayOrder: Number(row.display_order),
      productCount: Number(row.product_count),
    }));
  }

  async findMenu() {
    const [categories, products] = await Promise.all([
      this.findAll(),
      this.productsService.findAll(),
    ]);
    const typedProducts = products as Array<{ categorySlugs: string[] }>;
    const menu = categories
      .map((category) => ({
        ...category,
        products: typedProducts.filter((product) =>
          product.categorySlugs.includes(category.slug),
        ),
      }))
      .filter((category) => category.theme && category.products.length > 0);
    const uncategorized = typedProducts.filter(
      (product) => product.categorySlugs.length === 0,
    );

    if (uncategorized.length) {
      menu.push({
        id: 0,
        name: 'Altri prodotti',
        slug: 'altri-prodotti',
        description: null,
        theme: null,
        displayOrder: Number.MAX_SAFE_INTEGER,
        productCount: uncategorized.length,
        products: uncategorized,
      });
    }

    return { categories: menu };
  }

  async findProducts(slug: string) {
    const categories = await this.databaseService.query<any[]>(
      `
      SELECT id, name, slug, description, theme, display_order
      FROM categories
      WHERE slug = ? AND is_active = 1
      LIMIT 1
    `,
      [slug],
    );

    if (!categories.length) {
      throw new NotFoundException(`Category '${slug}' not found`);
    }

    return {
      category: {
        id: categories[0].id,
        name: categories[0].name,
        slug: categories[0].slug,
        description: categories[0].description,
        theme: categories[0].theme,
        displayOrder: Number(categories[0].display_order),
      },
      products: await this.productsService.findByCategorySlug(slug),
    };
  }
}
