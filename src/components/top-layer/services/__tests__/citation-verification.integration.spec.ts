import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { CitationAuthorityVerifierService } from '../citation-authority-verifier.service';
import { CitationExtractionService } from '../citation-extraction.service';
import { ExternalApiService } from '../external-api.service';
import { CitationCacheService } from '../citation-cache.service';
import { CitationMonitoringService } from '../citation-monitoring.service';
import { AzureAIService } from '../azure-ai-service';
import { ApplicationInsightsService } from '../../../../common/services/application-insights.service';

// Mock external dependencies
jest.mock('../azure-ai-service');
jest.mock('../../../../common/services/application-insights.service');

describe('Citation Verification Integration Tests', () => {
  let citationVerifier: CitationAuthorityVerifierService;
  let extractionService: CitationExtractionService;
  let externalApiService: ExternalApiService;
  let cacheService: CitationCacheService;
  let monitoringService: CitationMonitoringService;
  let azureAIService: jest.Mocked<AzureAIService>;
  let appInsights: jest.Mocked<ApplicationInsightsService>;

  const mockContent = {
    title: 'The Future of Artificial Intelligence in Business',
    sections: {
      introduction: {
        content: 'According to a recent study by McKinsey Global Institute (2023), artificial intelligence is expected to contribute $13 trillion to global economic output by 2030. This research can be found at https://www.mckinsey.com/ai-study-2023.'
      },
      methodology: {
        content: 'Our analysis builds upon the methodology described in Smith, J. and Johnson, A. (2023). Machine Learning in Enterprise Applications. Journal of Business Technology, 45(3), 123-145. DOI: 10.1000/jbt.2023.45.3.123'
      },
      results: {
        content: 'The findings align with recent research from Harvard Business Review and data from the World Economic Forum available at https://www.weforum.org/reports/future-of-jobs-2023.'
      }
    }
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [
        CitationAuthorityVerifierService,
        CitationExtractionService,
        ExternalApiService,
        CitationCacheService,
        CitationMonitoringService,
        AzureAIService,
        ApplicationInsightsService,
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
                'CITATION_CACHE_ENABLED': 'true',
                'CITATION_CACHE_TTL_MINUTES': '60',
                'CITATION_CACHE_MAX_SIZE': '1000',
                'CITATION_API_TIMEOUT_MS': '10000',
                'CITATION_API_RETRY_ATTEMPTS': '3',
                'CITATION_API_RETRY_DELAY_MS': '1000'
              };
              return config[key] || defaultValue;
            })
          }
        }
      ],
    }).compile();

    citationVerifier = module.get<CitationAuthorityVerifierService>(CitationAuthorityVerifierService);
    extractionService = module.get<CitationExtractionService>(CitationExtractionService);
    externalApiService = module.get<ExternalApiService>(ExternalApiService);
    cacheService = module.get<CitationCacheService>(CitationCacheService);
    monitoringService = module.get<CitationMonitoringService>(CitationMonitoringService);
    azureAIService = module.get(AzureAIService);
    appInsights = module.get(ApplicationInsightsService);

    // Setup mocks
    azureAIService.generateCompletion.mockResolvedValue({
      text: JSON.stringify([
        {
          text: 'McKinsey Global Institute (2023). AI Economic Impact Study.',
          type: 'report',
          authors: ['McKinsey Global Institute'],
          year: 2023,
          title: 'AI Economic Impact Study'
        }
      ]),
      usage: { completionTokens: 100, promptTokens: 500, totalTokens: 600 }
    });

    appInsights.trackEvent.mockImplementation();
    appInsights.trackException.mockImplementation();
    appInsights.trackMetric.mockImplementation();
  });

  describe('End-to-End Citation Verification Workflow', () => {
    it('should complete full verification workflow for B2B content', async () => {
      const startTime = Date.now();

      // Step 1: Verify citations
      const verificationResult = await citationVerifier.verifyCitations(mockContent, 'b2b');

      // Verify the result structure
      expect(verificationResult).toMatchObject({
        contentSummary: {
          title: 'The Future of Artificial Intelligence in Business',
          citationCount: expect.any(Number)
        },
        citations: expect.any(Array),
        overallCredibilityScore: expect.any(Number),
        segment: 'b2b',
        extractionResult: expect.objectContaining({
          citations: expect.any(Array),
          totalFound: expect.any(Number),
          extractionMethod: 'hybrid-nlp-pattern'
        }),
        timestamp: expect.any(String),
        processingTime: expect.any(Number)
      });

      // Verify citations were extracted
      expect(verificationResult.citations.length).toBeGreaterThan(0);

      // Verify each citation has proper verification data
      verificationResult.citations.forEach(citation => {
        expect(citation).toMatchObject({
          citation: expect.objectContaining({
            id: expect.any(String),
            type: expect.any(String),
            section: expect.any(String)
          }),
          verification: expect.any(Object),
          overallScore: expect.any(Number),
          verificationStatus: expect.stringMatching(/high_authority|moderate_authority|low_authority|unverified/),
          issues: expect.any(Array),
          suggestions: expect.any(Array),
          metadata: expect.objectContaining({
            verifiedAt: expect.any(String),
            verificationMethod: expect.any(String)
          })
        });
      });

      // Verify processing time is reasonable
      expect(verificationResult.processingTime).toBeLessThan(10000); // Less than 10 seconds

      console.log(`Verification completed in ${verificationResult.processingTime}ms`);
      console.log(`Found ${verificationResult.citations.length} citations`);
      console.log(`Overall credibility score: ${verificationResult.overallCredibilityScore}`);
    });

    it('should enhance citations and show improvement', async () => {
      // Step 1: Enhance citations
      const enhancementResult = await citationVerifier.enhanceCitationAuthority(mockContent, 'b2b');

      // Verify enhancement structure
      expect(enhancementResult).toMatchObject({
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

      console.log('Enhancement Summary:', enhancementResult.improvementSummary);
    });

    it('should generate appropriate citation strategy', async () => {
      const strategy = await citationVerifier.generateCitationStrategy('artificial intelligence', 'b2b');

      expect(strategy).toMatchObject({
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
          ]),
          tier2: expect.any(Array),
          tier3: expect.any(Array),
          tier4: expect.any(Array)
        }),
        densityRecommendation: expect.objectContaining({
          minimumCitations: expect.any(Number),
          recommendedCitationsPerSection: expect.any(Number)
        }),
        timestamp: expect.any(String)
      });

      console.log('Citation Strategy:', {
        topic: strategy.topic,
        segment: strategy.segment,
        recommendedSources: strategy.recommendedSources.slice(0, 3),
        minimumCitations: strategy.densityRecommendation.minimumCitations
      });
    });
  });

  describe('Performance and Monitoring', () => {
    it('should track metrics during verification', async () => {
      const result = await citationVerifier.verifyCitations(mockContent, 'b2b');

      // Verify telemetry was tracked
      expect(appInsights.trackEvent).toHaveBeenCalledWith(
        'CitationVerification:Start',
        expect.objectContaining({
          segment: 'b2b'
        })
      );

      expect(appInsights.trackEvent).toHaveBeenCalledWith(
        'CitationVerification:Success',
        expect.objectContaining({
          citationsFound: expect.any(Number),
          overallScore: expect.any(Number),
          processingTime: expect.any(Number)
        })
      );
    });

    it('should provide cache statistics', async () => {
      // Perform some operations to populate cache
      await citationVerifier.verifyCitations(mockContent, 'b2b');
      
      const stats = cacheService.getCacheStats();

      expect(stats).toMatchObject({
        enabled: true,
        totalEntries: expect.any(Number),
        maxSize: 1000,
        ttlMinutes: 60,
        expiredEntries: expect.any(Number),
        hitCounts: expect.objectContaining({
          total: expect.any(Number),
          average: expect.any(Number)
        }),
        byType: expect.any(Object)
      });

      console.log('Cache Statistics:', stats);
    });

    it('should handle high-volume verification efficiently', async () => {
      const startTime = Date.now();
      const promises = [];

      // Simulate multiple concurrent verifications
      for (let i = 0; i < 5; i++) {
        promises.push(citationVerifier.verifyCitations(mockContent, 'b2b'));
      }

      const results = await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      // All should complete successfully
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result.overallCredibilityScore).toBeGreaterThanOrEqual(0);
      });

      // Should complete in reasonable time (with caching, should be fast)
      expect(totalTime).toBeLessThan(15000); // Less than 15 seconds for 5 concurrent requests

      console.log(`Processed 5 concurrent verifications in ${totalTime}ms`);
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle AI service failures gracefully', async () => {
      // Mock AI service failure
      azureAIService.generateCompletion.mockRejectedValueOnce(new Error('AI Service Unavailable'));

      const result = await citationVerifier.verifyCitations(mockContent, 'b2b');

      // Should still return results with pattern-based extraction
      expect(result.citations.length).toBeGreaterThan(0);
      expect(result.overallCredibilityScore).toBeGreaterThanOrEqual(0);
    });

    it('should provide meaningful error messages', async () => {
      // Mock AI service to return empty array for invalid content
      azureAIService.generateCompletion.mockResolvedValueOnce({
        text: JSON.stringify([]),
        usage: { completionTokens: 10, promptTokens: 50, totalTokens: 60 }
      });

      const invalidContent = { invalid: 'structure' };

      const result = await citationVerifier.verifyCitations(invalidContent, 'b2b');

      // Should handle gracefully and provide empty result
      expect(result).toMatchObject({
        contentSummary: {
          citationCount: 0
        },
        citations: [],
        overallCredibilityScore: 0
      });
    });
  });

  afterEach(async () => {
    // Clean up cache after each test
    await cacheService.clearCache();
  });
});
