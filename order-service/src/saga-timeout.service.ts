import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { OrderEntity } from './entities/order.entity';
import { OrdersService } from './orders/orders.service';
import { OrderStatus } from '@app/common';

@Injectable()
export class SagaTimeoutService {
  private readonly logger = new Logger(SagaTimeoutService.name);

  constructor(
    @InjectRepository(OrderEntity)
    private ordersRepository: Repository<OrderEntity>,
    private ordersService: OrdersService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleTimeout() {
    this.logger.log('Checking for timed out orders...');
    
    // Find orders stuck in intermediate statuses for more than 5 minutes
    const timeoutThreshold = new Date(Date.now() - 5 * 60 * 1000);
    
    const stuckOrders = await this.ordersRepository.find({
      where: [
        { status: OrderStatus.PENDING, updated_at: LessThan(timeoutThreshold) },
        { status: OrderStatus.PAYMENT_COMPLETED, updated_at: LessThan(timeoutThreshold) },
        { status: OrderStatus.COMPENSATING, updated_at: LessThan(timeoutThreshold) },
      ],
    });

    for (const order of stuckOrders) {
      this.logger.warn(`Saga timeout detected for order ${order.id}. Current status: ${order.status}`);
      
      try {
        if (order.status === OrderStatus.PAYMENT_COMPLETED) {
          // If payment was done but inventory never finished, trigger compensation
          await this.ordersService.compensateOrder(order.id, 'Saga Timeout');
        } else {
          // Otherwise just fail it
          await this.ordersService.failOrder(order.id, 'Saga Timeout');
        }
      } catch (error) {
        this.logger.error(`Failed to timeout order ${order.id}: ${error.message}`);
      }
    }
  }
}
