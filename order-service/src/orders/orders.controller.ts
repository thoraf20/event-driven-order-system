import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
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

  @EventPattern('inventory.reserved')
  async handleInventoryReserved(@Payload() data: any) {
    console.log(`Received inventory.reserved for order: ${data.orderId}`);
    await this.ordersService.completeOrder(data.orderId);
  }
}

