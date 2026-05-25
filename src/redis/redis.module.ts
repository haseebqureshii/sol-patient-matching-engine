import { Module, Global } from '@nestjs/common';
import { Redis } from '@upstash/redis';

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useValue: Redis.fromEnv(), // This automatically reads UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
    },
  ],
  exports: ['REDIS_CLIENT'],
})
export class RedisModule {}