import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { ProductEntity } from './product.entity';
import { InventoryStatus } from '@app/common';

@Entity('inventory_reservations')
export class InventoryReservationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  order_id: string;

  @ManyToOne(() => ProductEntity, (product) => product.reservations)
  @JoinColumn({ name: 'product_id' })
  product: ProductEntity;

  @Column({ type: 'uuid' })
  product_id: string;

  @Column({ type: 'integer' })
  quantity: number;

  @Column({
    type: 'enum',
    enum: InventoryStatus,
    default: InventoryStatus.RESERVED,
  })
  status: InventoryStatus;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  expires_at: Date;
}
