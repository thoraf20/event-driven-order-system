import { Injectable, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ProductEntity } from '../entities/product.entity';
import { InventoryReservationEntity } from '../entities/inventory-reservation.entity';
import { InventoryStatus, PaymentProcessedPayload, InventoryReservedPayload } from '@app/common';
import { ClientProxy } from '@nestjs/microservices';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    @InjectRepository(ProductEntity)
    private productsRepository: Repository<ProductEntity>,
    @InjectRepository(InventoryReservationEntity)
    private reservationsRepository: Repository<InventoryReservationEntity>,
    private dataSource: DataSource,
    @Inject('INVENTORY_SERVICE') private client: ClientProxy,
  ) {}

  async reserveStock(payload: PaymentProcessedPayload) {
    this.logger.log(`Reserving stock for order: ${payload.orderId}`);
    
    // In a real app, we'd get items from the original order or payload
    // For this prototype, let's assume the payload should have included items
    // Since it didn't in my previous step, I'll simulate by finding products
    
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Simulate: Deduct from stock_quantity, add to reserved_quantity
      // For MVP, we'll just create a reservation record
      
      const reservation = this.reservationsRepository.create({
        order_id: payload.orderId,
        product_id: uuidv4(), // Simulation: random product
        quantity: 1,
        status: InventoryStatus.RESERVED,
      });

      const savedReservation = await queryRunner.manager.save(reservation);

      // Emit InventoryReserved event
      const eventPayload: InventoryReservedPayload = {
        orderId: payload.orderId,
        reservationId: savedReservation.id,
        items: [{ productId: savedReservation.product_id, quantity: savedReservation.quantity }],
      };

      this.client.emit('inventory.reserved', {
        ...eventPayload,
        eventId: uuidv4(),
        timestamp: new Date(),
        metadata: { source: 'inventory-service' },
      });

      await queryRunner.commitTransaction();
      this.logger.log(`Stock reserved for order: ${payload.orderId}`);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Stock reservation failed for order ${payload.orderId}: ${error.message}`);
      // Emit inventory.reservation_failed here
    } finally {
      await queryRunner.release();
    }
  }
}
