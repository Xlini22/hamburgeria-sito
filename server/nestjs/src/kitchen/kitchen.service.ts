import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import type { UpdateKitchenOrderStatusDto } from './kitchen.dto';

const NEXT_STATUS: Record<string, string | null> = {
  new: 'preparing',
  preparing: 'ready',
  ready: 'delivered',
  delivered: null,
};

@Injectable()
export class KitchenService {
  constructor(private readonly database: DatabaseService) {}

  async findOrders() {
    const orders = await this.database.query<any[]>(
      `SELECT o.id, o.order_number, o.status, o.total, o.created_at,
              o.updated_at, t.id AS table_id, t.table_number, t.name AS table_name
       FROM table_orders o
       JOIN table_sessions ts ON ts.id = o.table_session_id
       JOIN restaurant_tables t ON t.id = ts.table_id
       WHERE o.status IN ('new', 'preparing', 'ready')
       ORDER BY FIELD(o.status, 'new', 'preparing', 'ready'),
                o.created_at, o.id`,
    );
    return this.withItems(orders);
  }

  async findHistory(limit = 50) {
    const safeLimit = Math.max(1, Math.min(100, Math.trunc(limit)));
    const orders = await this.database.query<any[]>(
      `SELECT o.id, o.order_number, o.status, o.total, o.created_at,
              o.updated_at, t.id AS table_id, t.table_number, t.name AS table_name
       FROM table_orders o
       JOIN table_sessions ts ON ts.id = o.table_session_id
       JOIN restaurant_tables t ON t.id = ts.table_id
       WHERE o.status IN ('delivered', 'cancelled')
       ORDER BY o.updated_at DESC, o.id DESC
       LIMIT ${safeLimit}`,
    );
    return this.withItems(orders);
  }

  async updateStatus(
    orderId: number,
    status: UpdateKitchenOrderStatusDto['status'],
    userId: number,
  ) {
    return this.database.transaction(async (query) => {
      const rows = await query<any[]>(
        `SELECT id, status FROM table_orders WHERE id = ? FOR UPDATE`,
        [orderId],
      );
      if (!rows.length) throw new NotFoundException('Ordine non trovato');
      const current = String(rows[0].status);
      if (current === status) return { id: orderId, status };
      if (NEXT_STATUS[current] !== status) {
        throw new ConflictException(
          `L’ordine non può passare da ${current} a ${status}`,
        );
      }
      await query(
        `UPDATE table_orders SET status = ?, updated_at = NOW(3) WHERE id = ?`,
        [status, orderId],
      );
      await query(
        `INSERT INTO table_order_status_history
          (order_id, status, changed_by_user_id)
         VALUES (?, ?, ?)`,
        [orderId, status, userId],
      );
      return { id: orderId, status };
    });
  }

  private async withItems(orders: any[]) {
    if (!orders.length) return [];
    const ids = orders.map((order) => Number(order.id));
    const placeholders = ids.map(() => '?').join(',');
    const rows = await this.database.query<any[]>(
      `SELECT oi.id, oi.order_id, oi.product_name, oi.quantity,
              oi.unit_price, oi.subtotal,
              oip.preference, oip.quantity AS preference_quantity
       FROM table_order_items oi
       LEFT JOIN table_order_item_preferences oip
         ON oip.order_item_id = oi.id
       WHERE oi.order_id IN (${placeholders})
       ORDER BY oi.order_id, oi.sort_order, oi.id, oip.id`,
      ids,
    );
    const grouped = new Map<number, Map<number, any>>();
    for (const row of rows) {
      const orderId = Number(row.order_id);
      if (!grouped.has(orderId)) grouped.set(orderId, new Map());
      const items = grouped.get(orderId)!;
      const itemId = Number(row.id);
      if (!items.has(itemId)) {
        items.set(itemId, {
          name: row.product_name,
          quantity: Number(row.quantity),
          unitPrice: Number(row.unit_price),
          subtotal: Number(row.subtotal),
          preferences: [],
        });
      }
      if (row.preference) {
        items.get(itemId).preferences.push({
          text: row.preference,
          quantity: Number(row.preference_quantity),
        });
      }
    }
    return orders.map((order) => ({
      id: Number(order.id),
      orderNumber: Number(order.order_number),
      status: order.status,
      total: Number(order.total),
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      table: {
        id: Number(order.table_id),
        number: Number(order.table_number),
        name: order.table_name,
      },
      items: [...(grouped.get(Number(order.id))?.values() || [])],
    }));
  }
}
