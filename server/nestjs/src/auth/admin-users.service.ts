import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import * as bcrypt from 'bcrypt';

type UserInput = {
  username?: string;
  password?: string;
  role?: string;
  isActive?: boolean;
};

@Injectable()
export class AdminUsersService {
  constructor(private readonly databaseService: DatabaseService) {}

  async findAll() {
    const rows = await this.databaseService.query<any[]>(`
      SELECT id, username, role, is_active, created_at, updated_at
      FROM users ORDER BY username
    `);
    return rows.map((user) => ({
      id: user.id,
      username: user.username,
      role: user.role,
      isActive: Boolean(user.is_active),
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    }));
  }

  async create(input: UserInput) {
    const data = this.validate(input, true);
    const password = await bcrypt.hash(data.password!, 12);
    try {
      const result = await this.databaseService.query<any>(
        `INSERT INTO users (username, password, role, is_active)
         VALUES (?, ?, ?, ?)`,
        [data.username, password, data.role, data.isActive],
      );
      return { id: result.insertId };
    } catch (error: any) {
      if (error?.code === 'ER_DUP_ENTRY') {
        throw new ConflictException('Username already exists');
      }
      throw error;
    }
  }

  async update(id: number, input: UserInput) {
    const users = await this.databaseService.query<any[]>(
      'SELECT id, username FROM users WHERE id = ? LIMIT 1',
      [id],
    );
    if (!users.length) throw new NotFoundException('User not found');
    const data = this.validate(input, false);
    if (
      users[0].username === 'admin' &&
      ((data.role && data.role !== 'admin') || data.isActive === false)
    ) {
      throw new BadRequestException(
        'The main admin cannot be demoted or disabled',
      );
    }
    const assignments: string[] = [];
    const values: any[] = [];
    if (data.username !== undefined) {
      assignments.push('username = ?');
      values.push(data.username);
    }
    if (data.password !== undefined) {
      assignments.push('password = ?');
      values.push(await bcrypt.hash(data.password, 12));
    }
    if (data.role !== undefined) {
      assignments.push('role = ?');
      values.push(data.role);
    }
    if (data.isActive !== undefined) {
      assignments.push('is_active = ?');
      values.push(data.isActive);
    }
    if (!assignments.length) return { id };
    values.push(id);
    try {
      await this.databaseService.transaction(async (query) => {
        await query(
          `UPDATE users SET ${assignments.join(', ')} WHERE id = ?`,
          values,
        );
        if (data.password !== undefined || data.isActive === false) {
          await query(
            `UPDATE auth_refresh_sessions
             SET revoked_at = COALESCE(revoked_at, NOW(3))
             WHERE user_id = ?`,
            [id],
          );
        }
      });
      return { id };
    } catch (error: any) {
      if (error?.code === 'ER_DUP_ENTRY') {
        throw new ConflictException('Username already exists');
      }
      throw error;
    }
  }

  private validate(input: UserInput, creating: boolean) {
    const data = { ...input };
    if (creating || data.username !== undefined) {
      data.username = data.username?.trim();
      if (!data.username || !/^[a-zA-Z0-9._-]{3,100}$/.test(data.username)) {
        throw new BadRequestException('Invalid username');
      }
    }
    if (creating || data.password !== undefined) {
      if (!data.password || data.password.length < 8) {
        throw new BadRequestException(
          'Password must contain at least 8 characters',
        );
      }
    }
    if (creating || data.role !== undefined) {
      data.role ??= 'editor';
      if (!['admin', 'editor', 'viewer'].includes(data.role)) {
        throw new BadRequestException('Invalid role');
      }
    }
    if (creating) data.isActive ??= true;
    return data;
  }
}
