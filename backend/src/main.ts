import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  app.setGlobalPrefix('api');
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
    }),
  );
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });

  const corsOrigins =
    config.get<string[]>('corsOrigins') ??
    config
      .get<string>('CORS_ORIGINS')
      ?.split(',')
      .map((origin) => origin.trim()) ?? ['http://localhost:5173'];

  app.enableCors({
    origin: corsOrigins,
  });

  app.useGlobalFilters(new HttpExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // drops fields the DTO doesn't declare
      forbidNonWhitelisted: true, // ...and rejects the request instead
      transform: true,
    }),
  );

  const swagger = new DocumentBuilder()
    .setTitle('Arif Food API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, swagger));

  const port = Number(config.get('PORT') ?? 3000);
  await app.listen(port, '0.0.0.0');
  console.log(`Server listening on port ${port}`);
}

void bootstrap();
