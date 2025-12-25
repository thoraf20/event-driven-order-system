import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersModule } from './orders/orders.module';
import { OrderEntity } from './entities/order.entity';
import { OrderItemEntity } from './entities/order-item.entity';
import { OrderEventEntity } from './entities/order-event.entity';
import { IdempotencyEntity } from './entities/idempotency.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/order_db',
      entities: [OrderEntity, OrderItemEntity, OrderEventEntity, IdempotencyEntity],
      synchronize: true,
    }),
    OrdersModule,
  ],
})
export class AppModule {}

