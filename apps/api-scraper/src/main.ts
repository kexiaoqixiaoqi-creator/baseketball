import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.API_SCRAPER_PORT ?? 3003;
  await app.listen(port);
  console.log(`api-scraper running on http://localhost:${port}`);
}
bootstrap();
