import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'crypto';
import type { Response } from 'express';
import QRCode from 'qrcode';
import { DatabaseService } from '../database/database.service';
import { CreateTableDto, UpdateTableDto } from './tables.dto';

const GUEST_COOKIE = 'bourmet_guest';
const GUEST_LIFETIME_MS = 12 * 60 * 60 * 1000;

@Injectable()
export class TablesService {
  constructor(
    private readonly database: DatabaseService,
    private readonly config: ConfigService,
  ) {}

  async findAll() {
    const rows = await this.database.query<any[]>(
      `SELECT t.id, t.table_number, t.name, t.is_active, t.created_at,
              ts.id AS session_id, ts.opened_at,
              COUNT(gs.id) AS guest_count
       FROM restaurant_tables t
       LEFT JOIN table_sessions ts
         ON ts.table_id = t.id AND ts.status = 'open'
       LEFT JOIN guest_sessions gs
         ON gs.table_session_id = ts.id
        AND gs.is_revoked = 0 AND gs.expires_at > NOW(3)
       GROUP BY t.id, ts.id
       ORDER BY t.table_number`,
    );
    return rows.map((row) => this.mapTable(row));
  }

  async create(dto: CreateTableDto) {
    const token = this.newToken();
    try {
      const result = await this.database.query<any>(
        `INSERT INTO restaurant_tables
          (table_number, name, public_token_hash)
         VALUES (?, ?, ?)`,
        [dto.tableNumber, dto.name.trim(), this.hash(token)],
      );
      return {
        id: Number(result.insertId),
        tableNumber: dto.tableNumber,
        name: dto.name.trim(),
        isActive: true,
        accessToken: token,
        accessPath: `/api/table-access/${token}`,
      };
    } catch (error: any) {
      if (error?.code === 'ER_DUP_ENTRY') {
        throw new ConflictException('Esiste già un tavolo con questo numero');
      }
      throw error;
    }
  }

  async update(id: number, dto: UpdateTableDto) {
    const fields: string[] = [];
    const values: unknown[] = [];
    if (dto.tableNumber !== undefined) {
      fields.push('table_number = ?');
      values.push(dto.tableNumber);
    }
    if (dto.name !== undefined) {
      fields.push('name = ?');
      values.push(dto.name.trim());
    }
    if (dto.isActive !== undefined) {
      fields.push('is_active = ?');
      values.push(dto.isActive ? 1 : 0);
    }
    if (!fields.length) throw new ConflictException('Nessuna modifica indicata');
    values.push(id);
    try {
      const result = await this.database.query<any>(
        `UPDATE restaurant_tables SET ${fields.join(', ')} WHERE id = ?`,
        values,
      );
      if (!result.affectedRows) throw new NotFoundException('Tavolo non trovato');
      return this.findOne(id);
    } catch (error: any) {
      if (error?.code === 'ER_DUP_ENTRY') {
        throw new ConflictException('Esiste già un tavolo con questo numero');
      }
      throw error;
    }
  }

  async openSession(id: number, userId: number) {
    return this.database.transaction(async (query) => {
      const tables = await query<any[]>(
        `SELECT id, is_active FROM restaurant_tables WHERE id = ? FOR UPDATE`,
        [id],
      );
      if (!tables.length) throw new NotFoundException('Tavolo non trovato');
      if (!tables[0].is_active) throw new ConflictException('Il tavolo è disattivato');
      const open = await query<any[]>(
        `SELECT id FROM table_sessions
         WHERE table_id = ? AND status = 'open' LIMIT 1`,
        [id],
      );
      if (open.length) throw new ConflictException('Il tavolo ha già una sessione aperta');
      const result = await query<any>(
        `INSERT INTO table_sessions (table_id, opened_by_user_id)
         VALUES (?, ?)`,
        [id, userId],
      );
      return { id: Number(result.insertId), tableId: id, status: 'open' };
    });
  }

