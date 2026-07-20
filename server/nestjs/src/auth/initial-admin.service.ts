import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class InitialAdminService implements OnApplicationBootstrap {
  private readonly logger = new Logger(InitialAdminService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly configService: ConfigService,
  ) {}

  async onApplicationBootstrap() {
    const password = this.configService.get<string>('INITIAL_ADMIN_PASSWORD');
    if (!password) return;

    const users = await this.databaseService.query<any[]>(
      'SELECT COUNT(*) AS total FROM users',
    );
    if (Number(users[0].total) > 0) return;

    const username =
      this.configService.get<string>('INITIAL_ADMIN_USERNAME')?.trim() ||
      'admin';
    const passwordHash = await bcrypt.hash(password, 12);
    await this.databaseService.query(
      `INSERT INTO users (username, password, role, is_active)
       VALUES (?, ?, 'admin', 1)`,
      [username, passwordHash],
    );
    this.logger.log(`Initial administrator "${username}" created`);
  }
}
