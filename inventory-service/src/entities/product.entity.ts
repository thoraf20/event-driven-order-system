import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { InventoryReservationEntity } from './inventory-reservation.entity';

@Entity('products')
export class ProductEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  sku: string;

  @Column({ type: 'integer', default: 0 })
  stock_quantity: number;

  @Column({ type: 'integer', default: 0 })
  reserved_quantity: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price: number;

  @OneToMany(() => InventoryReservationEntity, (reservation) => reservation.product)
  reservations: InventoryReservationEntity[];
}