  async closeSession(id: number, userId: number) {
    return this.database.transaction(async (query) => {
      const sessions = await query<any[]>(
        `SELECT id FROM table_sessions
         WHERE table_id = ? AND status = 'open' LIMIT 1 FOR UPDATE`,
        [id],
      );
      if (!sessions.length) throw new ConflictException('Il tavolo non ha sessioni aperte');
      const sessionId = Number(sessions[0].id);
      await query(
        `UPDATE guest_sessions SET is_revoked = 1
         WHERE table_session_id = ?`,
        [sessionId],
      );
      await query(
        `UPDATE table_sessions
         SET status = 'closed', closed_by_user_id = ?, closed_at = NOW(3)
         WHERE id = ?`,
        [userId, sessionId],
      );
      return { id: sessionId, tableId: id, status: 'closed' };
    });
  }

  async regenerateToken(id: number) {
    const token = this.newToken();
    const result = await this.database.query<any>(
      `UPDATE restaurant_tables SET public_token_hash = ? WHERE id = ?`,
      [this.hash(token), id],
    );
    if (!result.affectedRows) throw new NotFoundException('Tavolo non trovato');
    return { id, accessToken: token, accessPath: `/api/table-access/${token}` };
  }

  async generateQr(id: number, token: string, requestOrigin: string) {
    const rows = await this.database.query<any[]>(
      `SELECT id FROM restaurant_tables
       WHERE id = ? AND public_token_hash = ? LIMIT 1`,
      [id, this.hash(token)],
    );
    if (!rows.length) {
      throw new ForbiddenException('Il token non appartiene a questo tavolo');
    }
    const baseUrl = (
      this.config.get<string>('PUBLIC_BASE_URL') || requestOrigin
    ).replace(/\/+$/, '');
    const accessUrl = `${baseUrl}/api/table-access/${token}`;
    return {
      accessUrl,
      dataUrl: await QRCode.toDataURL(accessUrl, {
        width: 420,
        margin: 2,
        errorCorrectionLevel: 'M',
        color: { dark: '#171719', light: '#fffaf4' },
      }),
    };
  }

  async enter(token: string, response: Response) {
    const rows = await this.database.query<any[]>(
      `SELECT t.id AS table_id, t.table_number, t.name,
              ts.id AS session_id,
              COUNT(gs.id) AS guest_count
       FROM restaurant_tables t
       JOIN table_sessions ts ON ts.table_id = t.id AND ts.status = 'open'
       LEFT JOIN guest_sessions gs ON gs.table_session_id = ts.id
       WHERE t.public_token_hash = ? AND t.is_active = 1
       GROUP BY t.id, ts.id LIMIT 1`,
      [this.hash(token)],
    );
    if (!rows.length) {
      throw new ForbiddenException('QR non valido oppure tavolo non ancora aperto');
    }
    const guestToken = this.newToken();
    const displayName = `Ospite ${Number(rows[0].guest_count) + 1}`;
    await this.database.query(
      `INSERT INTO guest_sessions
        (table_session_id, guest_token_hash, display_name, expires_at)
       VALUES (?, ?, ?, DATE_ADD(NOW(3), INTERVAL 12 HOUR))`,
      [rows[0].session_id, this.hash(guestToken), displayName],
    );
    response.cookie(GUEST_COOKIE, guestToken, {
      httpOnly: true,
      secure: this.config.get<string>('COOKIE_SECURE') === 'true',
      sameSite: 'lax',
      maxAge: GUEST_LIFETIME_MS,
      path: '/',
    });
    response.redirect(
      this.config.get<string>('PUBLIC_ORDER_URL') || '/menu/order.html',
    );
  }

