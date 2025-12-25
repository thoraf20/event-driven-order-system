import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'nestjs-pino';
import { TerminusModule } from '@nestjs/terminus';
import { PaymentsModule } from './payments/payments.module';
import { HealthController } from './health/health.controller';

import { PaymentEntity } from './entities/payment.entity';
import { IdempotencyEntity } from './entities/idempotency.entity';


@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/payment_db',
      entities: [PaymentEntity, IdempotencyEntity],
      synchronize: true,
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport: process.env.NODE_ENV !== 'production' ? { target: 'pino-pretty' } : undefined,
      },
    }),
    TerminusModule,
    PaymentsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
