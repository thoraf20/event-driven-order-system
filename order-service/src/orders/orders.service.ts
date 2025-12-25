import { Injectable, Inject, Scope } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

import { OrderEntity } from '../entities/order.entity';
import { OrderItemEntity } from '../entities/order-item.entity';
import { OrderEventEntity } from '../entities/order-event.entity';
import { CreateOrderDto } from '../dto/create-order.dto';
import { OrderStatus, OrderCreatedPayload } from '@app/common';
import { ClientProxy } from '@nestjs/microservices';
import { v4 as uuidv4 } from 'uuid';

@Injectable({ scope: Scope.REQUEST })
export class OrdersService {
  constructor(
    @InjectRepository(OrderEntity)
    private ordersRepository: Repository<OrderEntity>,
    @InjectRepository(OrderEventEntity)
    private eventsRepository: Repository<OrderEventEntity>,
    private dataSource: DataSource,
    @Inject('ORDER_SERVICE') 
    private client: ClientProxy,
    @Inject(REQUEST) 
    private readonly request: Request,
  ) {}

  async completeOrder(orderId: string) {
    await this.updateStatus(orderId, OrderStatus.COMPLETED, { status: OrderStatus.COMPLETED });
  }

  async failOrder(orderId: string, reason: string) {
    await this.updateStatus(orderId, OrderStatus.FAILED, { reason });
    
    this.client.emit('order.failed', {
      orderId,
      reason,
      eventId: uuidv4(),
      timestamp: new Date(),
    });
  }


  async compensateOrder(orderId: string, reason: string) {
    const order = await this.findOne(orderId);
    if (!order) return;

    await this.updateStatus(orderId, OrderStatus.COMPENSATING, { reason });

    this.client.emit('payment.refund', {
      orderId,
      amount: Number(order.total_amount),
      reason: `Inventory failure: ${reason}`,
      eventId: uuidv4(),
      timestamp: new Date(),
    });
  }

  async updateStatus(orderId: string, status: OrderStatus, metadata: any = {}) {
    await this.ordersRepository.update(orderId, { status });
    
    const orderEvent = this.eventsRepository.create({
      order_id: orderId,
      event_type: `OrderStatusChanged:${status}`,
      event_data: { orderId, status, ...metadata },
    });
    
    await this.eventsRepository.save(orderEvent);
  }


  async create(createOrderDto: CreateOrderDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { customerId, items } = createOrderDto;
      
      const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

      const order = this.ordersRepository.create({
        customer_id: customerId,
        total_amount: totalAmount,
        status: OrderStatus.PENDING,
        items: items.map(item => ({
          product_id: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
      });

      const savedOrder = await queryRunner.manager.save(order);

      const eventPayload: OrderCreatedPayload = {
        orderId: savedOrder.id,
        customerId: savedOrder.customer_id,
        totalAmount: savedOrder.total_amount,
        items: savedOrder.items.map(item => ({
          productId: item.product_id,
          quantity: item.quantity,
          price: Number(item.price),
        })),
      };

      const orderEvent = this.eventsRepository.create({
        order_id: savedOrder.id,
        event_type: 'OrderCreated',
        event_data: eventPayload,
      });

      await queryRunner.manager.save(orderEvent);

      const correlationId = this.request.headers['x-correlation-id'] as string;

      this.client.emit('order.created', {
        ...eventPayload,
        eventId: uuidv4(),
        timestamp: new Date(),
        correlationId,
      });


      await queryRunner.commitTransaction();
      return savedOrder;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findOne(id: string) {
    return this.ordersRepository.findOne({
      where: { id },
      relations: ['items'],
    });
  }

  async findEvents(orderId: string) {
    return this.eventsRepository.find({
      where: { order_id: orderId },
      order: { created_at: 'ASC' },
    });
  }
}
