import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { CitationAuthorityVerifierService } from '../citation-authority-verifier.service';
import { CitationExtractionService } from '../citation-extraction.service';
import { ExternalApiService } from '../external-api.service';
import { CitationCacheService } from '../citation-cache.service';
import { AzureAIService } from '../azure-ai-service';
import { ApplicationInsightsService } from '../../../../common/services/application-insights.service';

// Mock services
jest.mock('../citation-extraction.service');
jest.mock('../external-api.service');
jest.mock('../citation-cache.service');
jest.mock('../azure-ai-service');
jest.mock('../../../../common/services/application-insights.service');

describe('CitationAuthorityVerifierService', () => {
  let service: CitationAuthorityVerifierService;
  let citationExtractionService: jest.Mocked<CitationExtractionService>;
  let externalApiService: jest.Mocked<ExternalApiService>;
  let citationCacheService: jest.Mocked<CitationCacheService>;
  let azureAIService: jest.Mocked<AzureAIService>;
  let appInsights: jest.Mocked<ApplicationInsightsService>;

  const mockContent = {
    title: 'Test Article',
    sections: {
      introduction: {
        content: 'This is an introduction with a citation from Harvard Business Review (2024).'
      },
      methodology: {
        content: 'Our methodology follows standards from https://example.com/research-paper'
      }
    }
  };

  const mockExtractedCitations = [
    {
      id: 'citation-1',
      text: 'Harvard Business Review (2024)',
      source: 'Harvard Business Review',
      year: 2024,
      section: 'introduction',
      position: { start: 45, end: 75 },
      type: 'academic' as const
    },
    {
      id: 'citation-2',
      text: 'https://example.com/research-paper',
      url: 'https://example.com/research-paper',
      section: 'methodology',
      position: { start: 35, end: 69 },
      type: 'url' as const
    }
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CitationAuthorityVerifierService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => defaultValue)
          }
        },
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
            post: jest.fn(),
            head: jest.fn()
          }
        },
        CitationExtractionService,
        ExternalApiService,
        CitationCacheService,
        AzureAIService,
        ApplicationInsightsService
      ],
    }).compile();

    service = module.get<CitationAuthorityVerifierService>(CitationAuthorityVerifierService);
    citationExtractionService = module.get(CitationExtractionService);
    externalApiService = module.get(ExternalApiService);
    citationCacheService = module.get(CitationCacheService);
    azureAIService = module.get(AzureAIService);
    appInsights = module.get(ApplicationInsightsService);

    // Setup default mocks
    citationExtractionService.extractCitations.mockResolvedValue({
      citations: mockExtractedCitations,
      totalFound: 2,
      byType: { academic: 1, url: 1 },
      bySection: { introduction: 1, methodology: 1 },
      extractionMethod: 'hybrid-nlp-pattern',
      confidence: 0.85,
      processingTime: 1500
    });

    citationCacheService.getCitationVerification.mockResolvedValue(null);
    citationCacheService.setCitationVerification.mockResolvedValue();
    citationCacheService.getDomainAuthority.mockResolvedValue(null);
    citationCacheService.setDomainAuthority.mockResolvedValue();

    externalApiService.validateUrl.mockResolvedValue({
      url: 'https://example.com/research-paper',
      isValid: true,
      isAccessible: true,
      statusCode: 200,
      isSecure: true,
      errors: [],
      metadata: {
        checkedAt: new Date().toISOString(),
        responseTime: 500
      }
    });

    externalApiService.getMozDomainAuthority.mockResolvedValue({
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
    });

    azureAIService.generateCompletion.mockResolvedValue({
      text: '8',
      usage: {
        completionTokens: 1,
        promptTokens: 50,
        totalTokens: 51
      }
    });

    appInsights.trackEvent.mockImplementation();
    appInsights.trackException.mockImplementation();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('verifyCitations', () => {
    it('should successfully verify citations for B2B content', async () => {
      const result = await service.verifyCitations(mockContent, 'b2b');

      expect(result).toMatchObject({
        contentSummary: {
          title: 'Test Article',
          citationCount: 2
        },
        citations: expect.arrayContaining([
          expect.objectContaining({
            citation: expect.objectContaining({
              id: 'citation-1',
              type: 'academic'
            }),
            verificationStatus: expect.any(String),
            overallScore: expect.any(Number)
          })
        ]),
        overallCredibilityScore: expect.any(Number),
        segment: 'b2b',
        extractionResult: expect.objectContaining({
          citations: mockExtractedCitations,
          totalFound: 2
        }),
        timestamp: expect.any(String),
        processingTime: expect.any(Number)
      });

      expect(citationExtractionService.extractCitations).toHaveBeenCalledWith(mockContent);
      expect(appInsights.trackEvent).toHaveBeenCalledWith(
        'CitationVerification:Start',
        expect.objectContaining({
          segment: 'b2b'
        })
      );
    });

    it('should handle content with no citations', async () => {
      citationExtractionService.extractCitations.mockResolvedValueOnce({
        citations: [],
        totalFound: 0,
        byType: {},
        bySection: {},
        extractionMethod: 'hybrid-nlp-pattern',
        confidence: 0,
        processingTime: 500
      });

      const result = await service.verifyCitations(mockContent, 'b2c');

      expect(result).toMatchObject({
        contentSummary: {
          citationCount: 0
        },
        citations: [],
        overallCredibilityScore: 0,
        segment: 'b2c'
      });
    });

    it('should handle verification errors gracefully', async () => {
      citationExtractionService.extractCitations.mockRejectedValueOnce(
        new Error('Extraction failed')
      );

      const result = await service.verifyCitations(mockContent, 'b2b');

      expect(result).toMatchObject({
        contentSummary: {
          citationCount: 0
        },
        citations: [],
        overallCredibilityScore: 0,
        error: 'Extraction failed'
      });

      expect(appInsights.trackException).toHaveBeenCalled();
    });

    it('should use cached verification results when available', async () => {
      const cachedResult = {
        citation: mockExtractedCitations[0],
        verification: {
          sourceReputation: 9,
          recency: 10,
          authorityScore: 8,
          relevanceScore: 8
        },
        overallScore: 8.75,
        verificationStatus: 'high_authority' as const,
        issues: [],
        suggestions: [],
        metadata: {
          verifiedAt: new Date().toISOString(),
          verificationMethod: 'production-api'
        }
      };

      citationCacheService.getCitationVerification.mockResolvedValueOnce(cachedResult);

      const result = await service.verifyCitations(mockContent, 'b2b');

      expect(result.citations[0]).toEqual(cachedResult);
      expect(citationCacheService.getCitationVerification).toHaveBeenCalled();
    });
  });

  describe('enhanceCitationAuthority', () => {
    it('should enhance citations and provide improvement summary', async () => {
      const result = await service.enhanceCitationAuthority(mockContent, 'b2b');

      expect(result).toMatchObject({
        originalContent: mockContent,
        enhancedContent: expect.objectContaining({
          sections: expect.any(Object)
        }),
        originalVerification: expect.objectContaining({
          overallCredibilityScore: expect.any(Number)
        }),
        enhancedVerification: expect.objectContaining({
          overallCredibilityScore: expect.any(Number)
        }),
        improvementSummary: expect.objectContaining({
          citationCount: expect.objectContaining({
            before: expect.any(Number),
            after: expect.any(Number)
          }),
          credibilityScore: expect.objectContaining({
            before: expect.any(Number),
            after: expect.any(Number),
            improvement: expect.any(String)
          })
        }),
        timestamp: expect.any(String)
      });
    });
  });

  describe('generateCitationStrategy', () => {
    it('should generate appropriate strategy for B2B content', async () => {
      const result = await service.generateCitationStrategy('artificial intelligence', 'b2b');

      expect(result).toMatchObject({
        topic: 'artificial intelligence',
        segment: 'b2b',
        recommendedSources: expect.arrayContaining([
          'Industry research reports',
          'Academic papers'
        ]),
        preferredFormats: expect.arrayContaining(['IEEE', 'APA']),
        authorityHierarchy: expect.objectContaining({
          tier1: expect.arrayContaining([
            'Peer-reviewed academic research'
          ])
        }),
        densityRecommendation: expect.objectContaining({
          minimumCitations: 2,
          recommendedCitationsPerSection: 3
        })
      });
    });

    it('should generate appropriate strategy for B2C content', async () => {
      const result = await service.generateCitationStrategy('health tips', 'b2c');

      expect(result).toMatchObject({
        topic: 'health tips',
        segment: 'b2c',
        recommendedSources: expect.arrayContaining([
          'Consumer research studies',
          'Expert opinions'
        ]),
        densityRecommendation: expect.objectContaining({
          minimumCitations: 1,
          recommendedCitationsPerSection: 2
        })
      });
    });
  });

  describe('URL validation integration', () => {
    it('should validate URLs and incorporate results into verification', async () => {
      await service.verifyCitations(mockContent, 'b2b');

      expect(externalApiService.validateUrl).toHaveBeenCalledWith(
        'https://example.com/research-paper'
      );
    });

    it('should handle URL validation failures', async () => {
      externalApiService.validateUrl.mockResolvedValueOnce({
        url: 'https://example.com/research-paper',
        isValid: false,
        isAccessible: false,
        isSecure: false,
        errors: ['Network timeout'],
        metadata: {
          checkedAt: new Date().toISOString(),
          responseTime: 5000
        }
      });

      const result = await service.verifyCitations(mockContent, 'b2b');

      expect(result.citations[1].issues).toContain('URL not accessible: Network timeout');
    });
  });

  describe('Domain authority integration', () => {
    it('should fetch domain authority and incorporate into scoring', async () => {
      await service.verifyCitations(mockContent, 'b2b');

      expect(externalApiService.getMozDomainAuthority).toHaveBeenCalledWith('example.com');
    });

    it('should fallback to heuristic scoring when domain authority APIs fail', async () => {
      externalApiService.getMozDomainAuthority.mockResolvedValueOnce(null);
      externalApiService.getAhrefsDomainAuthority.mockResolvedValueOnce(null);

      const result = await service.verifyCitations(mockContent, 'b2b');

      // Should still have authority scores from heuristic calculation
      expect(result.citations[1].verification.authorityScore).toBeGreaterThan(0);
    });
  });

  describe('Caching integration', () => {
    it('should cache verification results', async () => {
      await service.verifyCitations(mockContent, 'b2b');

      expect(citationCacheService.setCitationVerification).toHaveBeenCalled();
    });

    it('should cache domain authority results', async () => {
      await service.verifyCitations(mockContent, 'b2b');

      expect(citationCacheService.setDomainAuthority).toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should provide fallback verification when external APIs fail', async () => {
      externalApiService.validateUrl.mockRejectedValueOnce(new Error('API Error'));
      externalApiService.getMozDomainAuthority.mockRejectedValueOnce(new Error('API Error'));

      const result = await service.verifyCitations(mockContent, 'b2b');

      // Should still return results with fallback scores
      expect(result.citations).toHaveLength(2);
      expect(result.citations[0].verificationStatus).toBeDefined();
    });

    it('should handle AI service failures gracefully', async () => {
      azureAIService.generateCompletion.mockRejectedValueOnce(new Error('AI Service Error'));

      const result = await service.verifyCitations(mockContent, 'b2b');

      // Should still complete verification with default scores
      expect(result.citations).toHaveLength(2);
    });
  });
});
