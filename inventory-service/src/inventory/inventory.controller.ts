import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
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
  async handlePaymentProcessed(@Payload() data: any, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      const isNew = await this.idempotencyService.checkAndSaveKey(data.eventId, 'inventory-service');
      if (isNew) {
        this.logger.log(`Received payment.processed event for order: ${data.orderId}`);
        await this.inventoryService.reserveStock(data);
      }
      channel.ack(originalMsg);
    } catch (error) {
      this.logger.error(`Error processing payment.processed: ${error.message}`);
      channel.nack(originalMsg, false, false);
    }
  }

  @EventPattern('order.failed')
  async handleOrderFailed(@Payload() data: any, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      const isNew = await this.idempotencyService.checkAndSaveKey(data.eventId, 'inventory-service');
      if (isNew) {
        this.logger.log(`Received order.failed for order: ${data.orderId}. Releasing stock if any.`);
        await this.inventoryService.releaseStock(data.orderId);
      }
      channel.ack(originalMsg);
    } catch (error) {
      this.logger.error(`Error processing order.failed: ${error.message}`);
      channel.nack(originalMsg, false, false);
    }
  }
}



