import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { KitchenController } from './kitchen.controller';
import { KitchenService } from './kitchen.service';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [KitchenController],
  providers: [KitchenService],
})
export class KitchenModule {}
