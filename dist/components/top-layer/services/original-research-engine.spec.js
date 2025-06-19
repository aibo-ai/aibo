"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const original_research_engine_service_1 = require("./original-research-engine.service");
const config_1 = require("@nestjs/config");
jest.mock('../../../shared/services/azure-ai.service', () => {
    return {
        AzureAIService: jest.fn().mockImplementation(() => {
            return {
                generateCompletion: jest.fn(),
                search: jest.fn(),
                generateEmbeddings: jest.fn(),
                analyzeText: jest.fn()
            };
        })
    };
});
const azure_ai_service_1 = require("../../../shared/services/azure-ai.service");
describe('OriginalResearchEngineService', () => {
    let service;
    let configService;
    let azureAIService;
    beforeEach(() => {
        jest.clearAllMocks();
        configService = new config_1.ConfigService();
        azureAIService = new azure_ai_service_1.AzureAIService(configService);
        service = new original_research_engine_service_1.OriginalResearchEngineService(configService, azureAIService);
        jest.spyOn(configService, 'get').mockImplementation((key) => {
            if (key === 'MOCK_RESEARCH_DATA') {
                return 'false';
            }
            return null;
        });
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe('generateOriginalResearch', () => {
        it('should generate research data using Azure AI service', async () => {
            const mockCompletionResponse = {
                choices: [
                    {
                        message: {
                            content: `
                # Original Research: Impact of AI on Content Marketing
                
                ## Research Type
                Comprehensive Trend Analysis
                
                ## Methodology
                This research combined survey data from 300 marketing professionals with analytics from 150 content campaigns.
                
                ## Demographics
                - Age: 25-45 years (68% of respondents)
                - Gender: Female (52%), Male (46%), Non-binary (2%)
                - Income: $75,000-$120,000 (median: $92,500)
                - Geography: North America (45%), Europe (32%), Asia-Pacific (18%), Other (5%)
                
                ## Trends
                - 78% increase in AI-assisted content production since 2023
                - Year-over-year growth of 135% in NLP usage for content optimization
                - 62% reduction in content production time when using AI tools
                
                ## Comparative Analysis
                - AI-generated content performs 32% better than traditional content in engagement metrics
                - Articles with AI-enhanced headlines see 47% more clicks than manually written ones
                - SMBs using AI content tools reported 28% higher ROI than those not using them
                
                ## Key Findings
                - 81% of surveyed marketers reported higher content quality when using AI tools
                - User session duration increased by 3.7 minutes on average with optimized content
                - Content personalization improved conversion rates by 42% across e-commerce sites
              `,
                        },
                    },
                ],
            };
            azureAIService.generateCompletion.mockResolvedValue(mockCompletionResponse);
            azureAIService.search.mockResolvedValue({ value: [] });
            const result = await service.generateOriginalResearch('AI in Content Marketing', 'blog', 'b2b');
            expect(azureAIService.generateCompletion).toHaveBeenCalled();
            expect(azureAIService.search).toHaveBeenCalled();
            expect(result).toBeDefined();
            expect(typeof result).toBe('object');
        });
        it('should use mock data when MOCK_RESEARCH_DATA config is true', async () => {
            jest.spyOn(configService, 'get').mockImplementation((key) => {
                if (key === 'MOCK_RESEARCH_DATA') {
                    return 'true';
                }
                return null;
            });
            const result = await service.generateOriginalResearch('AI in Content Marketing', 'blog', 'b2b');
            expect(result).toBeDefined();
            expect(typeof result).toBe('object');
        });
        it('should handle errors from Azure AI and fall back to mock data', async () => {
            azureAIService.generateCompletion.mockRejectedValue(new Error('API error'));
            const result = await service.generateOriginalResearch('AI in Content Marketing', 'blog', 'b2b');
            expect(azureAIService.generateCompletion).toHaveBeenCalled();
            expect(result).toBeDefined();
            expect(typeof result).toBe('object');
        });
    });
    describe('integrateResearchIntoContent', () => {
        it('should integrate research data into content with originalResearchFlag', async () => {
            const mockContent = {
                sections: {
                    intro: {
                        originalResearchFlag: true,
                        content: 'Introduction content'
                    },
                    body: {
                        originalResearchFlag: false,
                        content: 'Body content'
                    },
                    conclusion: {
                        originalResearchFlag: true,
                        content: 'Conclusion content'
                    }
                }
            };
            const mockResearchData = {
                researchType: 'Survey Analysis',
                keyFindings: ['Finding 1', 'Finding 2'],
                insights: ['Insight 1', 'Insight 2', 'Insight 3'],
                methodology: 'Survey of 500 professionals',
                visualizations: [{ type: 'chart', title: 'Chart 1' }],
                dataPoints: [{ metric: 'Usage', value: '85%' }]
            };
            const result = await service.integrateResearchIntoContent(mockContent, mockResearchData);
            expect(result).toBeDefined();
            expect(typeof result).toBe('object');
        });
    });
    describe('identifyResearchGaps', () => {
        it('should identify research gaps in b2b content', async () => {
            const mockContent = {
                meta: {
                    title: 'B2B Content',
                    segment: 'b2b',
                },
                sections: {
                    intro: { originalResearchFlag: true, researchData: [] },
                    keyPoints: { originalResearchFlag: false },
                    conclusion: { originalResearchFlag: true, researchData: [{ id: 1 }] }
                }
            };
            const result = await service.identifyResearchGaps(mockContent, 'b2b');
            expect(result).toBeDefined();
            expect(typeof result).toBe('object');
        });
        it('should identify research gaps in b2c content', async () => {
            const mockContent = {
                meta: {
                    title: 'B2C Content',
                    segment: 'b2c',
                },
                sections: {
                    intro: { originalResearchFlag: true, researchData: [] },
                    conclusion: { originalResearchFlag: true, researchData: [] }
                }
            };
            const result = await service.identifyResearchGaps(mockContent, 'b2c');
            expect(result).toBeDefined();
            expect(typeof result).toBe('object');
        });
    });
});
//# sourceMappingURL=original-research-engine.spec.js.map