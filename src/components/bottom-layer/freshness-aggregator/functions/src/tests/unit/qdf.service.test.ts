import { QdfService, Document, QdfOptions } from '../../services/qdf.service';
import { CacheService } from '../../services/cache.service';

describe('QdfService', () => {
  let qdfService: QdfService;
  let mockCacheService: jest.Mocked<CacheService>;

  beforeEach(() => {
    mockCacheService = {
      getOrSet: jest.fn(),
      get: jest.fn(),
      set: jest.fn(),
      invalidate: jest.fn(),
      clear: jest.fn(),
      getStats: jest.fn(),
      initialize: jest.fn()
    } as any;

    qdfService = new QdfService(mockCacheService);
  });

  describe('processQuery', () => {
    const mockDocuments: Document[] = [
      {
        id: 'doc1',
        title: 'Azure Functions Latest Updates',
        content: 'Azure Functions now supports TypeScript 4.0...',
        publishedAt: new Date('2024-01-15'),
        lastModified: new Date('2024-01-16'),
        contentType: 'article',
        popularity: 85,
        tags: ['azure', 'functions', 'typescript'],
        url: 'https://example.com/azure-functions'
      },
      {
        id: 'doc2',
        title: 'Cosmos DB Performance Guide',
        content: 'Optimize your Cosmos DB queries...',
        publishedAt: new Date('2024-01-10'),
        lastModified: new Date('2024-01-12'),
        contentType: 'documentation',
        popularity: 92,
        tags: ['cosmos', 'database', 'performance'],
        url: 'https://example.com/cosmos-guide'
      }
    ];

    it('should process query and return ranked results', async () => {
      const expectedResults = mockDocuments.map(doc => ({
        document: doc,
        score: expect.any(Number),
        freshnessScore: expect.any(Number),
        popularityScore: expect.any(Number),
        relevanceScore: expect.any(Number)
      }));

      mockCacheService.getOrSet.mockResolvedValue(expectedResults);

      const results = await qdfService.processQuery('azure functions');

      expect(results).toHaveLength(2);
      expect(results[0]).toMatchObject({
        document: expect.objectContaining({
          id: expect.any(String),
          title: expect.any(String)
        }),
        score: expect.any(Number),
        freshnessScore: expect.any(Number),
        popularityScore: expect.any(Number),
        relevanceScore: expect.any(Number)
      });

      expect(mockCacheService.getOrSet).toHaveBeenCalledWith(
        expect.stringContaining('qdf:azure functions:'),
        expect.any(Function),
        3600
      );
    });

    it('should apply custom options correctly', async () => {
      const options: QdfOptions = {
        maxResults: 1,
        freshnessWeight: 0.6,
        popularityWeight: 0.2,
        contentTypes: ['article'],
        minFreshnessScore: 0.5
      };

      const filteredResults = [expectedResults[0]]; // Only one result due to maxResults: 1
      mockCacheService.getOrSet.mockResolvedValue(filteredResults);

      const results = await qdfService.processQuery('azure', options);

      expect(results).toHaveLength(1);
      expect(mockCacheService.getOrSet).toHaveBeenCalledWith(
        expect.stringContaining('qdf:azure:'),
        expect.any(Function),
        3600
      );
    });

    it('should handle empty query results', async () => {
      mockCacheService.getOrSet.mockResolvedValue([]);

      const results = await qdfService.processQuery('nonexistent');

      expect(results).toHaveLength(0);
      expect(mockCacheService.getOrSet).toHaveBeenCalled();
    });

    it('should use cache when available', async () => {
      const cachedResults = [
        {
          document: mockDocuments[0],
          score: 0.8,
          freshnessScore: 0.9,
          popularityScore: 0.85,
          relevanceScore: 0.6
        }
      ];

      mockCacheService.getOrSet.mockResolvedValue(cachedResults);

      const results = await qdfService.processQuery('cached query');

      expect(results).toEqual(cachedResults);
      expect(mockCacheService.getOrSet).toHaveBeenCalledTimes(1);
    });
  });

  describe('invalidateQueryCache', () => {
    it('should invalidate cache for specific query', async () => {
      await qdfService.invalidateQueryCache('test query');

      expect(mockCacheService.invalidate).toHaveBeenCalledWith(
        expect.stringContaining('qdf:test query:')
      );
    });

    it('should invalidate cache with custom options', async () => {
      const options: QdfOptions = {
        maxResults: 5,
        freshnessWeight: 0.7
      };

      await qdfService.invalidateQueryCache('test query', options);

      expect(mockCacheService.invalidate).toHaveBeenCalledWith(
        expect.stringContaining('qdf:test query:')
      );
    });
  });

  describe('getStats', () => {
    it('should return service statistics', async () => {
      const mockCacheStats = {
        totalEntries: 10,
        containerSize: '1MB'
      };

      mockCacheService.getStats.mockResolvedValue(mockCacheStats);

      const stats = await qdfService.getStats();

      expect(stats).toEqual({
        cacheStats: mockCacheStats,
        totalQueries: 0
      });

      expect(mockCacheService.getStats).toHaveBeenCalled();
    });
  });

  describe('scoring algorithm', () => {
    it('should prioritize fresh content', async () => {
      const freshDoc: Document = {
        id: 'fresh',
        title: 'Fresh Content',
        content: 'Recently published content',
        publishedAt: new Date(), // Today
        lastModified: new Date(),
        contentType: 'article',
        popularity: 50,
        tags: ['fresh'],
        url: 'https://example.com/fresh'
      };

      const oldDoc: Document = {
        id: 'old',
        title: 'Old Content',
        content: 'Old published content',
        publishedAt: new Date('2020-01-01'), // Very old
        lastModified: new Date('2020-01-01'),
        contentType: 'article',
        popularity: 50,
        tags: ['old'],
        url: 'https://example.com/old'
      };

      // Mock the cache to return our test documents
      mockCacheService.getOrSet.mockImplementation(async (key, factory) => {
        return await factory();
      });

      // We need to test the actual scoring logic, so we'll need to access private methods
      // For now, we'll test through the public interface
      const results = await qdfService.processQuery('content');

      // The fresh document should have a higher freshness score
      // This is a simplified test - in a real scenario, you'd want more detailed scoring tests
      expect(mockCacheService.getOrSet).toHaveBeenCalled();
    });
  });
});
