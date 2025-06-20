import { CosmosClient, Container, Database } from "@azure/cosmos";

export interface CacheEntry {
  id: string;
  key: string;
  value: any;
  ttl: number;
  createdAt: Date;
}

export class CacheService {
  private database: Database;
  private container: Container;
  private defaultTtl: number;

  constructor(
    private cosmosClient: CosmosClient,
    private databaseId: string = "freshness-aggregator",
    private containerId: string = "cache",
    defaultTtlSeconds: number = 3600
  ) {
    this.database = this.cosmosClient.database(this.databaseId);
    this.container = this.database.container(this.containerId);
    this.defaultTtl = defaultTtlSeconds;
  }

  /**
   * Initialize the cache container with TTL settings
   */
  async initialize(): Promise<void> {
    try {
      // Create database if it doesn't exist
      await this.cosmosClient.databases.createIfNotExists({
        id: this.databaseId
      });

      // Create container with TTL enabled
      await this.database.containers.createIfNotExists({
        id: this.containerId,
        partitionKey: "/key",
        defaultTtl: this.defaultTtl
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to initialize cache: ${errorMessage}`);
    }
  }

  /**
   * Get a cached value by key
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const { resource } = await this.container.item(key, key).read<CacheEntry>();
      
      if (!resource) {
        return null;
      }

      // Check if entry has expired (additional check beyond Cosmos TTL)
      const now = new Date();
      const expiry = new Date(resource.createdAt.getTime() + resource.ttl * 1000);
      
      if (now > expiry) {
        // Entry has expired, delete it
        await this.invalidate(key);
        return null;
      }

      return resource.value as T;
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 404) {
        return null;
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to get cache entry: ${errorMessage}`);
    }
  }

  /**
   * Set a cached value with optional TTL
   */
  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    try {
      const ttl = ttlSeconds || this.defaultTtl;
      const cacheEntry: CacheEntry = {
        id: key,
        key,
        value,
        ttl,
        createdAt: new Date()
      };

      await this.container.items.upsert(cacheEntry);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to set cache entry: ${errorMessage}`);
    }
  }

  /**
   * Invalidate (delete) a cached entry
   */
  async invalidate(key: string): Promise<void> {
    try {
      await this.container.item(key, key).delete();
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code !== 404) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to invalidate cache entry: ${errorMessage}`);
      }
    }
  }

  /**
   * Get cached value or set it if not exists
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttlSeconds?: number
  ): Promise<T> {
    try {
      // Try to get from cache first
      const cached = await this.get<T>(key);
      if (cached !== null) {
        return cached;
      }

      // Not in cache, generate value
      const value = await factory();
      
      // Cache the generated value
      await this.set(key, value, ttlSeconds);
      
      return value;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to getOrSet cache entry: ${errorMessage}`);
    }
  }

  /**
   * Clear all cache entries (use with caution)
   */
  async clear(): Promise<void> {
    try {
      const { resources } = await this.container.items
        .query("SELECT c.id, c.key FROM c")
        .fetchAll();

      const deletePromises = resources.map(item => 
        this.container.item(item.id, item.key).delete()
      );

      await Promise.all(deletePromises);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to clear cache: ${errorMessage}`);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    totalEntries: number;
    containerSize: string;
  }> {
    try {
      const { resources } = await this.container.items
        .query("SELECT VALUE COUNT(1) FROM c")
        .fetchAll();

      return {
        totalEntries: resources[0] || 0,
        containerSize: "Unknown" // Cosmos doesn't provide easy size metrics
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to get cache stats: ${errorMessage}`);
    }
  }
}
