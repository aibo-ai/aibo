import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
}

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private cache = new Map<string, { value: any; expiry: number }>();

  constructor(private configService: ConfigService) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const item = this.cache.get(key);
      
      if (!item) {
        return null;
      }

      if (Date.now() > item.expiry) {
        this.cache.delete(key);
        return null;
      }

      return item.value as T;
    } catch (error) {
      this.logger.error(`Error getting cache key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: any, options?: CacheOptions): Promise<void> {
    try {
      const ttl = options?.ttl || 3600; // Default 1 hour
      const expiry = Date.now() + (ttl * 1000);
      
      this.cache.set(key, { value, expiry });
    } catch (error) {
      this.logger.error(`Error setting cache key ${key}:`, error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      this.cache.delete(key);
    } catch (error) {
      this.logger.error(`Error deleting cache key ${key}:`, error);
    }
  }

  async clear(prefix?: string): Promise<boolean> {
    try {
      if (prefix) {
        // Clear only keys with the specified prefix
        const keysToDelete = Array.from(this.cache.keys()).filter(key => key.startsWith(prefix));
        keysToDelete.forEach(key => this.cache.delete(key));
      } else {
        this.cache.clear();
      }
      return true;
    } catch (error) {
      this.logger.error('Error clearing cache:', error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const item = this.cache.get(key);
      
      if (!item) {
        return false;
      }

      if (Date.now() > item.expiry) {
        this.cache.delete(key);
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error(`Error checking cache key ${key}:`, error);
      return false;
    }
  }

  async keys(pattern?: string): Promise<string[]> {
    try {
      const allKeys = Array.from(this.cache.keys());
      
      if (!pattern) {
        return allKeys;
      }

      // Simple pattern matching with wildcards
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return allKeys.filter(key => regex.test(key));
    } catch (error) {
      this.logger.error('Error getting cache keys:', error);
      return [];
    }
  }

  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      return Promise.all(keys.map(key => this.get<T>(key)));
    } catch (error) {
      this.logger.error('Error getting multiple cache keys:', error);
      return keys.map(() => null);
    }
  }

  async mset(keyValuePairs: Array<{ key: string; value: any; options?: CacheOptions }>): Promise<void> {
    try {
      await Promise.all(
        keyValuePairs.map(({ key, value, options }) => this.set(key, value, options))
      );
    } catch (error) {
      this.logger.error('Error setting multiple cache keys:', error);
    }
  }

  // Cleanup expired entries
  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Test cache functionality
      const testKey = 'health-check-test';
      const testValue = 'test-value';

      await this.set(testKey, testValue, { ttl: 1 });
      const retrieved = await this.get(testKey);
      await this.del(testKey);

      return retrieved === testValue;
    } catch (error) {
      this.logger.error('Cache health check failed:', error);
      return false;
    }
  }

  async getStats(): Promise<{
    hits: number;
    misses: number;
    keys: number;
    memory: string;
    uptime: number;
  }> {
    try {
      const memoryUsage = process.memoryUsage();
      const uptime = process.uptime();

      return {
        hits: 0, // In-memory cache doesn't track hits/misses
        misses: 0,
        keys: this.cache.size,
        memory: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        uptime: Math.round(uptime)
      };
    } catch (error) {
      this.logger.error('Error getting cache stats:', error);
      return {
        hits: 0,
        misses: 0,
        keys: 0,
        memory: '0MB',
        uptime: 0
      };
    }
  }

  // Start periodic cleanup
  startCleanup(intervalMs: number = 300000): void { // Default 5 minutes
    setInterval(() => this.cleanup(), intervalMs);
  }
}
