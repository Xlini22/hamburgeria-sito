import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createPool, Pool } from 'mysql2/promise';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly pool: Pool;

  constructor(private readonly configService: ConfigService) {
    const user = this.configService.getOrThrow<string>('DB_USER');
    const password = user === 'root'
      ? this.configService.get<string>('DB_ROOT_PASSWORD')
        ?? this.configService.getOrThrow<string>('DB_ROOT')
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
    const [rows] = await this.pool.execute(sql, params);
    return rows as T;
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
