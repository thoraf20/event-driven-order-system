import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { OrderStatus } from '@app/common';
import { OrdersService } from './orders.service';


import { CreateOrderDto } from '../dto/create-order.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

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
    console.log(`Received payment.processed for order: ${data.orderId}`);
    await this.ordersService.updateStatus(data.orderId, OrderStatus.PAYMENT_COMPLETED);
    // In a real app, the orchestrator would then trigger inventory reservation
  }

  @EventPattern('payment.failed')
  async handlePaymentFailed(@Payload() data: any) {
    console.log(`Received payment.failed for order: ${data.orderId}`);
    await this.ordersService.failOrder(data.orderId, data.reason);
  }

  @EventPattern('inventory.reserved')
  async handleInventoryReserved(@Payload() data: any) {
    console.log(`Received inventory.reserved for order: ${data.orderId}`);
    await this.ordersService.completeOrder(data.orderId);
  }

  @EventPattern('inventory.reservation_failed')
  async handleInventoryFailed(@Payload() data: any) {
    console.log(`Received inventory.failed for order: ${data.orderId}`);
    await this.ordersService.compensateOrder(data.orderId, data.reason);
  }

  @EventPattern('payment.refunded')
  async handlePaymentRefunded(@Payload() data: any) {
    console.log(`Received payment.refunded for order: ${data.orderId}`);
    await this.ordersService.failOrder(data.orderId, 'Payment refunded successfully');
  }
}


