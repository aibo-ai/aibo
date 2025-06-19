import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisCacheService implements OnModuleInit {
  private readonly logger = new Logger(RedisCacheService.name);
  private redisClient: Redis;
  private readonly defaultTtl: number = 3600; // Default TTL in seconds (1 hour)

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    try {
      const redisHost = this.configService.get<string>('AZURE_REDIS_HOST');
      const redisPort = this.configService.get<number>('AZURE_REDIS_PORT') || 6380;
      const redisPassword = this.configService.get<string>('AZURE_REDIS_KEY');
      const enableTls = this.configService.get<boolean>('AZURE_REDIS_TLS_ENABLED') !== false;

      if (!redisHost || !redisPassword) {
        this.logger.warn('Redis configuration incomplete. Caching will be disabled.');
        return;
      }

      this.redisClient = new Redis({
        host: redisHost,
        port: redisPort,
        password: redisPassword,
        tls: enableTls ? { servername: redisHost } : undefined,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
      });

      this.redisClient.on('connect', () => {
        this.logger.log('Successfully connected to Redis cache');
      });

      this.redisClient.on('error', (error) => {
        this.logger.error(`Redis connection error: ${error.message}`);
      });
    } catch (error) {
      this.logger.error(`Failed to initialize Redis cache: ${error.message}`);
    }
  }

  /**
   * Set a value in the cache
   * @param key Cache key
   * @param value Value to cache (will be JSON stringified)
   * @param ttl Time-to-live in seconds (optional, defaults to 1 hour)
   */
  async set(key: string, value: any, ttl: number = this.defaultTtl): Promise<void> {
    try {
      if (!this.redisClient) {
        return;
      }
      
      const serializedValue = JSON.stringify(value);
      await this.redisClient.set(key, serializedValue, 'EX', ttl);
      this.logger.debug(`Cache set: ${key} (TTL: ${ttl}s)`);
    } catch (error) {
      this.logger.error(`Error setting cache key ${key}: ${error.message}`);
    }
  }

  /**
   * Get a value from the cache
   * @param key Cache key
   * @returns The cached value or null if not found
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      if (!this.redisClient) {
        return null;
      }
      
      const cachedValue = await this.redisClient.get(key);
      
      if (!cachedValue) {
        return null;
      }
      
      this.logger.debug(`Cache hit: ${key}`);
      return JSON.parse(cachedValue) as T;
    } catch (error) {
      this.logger.error(`Error getting cache key ${key}: ${error.message}`);
      return null;
    }
  }

  /**
   * Delete a value from the cache
   * @param key Cache key
   */
  async delete(key: string): Promise<void> {
    try {
      if (!this.redisClient) {
        return;
      }
      
      await this.redisClient.del(key);
      this.logger.debug(`Cache deleted: ${key}`);
    } catch (error) {
      this.logger.error(`Error deleting cache key ${key}: ${error.message}`);
    }
  }

  /**
   * Check if a key exists in the cache
   * @param key Cache key
   * @returns True if the key exists, false otherwise
   */
  async exists(key: string): Promise<boolean> {
    try {
      if (!this.redisClient) {
        return false;
      }
      
      const exists = await this.redisClient.exists(key);
      return exists === 1;
    } catch (error) {
      this.logger.error(`Error checking if key ${key} exists: ${error.message}`);
      return false;
    }
  }

  /**
   * Get a value from the cache or set it if not found
   * @param key Cache key
   * @param factory Function to generate the value if not in cache
   * @param ttl Time-to-live in seconds (optional, defaults to 1 hour)
   * @returns The cached value or the newly generated value
   */
  async getOrSet<T>(key: string, factory: () => Promise<T>, ttl: number = this.defaultTtl): Promise<T> {
    try {
      if (!this.redisClient) {
        return await factory();
      }
      
      const cachedValue = await this.get<T>(key);
      
      if (cachedValue !== null) {
        return cachedValue;
      }
      
      const newValue = await factory();
      await this.set(key, newValue, ttl);
      return newValue;
    } catch (error) {
      this.logger.error(`Error in getOrSet for key ${key}: ${error.message}`);
      return await factory();
    }
  }

  /**
   * Clear all keys with a specific prefix
   * @param prefix Key prefix to clear
   */
  async clearByPrefix(prefix: string): Promise<void> {
    try {
      if (!this.redisClient) {
        return;
      }
      
      const keys = await this.redisClient.keys(`${prefix}*`);
      
      if (keys.length > 0) {
        await this.redisClient.del(...keys);
        this.logger.debug(`Cleared ${keys.length} keys with prefix: ${prefix}`);
      }
    } catch (error) {
      this.logger.error(`Error clearing keys with prefix ${prefix}: ${error.message}`);
    }
  }
}
