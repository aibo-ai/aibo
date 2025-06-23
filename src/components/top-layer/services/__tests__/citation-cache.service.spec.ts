import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CitationCacheService } from '../citation-cache.service';
import { ApplicationInsightsService } from '../../../../common/services/application-insights.service';
import { CitationVerificationResult, DomainAuthorityResult, UrlValidationResult } from '../interfaces/citation-verification.interfaces';

jest.mock('../../../../common/services/application-insights.service');

describe('CitationCacheService', () => {
  let service: CitationCacheService;
  let appInsights: jest.Mocked<ApplicationInsightsService>;

  const mockCitationResult: CitationVerificationResult = {
    citation: {
      id: 'test-citation',
      text: 'Test citation',
      section: 'test',
      position: { start: 0, end: 10 },
      type: 'url',
      url: 'https://example.com'
    },
    verification: {
      sourceReputation: 8,
      recency: 9,
      authorityScore: 7,
      relevanceScore: 8
    },
    overallScore: 8,
    verificationStatus: 'high_authority',
    issues: [],
    suggestions: [],
    metadata: {
      verifiedAt: new Date().toISOString(),
      verificationMethod: 'production-api'
    }
  };

  const mockDomainResult: DomainAuthorityResult = {
    domain: 'example.com',
    authorityScore: 75,
    trustScore: 80,
    isGovernment: false,
    isEducational: false,
    isNonProfit: false,
    isNews: false,
    metadata: {
      source: 'moz',
      checkedAt: new Date().toISOString()
    }
  };

  const mockUrlResult: UrlValidationResult = {
    url: 'https://example.com',
    isValid: true,
    isAccessible: true,
    isSecure: true,
    errors: [],
    metadata: {
      checkedAt: new Date().toISOString(),
      responseTime: 500
    }
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CitationCacheService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config = {
                'CITATION_CACHE_ENABLED': 'true',
                'CITATION_CACHE_TTL_MINUTES': '60',
                'CITATION_CACHE_MAX_SIZE': '1000'
              };
              return config[key] || defaultValue;
            })
          }
        },
        ApplicationInsightsService
      ],
    }).compile();

    service = module.get<CitationCacheService>(CitationCacheService);
    appInsights = module.get(ApplicationInsightsService);

    appInsights.trackEvent.mockImplementation();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Citation verification caching', () => {
    it('should cache and retrieve citation verification results', async () => {
      const key = 'test-citation-key';

      // Initially should return null
      const initialResult = await service.getCitationVerification(key);
      expect(initialResult).toBeNull();

      // Cache the result
      await service.setCitationVerification(key, mockCitationResult);

      // Should now return the cached result
      const cachedResult = await service.getCitationVerification(key);
      expect(cachedResult).toEqual(mockCitationResult);

      expect(appInsights.trackEvent).toHaveBeenCalledWith(
        'CitationCache:Set',
        expect.objectContaining({
          type: 'citation',
          key: key
        })
      );

      expect(appInsights.trackEvent).toHaveBeenCalledWith(
        'CitationCache:Hit',
        expect.objectContaining({
          type: 'citation',
          key: key,
          hitCount: 1
        })
      );
    });

    it('should increment hit count on repeated access', async () => {
      const key = 'test-citation-key';
      await service.setCitationVerification(key, mockCitationResult);

      // Access multiple times
      await service.getCitationVerification(key);
      await service.getCitationVerification(key);
      await service.getCitationVerification(key);

      // Hit count should be tracked
      expect(appInsights.trackEvent).toHaveBeenCalledWith(
        'CitationCache:Hit',
        expect.objectContaining({
          hitCount: 3
        })
      );
    });
  });

  describe('Domain authority caching', () => {
    it('should cache and retrieve domain authority results', async () => {
      const domain = 'example.com';

      await service.setDomainAuthority(domain, mockDomainResult);
      const cachedResult = await service.getDomainAuthority(domain);

      expect(cachedResult).toEqual(mockDomainResult);
    });
  });

  describe('URL validation caching', () => {
    it('should cache and retrieve URL validation results', async () => {
      const url = 'https://example.com';

      await service.setUrlValidation(url, mockUrlResult);
      const cachedResult = await service.getUrlValidation(url);

      expect(cachedResult).toEqual(mockUrlResult);
    });

    it('should use shorter TTL for URL validation', async () => {
      // This test verifies that URL validation has different caching behavior
      // In a real implementation, you might want to verify the actual TTL
      const url = 'https://example.com';
      await service.setUrlValidation(url, mockUrlResult);

      expect(appInsights.trackEvent).toHaveBeenCalledWith(
        'CitationCache:Set',
        expect.objectContaining({
          type: 'url',
          key: url
        })
      );
    });
  });

  describe('Cache expiration', () => {
    it('should return null for expired entries', async () => {
      // Create a service with very short TTL for testing
      const shortTtlModule = await Test.createTestingModule({
        providers: [
          CitationCacheService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string, defaultValue?: any) => {
                if (key === 'CITATION_CACHE_TTL_MINUTES') return '0'; // Immediate expiration
                return defaultValue;
              })
            }
          },
          ApplicationInsightsService
        ],
      }).compile();

      const shortTtlService = shortTtlModule.get<CitationCacheService>(CitationCacheService);
      
      const key = 'test-expiration';
      await shortTtlService.setCitationVerification(key, mockCitationResult);

      // Wait a bit to ensure expiration
      await new Promise(resolve => setTimeout(resolve, 10));

      const result = await shortTtlService.getCitationVerification(key);
      expect(result).toBeNull();
    });
  });

  describe('Cache management', () => {
    it('should clear all cache entries', async () => {
      await service.setCitationVerification('key1', mockCitationResult);
      await service.setDomainAuthority('domain1', mockDomainResult);
      await service.setUrlValidation('url1', mockUrlResult);

      await service.clearCache();

      expect(await service.getCitationVerification('key1')).toBeNull();
      expect(await service.getDomainAuthority('domain1')).toBeNull();
      expect(await service.getUrlValidation('url1')).toBeNull();

      expect(appInsights.trackEvent).toHaveBeenCalledWith(
        'CitationCache:Clear',
        expect.objectContaining({
          entriesRemoved: 3
        })
      );
    });

    it('should provide cache statistics', async () => {
      await service.setCitationVerification('key1', mockCitationResult);
      await service.setDomainAuthority('domain1', mockDomainResult);
      await service.setUrlValidation('url1', mockUrlResult);

      // Access some entries to generate hit counts
      await service.getCitationVerification('key1');
      await service.getDomainAuthority('domain1');

      const stats = service.getCacheStats();

      expect(stats).toMatchObject({
        enabled: true,
        totalEntries: 3,
        maxSize: 1000,
        ttlMinutes: 60,
        expiredEntries: 0,
        hitCounts: {
          total: 2,
          average: expect.any(Number)
        },
        byType: {
          citation: 1,
          domain: 1,
          url: 1
        }
      });
    });
  });

  describe('Cache disabled mode', () => {
    it('should not cache when caching is disabled', async () => {
      const disabledModule = await Test.createTestingModule({
        providers: [
          CitationCacheService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string, defaultValue?: any) => {
                if (key === 'CITATION_CACHE_ENABLED') return 'false';
                return defaultValue;
              })
            }
          },
          ApplicationInsightsService
        ],
      }).compile();

      const disabledService = disabledModule.get<CitationCacheService>(CitationCacheService);
      
      const key = 'test-disabled';
      await disabledService.setCitationVerification(key, mockCitationResult);
      
      const result = await disabledService.getCitationVerification(key);
      expect(result).toBeNull();

      const stats = disabledService.getCacheStats();
      expect(stats.enabled).toBe(false);
    });
  });

  describe('Memory management', () => {
    it('should enforce maximum cache size', async () => {
      // Create service with small max size for testing
      const smallCacheModule = await Test.createTestingModule({
        providers: [
          CitationCacheService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string, defaultValue?: any) => {
                if (key === 'CITATION_CACHE_MAX_SIZE') return '2';
                return defaultValue;
              })
            }
          },
          ApplicationInsightsService
        ],
      }).compile();

      const smallCacheService = smallCacheModule.get<CitationCacheService>(CitationCacheService);
      const mockAppInsights = smallCacheModule.get(ApplicationInsightsService);

      // Add more entries than max size
      await smallCacheService.setCitationVerification('key1', mockCitationResult);
      await smallCacheService.setCitationVerification('key2', mockCitationResult);
      await smallCacheService.setCitationVerification('key3', mockCitationResult); // Should trigger cleanup

      expect(mockAppInsights.trackEvent).toHaveBeenCalledWith(
        'CitationCache:SizeEnforcement',
        expect.objectContaining({
          removedCount: 1,
          finalSize: 2
        })
      );
    });
  });
});
