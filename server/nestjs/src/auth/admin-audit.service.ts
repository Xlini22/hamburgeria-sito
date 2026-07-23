import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import type { AuditQueryDto } from './admin-audit.dto';

export type AuditResource = {
  type: 'product' | 'category' | 'ingredient' | 'allergen' | 'user' | 'table' | 'best-sellers';
  id: string | null;
};

export type AuditActor = {
  userId: number;
  username: string;
  role: string;
  ipAddress?: string;
  userAgent?: string;
};

@Injectable()
export class AdminAuditService {
  private readonly restorableActions = new Set([
    'product.update',
    'category.update',
    'ingredient.update',
    'image.visibility',
    'image.primary',
    'images.reorder',
    'best-sellers.update',
    'product.create',
    'product.delete',
    'category.create',
    'category.delete',
    'ingredient.create',
    'ingredient.delete',
    'allergen.create',
    'allergen.delete',
  ]);

  constructor(private readonly databaseService: DatabaseService) {}

  async findAll(query: AuditQueryDto) {
    const sources: string[] = [];
    if (query.source !== 'archive') {
      sources.push(this.auditSelect('admin_audit_log', 'active'));
    }
    if (query.source !== 'active') {
      sources.push(this.auditSelect('admin_audit_log_archive', 'archive'));
    }
    const filters: string[] = [];
    const params: unknown[] = [];
    if (query.username?.trim()) {
      filters.push('username LIKE ?');
      params.push(`%${query.username.trim()}%`);
    }
    if (query.action) {
      filters.push('action = ?');
      params.push(query.action);
    }
    if (query.product?.trim()) {
      filters.push(
        `(resource_type = 'product' AND (
          resource_id = ? OR
          JSON_UNQUOTE(JSON_EXTRACT(before_data, '$.name')) LIKE ? OR
          JSON_UNQUOTE(JSON_EXTRACT(after_data, '$.name')) LIKE ?
        ))`,
      );
      const product = query.product.trim();
      params.push(product, `%${product}%`, `%${product}%`);
    }
    if (query.dateFrom) {
      filters.push('created_at >= ?');
      params.push(new Date(query.dateFrom));
    }
    if (query.dateTo) {
      filters.push('created_at <= ?');
      params.push(new Date(query.dateTo));
    }
    const from = `(${sources.join(' UNION ALL ')}) audit`;
    const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const [rows, countRows] = await Promise.all([
      this.databaseService.query<any[]>(
        `SELECT *
         FROM ${from}
         ${where}
         ORDER BY created_at DESC, id DESC
         LIMIT ${query.limit} OFFSET ${query.offset}`,
        params,
      ),
      this.databaseService.query<any[]>(
        `SELECT COUNT(*) AS total FROM ${from} ${where}`,
        params,
      ),
    ]);
    return {
      total: Number(countRows[0].total),
      limit: query.limit,
      offset: query.offset,
      hasMore: query.offset + rows.length < Number(countRows[0].total),
      items: rows.map((row) => ({
        id: row.id,
        userId: row.user_id,
        username: row.username,
        userRole: row.user_role,
        action: row.action,
        resourceType: row.resource_type,
        resourceId: row.resource_id,
        before: this.parseJson(row.before_data),
        after: this.parseJson(row.after_data),
        ipAddress: row.ip_address,
        createdAt: row.created_at,
        restoredAt: row.restored_at,
        restoredByUserId: row.restored_by_user_id,
        restoreLogId: row.restore_log_id,
        source: row.audit_source,
        canRestore:
          row.audit_source === 'active' &&
          this.restorableActions.has(row.action) &&
          row.restored_at === null,
      })),
    };
  }

  private auditSelect(table: string, source: 'active' | 'archive') {
    return `SELECT
      id, user_id, username, user_role, action, resource_type,
      resource_id, before_data, after_data, ip_address, created_at,
      restored_at, restored_by_user_id, restore_log_id,
      '${source}' AS audit_source
      FROM ${table}`;
  }

