import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { createClient } from 'redis';
import { ConfigService } from '@nestjs/config';

@Global()
@Module({
  providers: [
    RedisService,
    {
      provide: 'REDIS_CLIENT',
      async useFactory(configService: ConfigService) {
        const client = createClient({
          socket: {
            port: configService.get('redis_server_port'),
          },
        });
        await client.connect();
        return client;
      },
      inject: [ConfigService]
    },
  ],
  exports: [RedisService],
})
export class RedisModule {}
