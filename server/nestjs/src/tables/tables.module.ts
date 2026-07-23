import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { AdminTablesController, GuestTablesController } from './tables.controller';
import { TablesService } from './tables.service';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [AdminTablesController, GuestTablesController],
  providers: [TablesService],
  exports: [TablesService],
})
export class TablesModule {}
