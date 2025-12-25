import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { PaymentsService } from './payments.service';

@Controller()
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  @EventPattern('order.created')
  async handleOrderCreated(@Payload() data: any) {
    this.logger.log(`Received order.created event for order: ${data.orderId}`);
    await this.paymentsService.processOrderCreated(data);
  }

  @EventPattern('payment.refund')
  async handlePaymentRefund(@Payload() data: any) {
    this.logger.log(`Received payment.refund for order: ${data.orderId}`);
    await this.paymentsService.processRefund(data);
  }
}

