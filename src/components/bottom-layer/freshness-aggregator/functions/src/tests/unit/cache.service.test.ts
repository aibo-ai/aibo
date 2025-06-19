import { CacheService, CacheEntry } from '../../services/cache.service';
import { CosmosClient } from '@azure/cosmos';

describe('CacheService', () => {
  let cacheService: CacheService;
  let mockCosmosClient: jest.Mocked<CosmosClient>;
  let mockContainer: any;
  let mockDatabase: any;

  beforeEach(() => {
    mockContainer = {
      items: {
        upsert: jest.fn(),
        query: jest.fn().mockReturnValue({
          fetchAll: jest.fn()
        })
      },
      item: jest.fn().mockReturnValue({
        read: jest.fn(),
        delete: jest.fn()
      })
    };

    mockDatabase = {
      container: jest.fn().mockReturnValue(mockContainer),
      containers: {
        createIfNotExists: jest.fn()
      }
    };

    mockCosmosClient = {
      database: jest.fn().mockReturnValue(mockDatabase),
      databases: {
        createIfNotExists: jest.fn()
      }
    } as any;

    cacheService = new CacheService(
      mockCosmosClient,
      'test-database',
      'test-container',
      3600
    );
  });

  describe('initialize', () => {
    it('should create database and container if they do not exist', async () => {
      mockCosmosClient.databases.createIfNotExists.mockResolvedValue({} as any);
      mockDatabase.containers.createIfNotExists.mockResolvedValue({} as any);

      await cacheService.initialize();

      expect(mockCosmosClient.databases.createIfNotExists).toHaveBeenCalledWith({
        id: 'test-database'
      });

      expect(mockDatabase.containers.createIfNotExists).toHaveBeenCalledWith({
        id: 'test-container',
        partitionKey: '/key',
        defaultTtl: 3600
      });
    });

    it('should handle initialization errors', async () => {
      const error = new Error('Database creation failed');
      mockCosmosClient.databases.createIfNotExists.mockRejectedValue(error);

      await expect(cacheService.initialize()).rejects.toThrow(
        'Failed to initialize cache: Database creation failed'
      );
    });
  });

  describe('get', () => {
    it('should return cached value when it exists and is not expired', async () => {
      const cacheEntry: CacheEntry = {
        id: 'test-key',
        key: 'test-key',
        value: { data: 'test-data' },
        ttl: 3600,
        createdAt: new Date()
      };

      mockContainer.item().read.mockResolvedValue({ resource: cacheEntry });

      const result = await cacheService.get('test-key');

      expect(result).toEqual({ data: 'test-data' });
      expect(mockContainer.item).toHaveBeenCalledWith('test-key', 'test-key');
    });

    it('should return null when cache entry does not exist', async () => {
      mockContainer.item().read.mockResolvedValue({ resource: null });

      const result = await cacheService.get('non-existent-key');

      expect(result).toBeNull();
    });

    it('should return null and delete expired entries', async () => {
      const expiredEntry: CacheEntry = {
        id: 'expired-key',
        key: 'expired-key',
        value: { data: 'expired-data' },
        ttl: 3600,
        createdAt: new Date(Date.now() - 7200000) // 2 hours ago
      };

      mockContainer.item().read.mockResolvedValue({ resource: expiredEntry });
      mockContainer.item().delete.mockResolvedValue({});

      const result = await cacheService.get('expired-key');

      expect(result).toBeNull();
      expect(mockContainer.item().delete).toHaveBeenCalled();
    });

    it('should handle 404 errors gracefully', async () => {
      const error = { code: 404 };
      mockContainer.item().read.mockRejectedValue(error);

      const result = await cacheService.get('missing-key');

      expect(result).toBeNull();
    });

    it('should throw on other errors', async () => {
      const error = new Error('Database connection failed');
      mockContainer.item().read.mockRejectedValue(error);

      await expect(cacheService.get('test-key')).rejects.toThrow(
        'Failed to get cache entry: Database connection failed'
      );
    });
  });

  describe('set', () => {
    it('should store cache entry with default TTL', async () => {
      const testValue = { data: 'test-data' };
      mockContainer.items.upsert.mockResolvedValue({});

      await cacheService.set('test-key', testValue);

      expect(mockContainer.items.upsert).toHaveBeenCalledWith({
        id: 'test-key',
        key: 'test-key',
        value: testValue,
        ttl: 3600,
        createdAt: expect.any(Date)
      });
    });

    it('should store cache entry with custom TTL', async () => {
      const testValue = { data: 'test-data' };
      mockContainer.items.upsert.mockResolvedValue({});

      await cacheService.set('test-key', testValue, 7200);

      expect(mockContainer.items.upsert).toHaveBeenCalledWith({
        id: 'test-key',
        key: 'test-key',
        value: testValue,
        ttl: 7200,
        createdAt: expect.any(Date)
      });
    });

    it('should handle set errors', async () => {
      const error = new Error('Upsert failed');
      mockContainer.items.upsert.mockRejectedValue(error);

      await expect(cacheService.set('test-key', 'test-value')).rejects.toThrow(
        'Failed to set cache entry: Upsert failed'
      );
    });
  });

  describe('invalidate', () => {
    it('should delete cache entry', async () => {
      mockContainer.item().delete.mockResolvedValue({});

      await cacheService.invalidate('test-key');

      expect(mockContainer.item).toHaveBeenCalledWith('test-key', 'test-key');
      expect(mockContainer.item().delete).toHaveBeenCalled();
    });

    it('should handle 404 errors gracefully', async () => {
      const error = { code: 404 };
      mockContainer.item().delete.mockRejectedValue(error);

      await expect(cacheService.invalidate('missing-key')).resolves.not.toThrow();
    });

    it('should throw on other delete errors', async () => {
      const error = new Error('Delete failed');
      mockContainer.item().delete.mockRejectedValue(error);

      await expect(cacheService.invalidate('test-key')).rejects.toThrow(
        'Failed to invalidate cache entry: Delete failed'
      );
    });
  });

  describe('getOrSet', () => {
    it('should return cached value if it exists', async () => {
      const cachedValue = { data: 'cached-data' };
      jest.spyOn(cacheService, 'get').mockResolvedValue(cachedValue);
      jest.spyOn(cacheService, 'set').mockResolvedValue();

      const factory = jest.fn().mockResolvedValue({ data: 'new-data' });

      const result = await cacheService.getOrSet('test-key', factory);

      expect(result).toEqual(cachedValue);
      expect(factory).not.toHaveBeenCalled();
      expect(cacheService.set).not.toHaveBeenCalled();
    });

    it('should generate and cache value if not in cache', async () => {
      const newValue = { data: 'new-data' };
      jest.spyOn(cacheService, 'get').mockResolvedValue(null);
      jest.spyOn(cacheService, 'set').mockResolvedValue();

      const factory = jest.fn().mockResolvedValue(newValue);

      const result = await cacheService.getOrSet('test-key', factory, 7200);

      expect(result).toEqual(newValue);
      expect(factory).toHaveBeenCalled();
      expect(cacheService.set).toHaveBeenCalledWith('test-key', newValue, 7200);
    });

    it('should handle factory errors', async () => {
      jest.spyOn(cacheService, 'get').mockResolvedValue(null);
      const factoryError = new Error('Factory failed');
      const factory = jest.fn().mockRejectedValue(factoryError);

      await expect(cacheService.getOrSet('test-key', factory)).rejects.toThrow(
        'Failed to getOrSet cache entry: Factory failed'
      );
    });
  });

  describe('clear', () => {
    it('should delete all cache entries', async () => {
      const mockEntries = [
        { id: 'key1', key: 'key1' },
        { id: 'key2', key: 'key2' }
      ];

      mockContainer.items.query().fetchAll.mockResolvedValue({
        resources: mockEntries
      });
      mockContainer.item().delete.mockResolvedValue({});

      await cacheService.clear();

      expect(mockContainer.items.query).toHaveBeenCalledWith('SELECT c.id, c.key FROM c');
      expect(mockContainer.item().delete).toHaveBeenCalledTimes(2);
    });

    it('should handle clear errors', async () => {
      const error = new Error('Query failed');
      mockContainer.items.query().fetchAll.mockRejectedValue(error);

      await expect(cacheService.clear()).rejects.toThrow(
        'Failed to clear cache: Query failed'
      );
    });
  });

  describe('getStats', () => {
    it('should return cache statistics', async () => {
      mockContainer.items.query().fetchAll.mockResolvedValue({
        resources: [5] // COUNT result
      });

      const stats = await cacheService.getStats();

      expect(stats).toEqual({
        totalEntries: 5,
        containerSize: 'Unknown'
      });

      expect(mockContainer.items.query).toHaveBeenCalledWith('SELECT VALUE COUNT(1) FROM c');
    });

    it('should handle stats errors', async () => {
      const error = new Error('Stats query failed');
      mockContainer.items.query().fetchAll.mockRejectedValue(error);

      await expect(cacheService.getStats()).rejects.toThrow(
        'Failed to get cache stats: Stats query failed'
      );
    });
  });
});
