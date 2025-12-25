import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IdempotencyEntity } from '../entities/idempotency.entity';

@Injectable()
export class IdempotencyService {
  constructor(
    @InjectRepository(IdempotencyEntity)
    private idempotencyRepository: Repository<IdempotencyEntity>,
  ) {}

  async checkAndSaveKey(key: string, serviceName: string): Promise<boolean> {
    const existingKey = await this.idempotencyRepository.findOne({ where: { key, service_name: serviceName } });
    if (existingKey) {
      return false; // Key already exists
    }

    const newKey = this.idempotencyRepository.create({
      key,
      service_name: serviceName,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    await this.idempotencyRepository.save(newKey);
    return true; // Key saved successfully
  }
}
