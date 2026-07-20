import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export type AdminProductInput = {
  name?: string;
  slug?: string;
  description?: string | null;
  basePrice?: number;
  salePrice?: number;
  isActive?: boolean;
  isAvailable?: boolean;
  isBestSeller?: boolean;
  bestSellerOrder?: number;
  displayOrder?: number;
  categoryIds?: number[];
  ingredientIds?: number[];
};

export type AdminIngredientInput = {
  name?: string;
  allergenIds?: number[];
};

export type AdminAllergenInput = {
  name?: string;
  description?: string | null;
};

export type AdminCategoryInput = {
  name?: string;
  slug?: string;
  theme?: string;
  displayOrder?: number;
  isActive?: boolean;
};

@Injectable()
export class AdminProductsService {
  constructor(private readonly databaseService: DatabaseService) {}

  async findAll() {
    const rows = await this.databaseService.query<any[]>(`
      SELECT
        p.id,
        p.name,
        p.slug,
        p.description,
        p.base_price,
        p.sale_price,
        p.is_active,
        p.is_available,
        p.is_best_seller,
        p.best_seller_order,
        p.display_order,
        (
          SELECT pi.image_path
          FROM product_images pi
          WHERE pi.product_id = p.id
            AND pi.is_visible = 1
          ORDER BY pi.sort_order, pi.id
          LIMIT 1
        ) AS image_path,
        GROUP_CONCAT(DISTINCT c.id ORDER BY c.display_order, c.name) AS category_ids,
        GROUP_CONCAT(DISTINCT c.name ORDER BY c.display_order, c.name SEPARATOR '|||') AS category_names,
        GROUP_CONCAT(DISTINCT pi.ingredient_id ORDER BY pi.ingredient_id) AS ingredient_ids
      FROM products p
      LEFT JOIN product_category pc ON pc.product_id = p.id
      LEFT JOIN categories c ON c.id = pc.category_id AND c.theme IS NOT NULL
      LEFT JOIN product_ingredient pi ON pi.product_id = p.id
      GROUP BY p.id
      ORDER BY p.is_active DESC, p.display_order, p.name
    `);
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      basePrice: Number(row.base_price),
      salePrice: Number(row.sale_price),
      isActive: Boolean(row.is_active),
      isAvailable: Boolean(row.is_available),
      isBestSeller: Boolean(row.is_best_seller),
      bestSellerOrder: Number(row.best_seller_order),
      displayOrder: Number(row.display_order),
      imagePath: row.image_path,
      categoryIds: row.category_ids
        ? row.category_ids.split(',').map(Number)
        : [],
      categoryNames: row.category_names ? row.category_names.split('|||') : [],
      ingredientIds: row.ingredient_ids
        ? row.ingredient_ids.split(',').map(Number)
        : [],
    }));
  }

  async findCategories() {
    const rows = await this.databaseService.query<any[]>(`
      SELECT
        c.id,
        c.name,
        c.slug,
        c.description,
        c.theme,
        c.display_order,
        c.is_active,
        COUNT(DISTINCT pc.product_id) AS product_count
      FROM categories c
      LEFT JOIN product_category pc ON pc.category_id = c.id
      WHERE c.theme IS NOT NULL
      GROUP BY c.id
      ORDER BY c.is_active DESC, c.display_order, c.name
    `);
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      theme: row.theme,
      displayOrder: Number(row.display_order),
      isActive: Boolean(row.is_active),
      productCount: Number(row.product_count),
    }));
  }

  async createCategory(input: AdminCategoryInput) {
    const data = this.validateCategory(input, true);
    try {
      const result = await this.databaseService.query<any>(
        `INSERT INTO categories
          (name, slug, description, is_active, theme, display_order, created_at, updated_at)
         VALUES (?, ?, NULL, ?, ?, ?, NOW(), NOW())`,
        [data.name, data.slug, data.isActive, data.theme, data.displayOrder],
      );
      return { id: result.insertId };
    } catch (error: any) {
      if (error?.code === 'ER_DUP_ENTRY') {
        throw new ConflictException('A category with this slug already exists');
      }
      throw error;
    }
  }

  async updateCategory(id: number, input: AdminCategoryInput) {
    const data = this.validateCategory(input, false);
    const categories = await this.databaseService.query<any[]>(
      'SELECT id FROM categories WHERE id = ? AND theme IS NOT NULL LIMIT 1',
      [id],
    );
    if (!categories.length) throw new NotFoundException('Category not found');

    const assignments: string[] = [];
    const values: any[] = [];
    const fields: Array<[keyof AdminCategoryInput, string]> = [
      ['name', 'name'],
      ['slug', 'slug'],
      ['theme', 'theme'],
      ['displayOrder', 'display_order'],
      ['isActive', 'is_active'],
    ];
    fields.forEach(([property, column]) => {
      if (data[property] !== undefined) {
        assignments.push(`${column} = ?`);
        values.push(data[property]);
      }
    });
    if (!assignments.length) return { id };
    values.push(id);
    try {
      await this.databaseService.query(
        `UPDATE categories
         SET ${assignments.join(', ')}, updated_at = NOW()
         WHERE id = ?`,
        values,
      );
      return { id };
    } catch (error: any) {
      if (error?.code === 'ER_DUP_ENTRY') {
        throw new ConflictException('A category with this slug already exists');
      }
      throw error;
    }
  }

  async removeCategory(id: number) {
    const categories = await this.databaseService.query<any[]>(
      `SELECT c.id, COUNT(DISTINCT pc.product_id) AS product_count
       FROM categories c
       LEFT JOIN product_category pc ON pc.category_id = c.id
       WHERE c.id = ? AND c.theme IS NOT NULL
       GROUP BY c.id`,
      [id],
    );
    if (!categories.length) throw new NotFoundException('Category not found');
    const productCount = Number(categories[0].product_count);
    if (productCount > 0) {
      throw new ConflictException(
        `Category is used by ${productCount} products and cannot be deleted`,
      );
    }
    await this.databaseService.query('DELETE FROM categories WHERE id = ?', [
      id,
    ]);
    return { id };
  }

  async saveBestSellers(productIdsInput: unknown) {
    if (!Array.isArray(productIdsInput)) {
      throw new BadRequestException('productIds must be an array');
    }
    const productIds = [
      ...new Set(productIdsInput.map(Number).filter(Number.isInteger)),
    ];
    if (productIds.length !== productIdsInput.length) {
      throw new BadRequestException(
        'productIds must contain unique valid product ids',
      );
    }

    await this.databaseService.transaction(async (query) => {
      await query(
        'UPDATE products SET is_best_seller = 0, best_seller_order = 0',
      );
      for (let index = 0; index < productIds.length; index += 1) {
        const result = await query<any>(
          `UPDATE products
           SET is_best_seller = 1, best_seller_order = ?, updated_at = NOW()
           WHERE id = ? AND is_active = 1`,
          [index + 1, productIds[index]],
        );
        if (result.affectedRows !== 1) {
          throw new BadRequestException(
            `Product ${productIds[index]} does not exist or is inactive`,
          );
        }
      }
    });
    return { count: productIds.length };
  }

  async findIngredients() {
    const rows = await this.databaseService.query<any[]>(`
      SELECT
        i.id,
        i.name,
        i.is_active,
        GROUP_CONCAT(DISTINCT a.id ORDER BY a.name) AS allergen_ids,
        GROUP_CONCAT(DISTINCT a.name ORDER BY a.name SEPARATOR '|||') AS allergen_names,
        COUNT(DISTINCT pi.product_id) AS product_count
      FROM ingredients i
      LEFT JOIN ingredient_allergen ia ON ia.ingredient_id = i.id
      LEFT JOIN allergens a ON a.id = ia.allergen_id
      LEFT JOIN product_ingredient pi ON pi.ingredient_id = i.id
      WHERE i.is_active = 1
      GROUP BY i.id
      ORDER BY i.name
    `);
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      allergenIds: row.allergen_ids
        ? row.allergen_ids.split(',').map(Number)
        : [],
      allergenNames: row.allergen_names ? row.allergen_names.split('|||') : [],
      productCount: Number(row.product_count),
    }));
  }

  async findAllergens() {
    const rows = await this.databaseService.query<any[]>(`
      SELECT
        a.id,
        a.name,
        a.description,
        COUNT(DISTINCT ia.ingredient_id) AS ingredient_count,
        COUNT(DISTINCT pi.product_id) AS product_count
      FROM allergens a
      LEFT JOIN ingredient_allergen ia ON ia.allergen_id = a.id
      LEFT JOIN product_ingredient pi ON pi.ingredient_id = ia.ingredient_id
      GROUP BY a.id
      ORDER BY a.name
    `);
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      ingredientCount: Number(row.ingredient_count),
      productCount: Number(row.product_count),
    }));
  }

  async createAllergen(input: AdminAllergenInput) {
    const name = input.name?.trim();
    const description = input.description?.trim() || null;
    if (!name) throw new BadRequestException('Allergen name is required');

    const duplicate = await this.databaseService.query<any[]>(
      'SELECT id FROM allergens WHERE LOWER(name) = LOWER(?) LIMIT 1',
      [name],
    );
    if (duplicate.length) {
      throw new ConflictException('An allergen with this name already exists');
    }

    const result = await this.databaseService.query<any>(
      'INSERT INTO allergens (name, description) VALUES (?, ?)',
      [name, description],
    );
    return { id: result.insertId };
  }

  async findAllergenUsage(id: number) {
    const allergens = await this.databaseService.query<any[]>(
      'SELECT id, name FROM allergens WHERE id = ? LIMIT 1',
      [id],
    );
    if (!allergens.length) throw new NotFoundException('Allergen not found');

    const [ingredients, products] = await Promise.all([
      this.databaseService.query<any[]>(
        `SELECT DISTINCT i.id, i.name
         FROM ingredient_allergen ia
         JOIN ingredients i ON i.id = ia.ingredient_id
         WHERE ia.allergen_id = ?
         ORDER BY i.name`,
        [id],
      ),
      this.databaseService.query<any[]>(
        `SELECT DISTINCT p.id, p.name
         FROM ingredient_allergen ia
         JOIN product_ingredient pi ON pi.ingredient_id = ia.ingredient_id
         JOIN products p ON p.id = pi.product_id
         WHERE ia.allergen_id = ?
         ORDER BY p.name`,
        [id],
      ),
    ]);
    return {
      id,
      name: allergens[0].name,
      ingredients,
      products,
      ingredientCount: ingredients.length,
      productCount: products.length,
    };
  }

  async removeAllergen(id: number) {
    const usage = await this.findAllergenUsage(id);
    await this.databaseService.transaction(async (query) => {
      await query('DELETE FROM ingredient_allergen WHERE allergen_id = ?', [
        id,
      ]);
      await query('DELETE FROM allergens WHERE id = ?', [id]);
    });
    return {
      id,
      removedFromIngredients: usage.ingredientCount,
      affectedProducts: usage.productCount,
    };
  }

  async createIngredient(input: AdminIngredientInput) {
    const name = input.name?.trim();
    if (!name) throw new BadRequestException('Ingredient name is required');
    const allergenIds = Array.isArray(input.allergenIds)
      ? [...new Set(input.allergenIds.map(Number).filter(Number.isInteger))]
      : [];
    const duplicate = await this.databaseService.query<any[]>(
      'SELECT id FROM ingredients WHERE LOWER(name) = LOWER(?) LIMIT 1',
      [name],
    );
    if (duplicate.length) {
      throw new ConflictException(
        'An ingredient with this name already exists',
      );
    }

    const id = await this.databaseService.transaction<number>(async (query) => {
      const result = await query<any>(
        'INSERT INTO ingredients (name, description, is_active) VALUES (?, NULL, 1)',
        [name],
      );
      for (const allergenId of allergenIds) {
        await query(
          `INSERT IGNORE INTO ingredient_allergen (ingredient_id, allergen_id)
           SELECT ?, id FROM allergens WHERE id = ?`,
          [result.insertId, allergenId],
        );
      }
      return result.insertId;
    });
    return { id };
  }

  async updateIngredient(id: number, input: AdminIngredientInput) {
    const name = input.name?.trim();
    if (!name) throw new BadRequestException('Ingredient name is required');
    const allergenIds = Array.isArray(input.allergenIds)
      ? [...new Set(input.allergenIds.map(Number).filter(Number.isInteger))]
      : [];
    const ingredients = await this.databaseService.query<any[]>(
      'SELECT id FROM ingredients WHERE id = ? LIMIT 1',
      [id],
    );
    if (!ingredients.length) {
      throw new NotFoundException('Ingredient not found');
    }
    const duplicate = await this.databaseService.query<any[]>(
      `SELECT id FROM ingredients
       WHERE LOWER(name) = LOWER(?) AND id <> ?
       LIMIT 1`,
      [name, id],
    );
    if (duplicate.length) {
      throw new ConflictException(
        'An ingredient with this name already exists',
      );
    }

    await this.databaseService.transaction(async (query) => {
      await query(
        'UPDATE ingredients SET name = ?, is_active = 1 WHERE id = ?',
        [name, id],
      );
      await query('DELETE FROM ingredient_allergen WHERE ingredient_id = ?', [
        id,
      ]);
      for (const allergenId of allergenIds) {
        await query(
          `INSERT IGNORE INTO ingredient_allergen
            (ingredient_id, allergen_id)
           SELECT ?, id FROM allergens WHERE id = ?`,
          [id, allergenId],
        );
      }
    });
    return { id };
  }

  async removeIngredient(id: number) {
    const ingredients = await this.databaseService.query<any[]>(
      `SELECT i.id, COUNT(DISTINCT pi.product_id) AS product_count
       FROM ingredients i
       LEFT JOIN product_ingredient pi ON pi.ingredient_id = i.id
       WHERE i.id = ?
       GROUP BY i.id`,
      [id],
    );
    if (!ingredients.length) {
      throw new NotFoundException('Ingredient not found');
    }
    await this.databaseService.transaction(async (query) => {
      await query('DELETE FROM product_ingredient WHERE ingredient_id = ?', [
        id,
      ]);
      await query('DELETE FROM ingredient_allergen WHERE ingredient_id = ?', [
        id,
      ]);
      await query('DELETE FROM ingredients WHERE id = ?', [id]);
    });
    return {
      id,
      removedFromProducts: Number(ingredients[0].product_count),
    };
  }

  async create(input: AdminProductInput) {
    const data = this.validate(input, true);
    try {
      const id = await this.databaseService.transaction<number>(
        async (query) => {
          const result = await query<any>(
            `INSERT INTO products
              (name, slug, description, base_price, sale_price, is_active, is_available, is_best_seller, display_order, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [
              data.name,
              data.slug,
              data.description,
              data.basePrice,
              data.salePrice,
              data.isActive,
              data.isAvailable,
              data.isBestSeller,
              data.displayOrder,
            ],
          );
          await this.replaceMenuCategories(
            query,
            result.insertId,
            data.categoryIds ?? [],
          );
          await this.replaceProductIngredients(
            query,
            result.insertId,
            data.ingredientIds ?? [],
          );
          return result.insertId;
        },
      );
      return { id };
    } catch (error: any) {
      this.handleDatabaseError(error);
    }
  }

  async update(id: number, input: AdminProductInput) {
    if (!Number.isInteger(id) || id < 1) {
      throw new BadRequestException('Invalid product id');
    }
    const data = this.validate(input, false);
    const existing = await this.databaseService.query<any[]>(
      'SELECT id FROM products WHERE id = ? LIMIT 1',
      [id],
    );
    if (!existing.length) throw new NotFoundException('Product not found');

    try {
      await this.databaseService.transaction(async (query) => {
        const assignments: string[] = [];
        const values: any[] = [];
        const fields: Array<[keyof AdminProductInput, string]> = [
          ['name', 'name'],
          ['slug', 'slug'],
          ['description', 'description'],
          ['basePrice', 'base_price'],
          ['salePrice', 'sale_price'],
          ['isActive', 'is_active'],
          ['isAvailable', 'is_available'],
          ['isBestSeller', 'is_best_seller'],
          ['bestSellerOrder', 'best_seller_order'],
          ['displayOrder', 'display_order'],
        ];
        fields.forEach(([property, column]) => {
          if (data[property] !== undefined) {
            assignments.push(`${column} = ?`);
            values.push(data[property]);
          }
        });
        if (assignments.length) {
          values.push(id);
          await query(
            `UPDATE products SET ${assignments.join(', ')}, updated_at = NOW() WHERE id = ?`,
            values,
          );
        }
        if (data.categoryIds !== undefined) {
          await this.replaceMenuCategories(query, id, data.categoryIds);
        }
        if (data.ingredientIds !== undefined) {
          await this.replaceProductIngredients(query, id, data.ingredientIds);
        }
      });
      return { id };
    } catch (error: any) {
      this.handleDatabaseError(error);
    }
  }

  async setPrimaryImage(id: number, imagePath: string, altText: string | null) {
    const existing = await this.databaseService.query<any[]>(
      'SELECT id FROM products WHERE id = ? LIMIT 1',
      [id],
    );
    if (!existing.length) throw new NotFoundException('Product not found');

    await this.databaseService.transaction(async (query) => {
      await query(
        'UPDATE product_images SET sort_order = sort_order + 1 WHERE product_id = ?',
        [id],
      );
      await query(
        `INSERT INTO product_images
          (product_id, image_path, alt_text, sort_order, is_visible, created_at, updated_at)
         VALUES (?, ?, ?, 0, 1, NOW(), NOW())`,
        [id, imagePath, altText],
      );
    });
    return { imagePath };
  }

  async findImages(productId: number) {
    await this.ensureProductExists(productId);
    const rows = await this.databaseService.query<any[]>(
      `SELECT id, image_path, alt_text, sort_order, is_visible, created_at
       FROM product_images
       WHERE product_id = ?
       ORDER BY sort_order, id`,
      [productId],
    );
    let primaryAssigned = false;
    return rows.map((row) => {
      const isVisible = Boolean(row.is_visible);
      const isPrimary = isVisible && !primaryAssigned;
      if (isPrimary) primaryAssigned = true;
      return {
        id: row.id,
        path: row.image_path,
        alt: row.alt_text,
        sortOrder: Number(row.sort_order),
        isVisible,
        createdAt: row.created_at,
        isPrimary,
      };
    });
  }

  async selectPrimaryImage(productId: number, imageId: number) {
    await this.ensureImageBelongsToProduct(productId, imageId);
    await this.databaseService.transaction(async (query) => {
      await query(
        'UPDATE product_images SET sort_order = sort_order + 1 WHERE product_id = ?',
        [productId],
      );
      await query(
        `UPDATE product_images
         SET sort_order = 0, is_visible = 1, updated_at = NOW()
         WHERE id = ? AND product_id = ?`,
        [imageId, productId],
      );
    });
    const images = await this.findImages(productId);
    return { imagePath: images[0]?.path ?? null };
  }

  async setImageVisibility(
    productId: number,
    imageId: number,
    isVisible: boolean,
  ) {
    await this.ensureImageBelongsToProduct(productId, imageId);
    await this.databaseService.query(
      `UPDATE product_images
       SET is_visible = ?, updated_at = NOW()
       WHERE id = ? AND product_id = ?`,
      [isVisible, imageId, productId],
    );
    const images = await this.findImages(productId);
    return {
      imagePath: images.find((image) => image.isPrimary)?.path ?? null,
    };
  }

  async saveImageOrder(productId: number, imageIdsInput: unknown) {
    if (!Array.isArray(imageIdsInput)) {
      throw new BadRequestException('imageIds must be an array');
    }
    const imageIds = [
      ...new Set(imageIdsInput.map(Number).filter(Number.isInteger)),
    ];
    const existing = await this.findImages(productId);
    const existingIds = existing.map((image) => image.id).sort((a, b) => a - b);
    const sortedInput = [...imageIds].sort((a, b) => a - b);
    if (
      imageIds.length !== imageIdsInput.length ||
      JSON.stringify(existingIds) !== JSON.stringify(sortedInput)
    ) {
      throw new BadRequestException(
        'imageIds must contain every product image exactly once',
      );
    }
    await this.databaseService.transaction(async (query) => {
      for (let index = 0; index < imageIds.length; index += 1) {
        await query(
          `UPDATE product_images
           SET sort_order = ?, updated_at = NOW()
           WHERE id = ? AND product_id = ?`,
          [index, imageIds[index], productId],
        );
      }
    });
    const images = await this.findImages(productId);
    return {
      imagePath: images.find((image) => image.isPrimary)?.path ?? null,
    };
  }

  async removeImage(productId: number, imageId: number) {
    const image = await this.ensureImageBelongsToProduct(productId, imageId);
    await this.databaseService.transaction(async (query) => {
      await query(
        'DELETE FROM product_images WHERE id = ? AND product_id = ?',
        [imageId, productId],
      );
      const remaining = await query<any[]>(
        `SELECT id FROM product_images
         WHERE product_id = ?
         ORDER BY sort_order, id`,
        [productId],
      );
      for (let index = 0; index < remaining.length; index += 1) {
        await query('UPDATE product_images SET sort_order = ? WHERE id = ?', [
          index,
          remaining[index].id,
        ]);
      }
    });
    const images = await this.findImages(productId);
    return {
      removedPath: image.image_path as string,
      imagePath: images.find((image) => image.isPrimary)?.path ?? null,
    };
  }

  private validate(input: AdminProductInput, creating: boolean) {
    const data = { ...input };
    if (creating || data.name !== undefined) {
      data.name = data.name?.trim();
      if (!data.name) throw new BadRequestException('Name is required');
    }
    if (creating || data.slug !== undefined) {
      data.slug = this.slugify(data.slug || data.name || '');
      if (!data.slug) throw new BadRequestException('Slug is required');
    }
    for (const property of ['basePrice', 'salePrice'] as const) {
      if (creating || data[property] !== undefined) {
        const value = Number(data[property] ?? 0);
        if (!Number.isFinite(value) || value < 0) {
          throw new BadRequestException(
            `${property} must be a positive number`,
          );
        }
        data[property] = value;
      }
    }
    if (data.displayOrder !== undefined) {
      data.displayOrder = Math.max(0, Math.trunc(Number(data.displayOrder)));
    }
    if (data.bestSellerOrder !== undefined) {
      data.bestSellerOrder = Math.max(
        0,
        Math.trunc(Number(data.bestSellerOrder)),
      );
    }
    if (data.categoryIds !== undefined) {
      if (!Array.isArray(data.categoryIds)) {
        throw new BadRequestException('categoryIds must be an array');
      }
      data.categoryIds = [
        ...new Set(data.categoryIds.map(Number).filter(Number.isInteger)),
      ];
    }
    if (data.ingredientIds !== undefined) {
      if (!Array.isArray(data.ingredientIds)) {
        throw new BadRequestException('ingredientIds must be an array');
      }
      data.ingredientIds = [
        ...new Set(data.ingredientIds.map(Number).filter(Number.isInteger)),
      ];
    }
    if (creating) {
      data.description ??= null;
      data.isActive ??= true;
      data.isAvailable ??= true;
      data.isBestSeller ??= false;
      data.displayOrder ??= 0;
      data.bestSellerOrder ??= 0;
      data.categoryIds ??= [];
      data.ingredientIds ??= [];
    }
    return data;
  }

  private validateCategory(input: AdminCategoryInput, creating: boolean) {
    const data = { ...input };
    if (creating || data.name !== undefined) {
      data.name = data.name?.trim();
      if (!data.name)
        throw new BadRequestException('Category name is required');
    }
    if (creating || data.slug !== undefined) {
      data.slug = this.slugify(data.slug || data.name || '');
      if (!data.slug)
        throw new BadRequestException('Category slug is required');
    }
    if (creating || data.theme !== undefined) {
      const themes = ['burgers', 'sides', 'desserts', 'drinks'];
      if (!data.theme || !themes.includes(data.theme)) {
        throw new BadRequestException('Invalid category theme');
      }
    }
    if (data.displayOrder !== undefined) {
      data.displayOrder = Math.max(0, Math.trunc(Number(data.displayOrder)));
    }
    if (creating) {
      data.isActive ??= true;
      data.displayOrder ??= 0;
    }
    return data;
  }

  private async ensureProductExists(id: number) {
    const products = await this.databaseService.query<any[]>(
      'SELECT id FROM products WHERE id = ? LIMIT 1',
      [id],
    );
    if (!products.length) throw new NotFoundException('Product not found');
  }

  private async ensureImageBelongsToProduct(
    productId: number,
    imageId: number,
  ) {
    const images = await this.databaseService.query<any[]>(
      `SELECT id, image_path
       FROM product_images
       WHERE id = ? AND product_id = ?
       LIMIT 1`,
      [imageId, productId],
    );
    if (!images.length) throw new NotFoundException('Image not found');
    return images[0];
  }

  private slugify(value: string) {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private async replaceMenuCategories(
    query: <T = any[]>(sql: string, params?: any[]) => Promise<T>,
    productId: number,
    categoryIds: number[],
  ) {
    await query(
      `DELETE pc FROM product_category pc
       JOIN categories c ON c.id = pc.category_id
       WHERE pc.product_id = ? AND c.theme IS NOT NULL`,
      [productId],
    );
    for (const categoryId of categoryIds) {
      await query(
        `INSERT IGNORE INTO product_category (product_id, category_id)
         SELECT ?, id FROM categories
         WHERE id = ? AND is_active = 1 AND theme IS NOT NULL`,
        [productId, categoryId],
      );
    }
  }

  private async replaceProductIngredients(
    query: <T = any[]>(sql: string, params?: any[]) => Promise<T>,
    productId: number,
    ingredientIds: number[],
  ) {
    await query('DELETE FROM product_ingredient WHERE product_id = ?', [
      productId,
    ]);
    for (const ingredientId of ingredientIds) {
      await query(
        `INSERT IGNORE INTO product_ingredient
          (product_id, ingredient_id, is_optional)
         SELECT ?, id, 0 FROM ingredients
         WHERE id = ? AND is_active = 1`,
        [productId, ingredientId],
      );
    }
  }

  private handleDatabaseError(error: any): never {
    if (error?.code === 'ER_DUP_ENTRY') {
      throw new ConflictException('A product with this slug already exists');
    }
    throw error;
  }
}
