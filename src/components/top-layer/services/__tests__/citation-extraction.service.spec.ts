import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CitationExtractionService } from '../citation-extraction.service';
import { AzureAIService } from '../azure-ai-service';
import { ApplicationInsightsService } from '../../../../common/services/application-insights.service';

jest.mock('../azure-ai-service');
jest.mock('../../../../common/services/application-insights.service');

describe('CitationExtractionService', () => {
  let service: CitationExtractionService;
  let azureAIService: jest.Mocked<AzureAIService>;
  let appInsights: jest.Mocked<ApplicationInsightsService>;

  const mockContent = {
    title: 'Research Article',
    sections: {
      introduction: {
        content: 'According to Smith et al. (2023), artificial intelligence is transforming industries. See https://example.com/ai-research for more details.'
      },
      methodology: {
        content: 'Our approach follows the methodology described in doi:10.1000/182 and builds upon previous work by Johnson (2022).'
      },
      results: {
        content: 'The findings are consistent with Harvard Business Review (2024) analysis of market trends.'
      }
    }
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CitationExtractionService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => defaultValue)
          }
        },
        AzureAIService,
        ApplicationInsightsService
      ],
    }).compile();

    service = module.get<CitationExtractionService>(CitationExtractionService);
    azureAIService = module.get(AzureAIService);
    appInsights = module.get(ApplicationInsightsService);

    // Setup default mocks
    azureAIService.generateCompletion.mockResolvedValue({
      text: JSON.stringify([
        {
          text: 'Smith et al. (2023). AI Transformation Study.',
          type: 'academic',
          authors: ['Smith', 'Jones'],
          year: 2023,
          title: 'AI Transformation Study'
        }
      ]),
      usage: {
        completionTokens: 100,
        promptTokens: 500,
        totalTokens: 600
      }
    });

    appInsights.trackEvent.mockImplementation();
    appInsights.trackException.mockImplementation();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('extractCitations', () => {
    it('should extract citations from structured content', async () => {
      const result = await service.extractCitations(mockContent);

      expect(result).toMatchObject({
        citations: expect.arrayContaining([
          expect.objectContaining({
            id: expect.stringMatching(/^citation-extract-/),
            type: 'url',
            url: 'https://example.com/ai-research',
            section: 'introduction'
          }),
          expect.objectContaining({
            type: 'doi',
            doi: '10.1000/182',
            section: 'methodology'
          })
        ]),
        totalFound: expect.any(Number),
        byType: expect.objectContaining({
          url: expect.any(Number),
          doi: expect.any(Number)
        }),
        bySection: expect.objectContaining({
          introduction: expect.any(Number),
          methodology: expect.any(Number)
        }),
        extractionMethod: 'hybrid-nlp-pattern',
        confidence: expect.any(Number),
        processingTime: expect.any(Number)
      });

      expect(appInsights.trackEvent).toHaveBeenCalledWith(
        'CitationExtraction:Start',
        expect.objectContaining({
          extractionId: expect.any(String)
        })
      );
    });

    it('should extract URL citations correctly', async () => {
      const result = await service.extractCitations(mockContent);

      const urlCitations = result.citations.filter(c => c.type === 'url');
      expect(urlCitations).toHaveLength(1);
      expect(urlCitations[0]).toMatchObject({
        url: 'https://example.com/ai-research',
        section: 'introduction',
        position: expect.objectContaining({
          start: expect.any(Number),
          end: expect.any(Number)
        })
      });
    });

    it('should extract DOI citations correctly', async () => {
      const result = await service.extractCitations(mockContent);

      const doiCitations = result.citations.filter(c => c.type === 'doi');
      expect(doiCitations).toHaveLength(1);
      expect(doiCitations[0]).toMatchObject({
        doi: '10.1000/182',
        url: 'https://doi.org/10.1000/182',
        section: 'methodology'
      });
    });

    it('should extract academic citations using pattern matching', async () => {
      const academicContent = {
        sections: {
          main: {
            content: 'Smith, J. and Johnson, A. (2023). Machine Learning Applications. Journal of AI Research.'
          }
        }
      };

      const result = await service.extractCitations(academicContent);

      const academicCitations = result.citations.filter(c => c.type === 'academic');
      expect(academicCitations.length).toBeGreaterThan(0);
      
      if (academicCitations.length > 0) {
        expect(academicCitations[0]).toMatchObject({
          type: 'academic',
          authors: expect.arrayContaining(['Smith, J.']),
          year: 2023,
          title: 'Machine Learning Applications',
          source: 'Journal of AI Research'
        });
      }
    });

    it('should handle string content input', async () => {
      const stringContent = 'This research cites https://example.com/study and doi:10.1000/123';

      const result = await service.extractCitations(stringContent);

      // Should extract URL and DOI, plus potentially AI-extracted citations
      expect(result.citations.length).toBeGreaterThanOrEqual(2);

      const urlCitations = result.citations.filter(c => c.type === 'url');
      const doiCitations = result.citations.filter(c => c.type === 'doi');

      expect(urlCitations).toHaveLength(1);
      expect(doiCitations).toHaveLength(1);
    });

    it('should handle content with no citations', async () => {
      // Mock AI service to return empty array for this test
      azureAIService.generateCompletion.mockResolvedValueOnce({
        text: JSON.stringify([]),
        usage: { completionTokens: 10, promptTokens: 50, totalTokens: 60 }
      });

      const noCitationsContent = {
        sections: {
          main: {
            content: 'This is content without any citations or references.'
          }
        }
      };

      const result = await service.extractCitations(noCitationsContent);

      expect(result).toMatchObject({
        citations: [],
        totalFound: 0,
        byType: {},
        bySection: {},
        confidence: 0
      });
    });

    it('should deduplicate citations', async () => {
      const duplicateContent = {
        sections: {
          section1: {
            content: 'Reference to https://example.com/study'
          },
          section2: {
            content: 'Another reference to https://example.com/study'
          }
        }
      };

      const result = await service.extractCitations(duplicateContent);

      const urlCitations = result.citations.filter(c => c.url === 'https://example.com/study');
      expect(urlCitations).toHaveLength(1);
    });

    it('should handle AI extraction failures gracefully', async () => {
      azureAIService.generateCompletion.mockRejectedValueOnce(new Error('AI Service Error'));

      const result = await service.extractCitations(mockContent);

      // Should still extract citations using pattern matching
      expect(result.citations.length).toBeGreaterThan(0);
      expect(appInsights.trackException).not.toHaveBeenCalled(); // AI failure is handled gracefully
    });

    it('should handle malformed AI responses', async () => {
      azureAIService.generateCompletion.mockResolvedValueOnce({
        text: 'This is not valid JSON',
        usage: { completionTokens: 10, promptTokens: 50, totalTokens: 60 }
      });

      const result = await service.extractCitations(mockContent);

      // Should still work with pattern-based extraction
      expect(result.citations.length).toBeGreaterThan(0);
    });

    it('should calculate confidence scores appropriately', async () => {
      const highQualityContent = {
        sections: {
          main: {
            content: 'Smith, J. (2023). Research Paper. Journal. https://example.com/paper doi:10.1000/123'
          }
        }
      };

      const result = await service.extractCitations(highQualityContent);

      // Should have high confidence due to structured citations
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('should track processing metrics', async () => {
      await service.extractCitations(mockContent);

      expect(appInsights.trackEvent).toHaveBeenCalledWith(
        'CitationExtraction:Success',
        expect.objectContaining({
          citationsFound: expect.any(Number),
          processingTime: expect.any(Number)
        })
      );
    });

    it('should handle extraction errors and return fallback result', async () => {
      // Mock AI service to fail for this test
      azureAIService.generateCompletion.mockRejectedValueOnce(new Error('AI Service Error'));

      // Mock a critical error in extraction
      const errorContent = null;

      const result = await service.extractCitations(errorContent);

      expect(result).toMatchObject({
        citations: [],
        totalFound: 0,
        extractionMethod: 'error-fallback',
        confidence: 0
      });

      expect(appInsights.trackException).toHaveBeenCalled();
    });
  });
});
