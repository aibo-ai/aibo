"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const config_1 = require("@nestjs/config");
const original_research_engine_service_1 = require("./original-research-engine.service");
const AzureAIService = 'AzureAIService';
describe('OriginalResearchEngineService', () => {
    let service;
    const mockAzureAIService = {
        generateCompletion: jest.fn(),
        search: jest.fn(),
    };
    const mockConfigService = {
        get: jest.fn(),
    };
    beforeEach(async () => {
        mockAzureAIService.generateCompletion.mockReset();
        mockAzureAIService.search.mockReset();
        mockConfigService.get.mockReset();
        mockConfigService.get.mockImplementation((key) => {
            if (key === 'MOCK_RESEARCH_DATA') {
                return 'true';
            }
            return null;
        });
        const module = await testing_1.Test.createTestingModule({
            providers: [
                original_research_engine_service_1.OriginalResearchEngineService,
                { provide: AzureAIService, useValue: mockAzureAIService },
                { provide: config_1.ConfigService, useValue: mockConfigService },
            ],
        }).compile();
        service = module.get(original_research_engine_service_1.OriginalResearchEngineService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe('generateOriginalResearch', () => {
        it('should generate research data using Azure AI when MOCK_RESEARCH_DATA is false', async () => {
            mockConfigService.get.mockImplementation((key) => {
                if (key === 'MOCK_RESEARCH_DATA') {
                    return 'false';
                }
                return null;
            });
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
            mockAzureAIService.generateCompletion.mockResolvedValue(mockCompletionResponse);
            mockAzureAIService.search.mockResolvedValue({ value: [] });
            const result = await service.generateOriginalResearch('AI in Content Marketing', 'blog', 'b2b');
            expect(mockAzureAIService.generateCompletion).toHaveBeenCalled();
            expect(mockAzureAIService.search).toHaveBeenCalled();
            expect(result).toBeDefined();
            expect(result.researchType).toBe('Comprehensive Trend Analysis');
            expect(result.methodology).toContain('survey data');
            expect(result.demographicData).toBeDefined();
            expect(result.trendData).toBeDefined();
            expect(result.comparativeData).toBeDefined();
            expect(result.keyFindings).toHaveLength(3);
        });
        it('should return mock data when MOCK_RESEARCH_DATA is true', async () => {
            mockConfigService.get.mockImplementation((key) => {
                if (key === 'MOCK_RESEARCH_DATA') {
                    return 'true';
                }
                return null;
            });
            const result = await service.generateOriginalResearch('AI in Content Marketing', 'blog', 'b2b');
            expect(mockAzureAIService.generateCompletion).not.toHaveBeenCalled();
            expect(result).toBeDefined();
            expect(result.researchType).toBeDefined();
            expect(result.isMockData).toBe(true);
        });
        it('should handle errors from Azure AI and fall back to mock data', async () => {
            mockConfigService.get.mockImplementation((key) => {
                if (key === 'MOCK_RESEARCH_DATA') {
                    return 'false';
                }
                return null;
            });
            mockAzureAIService.generateCompletion.mockRejectedValue(new Error('API error'));
            const result = await service.generateOriginalResearch('AI in Content Marketing', 'blog', 'b2b');
            expect(mockAzureAIService.generateCompletion).toHaveBeenCalled();
            expect(result).toBeDefined();
            expect(result.researchType).toBeDefined();
            expect(result.isMockData).toBe(true);
        });
    });
    describe('integrateResearchIntoContent', () => {
        it('should integrate research data into content', async () => {
            const mockContent = {
                sections: {
                    intro: {
                        originalResearchFlag: true,
                        content: 'Introduction content'
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
                visualizations: [{ type: 'chart' }]
            };
            const result = await service.integrateResearchIntoContent(mockContent, mockResearchData);
            expect(result.sections.intro.researchData).toBeDefined();
            expect(result.sections.conclusion.researchData).toBeDefined();
            expect(result.updatedSections).toContain('intro');
            expect(result.updatedSections).toContain('conclusion');
        });
    });
    describe('identifyResearchGaps', () => {
        it('should identify research gaps in content for b2b segment', async () => {
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
            expect(result.integrationPoints).toHaveLength(2);
            expect(result.researchOpportunities).toBeDefined();
            expect(result.recommendedApproach).toBeDefined();
            expect(result.recommendedApproach.researchType).toBeDefined();
        });
        it('should identify research gaps in content for b2c segment', async () => {
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
            expect(result.integrationPoints).toHaveLength(2);
            expect(result.researchOpportunities).toBeDefined();
            expect(result.recommendedApproach.researchType).toBeDefined();
            expect(result.recommendedApproach.suggestedMethodology).toContain('consumer');
        });
    });
});
//# sourceMappingURL=original-research-engine.service.simplified.spec.js.map