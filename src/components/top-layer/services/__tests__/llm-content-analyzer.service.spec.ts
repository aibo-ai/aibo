import { Test, TestingModule } from '@nestjs/testing';
import { LLMContentAnalyzerService } from '../llm-content-analyzer.service';
import { AzureAIService } from '../azure-ai-service';
import { ContentChunkerService } from '../../../bottom-layer/services/content-chunker.service';
import { ApplicationInsightsService } from '../../../../common/services/application-insights.service';

jest.mock('../azure-ai-service');
jest.mock('../../../bottom-layer/services/content-chunker.service');
jest.mock('../../../../common/services/application-insights.service');

describe('LLMContentAnalyzerService', () => {
  let service: LLMContentAnalyzerService;
  let azureAIService: jest.Mocked<AzureAIService>;
  let contentChunkerService: jest.Mocked<ContentChunkerService>;
  let appInsights: jest.Mocked<ApplicationInsightsService>;

  const mockContent = 'This is some test content that will be analyzed and chunked.';
  
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LLMContentAnalyzerService,
        AzureAIService,
        ContentChunkerService,
        ApplicationInsightsService,
      ],
    }).compile();

    service = module.get<LLMContentAnalyzerService>(LLMContentAnalyzerService);
    azureAIService = module.get(AzureAIService) as jest.Mocked<AzureAIService>;
    contentChunkerService = module.get(ContentChunkerService) as jest.Mocked<ContentChunkerService>;
    appInsights = module.get(ApplicationInsightsService) as jest.Mocked<ApplicationInsightsService>;
    
    // Mock Azure AI Service response for generateCompletion
    azureAIService.generateCompletion.mockResolvedValue({
      text: JSON.stringify({
        metrics: {
          readabilityScore: 85,
          semanticDensity: 75,
          contextualRelevance: 80,
          cohesionScore: 78,
          llmQualityScore: 79
        },
        issues: [
          {
            type: 'Ambiguous Reference',
            severity: 'medium',
            description: 'Pronoun with unclear antecedent',
            example: 'It was unclear what the reference was about'
          }
        ],
        recommendations: [
          'Use more precise terminology',
          'Clarify ambiguous references'
        ]
      }),
      usage: {
        completionTokens: 100,
        promptTokens: 200,
        totalTokens: 300
      }
    });
    
    // Mock ContentChunker service responses
    contentChunkerService.chunkContent.mockResolvedValue({
      chunks: [
        { 
          id: 'chunk-1', 
          content: 'This is some test', 
          startPosition: 0, 
          endPosition: 15 
        },
        { 
          id: 'chunk-2', 
          content: 'content that will', 
          startPosition: 16, 
          endPosition: 32 
        },
        { 
          id: 'chunk-3', 
          content: 'be analyzed and chunked.', 
          startPosition: 33, 
          endPosition: 58
        }
      ]
    });
    
    contentChunkerService.optimizeChunksForLLM.mockResolvedValue([
      { 
        id: 'chunk-1', 
        content: 'This is some test', 
        startPosition: 0, 
        endPosition: 15 
      },
      { 
        id: 'chunk-2', 
        content: 'content that will', 
        startPosition: 16, 
        endPosition: 32 
      },
      { 
        id: 'chunk-3', 
        content: 'be analyzed and chunked.', 
        startPosition: 33, 
        endPosition: 58
      }
    ]);
    
    // Clear all mock calls
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('analyzeContent', () => {
    it('should analyze content successfully', async () => {
      const result = await service.analyzeContent(mockContent, 'gpt4');
      
      // Verify Azure AI Service was called with correct parameters
      expect(azureAIService.generateCompletion).toHaveBeenCalledTimes(1);
      expect(azureAIService.generateCompletion).toHaveBeenCalledWith(expect.objectContaining({
        prompt: expect.stringContaining('You are an expert content analyzer'),
        maxTokens: 1500,
        temperature: 0.1
      }));
      
      // Verify the result structure
      expect(result).toMatchObject({
        analysisId: expect.any(String),
        contentLength: mockContent.length,
        targetLLM: 'gpt4',
        metrics: {
          readabilityScore: 85,
          semanticDensity: 75,
          contextualRelevance: 80,
          cohesionScore: 78,
          llmQualityScore: 79
        },
        issues: [expect.objectContaining({
          type: 'Ambiguous Reference',
          severity: 'medium'
        })],
        recommendations: expect.arrayContaining([
          'Use more precise terminology',
          'Clarify ambiguous references'
        ]),
        timestamp: expect.any(String)
      });
      
      // Verify telemetry was tracked
      expect(appInsights.trackEvent).toHaveBeenCalledWith(
        'LLMContentAnalyzer:Analyze:Start',
        expect.any(Object)
      );
      expect(appInsights.trackEvent).toHaveBeenCalledWith(
        'LLMContentAnalyzer:Analyze:Success',
        expect.any(Object)
      );
      expect(appInsights.trackMetric).toHaveBeenCalledWith(
        'LLMContentAnalyzer:AnalyzeLatency',
        expect.any(Number),
        expect.any(Object)
      );
    });
    
    it('should handle errors during analysis', async () => {
      // Mock service to throw an error
      azureAIService.generateCompletion.mockRejectedValueOnce(new Error('API failure'));
      
      await expect(service.analyzeContent(mockContent)).rejects.toThrow('Failed to analyze content');
      
      // Verify error telemetry was tracked
      expect(appInsights.trackException).toHaveBeenCalledTimes(1);
      expect(appInsights.trackMetric).toHaveBeenCalledWith(
        'LLMContentAnalyzer:AnalyzeLatency',
        expect.any(Number),
        expect.objectContaining({ success: 'false' })
      );
    });
    
    it('should handle JSON parsing errors', async () => {
      // Mock invalid JSON response
      azureAIService.generateCompletion.mockResolvedValueOnce({
        text: 'This is not valid JSON',
        usage: { completionTokens: 10, promptTokens: 20, totalTokens: 30 }
      });
      
      const result = await service.analyzeContent(mockContent);
      
      // Should use fallback values
      expect(result.metrics.llmQualityScore).toBe(70);
      expect(result.issues.length).toBe(1);
      expect(result.recommendations.length).toBe(3);
    });
  });
  
  describe('chunkContent', () => {
    it('should chunk content successfully', async () => {
      const result = await service.chunkContent(mockContent, 'semantic', 500);
      
      // Verify ContentChunker service was called correctly
      expect(contentChunkerService.chunkContent).toHaveBeenCalledWith(mockContent, 'semantic');
      expect(contentChunkerService.optimizeChunksForLLM).toHaveBeenCalledWith(
        expect.any(Array),
        500
      );
      
      // Verify the result structure
      expect(result).toMatchObject({
        chunkingId: expect.any(String),
        originalLength: mockContent.length,
        contentSnapshot: expect.any(String),
        chunkType: 'semantic',
        targetTokenSize: 500,
        chunks: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            content: expect.any(String),
            estimatedTokenCount: expect.any(Number)
          })
        ]),
        metrics: {
          chunkCount: 3,
          averageChunkSize: expect.any(Number),
          tokenReductionPercentage: expect.any(Number),
          contextPreservationScore: expect.any(Number)
        },
        timestamp: expect.any(String)
      });
      
      // Verify telemetry was tracked
      expect(appInsights.trackEvent).toHaveBeenCalledWith(
        'LLMContentAnalyzer:Chunk:Start',
        expect.any(Object)
      );
      expect(appInsights.trackEvent).toHaveBeenCalledWith(
        'LLMContentAnalyzer:Chunk:Success',
        expect.any(Object)
      );
      expect(appInsights.trackMetric).toHaveBeenCalledWith(
        'LLMContentAnalyzer:ChunkLatency',
        expect.any(Number),
        expect.any(Object)
      );
    });
    
    it('should handle errors during chunking', async () => {
      // Mock service to throw an error
      contentChunkerService.chunkContent.mockRejectedValueOnce(new Error('Chunking failure'));
      
      await expect(service.chunkContent(mockContent)).rejects.toThrow('Failed to chunk content');
      
      // Verify error telemetry was tracked
      expect(appInsights.trackException).toHaveBeenCalledTimes(1);
      expect(appInsights.trackMetric).toHaveBeenCalledWith(
        'LLMContentAnalyzer:ChunkLatency',
        expect.any(Number),
        expect.objectContaining({ success: 'false' })
      );
    });
  });
});