  async restore(logId: number, actor: AuditActor) {
    const rows = await this.databaseService.query<any[]>(
      `SELECT id, action, resource_type, resource_id, before_data, after_data,
              restored_at
       FROM admin_audit_log WHERE id = ? LIMIT 1`,
      [logId],
    );
    if (!rows.length) throw new NotFoundException('Log non trovato');

    const log = rows[0];
    if (!this.restorableActions.has(log.action)) {
      throw new ConflictException(
        'Questa operazione non può essere ripristinata automaticamente',
      );
    }
    if (log.restored_at) {
      throw new ConflictException('Questa modifica è già stata ripristinata');
    }

    const resource = {
      type: log.resource_type,
      id: log.resource_id,
    } as AuditResource;
    const before = this.parseJson(log.before_data);
    const expectedCurrent = this.parseJson(log.after_data);
    const current = await this.snapshot(resource);
    if (!this.sameSnapshot(current, expectedCurrent)) {
      throw new ConflictException(
        'La risorsa è stata modificata dopo questo evento. Ripristina prima le modifiche più recenti.',
      );
    }

    const restoreLogId = await this.databaseService.transaction<number>(
      async (query) => {
        await this.restoreState(query, resource, before, log.action);
        const result = await query<any>(
          `INSERT INTO admin_audit_log
            (user_id, username, user_role, action, resource_type, resource_id,
             before_data, after_data, ip_address, user_agent)
           VALUES (?, ?, ?, 'audit.restore', ?, ?, ?, ?, ?, ?)`,
          [
            actor.userId,
            actor.username,
            actor.role,
            resource.type,
            resource.id,
            JSON.stringify(current),
            JSON.stringify(before),
            actor.ipAddress?.slice(0, 45) || null,
            actor.userAgent?.slice(0, 255) || null,
          ],
        );
        const update = await query<any>(
          `UPDATE admin_audit_log
           SET restored_at = NOW(3), restored_by_user_id = ?, restore_log_id = ?
           WHERE id = ? AND restored_at IS NULL`,
          [actor.userId, result.insertId, logId],
        );
        if (update.affectedRows !== 1) {
          throw new ConflictException('Questa modifica è già stata ripristinata');
        }
        return Number(result.insertId);
      },
    );
    return { id: logId, restored: true, restoreLogId };
  }

