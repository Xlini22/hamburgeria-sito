import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api', {
    exclude: ['/', '/index.html', '/index.js', '/login.html', '/login.js', '/product-detail', '/product-detail.html', '/product-detail.js', '/images/{*path}'],
  });
  app.enableCors(
    {
      origin: '*',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    }
  );
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
