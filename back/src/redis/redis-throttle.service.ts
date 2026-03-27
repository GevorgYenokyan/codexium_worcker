import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisThrottleService {
  private redis: Redis;

  constructor() { 
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'redis',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD,
    });

    this.redis.on('error', (err) => {
      console.error('Redis Throttle Error:', err);
    });
  }

  async checkFailedAttempts(key: string, limit: number): Promise<number> {
    const count = await this.redis.get(key);
    return count ? parseInt(count, 10) : 0;
  }

  async incrementFailedAttempts(key: string, ttl: number): Promise<number> {
    const count = await this.redis.incr(key);

    if (count === 1) {
      await this.redis.expire(key, ttl);
    }

    return count;
  }

  async resetFailedAttempts(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async getTTL(key: string): Promise<number> {
    return await this.redis.ttl(key);
  }
}
