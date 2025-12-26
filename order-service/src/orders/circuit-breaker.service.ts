import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

@Injectable()
export class CircuitBreakerService implements OnModuleInit {
  private redis: Redis;
  private readonly logger = new Logger(CircuitBreakerService.name);
  
  private readonly FAILURE_THRESHOLD = 5;
  private readonly RECOVERY_TIMEOUT = 30000; // 30 seconds
  private readonly HALF_OPEN_SUCCESS_THRESHOLD = 2;

  onModuleInit() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    this.redis.on('error', (err) => this.logger.error('Redis Error', err));
  }

  async check(serviceName: string): Promise<CircuitState> {
    const state = await this.redis.get(`cb:${serviceName}:state`) as CircuitState || CircuitState.CLOSED;

    if (state === CircuitState.OPEN) {
      const openTime = await this.redis.get(`cb:${serviceName}:open_time`);
      if (openTime && Date.now() - parseInt(openTime) > this.RECOVERY_TIMEOUT) {
        await this.setState(serviceName, CircuitState.HALF_OPEN);
        return CircuitState.HALF_OPEN;
      }
      return CircuitState.OPEN;
    }

    return state;
  }

  async recordFailure(serviceName: string) {
    const failures = await this.redis.incr(`cb:${serviceName}:failures`);
    this.logger.warn(`Failure recorded for ${serviceName}. Current failures: ${failures}`);

    if (failures >= this.FAILURE_THRESHOLD) {
      await this.setState(serviceName, CircuitState.OPEN);
      await this.redis.set(`cb:${serviceName}:open_time`, Date.now().toString());
    }
  }

  async recordSuccess(serviceName: string) {
    const state = await this.check(serviceName);
    
    if (state === CircuitState.HALF_OPEN) {
      const successes = await this.redis.incr(`cb:${serviceName}:half_open_successes`);
      if (successes >= this.HALF_OPEN_SUCCESS_THRESHOLD) {
        await this.reset(serviceName);
      }
    } else {
      await this.reset(serviceName);
    }
  }

  private async setState(serviceName: string, state: CircuitState) {
    this.logger.log(`Circuit for ${serviceName} transitioning to ${state}`);
    await this.redis.set(`cb:${serviceName}:state`, state);
  }

  private async reset(serviceName: string) {
    this.logger.log(`Resetting circuit for ${serviceName}`);
    await this.redis.set(`cb:${serviceName}:state`, CircuitState.CLOSED);
    await this.redis.del(`cb:${serviceName}:failures`);
    await this.redis.del(`cb:${serviceName}:half_open_successes`);
    await this.redis.del(`cb:${serviceName}:open_time`);
  }
}
