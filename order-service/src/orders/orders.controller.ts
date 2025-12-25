import { Controller, Post, Get, Body, Param, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { OrderStatus } from '@app/common';
import { OrdersService } from './orders.service';
import { IdempotencyService } from '../idempotency/idempotency.service';
import { CreateOrderDto } from '../dto/create-order.dto';

@Controller('orders')
export class OrdersController {
  private readonly logger = new Logger(OrdersController.name);

  constructor(
    private readonly ordersService: OrdersService,
    private readonly idempotencyService: IdempotencyService,
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
  async handlePaymentProcessed(@Payload() data: any) {
    const isNew = await this.idempotencyService.checkAndSaveKey(data.eventId, 'order-service');
    if (!isNew) return;

    this.logger.log(`Received payment.processed for order: ${data.orderId}`);
    await this.ordersService.updateStatus(data.orderId, OrderStatus.PAYMENT_COMPLETED);
  }

  @EventPattern('payment.failed')
  async handlePaymentFailed(@Payload() data: any) {
    const isNew = await this.idempotencyService.checkAndSaveKey(data.eventId, 'order-service');
    if (!isNew) return;

    this.logger.log(`Received payment.failed for order: ${data.orderId}`);
    await this.ordersService.failOrder(data.orderId, data.reason);
  }

  @EventPattern('inventory.reserved')
  async handleInventoryReserved(@Payload() data: any) {
    const isNew = await this.idempotencyService.checkAndSaveKey(data.eventId, 'order-service');
    if (!isNew) return;

    this.logger.log(`Received inventory.reserved for order: ${data.orderId}`);
    await this.ordersService.completeOrder(data.orderId);
  }

  @EventPattern('inventory.reservation_failed')
  async handleInventoryFailed(@Payload() data: any) {
    const isNew = await this.idempotencyService.checkAndSaveKey(data.eventId, 'order-service');
    if (!isNew) return;

    this.logger.log(`Received inventory.failed for order: ${data.orderId}`);
    await this.ordersService.compensateOrder(data.orderId, data.reason);
  }

  @EventPattern('payment.refunded')
  async handlePaymentRefunded(@Payload() data: any) {
    const isNew = await this.idempotencyService.checkAndSaveKey(data.eventId, 'order-service');
    if (!isNew) return;

    this.logger.log(`Received payment.refunded for order: ${data.orderId}`);
    await this.ordersService.failOrder(data.orderId, 'Payment refunded successfully');
  }
}