  async guestSession(token?: string) {
    if (!token) throw new UnauthorizedException('Sessione del tavolo assente');
    const rows = await this.database.query<any[]>(
      `SELECT gs.id, gs.display_name, gs.expires_at,
              gs.ready_at,
              ts.id AS table_session_id,
              t.id AS table_id, t.table_number, t.name
       FROM guest_sessions gs
       JOIN table_sessions ts ON ts.id = gs.table_session_id
       JOIN restaurant_tables t ON t.id = ts.table_id
       WHERE gs.guest_token_hash = ?
         AND gs.is_revoked = 0 AND gs.expires_at > NOW(3)
         AND ts.status = 'open' AND t.is_active = 1
       LIMIT 1`,
      [this.hash(token)],
    );
    if (!rows.length) throw new UnauthorizedException('Sessione del tavolo scaduta');
    await this.database.query(
      `UPDATE guest_sessions SET last_seen_at = NOW(3) WHERE id = ?`,
      [rows[0].id],
    );
    return {
      guestId: Number(rows[0].id),
      guestName: rows[0].display_name,
      tableSessionId: Number(rows[0].table_session_id),
      table: {
        id: Number(rows[0].table_id),
        number: Number(rows[0].table_number),
        name: rows[0].name,
      },
      expiresAt: rows[0].expires_at,
      ready: Boolean(rows[0].ready_at),
      readyAt: rows[0].ready_at,
    };
  }

  async guestCart(token?: string) {
    const session = await this.guestSession(token);
    const rows = await this.database.query<any[]>(
      `SELECT product_id, quantity, preference, updated_at
       FROM guest_cart_items
       WHERE guest_session_id = ?
       ORDER BY updated_at, product_id`,
      [session.guestId],
    );
    return {
      guestId: session.guestId,
      tableSessionId: session.tableSessionId,
      items: rows.map((row) => ({
        productId: Number(row.product_id),
        quantity: Number(row.quantity),
        preference: row.preference,
        updatedAt: row.updated_at,
      })),
    };
  }

  async updateGuestCartItem(
    token: string | undefined,
    productId: number,
    quantity: number,
    preference = '',
  ) {
    const session = await this.guestSession(token);
    if (quantity === 0) {
      await this.database.transaction(async (query) => {
        await query(
          `DELETE FROM guest_cart_items
           WHERE guest_session_id = ? AND product_id = ?`,
          [session.guestId, productId],
        );
        await query(`UPDATE guest_sessions SET ready_at = NULL WHERE id = ?`, [
          session.guestId,
        ]);
      });
      return this.guestCart(token);
    }
    const products = await this.database.query<any[]>(
      `SELECT id FROM products
       WHERE id = ? AND is_active = 1 AND is_available = 1 LIMIT 1`,
      [productId],
    );
    if (!products.length) {
      throw new ConflictException('Il prodotto non è disponibile');
    }
    await this.database.transaction(async (query) => {
      await query(
        `INSERT INTO guest_cart_items
          (guest_session_id, product_id, quantity, preference)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           quantity = VALUES(quantity),
           preference = VALUES(preference),
           updated_at = NOW(3)`,
        [session.guestId, productId, quantity, preference.trim()],
      );
      await query(`UPDATE guest_sessions SET ready_at = NULL WHERE id = ?`, [
        session.guestId,
      ]);
    });
    return this.guestCart(token);
  }

  async guestTableCart(token?: string) {
    const session = await this.guestSession(token);
    return this.buildTableCart(session.table.id, session.guestId);
  }

  async updateGuestReadiness(token: string | undefined, ready: boolean) {
    const session = await this.guestSession(token);
    if (ready) {
      const rows = await this.database.query<any[]>(
        `SELECT 1 FROM guest_cart_items
         WHERE guest_session_id = ? LIMIT 1`,
        [session.guestId],
      );
      if (!rows.length) {
        throw new ConflictException('Aggiungi almeno un prodotto prima di essere pronto');
      }
    }
    await this.database.query(
      `UPDATE guest_sessions SET ready_at = ${ready ? 'NOW(3)' : 'NULL'}
       WHERE id = ?`,
      [session.guestId],
    );
    return this.guestTableCart(token);
  }

