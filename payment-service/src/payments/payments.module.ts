import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PaymentEntity } from '../entities/payment.entity';
import { IdempotencyModule } from '../idempotency/idempotency.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PaymentEntity]),
    IdempotencyModule,
    ClientsModule.register([

      {
        name: 'PAYMENT_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
          queue: process.env.RABBITMQ_PAYMENT_QUEUE || 'payment_queue',
          queueOptions: {
            durable: true,
            arguments: {
              'x-dead-letter-exchange': 'payment_service_dlx',
              'x-dead-letter-routing-key': 'payment_service_dlq',
            },
          },
        },
      },

    ]),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
