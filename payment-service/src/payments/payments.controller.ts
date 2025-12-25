import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { PaymentsService } from './payments.service';
import { IdempotencyService } from '../idempotency/idempotency.service';

@Controller()
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly idempotencyService: IdempotencyService,
  ) {}

  @EventPattern('order.created')
  async handleOrderCreated(@Payload() data: any) {
    const isNew = await this.idempotencyService.checkAndSaveKey(data.eventId, 'payment-service');
    if (!isNew) {
      this.logger.warn(`Duplicate order.created event received: ${data.eventId}`);
      return;
    }

    this.logger.log(`Received order.created event for order: ${data.orderId}`);
    await this.paymentsService.processOrderCreated(data);
  }

  @EventPattern('payment.refund')
  async handlePaymentRefund(@Payload() data: any) {
    const isNew = await this.idempotencyService.checkAndSaveKey(data.eventId, 'payment-service');
    if (!isNew) {
      this.logger.warn(`Duplicate payment.refund event received: ${data.eventId}`);
      return;
    }

    this.logger.log(`Received payment.refund for order: ${data.orderId}`);
    await this.paymentsService.processRefund(data);
  }
}


