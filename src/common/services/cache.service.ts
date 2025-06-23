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

  async clear(): Promise<void> {
    try {
      this.cache.clear();
    } catch (error) {
      this.logger.error('Error clearing cache:', error);
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

  // Start periodic cleanup
  startCleanup(intervalMs: number = 300000): void { // Default 5 minutes
    setInterval(() => this.cleanup(), intervalMs);
  }
}
