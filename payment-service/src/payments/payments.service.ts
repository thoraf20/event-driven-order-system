import { Injectable, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentEntity } from '../entities/payment.entity';
import { PaymentStatus, OrderCreatedPayload, PaymentProcessedPayload } from '@app/common';
import { ClientProxy } from '@nestjs/microservices';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(PaymentEntity)
    private paymentsRepository: Repository<PaymentEntity>,
    @Inject('PAYMENT_SERVICE') 
    private client: ClientProxy,
  ) {}

  async processOrderCreated(payload: OrderCreatedPayload) {
    this.logger.log(`Processing payment for order: ${payload.orderId}`);
    
    try {
      // Simulate payment processing
      const payment = this.paymentsRepository.create({
        order_id: payload.orderId,
        amount: payload.totalAmount,
        status: PaymentStatus.COMPLETED,
        payment_method: 'SAGA_SIMULATOR',
        transaction_id: `TXN-${uuidv4().substring(0, 8).toUpperCase()}`,
      });

      const savedPayment = await this.paymentsRepository.save(payment);

      // Emit PaymentProcessed event
      const eventPayload: PaymentProcessedPayload = {
        orderId: savedPayment.order_id,
        paymentId: savedPayment.id,
        amount: Number(savedPayment.amount),
        transactionId: savedPayment.transaction_id,
      };

      this.client.emit('payment.processed', {
        ...eventPayload,
        eventId: uuidv4(),
        timestamp: new Date(),
        metadata: { source: 'payment-service' },
      });

      this.logger.log(`Payment processed successfully for order: ${payload.orderId}`);
    } catch (error) {
      this.logger.error(`Payment failed for order ${payload.orderId}: ${error.message}`);
      // In a real app, emit payment.failed here
    }
  }
}
