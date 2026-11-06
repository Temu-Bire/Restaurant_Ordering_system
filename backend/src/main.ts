import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strips fields not in the DTO
      transform: true, // runs @Transform and converts types
    }),
  );

  app.enableCors({ origin: 'http://localhost:5173' }); // Vite dev server

  const port = app.get(ConfigService).get<number>('port') ?? 3000;
  await app.listen(port);
  console.log(`API running on http://localhost:${port}`);
}
bootstrap();