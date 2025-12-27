import { Controller, Post, Get, Body, Param, Logger } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { OrderStatus } from '@app/common';
import { OrdersService } from './orders.service';
import { IdempotencyService } from '../idempotency/idempotency.service';
import { CreateOrderDto } from '../dto/create-order.dto';
import { CircuitBreakerService } from './circuit-breaker.service';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';


@Controller('orders')
export class OrdersController {
  private readonly logger = new Logger(OrdersController.name);

  constructor(
    private readonly ordersService: OrdersService,
    private readonly idempotencyService: IdempotencyService,
    private readonly circuitBreaker: CircuitBreakerService,
    @Inject('RETRY_SERVICE')
    private readonly retryClient: ClientProxy,
  ) {}

  @Post()
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Get(':id/events')
  findEvents(@Param('id') id: string) {
    return this.ordersService.findEvents(id);
  }

  @EventPattern('payment.processed')
  async handlePaymentProcessed(@Payload() data: any, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    
    try {
      const isNew = await this.idempotencyService.checkAndSaveKey(data.eventId, 'order-service');
      if (isNew) {
        this.logger.log(`Received payment.processed for order: ${data.orderId}`);
      
        const inventoryCircuit = await this.circuitBreaker.check('inventory-service');
        if (inventoryCircuit === 'OPEN') {
          this.logger.warn(`Inventory circuit is OPEN. Routing payment.processed for order ${data.orderId} to retry exchange.`);
          this.retryClient.emit('payment.processed', data);
          return channel.ack(originalMsg); // Ack from main queue, let retry queue handle it
        }

        await this.ordersService.updateStatus(data.orderId, OrderStatus.PAYMENT_COMPLETED);
        await this.circuitBreaker.recordSuccess('payment-service');
      }
      channel.ack(originalMsg);
    } catch (error) {
      this.logger.error(`Error processing payment.processed: ${error.message}`);
      channel.nack(originalMsg, false, false); // Move to DLQ
    }
  }

  @EventPattern('payment.failed')
  async handlePaymentFailed(@Payload() data: any, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      const isNew = await this.idempotencyService.checkAndSaveKey(data.eventId, 'order-service');
      if (isNew) {
        this.logger.log(`Received payment.failed for order: ${data.orderId}`);
        await this.ordersService.failOrder(data.orderId, data.reason);
        await this.circuitBreaker.recordFailure('payment-service');
      }
      channel.ack(originalMsg);
    } catch (error) {
      this.logger.error(`Error processing payment.failed: ${error.message}`);
      channel.nack(originalMsg, false, false);
    }
  }

  @EventPattern('inventory.reserved')
  async handleInventoryReserved(@Payload() data: any, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      const isNew = await this.idempotencyService.checkAndSaveKey(data.eventId, 'order-service');
      if (isNew) {
        this.logger.log(`Received inventory.reserved for order: ${data.orderId}`);
        await this.ordersService.completeOrder(data.orderId);
      }
      channel.ack(originalMsg);
    } catch (error) {
      this.logger.error(`Error processing inventory.reserved: ${error.message}`);
      channel.nack(originalMsg, false, false);
    }
  }

  @EventPattern('inventory.reservation_failed')
  async handleInventoryFailed(@Payload() data: any, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      const isNew = await this.idempotencyService.checkAndSaveKey(data.eventId, 'order-service');
      if (isNew) {
        this.logger.log(`Received inventory.failed for order: ${data.orderId}`);
        await this.ordersService.compensateOrder(data.orderId, data.reason);
      }
      channel.ack(originalMsg);
    } catch (error) {
      this.logger.error(`Error processing inventory.failed: ${error.message}`);
      channel.nack(originalMsg, false, false);
    }
  }

  @EventPattern('payment.refunded')
  async handlePaymentRefunded(@Payload() data: any, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      const isNew = await this.idempotencyService.checkAndSaveKey(data.eventId, 'order-service');
      if (isNew) {
        this.logger.log(`Received payment.refunded for order: ${data.orderId}`);
        await this.ordersService.failOrder(data.orderId, 'Payment refunded successfully');
      }
      channel.ack(originalMsg);
    } catch (error) {
      this.logger.error(`Error processing payment.refunded: ${error.message}`);
      channel.nack(originalMsg, false, false);
    }
  }
}




