import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { LoggerModule } from 'nestjs-pino';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProfileModule } from './profile/profile.module';
import { TendersModule } from './tenders/tenders.module';
import { MinioModule } from './minio/minio.module';
import { QueueModule } from './queue/queue.module';

@Module({
  imports: [
    // ── Config ─────────────────────────────────────────────────
    ConfigModule.forRoot({ isGlobal: true }),

    // ── Pino logging ────────────────────────────────────────────
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { colorize: true } }
            : undefined,
      },
    }),

    // ── BullMQ / Redis ──────────────────────────────────────────
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    }),

    // ── Feature Modules ─────────────────────────────────────────
    PrismaModule,
    AuthModule,
    UsersModule,
    ProfileModule,
    TendersModule,
    MinioModule,
    QueueModule,
  ],
})
export class AppModule {}
