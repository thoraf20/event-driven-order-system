import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
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
  async handleOrderCreated(@Payload() data: any, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      const isNew = await this.idempotencyService.checkAndSaveKey(data.eventId, 'payment-service');
      if (isNew) {
        this.logger.log(`Received order.created event for order: ${data.orderId}`);
        await this.paymentsService.processOrderCreated(data);
      }
      channel.ack(originalMsg);
    } catch (error) {
      this.logger.error(`Error processing order.created: ${error.message}`);
      channel.nack(originalMsg, false, false);
    }
  }

  @EventPattern('payment.refund')
  async handlePaymentRefund(@Payload() data: any, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      const isNew = await this.idempotencyService.checkAndSaveKey(data.eventId, 'payment-service');
      if (isNew) {
        this.logger.log(`Received payment.refund for order: ${data.orderId}`);
        await this.paymentsService.processRefund(data);
      }
      channel.ack(originalMsg);
    } catch (error) {
      this.logger.error(`Error processing payment.refund: ${error.message}`);
      channel.nack(originalMsg, false, false);
    }
  }
}



