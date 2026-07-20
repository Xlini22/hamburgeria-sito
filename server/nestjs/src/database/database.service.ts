import {
  Injectable,
  OnModuleDestroy,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createPool, Pool, PoolConnection } from 'mysql2/promise';

type TransactionQuery = <T = any[]>(sql: string, params?: any[]) => Promise<T>;

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly pool: Pool;

  constructor(private readonly configService: ConfigService) {
    const user = this.configService.getOrThrow<string>('DB_USER');
    const password =
      user === 'root'
        ? (this.configService.get<string>('DB_ROOT_PASSWORD') ??
          this.configService.getOrThrow<string>('DB_ROOT'))
        : this.configService.getOrThrow<string>('DB_PASSWORD');

    this.pool = createPool({
      host: this.configService.getOrThrow<string>('DB_HOST'),
      user,
      password,
      database: this.configService.getOrThrow<string>('DB_NAME'),
      port: this.configService.get<number>('DB_PORT', 3306),
      waitForConnections: true,
      connectionLimit: this.configService.get<number>('DB_POOL_SIZE', 10),
      queueLimit: 0,
      decimalNumbers: true,
    });
  }

  async query<T = any[]>(sql: string, params: any[] = []): Promise<T> {
    try {
      const [rows] = await this.pool.execute(sql, params);
      return rows as T;
    } catch (error) {
      return this.rethrowDatabaseError(error);
    }
  }

  async transaction<T>(
    callback: (query: TransactionQuery) => Promise<T>,
  ): Promise<T> {
    let connection: PoolConnection | undefined;
    try {
      connection = await this.pool.getConnection();
      await connection.beginTransaction();
      const activeConnection = connection;
      const query: TransactionQuery = async (sql, params = []) => {
        const [rows] = await activeConnection.execute(sql, params);
        return rows as any;
      };
      const result = await callback(query);
      await connection.commit();
      return result;
    } catch (error) {
      if (connection) {
        await connection.rollback().catch(() => undefined);
      }
      return this.rethrowDatabaseError(error);
    } finally {
      connection?.release();
    }
  }

  private rethrowDatabaseError(error: unknown): never {
    const connectionCodes = new Set([
      'ECONNREFUSED',
      'ECONNRESET',
      'ETIMEDOUT',
      'ENOTFOUND',
      'EHOSTUNREACH',
      'PROTOCOL_CONNECTION_LOST',
      'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR',
    ]);
    const code =
      typeof error === 'object' && error !== null && 'code' in error
        ? String(error.code)
        : '';

    if (connectionCodes.has(code)) {
      throw new ServiceUnavailableException({
        statusCode: 503,
        error: 'Service Unavailable',
        message: 'Database temporaneamente non disponibile',
      });
    }

    throw error;
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
