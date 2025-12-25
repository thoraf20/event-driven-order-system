import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsModule } from './payments/payments.module';
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
    PaymentsModule,
  ],
})
export class AppModule {}

