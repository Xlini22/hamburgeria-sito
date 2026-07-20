import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductsModule } from './products/products.module';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import {ServeStaticModule} from "@nestjs/serve-static";
import { join } from "path";
import { CategoriesModule } from './categories/categories.module';
import { validateEnvironment } from './config/validate-environment';

@Module({
  imports: [ConfigModule.forRoot({
    isGlobal: true,
    validate: validateEnvironment,
  }), DatabaseModule, ProductsModule, CategoriesModule, AuthModule, ServeStaticModule.forRoot({
    rootPath: join(process.cwd(), 'public'),
    renderPath: '/',
    exclude: ['/api', '/api/{*path}'],
  })],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
