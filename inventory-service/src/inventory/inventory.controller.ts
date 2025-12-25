import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { InventoryService } from './inventory.service';

@Controller()
export class InventoryController {
  private readonly logger = new Logger(InventoryController.name);

  constructor(private readonly inventoryService: InventoryService) {}

  @EventPattern('payment.processed')
  async handlePaymentProcessed(@Payload() data: any) {
    this.logger.log(`Received payment.processed event for order: ${data.orderId}`);
    await this.inventoryService.reserveStock(data);
  }

  @EventPattern('order.failed')
  async handleOrderFailed(@Payload() data: any) {
    this.logger.log(`Received order.failed for order: ${data.orderId}. Releasing stock if any.`);
    await this.inventoryService.releaseStock(data.orderId);
  }
}

