"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const llm_content_analyzer_service_1 = require("../llm-content-analyzer.service");
const azure_ai_service_1 = require("../azure-ai-service");
const content_chunker_service_1 = require("../../../bottom-layer/services/content-chunker.service");
const application_insights_service_1 = require("../../../../common/services/application-insights.service");
jest.mock('../azure-ai-service');
jest.mock('../../../bottom-layer/services/content-chunker.service');
jest.mock('../../../../common/services/application-insights.service');
describe('LLMContentAnalyzerService', () => {
    let service;
    let azureAIService;
    let contentChunkerService;
    let appInsights;
    const mockContent = 'This is some test content that will be analyzed and chunked.';
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                llm_content_analyzer_service_1.LLMContentAnalyzerService,
                azure_ai_service_1.AzureAIService,
                content_chunker_service_1.ContentChunkerService,
                application_insights_service_1.ApplicationInsightsService,
            ],
        }).compile();
        service = module.get(llm_content_analyzer_service_1.LLMContentAnalyzerService);
        azureAIService = module.get(azure_ai_service_1.AzureAIService);
        contentChunkerService = module.get(content_chunker_service_1.ContentChunkerService);
        appInsights = module.get(application_insights_service_1.ApplicationInsightsService);
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
        jest.clearAllMocks();
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe('analyzeContent', () => {
        it('should analyze content successfully', async () => {
            const result = await service.analyzeContent(mockContent, 'gpt4');
            expect(azureAIService.generateCompletion).toHaveBeenCalledTimes(1);
            expect(azureAIService.generateCompletion).toHaveBeenCalledWith(expect.objectContaining({
                prompt: expect.stringContaining('You are an expert content analyzer'),
                maxTokens: 1500,
                temperature: 0.1
            }));
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
            expect(appInsights.trackEvent).toHaveBeenCalledWith('LLMContentAnalyzer:Analyze:Start', expect.any(Object));
            expect(appInsights.trackEvent).toHaveBeenCalledWith('LLMContentAnalyzer:Analyze:Success', expect.any(Object));
            expect(appInsights.trackMetric).toHaveBeenCalledWith('LLMContentAnalyzer:AnalyzeLatency', expect.any(Number), expect.any(Object));
        });
        it('should handle errors during analysis', async () => {
            azureAIService.generateCompletion.mockRejectedValueOnce(new Error('API failure'));
            await expect(service.analyzeContent(mockContent)).rejects.toThrow('Failed to analyze content');
            expect(appInsights.trackException).toHaveBeenCalledTimes(1);
            expect(appInsights.trackMetric).toHaveBeenCalledWith('LLMContentAnalyzer:AnalyzeLatency', expect.any(Number), expect.objectContaining({ success: 'false' }));
        });
        it('should handle JSON parsing errors', async () => {
            azureAIService.generateCompletion.mockResolvedValueOnce({
                text: 'This is not valid JSON',
                usage: { completionTokens: 10, promptTokens: 20, totalTokens: 30 }
            });
            const result = await service.analyzeContent(mockContent);
            expect(result.metrics.llmQualityScore).toBe(70);
            expect(result.issues.length).toBe(1);
            expect(result.recommendations.length).toBe(3);
        });
    });
    describe('chunkContent', () => {
        it('should chunk content successfully', async () => {
            const result = await service.chunkContent(mockContent, 'semantic', 500);
            expect(contentChunkerService.chunkContent).toHaveBeenCalledWith(mockContent, 'semantic');
            expect(contentChunkerService.optimizeChunksForLLM).toHaveBeenCalledWith(expect.any(Array), 500);
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
            expect(appInsights.trackEvent).toHaveBeenCalledWith('LLMContentAnalyzer:Chunk:Start', expect.any(Object));
            expect(appInsights.trackEvent).toHaveBeenCalledWith('LLMContentAnalyzer:Chunk:Success', expect.any(Object));
            expect(appInsights.trackMetric).toHaveBeenCalledWith('LLMContentAnalyzer:ChunkLatency', expect.any(Number), expect.any(Object));
        });
        it('should handle errors during chunking', async () => {
            contentChunkerService.chunkContent.mockRejectedValueOnce(new Error('Chunking failure'));
            await expect(service.chunkContent(mockContent)).rejects.toThrow('Failed to chunk content');
            expect(appInsights.trackException).toHaveBeenCalledTimes(1);
            expect(appInsights.trackMetric).toHaveBeenCalledWith('LLMContentAnalyzer:ChunkLatency', expect.any(Number), expect.objectContaining({ success: 'false' }));
        });
    });
});
//# sourceMappingURL=llm-content-analyzer.service.spec.js.map