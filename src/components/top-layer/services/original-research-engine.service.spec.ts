import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { OriginalResearchEngineService } from './original-research-engine.service';

// Define a class name to use for mocking the AzureAIService
const AzureAIService = 'AzureAIService';

// Mock services
const mockAzureAIService = {
  generateCompletion: jest.fn(),
  search: jest.fn(),
  generateEmbeddings: jest.fn(),
  analyzeText: jest.fn(),
};

const mockConfigService = {
  get: jest.fn((key: string) => {
    if (key === 'MOCK_RESEARCH_DATA') {
      return 'true';
    }
    return null;
  }),
};

describe('OriginalResearchEngineService', () => {
  let service: OriginalResearchEngineService;
  let azureAIService: typeof mockAzureAIService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OriginalResearchEngineService,
        { provide: AzureAIService, useValue: mockAzureAIService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<OriginalResearchEngineService>(OriginalResearchEngineService);
    azureAIService = module.get(AzureAIService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Testing public methods
  describe('generateOriginalResearch', () => {
    it('should generate original research data for a given topic', async () => {
      // Mock the generateCompletion response
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
      expect(result).toBeDefined();
      expect(result.researchType).toBe('Comprehensive Trend Analysis');
      expect(result.methodology).toContain('survey data');
      expect(result.demographicData).toBeDefined();
      expect(result.trendData).toBeDefined();
      expect(result.comparativeData).toBeDefined();
      expect(result.keyFindings).toBeDefined();
    });

    it('should handle errors and return mock data when API fails', async () => {
      mockAzureAIService.generateCompletion.mockRejectedValue(new Error('API Failure'));

      const result = await service.generateOriginalResearch('AI in Content Marketing', 'blog', 'b2b');

      expect(result).toBeDefined();
      expect(result.researchType).toBeDefined(); // Should fall back to mock data
    });
  });

  describe('identifyResearchGaps', () => {
    it('should identify research gaps in content', async () => {
      const mockContent = {
        meta: {
          title: 'Test Content',
          segment: 'b2b',
        },
        sections: {
          intro: {
            originalResearchFlag: true,
            researchData: [],
          },
          keyPoints: {
            originalResearchFlag: false,
          }
        }
      };

      const result = await service.identifyResearchGaps(mockContent, 'b2b');

      expect(result).toBeDefined();
      expect(result.integrationPoints).toBeDefined();
      expect(result.researchOpportunities).toBeDefined();
    });
  });

  // Testing private methods using type assertion
  describe('Private methods', () => {
    // Use any type to bypass TypeScript's private method restrictions for testing
    let privateService: any;

    // Test for generateResearchPrompt
    it('should generate a research prompt correctly', () => {
      privateService = service as any;
      const prompt = privateService.generateResearchPrompt('AI', 'blog', 'b2b', { value: [] });
      
      expect(prompt).toContain('AI');
      expect(prompt).toContain('B2B');
      expect(prompt).toContain('blog');
    });

    // Test for extractResearchType
    it('should extract research type from text', () => {
      privateService = service as any;
      const text = `# Research Results
      ## Research Type
      Market Analysis Survey`;
      
      const researchType = privateService.extractResearchType(text);
      expect(researchType).toBe('Market Analysis Survey');
    });

    // Test for extractMethodology
    it('should extract methodology from text', () => {
      privateService = service as any;
      const text = `# Research Results
      ## Methodology
      Online survey of 500 participants`;
      
      const methodology = privateService.extractMethodology(text);
      expect(methodology).toBe('Online survey of 500 participants');
    });

    // Test for extractDemographicData
    it('should extract demographic data from text', () => {
      privateService = service as any;
      const text = `# Research Results
      ## Demographics
      - Age: 25-34 (45%)
      - Gender: Male (53%), Female (47%)
      - Income: $50,000-$75,000`;
      
      const demographicData = privateService.extractDemographicData(text);
      expect(demographicData.age).toContain('25-34');
      expect(demographicData.gender).toContain('Male');
      expect(demographicData.income).toContain('$50,000-$75,000');
    });

    // Test for extractTrendData
    it('should extract trend data from text', () => {
      privateService = service as any;
      const text = `# Research Results
      ## Trends
      - 25% increase in adoption
      - Year-over-year growth of 15%`;
      
      const trendData = privateService.extractTrendData(text);
      expect(trendData.percentages).toContain('25% increase');
      expect(trendData.growth).toContain('Year-over-year growth of 15%');
    });

    // Test for extractComparativeData
    it('should extract comparative data from text', () => {
      privateService = service as any;
      const text = `# Research Results
      ## Comparative Analysis
      - Product A performs 30% better than Product B
      - Solution X costs 25% less than Solution Y`;
      
      const comparativeData = privateService.extractComparativeData(text);
      expect(comparativeData.comparisons).toHaveLength(2);
      expect(comparativeData.comparisons[0]).toContain('Product A');
    });

    // Test for extractKeyFindings
    it('should extract key findings from text', () => {
      privateService = service as any;
      const text = `# Research Results
      ## Key Findings
      - Finding 1: Important insight
      - Finding 2: Critical discovery`;
      
      const keyFindings = privateService.extractKeyFindings(text);
      expect(keyFindings).toHaveLength(2);
      expect(keyFindings[0]).toContain('Finding 1');
    });

    // Test for getIntegrationPoints
    it('should identify integration points in content', () => {
      privateService = service as any;
      const mockContent = {
        sections: {
          intro: { originalResearchFlag: true, researchData: [{ id: 1 }] },
          details: { originalResearchFlag: false }
        }
      };
      
      const integrationPoints = privateService.getIntegrationPoints(mockContent);
      expect(integrationPoints).toHaveLength(1);
      expect(integrationPoints[0].section).toBe('intro');
      expect(integrationPoints[0].researchDataCount).toBe(1);
    });

    // Test for getResearchOpportunities
    it('should generate research opportunities based on segment and gap score', () => {
      privateService = service as any;
      
      const b2bOpportunities = privateService.getResearchOpportunities('b2b', 0.8);
      expect(b2bOpportunities.length).toBeGreaterThan(0);
      expect(b2bOpportunities[0]).toContain('ROI analysis');
      
      const b2cOpportunities = privateService.getResearchOpportunities('b2c', 0.8);
      expect(b2cOpportunities.length).toBeGreaterThan(0);
      expect(b2cOpportunities[0]).toContain('user satisfaction');
    });

    // Test for getRecommendedApproach
    it('should recommend a research approach based on segment and gaps', () => {
      privateService = service as any;
      const prioritizedGaps = [
        { section: 'intro', gapScore: 0.7 },
        { section: 'details', gapScore: 0.6 }
      ];
      
      const b2bApproach = privateService.getRecommendedApproach('b2b', prioritizedGaps);
      expect(b2bApproach.researchType).toBeDefined();
      expect(b2bApproach.suggestedMethodology).toBeDefined();
      
      const b2cApproach = privateService.getRecommendedApproach('b2c', prioritizedGaps);
      expect(b2cApproach.researchType).toBeDefined();
      expect(b2cApproach.suggestedMethodology).toBeDefined();
    });
  });
});