  async updateGuestName(token: string | undefined, name: string) {
    const session = await this.guestSession(token);
    const normalizedName = name.trim().replace(/\s+/g, ' ');
    if (!normalizedName) {
      throw new ConflictException('Inserisci un nome valido');
    }
    await this.database.query(
      `UPDATE guest_sessions SET display_name = ? WHERE id = ?`,
      [normalizedName, session.guestId],
    );
    return {
      guestId: session.guestId,
      name: normalizedName,
    };
  }

  async submitTableOrder(
    token: string | undefined,
    idempotencyKey: string,
    confirmNotReady: boolean,
  ) {
    const session = await this.guestSession(token);
    return this.database.transaction(async (query) => {
      const tableSessions = await query<any[]>(
        `SELECT id FROM table_sessions
         WHERE id = ? AND status = 'open' FOR UPDATE`,
        [session.tableSessionId],
      );
      if (!tableSessions.length) {
        throw new ConflictException('La sessione del tavolo è stata chiusa');
      }

      const previous = await query<any[]>(
        `SELECT id, order_number, status, total, created_at
         FROM table_orders
         WHERE table_session_id = ? AND idempotency_key = ? LIMIT 1`,
        [session.tableSessionId, idempotencyKey],
      );
      if (previous.length) return this.mapOrder(previous[0], []);

      const rows = await query<any[]>(
        `SELECT gs.id AS guest_id, gs.display_name, gs.ready_at,
                gci.product_id, gci.quantity, gci.preference,
                p.name AS product_name,
                IF(p.sale_price > 0, p.sale_price, p.base_price) AS unit_price
         FROM guest_sessions gs
         JOIN guest_cart_items gci ON gci.guest_session_id = gs.id
         JOIN products p ON p.id = gci.product_id
         WHERE gs.table_session_id = ?
           AND gs.is_revoked = 0 AND gs.expires_at > NOW(3)
         ORDER BY p.id, gs.id
         FOR UPDATE`,
        [session.tableSessionId],
      );
      if (!rows.length) throw new ConflictException('Il carrello del tavolo è vuoto');

      const unready = new Map<number, string>();
      for (const row of rows) {
        if (!row.ready_at) unready.set(Number(row.guest_id), row.display_name);
      }
      if (unready.size && !confirmNotReady) {
        throw new ConflictException({
          code: 'GUESTS_NOT_READY',
          message: 'Alcuni ospiti stanno ancora scegliendo',
          guests: [...unready.values()],
        });
      }

      const aggregated = new Map<number, any>();
      for (const row of rows) {
        const productId = Number(row.product_id);
        if (!aggregated.has(productId)) {
          aggregated.set(productId, {
            productId,
            name: row.product_name,
            unitPrice: Number(row.unit_price),
            quantity: 0,
            preferences: new Map<string, number>(),
          });
        }
        const item = aggregated.get(productId);
        const quantity = Number(row.quantity);
        item.quantity += quantity;
        const preference = String(row.preference || '').trim();
        if (preference) {
          item.preferences.set(
            preference,
            (item.preferences.get(preference) || 0) + quantity,
          );
        }
      }
      const items = [...aggregated.values()];
      const total = items.reduce(
        (sum, item) => sum + item.unitPrice * item.quantity,
        0,
      );
      const numberRows = await query<any[]>(
        `SELECT COALESCE(MAX(order_number), 0) + 1 AS next_number
         FROM table_orders WHERE table_session_id = ?`,
        [session.tableSessionId],
      );
      const orderNumber = Number(numberRows[0].next_number);
      const result = await query<any>(
        `INSERT INTO table_orders
          (table_session_id, order_number, submitted_by_guest_id,
           idempotency_key, total)
         VALUES (?, ?, ?, ?, ?)`,
        [
          session.tableSessionId,
          orderNumber,
          session.guestId,
          idempotencyKey,
          total,
        ],
      );
      const orderId = Number(result.insertId);
      for (const [index, item] of items.entries()) {
        const itemResult = await query<any>(
          `INSERT INTO table_order_items
            (order_id, product_id, product_name, unit_price, quantity,
             subtotal, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            orderId,
            item.productId,
            item.name,
            item.unitPrice,
            item.quantity,
            item.unitPrice * item.quantity,
            index,
          ],
        );
        for (const [preference, quantity] of item.preferences.entries()) {
          await query(
            `INSERT INTO table_order_item_preferences
              (order_item_id, preference, quantity)
             VALUES (?, ?, ?)`,
            [itemResult.insertId, preference, quantity],
          );
        }
      }
      await query(
        `INSERT INTO table_order_status_history (order_id, status)
         VALUES (?, 'new')`,
        [orderId],
      );
      await query(
        `DELETE gci FROM guest_cart_items gci
         JOIN guest_sessions gs ON gs.id = gci.guest_session_id
         WHERE gs.table_session_id = ?`,
        [session.tableSessionId],
      );
      await query(
        `UPDATE guest_sessions SET ready_at = NULL
         WHERE table_session_id = ?`,
        [session.tableSessionId],
      );
      return {
        id: orderId,
        orderNumber,
        status: 'new',
        total,
        createdAt: new Date(),
        items: items.map((item) => ({
          productId: item.productId,
          name: item.name,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          subtotal: item.unitPrice * item.quantity,
          preferences: [...item.preferences].map(([preference, quantity]) => ({
            preference,
            quantity,
          })),
        })),
      };
    });
  }

  async guestOrderHistory(token?: string) {
    const session = await this.guestSession(token);
    const orders = await this.database.query<any[]>(
      `SELECT id, order_number, status, total, created_at
       FROM table_orders
       WHERE table_session_id = ?
       ORDER BY created_at DESC, id DESC`,
      [session.tableSessionId],
    );
    if (!orders.length) return [];
    const orderIds = orders.map((order) => Number(order.id));
    const placeholders = orderIds.map(() => '?').join(',');
    const rows = await this.database.query<any[]>(
      `SELECT toi.id, toi.order_id, toi.product_id, toi.product_name,
              toi.unit_price, toi.quantity, toi.subtotal,
              toip.preference, toip.quantity AS preference_quantity
       FROM table_order_items toi
       LEFT JOIN table_order_item_preferences toip
         ON toip.order_item_id = toi.id
       WHERE toi.order_id IN (${placeholders})
       ORDER BY toi.order_id DESC, toi.sort_order, toi.id, toip.id`,
      orderIds,
    );
    const itemMaps = new Map<number, Map<number, any>>();
    for (const row of rows) {
      const orderId = Number(row.order_id);
      if (!itemMaps.has(orderId)) itemMaps.set(orderId, new Map());
      const orderItems = itemMaps.get(orderId)!;
      const itemId = Number(row.id);
      if (!orderItems.has(itemId)) {
        orderItems.set(itemId, {
          productId: row.product_id ? Number(row.product_id) : null,
          name: row.product_name,
          unitPrice: Number(row.unit_price),
          quantity: Number(row.quantity),
          subtotal: Number(row.subtotal),
          preferences: [],
        });
      }
      if (row.preference) {
        orderItems.get(itemId).preferences.push({
          preference: row.preference,
          quantity: Number(row.preference_quantity),
        });
      }
    }
    return orders.map((order) =>
      this.mapOrder(order, [...(itemMaps.get(Number(order.id))?.values() || [])]),
    );
  }

  async tableCart(tableId: number) {
    return this.buildTableCart(tableId);
  }

  private async buildTableCart(tableId: number, currentGuestId?: number) {
    const sessions = await this.database.query<any[]>(
      `SELECT ts.id, ts.opened_at, t.table_number, t.name
       FROM restaurant_tables t
       LEFT JOIN table_sessions ts
         ON ts.table_id = t.id AND ts.status = 'open'
       WHERE t.id = ? LIMIT 1`,
      [tableId],
    );
    if (!sessions.length) throw new NotFoundException('Tavolo non trovato');
    if (!sessions[0].id) {
      return {
        tableId,
        tableNumber: Number(sessions[0].table_number),
        tableName: sessions[0].name,
        session: null,
        guests: [],
        total: 0,
      };
    }
    const rows = await this.database.query<any[]>(
      `SELECT gs.id AS guest_id, gs.display_name, gs.ready_at,
              gci.product_id, gci.quantity, gci.preference, gci.updated_at,
              p.name AS product_name,
              IF(p.sale_price > 0, p.sale_price, p.base_price) AS unit_price,
              (
                SELECT pi.image_path
                FROM product_images pi
                WHERE pi.product_id = p.id AND pi.is_visible = 1
                ORDER BY pi.sort_order, pi.id LIMIT 1
              ) AS image_path
       FROM guest_sessions gs
       LEFT JOIN guest_cart_items gci ON gci.guest_session_id = gs.id
       LEFT JOIN products p ON p.id = gci.product_id
       WHERE gs.table_session_id = ?
         AND gs.is_revoked = 0 AND gs.expires_at > NOW(3)
       ORDER BY gs.created_at, gci.updated_at, gci.product_id`,
      [sessions[0].id],
    );
    const guests = new Map<number, any>();
    for (const row of rows) {
      const guestId = Number(row.guest_id);
      if (!guests.has(guestId)) {
        guests.set(guestId, {
          id: guestId,
          name: row.display_name,
          isCurrent: guestId === currentGuestId,
          ready: Boolean(row.ready_at),
          items: [],
          total: 0,
        });
      }
      if (!row.product_id) continue;
      const guest = guests.get(guestId);
      const unitPrice = Number(row.unit_price);
      const quantity = Number(row.quantity);
      guest.items.push({
        productId: Number(row.product_id),
        name: row.product_name,
        quantity,
        preference: row.preference,
        unitPrice,
        subtotal: unitPrice * quantity,
        imagePath: row.image_path,
      });
      guest.total += unitPrice * quantity;
    }
    const guestList = [...guests.values()];
    return {
      tableId,
      tableNumber: Number(sessions[0].table_number),
      tableName: sessions[0].name,
      session: {
        id: Number(sessions[0].id),
        openedAt: sessions[0].opened_at,
      },
      guests: guestList,
      total: guestList.reduce((sum, guest) => sum + guest.total, 0),
    };
  }

  private mapOrder(order: any, items: any[]) {
    return {
      id: Number(order.id),
      orderNumber: Number(order.order_number),
      status: order.status,
      total: Number(order.total),
      createdAt: order.created_at,
      items,
    };
  }

  private async findOne(id: number) {
    const rows = await this.database.query<any[]>(
      `SELECT id, table_number, name, is_active, created_at
       FROM restaurant_tables WHERE id = ? LIMIT 1`,
      [id],
    );
    if (!rows.length) throw new NotFoundException('Tavolo non trovato');
    return this.mapTable(rows[0]);
  }

  private mapTable(row: any) {
    return {
      id: Number(row.id),
      tableNumber: Number(row.table_number),
      name: row.name,
      isActive: Boolean(row.is_active),
      session: row.session_id
        ? {
            id: Number(row.session_id),
            status: 'open',
            openedAt: row.opened_at,
            guestCount: Number(row.guest_count),
          }
        : null,
      createdAt: row.created_at,
    };
  }

  private newToken() {
    return randomBytes(32).toString('base64url');
  }

  private hash(value: string) {
    return createHash('sha256').update(value).digest('hex');
  }
}
