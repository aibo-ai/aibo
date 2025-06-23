import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { ExternalApiService } from '../external-api.service';
import { ApplicationInsightsService } from '../../../../common/services/application-insights.service';

jest.mock('../../../../common/services/application-insights.service');

describe('ExternalApiService', () => {
  let service: ExternalApiService;
  let httpService: jest.Mocked<HttpService>;
  let appInsights: jest.Mocked<ApplicationInsightsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExternalApiService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config = {
                'CROSSREF_API_URL': 'https://api.crossref.org',
                'MOZ_API_URL': 'https://lsapi.seomoz.com',
                'MOZ_API_KEY': 'test-moz-key',
                'MOZ_API_SECRET': 'test-moz-secret',
                'AHREFS_API_URL': 'https://apiv2.ahrefs.com',
                'AHREFS_API_KEY': 'test-ahrefs-key',
                'CITATION_API_TIMEOUT_MS': '10000',
                'CITATION_API_RETRY_ATTEMPTS': '3',
                'CITATION_API_RETRY_DELAY_MS': '1000'
              };
              return config[key] || defaultValue;
            })
          }
        },
        {
          provide: HttpService,
          useValue: {
            head: jest.fn(),
            get: jest.fn(),
            post: jest.fn()
          }
        },
        ApplicationInsightsService
      ],
    }).compile();

    service = module.get<ExternalApiService>(ExternalApiService);
    httpService = module.get(HttpService);
    appInsights = module.get(ApplicationInsightsService);

    appInsights.trackEvent.mockImplementation();
    appInsights.trackException.mockImplementation();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUrl', () => {
    it('should validate accessible URLs successfully', async () => {
      const mockResponse = {
        status: 200,
        headers: {
          'content-type': 'text/html',
          'last-modified': '2024-01-01T00:00:00Z'
        }
      };

      httpService.head.mockReturnValueOnce(of(mockResponse as any));
      httpService.get.mockReturnValueOnce(of({
        data: '<html><head><title>Test Page</title></head></html>'
      } as any));

      const result = await service.validateUrl('https://example.com/test');

      expect(result).toMatchObject({
        url: 'https://example.com/test',
        isValid: true,
        isAccessible: true,
        statusCode: 200,
        contentType: 'text/html',
        lastModified: '2024-01-01T00:00:00Z',
        isSecure: true,
        title: 'Test Page',
        errors: [],
        metadata: expect.objectContaining({
          checkedAt: expect.any(String),
          responseTime: expect.any(Number)
        })
      });

      expect(appInsights.trackEvent).toHaveBeenCalledWith(
        'ExternalApi:UrlValidation:Success',
        expect.objectContaining({
          url: 'https://example.com/test',
          statusCode: 200
        })
      );
    });

    it('should handle invalid URL format', async () => {
      const result = await service.validateUrl('not-a-valid-url');

      expect(result).toMatchObject({
        url: 'not-a-valid-url',
        isValid: false,
        isAccessible: false,
        isSecure: false,
        errors: ['Invalid URL format']
      });
    });

    it('should handle network errors', async () => {
      httpService.head.mockReturnValueOnce(throwError(() => new Error('Network timeout')));

      const result = await service.validateUrl('https://example.com/test');

      expect(result).toMatchObject({
        url: 'https://example.com/test',
        isValid: true,
        isAccessible: false,
        errors: ['Network timeout']
      });

      expect(appInsights.trackEvent).toHaveBeenCalledWith(
        'ExternalApi:UrlValidation:NetworkError',
        expect.objectContaining({
          url: 'https://example.com/test',
          error: 'Network timeout'
        })
      );
    });

    it('should handle HTTP error status codes', async () => {
      const mockResponse = {
        status: 404,
        headers: {}
      };

      httpService.head.mockReturnValueOnce(of(mockResponse as any));

      const result = await service.validateUrl('https://example.com/notfound');

      expect(result).toMatchObject({
        url: 'https://example.com/notfound',
        isValid: true,
        isAccessible: false,
        statusCode: 404,
        errors: ['HTTP 404']
      });
    });

    it('should detect insecure URLs', async () => {
      const mockResponse = {
        status: 200,
        headers: {}
      };

      httpService.head.mockReturnValueOnce(of(mockResponse as any));

      const result = await service.validateUrl('http://example.com/test');

      expect(result).toMatchObject({
        url: 'http://example.com/test',
        isValid: true,
        isAccessible: true,
        isSecure: false
      });
    });
  });

  describe('getMozDomainAuthority', () => {
    it('should fetch domain authority from Moz API', async () => {
      const mockMozResponse = {
        data: {
          domain_authority: 75,
          page_authority: 80,
          spam_score: 5,
          external_equity_links: 1000,
          linking_root_domains: 500
        }
      };

      httpService.post.mockReturnValueOnce(of(mockMozResponse as any));

      const result = await service.getMozDomainAuthority('example.com');

      expect(result).toMatchObject({
        domain: 'example.com',
        authorityScore: 75,
        trustScore: 80,
        spamScore: 5,
        backlinks: 1000,
        referringDomains: 500,
        isGovernment: false,
        isEducational: false,
        metadata: {
          source: 'moz',
          checkedAt: expect.any(String)
        }
      });

      expect(httpService.post).toHaveBeenCalledWith(
        expect.stringContaining('example.com'),
        expect.objectContaining({
          targets: ['example.com']
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': expect.stringMatching(/^Basic /)
          })
        })
      );
    });

    it('should return null when Moz API credentials are not configured', async () => {
      // Create a new service instance without Moz credentials
      const moduleWithoutCreds = await Test.createTestingModule({
        providers: [
          ExternalApiService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string, defaultValue?: any) => {
                if (key === 'MOZ_API_KEY' || key === 'MOZ_API_SECRET') return undefined;
                return defaultValue;
              })
            }
          },
          {
            provide: HttpService,
            useValue: httpService
          },
          ApplicationInsightsService
        ],
      }).compile();

      const serviceWithoutCreds = moduleWithoutCreds.get<ExternalApiService>(ExternalApiService);
      const result = await serviceWithoutCreds.getMozDomainAuthority('example.com');

      expect(result).toBeNull();
    });

    it('should handle Moz API errors', async () => {
      httpService.post.mockReturnValueOnce(throwError(() => new Error('Moz API Error')));

      const result = await service.getMozDomainAuthority('example.com');

      expect(result).toBeNull();
      expect(appInsights.trackException).toHaveBeenCalled();
    });

    it('should detect special domain types', async () => {
      const mockResponse = { data: { domain_authority: 90 } };
      httpService.post.mockReturnValue(of(mockResponse as any));

      const govResult = await service.getMozDomainAuthority('cdc.gov');
      expect(govResult?.isGovernment).toBe(true);

      const eduResult = await service.getMozDomainAuthority('harvard.edu');
      expect(eduResult?.isEducational).toBe(true);

      const orgResult = await service.getMozDomainAuthority('wikipedia.org');
      expect(orgResult?.isNonProfit).toBe(true);
    });
  });

  describe('getAhrefsDomainAuthority', () => {
    it('should fetch domain authority from Ahrefs API', async () => {
      const mockAhrefsResponse = {
        data: {
          domain_rating: 85,
          backlinks: 50000,
          referring_domains: 2000
        }
      };

      httpService.get.mockReturnValueOnce(of(mockAhrefsResponse as any));

      const result = await service.getAhrefsDomainAuthority('example.com');

      expect(result).toMatchObject({
        domain: 'example.com',
        authorityScore: 85,
        trustScore: 85,
        backlinks: 50000,
        referringDomains: 2000,
        metadata: {
          source: 'ahrefs',
          checkedAt: expect.any(String)
        }
      });

      expect(httpService.get).toHaveBeenCalledWith(
        expect.stringContaining('domain-rating'),
        expect.objectContaining({
          params: expect.objectContaining({
            target: 'example.com',
            token: 'test-ahrefs-key'
          })
        })
      );
    });

    it('should return null when Ahrefs API key is not configured', async () => {
      const moduleWithoutKey = await Test.createTestingModule({
        providers: [
          ExternalApiService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string, defaultValue?: any) => {
                if (key === 'AHREFS_API_KEY') return undefined;
                return defaultValue;
              })
            }
          },
          {
            provide: HttpService,
            useValue: httpService
          },
          ApplicationInsightsService
        ],
      }).compile();

      const serviceWithoutKey = moduleWithoutKey.get<ExternalApiService>(ExternalApiService);
      const result = await serviceWithoutKey.getAhrefsDomainAuthority('example.com');

      expect(result).toBeNull();
    });
  });

  describe('verifyDoi', () => {
    it('should verify valid DOI using Crossref API', async () => {
      const mockCrossrefResponse = {
        data: {
          message: {
            title: ['Test Article'],
            author: [{ given: 'John', family: 'Doe' }],
            published: { 'date-parts': [[2023, 1, 1]] }
          }
        }
      };

      httpService.get.mockReturnValueOnce(of(mockCrossrefResponse as any));

      const result = await service.verifyDoi('10.1000/123');

      expect(result).toMatchObject({
        valid: true,
        metadata: expect.objectContaining({
          title: ['Test Article']
        }),
        checkedAt: expect.any(String)
      });

      expect(httpService.get).toHaveBeenCalledWith(
        'https://api.crossref.org/works/10.1000%2F123',
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': expect.stringContaining('ContentArchitect')
          })
        })
      );
    });

    it('should handle invalid DOI', async () => {
      httpService.get.mockReturnValueOnce(throwError(() => new Error('DOI not found')));

      const result = await service.verifyDoi('10.1000/invalid');

      expect(result).toMatchObject({
        valid: false,
        error: 'DOI not found',
        checkedAt: expect.any(String)
      });
    });
  });
});
