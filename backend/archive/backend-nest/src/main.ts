import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { Logger } from 'nestjs-pino';
import * as Sentry from '@sentry/node';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // ── Pino structured logging ────────────────────────────────────
  app.useLogger(app.get(Logger));

  // ── Sentry error monitoring ────────────────────────────────────
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
    });
  }

  // ── Global validation pipe ──────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // ── CORS ───────────────────────────────────────────────────────
  app.enableCors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
  });

  // ── Swagger API docs ───────────────────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('TenderLens API')
    .setDescription('AI-powered Tender Intelligence & Bid Management Platform')
    .setVersion('2.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // ── Listen ─────────────────────────────────────────────────────
  const port = process.env.BACKEND_PORT || 3001;
  await app.listen(port);
  console.log(`🚀 TenderLens NestJS API running on port ${port}`);
  console.log(`📖 Swagger docs: http://localhost:${port}/api/docs`);
}

bootstrap();
