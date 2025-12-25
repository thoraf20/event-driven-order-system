import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { InventoryService } from './inventory.service';
import { IdempotencyService } from '../idempotency/idempotency.service';

@Controller()
export class InventoryController {
  private readonly logger = new Logger(InventoryController.name);

  constructor(
    private readonly inventoryService: InventoryService,
    private readonly idempotencyService: IdempotencyService,
  ) {}

  @EventPattern('payment.processed')
  async handlePaymentProcessed(@Payload() data: any) {
    const isNew = await this.idempotencyService.checkAndSaveKey(data.eventId, 'inventory-service');
    if (!isNew) {
      this.logger.warn(`Duplicate payment.processed event received: ${data.eventId}`);
      return;
    }

    this.logger.log(`Received payment.processed event for order: ${data.orderId}`);
    await this.inventoryService.reserveStock(data);
  }

  @EventPattern('order.failed')
  async handleOrderFailed(@Payload() data: any) {
    const isNew = await this.idempotencyService.checkAndSaveKey(data.eventId, 'inventory-service');
    if (!isNew) {
      this.logger.warn(`Duplicate order.failed event received: ${data.eventId}`);
      return;
    }

    this.logger.log(`Received order.failed for order: ${data.orderId}. Releasing stock if any.`);
    await this.inventoryService.releaseStock(data.orderId);
  }
}


