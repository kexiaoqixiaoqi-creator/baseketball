import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ensureDatabase } from './ensure-database';
import { seedAdminUser } from './seed-admin';

async function bootstrap() {
  await ensureDatabase();
  const app = await NestFactory.create(AppModule);
  await seedAdminUser(app);
  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  const port = process.env.API_PORT ?? 3001;
  await app.listen(port);
  console.log(`API running on http://localhost:${port}`);
}
bootstrap();
