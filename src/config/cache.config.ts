// cache.module.ts
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import * as cacheManager from 'cache-manager';
import * as MemcachedStore from 'cache-manager-memcached-store';


require('dotenv').config();

@Module({
  imports: [
    CacheModule.registerAsync({
      useFactory: () => ({
        store:'memcached',
        host: process.env.MEMCACHEDCLOUD_SERVERS||'localhost', 
        port: 11211, 
        ttl: 0, 
        username: process.env.MEMCACHEDCLOUD_USERNAME || '', 
        password: process.env.MEMCACHEDCLOUD_PASSWORD || '',
      }),
    }),
  ],
  exports: [CacheModule],
})
export class CacheConfigModule {}


