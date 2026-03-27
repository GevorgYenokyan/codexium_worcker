import { Module } from '@nestjs/common';
import { RedisThrottleService } from './redis-throttle.service';

@Module({
  providers: [RedisThrottleService],
  exports: [RedisThrottleService],
})
export class RedisThrottleModule {}
