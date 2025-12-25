import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('idempotency_keys')
export class IdempotencyEntity {
  @PrimaryColumn()
  key: string;

  @Column()
  service_name: string;

  @Column({ type: 'jsonb', nullable: true })
  response: any;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'timestamp' })
  expires_at: Date;
}
