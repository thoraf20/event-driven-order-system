import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { LoggerModule } from 'nestjs-pino';
import { TerminusModule } from '@nestjs/terminus';
import { OrdersModule } from './orders/orders.module';
import { SagaTimeoutService } from './saga-timeout.service';
import { CorrelationMiddleware } from './middleware/correlation.middleware';
import { HealthController } from './health/health.controller';


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
    LoggerModule.forRoot({
      pinoHttp: {
        transport: process.env.NODE_ENV !== 'production' ? { target: 'pino-pretty' } : undefined,
      },
    }),
    TerminusModule,
    OrdersModule,
  ],
  controllers: [HealthController],
  providers: [SagaTimeoutService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationMiddleware).forRoutes('*');
  }
}
