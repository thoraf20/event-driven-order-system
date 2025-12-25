import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'nestjs-pino';
import { TerminusModule } from '@nestjs/terminus';
import { InventoryModule } from './inventory/inventory.module';
import { HealthController } from './health/health.controller';

import { ProductEntity } from './entities/product.entity';
import { InventoryReservationEntity } from './entities/inventory-reservation.entity';
import { IdempotencyEntity } from './entities/idempotency.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/inventory_db',
      entities: [ProductEntity, InventoryReservationEntity, IdempotencyEntity],
      synchronize: true,
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport: process.env.NODE_ENV !== 'production' ? { target: 'pino-pretty' } : undefined,
      },
    }),
    TerminusModule,
    InventoryModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}