  async record(
    actor: AuditActor,
    action: string,
    resource: AuditResource,
    before: unknown,
    after: unknown,
  ) {
    await this.databaseService.query(
      `INSERT INTO admin_audit_log
        (user_id, username, user_role, action, resource_type, resource_id,
         before_data, after_data, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        actor.userId,
        actor.username,
        actor.role,
        action,
        resource.type,
        resource.id,
        before === null ? null : JSON.stringify(before),
        after === null ? null : JSON.stringify(after),
        actor.ipAddress?.slice(0, 45) || null,
        actor.userAgent?.slice(0, 255) || null,
      ],
    );
  }

  async snapshot(resource: AuditResource): Promise<unknown> {
    if (!resource.id && resource.type !== 'best-sellers') return null;
    switch (resource.type) {
      case 'product':
        return this.productSnapshot(Number(resource.id));
      case 'category':
        return this.categorySnapshot(Number(resource.id));
      case 'ingredient':
        return this.ingredientSnapshot(Number(resource.id));
      case 'allergen':
        return this.allergenSnapshot(Number(resource.id));
      case 'user':
        return this.userSnapshot(Number(resource.id));
      case 'table':
        return this.tableSnapshot(Number(resource.id));
      case 'best-sellers':
        return this.bestSellerSnapshot();
    }
  }

  private async tableSnapshot(id: number) {
    const tables = await this.databaseService.query<any[]>(
      `SELECT t.id, t.table_number, t.name, t.is_active,
              ts.id AS open_session_id, ts.opened_at
       FROM restaurant_tables t
       LEFT JOIN table_sessions ts
         ON ts.table_id = t.id AND ts.status = 'open'
       WHERE t.id = ? LIMIT 1`,
      [id],
    );
    if (!tables.length) return null;
    return {
      id: Number(tables[0].id),
      tableNumber: Number(tables[0].table_number),
      name: tables[0].name,
      isActive: Boolean(tables[0].is_active),
      openSessionId: tables[0].open_session_id
        ? Number(tables[0].open_session_id)
        : null,
      openedAt: tables[0].opened_at,
    };
  }

  private async productSnapshot(id: number) {
    const [products, categories, ingredients, images] = await Promise.all([
      this.databaseService.query<any[]>(
        `SELECT id, name, slug, description, base_price, sale_price,
                is_active, is_available, is_best_seller,
                best_seller_order, display_order
         FROM products WHERE id = ? LIMIT 1`,
        [id],
      ),
      this.databaseService.query<any[]>(
        `SELECT c.id, c.name
         FROM product_category pc
         JOIN categories c ON c.id = pc.category_id
         WHERE pc.product_id = ? ORDER BY c.display_order, c.name`,
        [id],
      ),
      this.databaseService.query<any[]>(
        `SELECT i.id, i.name
         FROM product_ingredient pi
         JOIN ingredients i ON i.id = pi.ingredient_id
         WHERE pi.product_id = ? ORDER BY i.name`,
        [id],
      ),
      this.databaseService.query<any[]>(
        `SELECT id, image_path, alt_text, sort_order, is_visible
         FROM product_images WHERE product_id = ? ORDER BY sort_order, id`,
        [id],
      ),
    ]);
    if (!products.length) return null;
    return {
      ...products[0],
      categories,
      ingredients,
      images,
    };
  }

  private async categorySnapshot(id: number) {
    const rows = await this.databaseService.query<any[]>(
      `SELECT c.id, c.name, c.slug, c.description, c.theme,
              c.display_order, c.is_active,
              COUNT(DISTINCT pc.product_id) AS product_count
       FROM categories c
       LEFT JOIN product_category pc ON pc.category_id = c.id
       WHERE c.id = ? GROUP BY c.id`,
      [id],
    );
    return rows[0] ?? null;
  }

  private async ingredientSnapshot(id: number) {
    const [rows, allergens, products] = await Promise.all([
      this.databaseService.query<any[]>(
        'SELECT id, name, description, is_active FROM ingredients WHERE id = ?',
        [id],
      ),
      this.databaseService.query<any[]>(
        `SELECT a.id, a.name
         FROM ingredient_allergen ia
         JOIN allergens a ON a.id = ia.allergen_id
         WHERE ia.ingredient_id = ? ORDER BY a.name`,
        [id],
      ),
      this.databaseService.query<any[]>(
        `SELECT p.id, p.name
         FROM product_ingredient pi
         JOIN products p ON p.id = pi.product_id
         WHERE pi.ingredient_id = ? ORDER BY p.name`,
        [id],
      ),
    ]);
    return rows.length ? { ...rows[0], allergens, products } : null;
  }

  private async allergenSnapshot(id: number) {
    const [rows, ingredients, products] = await Promise.all([
      this.databaseService.query<any[]>(
        'SELECT id, name, description FROM allergens WHERE id = ?',
        [id],
      ),
      this.databaseService.query<any[]>(
        `SELECT i.id, i.name
         FROM ingredient_allergen ia
         JOIN ingredients i ON i.id = ia.ingredient_id
         WHERE ia.allergen_id = ? ORDER BY i.name`,
        [id],
      ),
      this.databaseService.query<any[]>(
        `SELECT DISTINCT p.id, p.name
         FROM ingredient_allergen ia
         JOIN product_ingredient pi ON pi.ingredient_id = ia.ingredient_id
         JOIN products p ON p.id = pi.product_id
         WHERE ia.allergen_id = ? ORDER BY p.name`,
        [id],
      ),
    ]);
    return rows.length ? { ...rows[0], ingredients, products } : null;
  }

  private async userSnapshot(id: number) {
    const rows = await this.databaseService.query<any[]>(
      `SELECT id, username, role, is_active, created_at, updated_at
       FROM users WHERE id = ?`,
      [id],
    );
    return rows[0] ?? null;
  }

  private bestSellerSnapshot() {
    return this.databaseService.query<any[]>(
      `SELECT id, name, best_seller_order
       FROM products WHERE is_best_seller = 1
       ORDER BY best_seller_order, name`,
    );
  }

  private async restoreSnapshot(
    query: <T = any[]>(sql: string, params?: any[]) => Promise<T>,
    resource: AuditResource,
    snapshot: any,
  ) {
    if (!snapshot) {
      throw new ConflictException('Lo stato precedente non è disponibile');
    }
    if (resource.type === 'best-sellers') {
      await query('UPDATE products SET is_best_seller = 0, best_seller_order = 0');
      for (const product of snapshot) {
        await query(
          `UPDATE products SET is_best_seller = 1, best_seller_order = ?,
                  updated_at = NOW()
           WHERE id = ?`,
          [product.best_seller_order, product.id],
        );
      }
      return;
    }

    const id = Number(resource.id);
    if (resource.type === 'category') {
      await query(
        `UPDATE categories
         SET name = ?, slug = ?, description = ?, theme = ?,
             display_order = ?, is_active = ?, updated_at = NOW()
         WHERE id = ?`,
        [
          snapshot.name,
          snapshot.slug,
          snapshot.description,
          snapshot.theme,
          snapshot.display_order,
          snapshot.is_active,
          id,
        ],
      );
      return;
    }
    if (resource.type === 'ingredient') {
      await query(
        `UPDATE ingredients SET name = ?, description = ?, is_active = ?
         WHERE id = ?`,
        [snapshot.name, snapshot.description, snapshot.is_active, id],
      );
      await query('DELETE FROM ingredient_allergen WHERE ingredient_id = ?', [id]);
      for (const allergen of snapshot.allergens || []) {
        await query(
          `INSERT INTO ingredient_allergen (ingredient_id, allergen_id)
           VALUES (?, ?)`,
          [id, allergen.id],
        );
      }
      return;
    }
    if (resource.type === 'product') {
      await query(
        `UPDATE products
         SET name = ?, slug = ?, description = ?, base_price = ?,
             sale_price = ?, is_active = ?, is_available = ?,
             is_best_seller = ?, best_seller_order = ?, display_order = ?,
             updated_at = NOW()
         WHERE id = ?`,
        [
          snapshot.name,
          snapshot.slug,
          snapshot.description,
          snapshot.base_price,
          snapshot.sale_price,
          snapshot.is_active,
          snapshot.is_available,
          snapshot.is_best_seller,
          snapshot.best_seller_order,
          snapshot.display_order,
          id,
        ],
      );
      await query('DELETE FROM product_category WHERE product_id = ?', [id]);
      for (const category of snapshot.categories || []) {
        await query(
          'INSERT INTO product_category (product_id, category_id) VALUES (?, ?)',
          [id, category.id],
        );
      }
      await query('DELETE FROM product_ingredient WHERE product_id = ?', [id]);
      for (const ingredient of snapshot.ingredients || []) {
        await query(
          'INSERT INTO product_ingredient (product_id, ingredient_id) VALUES (?, ?)',
          [id, ingredient.id],
        );
      }
      for (const image of snapshot.images || []) {
        await query(
          `UPDATE product_images
           SET image_path = ?, alt_text = ?, sort_order = ?, is_visible = ?,
               updated_at = NOW()
           WHERE id = ? AND product_id = ?`,
          [
            image.image_path,
            image.alt_text,
            image.sort_order,
            image.is_visible,
            image.id,
            id,
          ],
        );
      }
      return;
    }
    throw new ConflictException(
      'Questa risorsa non può essere ripristinata automaticamente',
    );
  }

  private async restoreState(
    query: <T = any[]>(sql: string, params?: any[]) => Promise<T>,
    resource: AuditResource,
    snapshot: any,
    action: string,
  ) {
    if (action.endsWith('.create')) {
      await this.removeCreatedResource(query, resource);
      return;
    }
    if (action.endsWith('.delete')) {
      await this.recreateDeletedResource(query, resource, snapshot);
      return;
    }
    await this.restoreSnapshot(query, resource, snapshot);
  }

  private async removeCreatedResource(
    query: <T = any[]>(sql: string, params?: any[]) => Promise<T>,
    resource: AuditResource,
  ) {
    const id = Number(resource.id);
    if (resource.type === 'product') {
      await query('DELETE FROM product_category WHERE product_id = ?', [id]);
      await query('DELETE FROM product_ingredient WHERE product_id = ?', [id]);
      await query('DELETE FROM product_images WHERE product_id = ?', [id]);
      await query('DELETE FROM products WHERE id = ?', [id]);
      return;
    }
    if (resource.type === 'category') {
      await query('DELETE FROM categories WHERE id = ?', [id]);
      return;
    }
    if (resource.type === 'ingredient') {
      await query('DELETE FROM ingredient_allergen WHERE ingredient_id = ?', [id]);
      await query('DELETE FROM product_ingredient WHERE ingredient_id = ?', [id]);
      await query('DELETE FROM ingredients WHERE id = ?', [id]);
      return;
    }
    if (resource.type === 'allergen') {
      await query('DELETE FROM ingredient_allergen WHERE allergen_id = ?', [id]);
      await query('DELETE FROM allergens WHERE id = ?', [id]);
      return;
    }
    throw new ConflictException('Questa creazione non può essere annullata');
  }

  private async recreateDeletedResource(
    query: <T = any[]>(sql: string, params?: any[]) => Promise<T>,
    resource: AuditResource,
    snapshot: any,
  ) {
    if (!snapshot) {
      throw new ConflictException('I dati eliminati non sono disponibili');
    }
    const id = Number(resource.id);
    if (resource.type === 'category') {
      await query(
        `INSERT INTO categories
          (id, name, slug, description, theme, display_order, is_active,
           created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          id,
          snapshot.name,
          snapshot.slug,
          snapshot.description,
          snapshot.theme,
          snapshot.display_order,
          snapshot.is_active,
        ],
      );
      return;
    }
    if (resource.type === 'ingredient') {
      await query(
        `INSERT INTO ingredients (id, name, description, is_active)
         VALUES (?, ?, ?, ?)`,
        [id, snapshot.name, snapshot.description, snapshot.is_active],
      );
      for (const allergen of snapshot.allergens || []) {
        await query(
          'INSERT INTO ingredient_allergen (ingredient_id, allergen_id) VALUES (?, ?)',
          [id, allergen.id],
        );
      }
      for (const product of snapshot.products || []) {
        await query(
          `INSERT INTO product_ingredient
            (product_id, ingredient_id, is_optional) VALUES (?, ?, 0)`,
          [product.id, id],
        );
      }
      return;
    }
    if (resource.type === 'allergen') {
      await query(
        'INSERT INTO allergens (id, name, description) VALUES (?, ?, ?)',
        [id, snapshot.name, snapshot.description],
      );
      for (const ingredient of snapshot.ingredients || []) {
        await query(
          'INSERT INTO ingredient_allergen (ingredient_id, allergen_id) VALUES (?, ?)',
          [ingredient.id, id],
        );
      }
      return;
    }
    if (resource.type === 'product') {
      await query(
        `INSERT INTO products
          (id, name, slug, description, base_price, sale_price, is_active,
           is_available, is_best_seller, best_seller_order, display_order,
           created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          id,
          snapshot.name,
          snapshot.slug,
          snapshot.description,
          snapshot.base_price,
          snapshot.sale_price,
          snapshot.is_active,
          snapshot.is_available,
          snapshot.is_best_seller,
          snapshot.best_seller_order,
          snapshot.display_order,
        ],
      );
      for (const category of snapshot.categories || []) {
        await query(
          'INSERT INTO product_category (product_id, category_id) VALUES (?, ?)',
          [id, category.id],
        );
      }
      for (const ingredient of snapshot.ingredients || []) {
        await query(
          `INSERT INTO product_ingredient
            (product_id, ingredient_id, is_optional) VALUES (?, ?, 0)`,
          [id, ingredient.id],
        );
      }
      for (const image of snapshot.images || []) {
        await query(
          `INSERT INTO product_images
            (id, product_id, image_path, alt_text, sort_order, is_visible,
             created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            image.id,
            id,
            image.image_path,
            image.alt_text,
            image.sort_order,
            image.is_visible,
          ],
        );
      }
      return;
    }
    throw new ConflictException(
      'Questa eliminazione non può essere ripristinata',
    );
  }

  private sameSnapshot(left: unknown, right: unknown) {
    return (
      JSON.stringify(this.canonicalSnapshot(left)) ===
      JSON.stringify(this.canonicalSnapshot(right))
    );
  }

  private canonicalSnapshot(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map((item) => this.canonicalSnapshot(item));
    }
    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>)
          .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
          .map(([key, item]) => [key, this.canonicalSnapshot(item)]),
      );
    }
    return value;
  }

  private parseJson(value: unknown) {
    if (value === null || typeof value === 'object') return value;
    try {
      return JSON.parse(String(value));
    } catch {
      return null;
    }
  }
}
