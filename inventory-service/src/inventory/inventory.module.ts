import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { ProductEntity } from '../entities/product.entity';
import { InventoryReservationEntity } from '../entities/inventory-reservation.entity';
import { IdempotencyModule } from '../idempotency/idempotency.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductEntity, InventoryReservationEntity]),
    IdempotencyModule,
    ClientsModule.register([

      {
        name: 'INVENTORY_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
          queue: process.env.RABBITMQ_INVENTORY_QUEUE || 'inventory_queue',
          queueOptions: {
            durable: true,
            arguments: {
              'x-dead-letter-exchange': 'inventory_service_dlx',
              'x-dead-letter-routing-key': 'inventory_service_dlq',
            },
          },
        },
      },

    ]),
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
})
export class InventoryModule {}
