import { Inject, Injectable } from '@nestjs/common';
import { RedisClientType } from 'redis';

/**
 * Redis服务类，提供Redis数据库的操作方法
 * 该类被标记为@Injectable()，使其可以在其他服务或组件中注入使用
 */
@Injectable()
export class RedisService {
  /**
   * Redis客户端属性，用于执行Redis命令
   * 通过@Inject('REDIS_CLIENT')装饰器注入，确保在模块中正确配置了Redis客户端
   */
  @Inject('REDIS_CLIENT')
  private redisClient: RedisClientType;

  /**
   * 异步获取指定键的值
   * @param key 要获取值的键
   * @returns 返回键的值，如果键不存在则返回null
   */
  async get(key: string) {
    return await this.redisClient.get(key);
  }

  /**
   * 异步设置键的值，并可选地设置过期时间
   * @param key 要设置值的键
   * @param value 键的值，可以是字符串或数字
   * @param ttl 可选参数，键的过期时间（秒），如果不传则键不会自动过期
   */
  async set(key: string, value: string | number, ttl?: number) {
    await this.redisClient.set(key, value);

    // 如果传入了ttl参数，则为键设置过期时间
    if (ttl) {
      await this.redisClient.expire(key, ttl);
    }
  }

  async del(key: string) {
    await this.redisClient.del(key);
  }
}
