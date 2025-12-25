import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { OrdersModule } from './orders/orders.module';
import { SagaTimeoutService } from './saga-timeout.service';
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
    TypeOrmModule.forFeature([OrderEntity]),
    ScheduleModule.forRoot(),
    OrdersModule,
  ],
  providers: [SagaTimeoutService],
})
export class AppModule {}



