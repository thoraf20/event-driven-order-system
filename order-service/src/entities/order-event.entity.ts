import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('order_events')
export class OrderEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  order_id: string;

  @Column()
  event_type: string;

  @Column({ type: 'jsonb' })
  event_data: any;

  @CreateDateColumn()
  created_at: Date;
}
