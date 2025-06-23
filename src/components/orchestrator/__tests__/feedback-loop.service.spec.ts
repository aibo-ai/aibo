import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { FeedbackLoopService, ContentPerformanceMetrics, LayerPerformanceMetrics } from '../services/feedback-loop.service';
import { ApplicationInsightsService } from '../../../common/services/application-insights.service';

describe('FeedbackLoopService', () => {
  let service: FeedbackLoopService;
  let appInsights: jest.Mocked<ApplicationInsightsService>;
  let configService: jest.Mocked<ConfigService>;

  const mockContentMetrics: ContentPerformanceMetrics = {
    jobId: 'test-job-123',
    contentId: 'content-456',
    contentType: 'blog_post',
    audience: 'b2b',
    engagementScore: 75,
    clickThroughRate: 3.5,
    timeOnPage: 240,
    bounceRate: 35,
    conversionRate: 8.2,
    userRating: 4.2,
    loadTime: 1200,
    recordedAt: new Date().toISOString()
  };

  const mockLayerMetrics: LayerPerformanceMetrics = {
    jobId: 'test-job-123',
    layer: 'bottom',
    service: 'queryIntentAnalyzer',
    processingTime: 1500,
    successRate: 98.5,
    errorRate: 1.5,
    outputQuality: 85,
    memoryUsage: 256,
    cpuUsage: 45,
    timestamp: new Date().toISOString()
  };

  beforeEach(async () => {
    const mockAppInsights = {
      trackEvent: jest.fn(),
      trackMetric: jest.fn(),
      trackException: jest.fn(),
      isAppInsightsAvailable: jest.fn().mockReturnValue(true)
    };

    const mockConfigService = {
      get: jest.fn((key: string, defaultValue?: any) => {
        const config = {
          'FEEDBACK_LOOP_ENABLED': 'true',
          'PERFORMANCE_ANALYSIS_INTERVAL': '24'
        };
        return config[key] || defaultValue;
      })
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedbackLoopService,
        {
          provide: ApplicationInsightsService,
          useValue: mockAppInsights
        },
        {
          provide: ConfigService,
          useValue: mockConfigService
        }
      ],
    }).compile();

    service = module.get<FeedbackLoopService>(FeedbackLoopService);
    appInsights = module.get(ApplicationInsightsService);
    configService = module.get(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('collectPerformanceMetrics', () => {
    it('should collect B2B performance metrics successfully', async () => {
      const result = await service.collectPerformanceMetrics('content-123', 'b2b');

      expect(result).toMatchObject({
        contentId: 'content-123',
        clientType: 'b2b',
        timestamp: expect.any(String),
        metrics: expect.objectContaining({
          technicalAccuracyScore: expect.any(Number),
          comprehensivenessMeasure: expect.any(Number),
          industryAlignmentIndex: expect.any(Number),
          citationQualityScore: expect.any(Number),
          engagementScore: expect.any(Number),
          conversionRate: expect.any(Number),
          timeOnPage: expect.any(Number)
        })
      });

      expect(appInsights.trackEvent).toHaveBeenCalledWith(
        'FeedbackLoop:MetricsCollected',
        expect.objectContaining({
          contentId: 'content-123',
          clientType: 'b2b'
        })
      );
    });

    it('should collect B2C performance metrics successfully', async () => {
      const result = await service.collectPerformanceMetrics('content-456', 'b2c');

      expect(result).toMatchObject({
        contentId: 'content-456',
        clientType: 'b2c',
        timestamp: expect.any(String),
        metrics: expect.objectContaining({
          engagementScore: expect.any(Number),
          emotionalResonanceIndex: expect.any(Number),
          conversionPotentialScore: expect.any(Number),
          socialSharingProbability: expect.any(Number),
          conversionRate: expect.any(Number),
          timeOnPage: expect.any(Number)
        })
      });

      expect(appInsights.trackEvent).toHaveBeenCalledWith(
        'FeedbackLoop:MetricsCollected',
        expect.objectContaining({
          contentId: 'content-456',
          clientType: 'b2c'
        })
      );
    });

    it('should handle errors gracefully', async () => {
      // Mock an error in Application Insights
      appInsights.trackEvent.mockImplementationOnce(() => {
        throw new Error('Application Insights error');
      });

      await expect(service.collectPerformanceMetrics('content-error', 'b2b'))
        .rejects.toThrow('Application Insights error');

      expect(appInsights.trackException).toHaveBeenCalled();
    });
  });

  describe('recordContentPerformance', () => {
    it('should record content performance metrics', async () => {
      await service.recordContentPerformance(mockContentMetrics);

      expect(appInsights.trackEvent).toHaveBeenCalledWith(
        'ContentPerformance:Recorded',
        expect.objectContaining({
          jobId: mockContentMetrics.jobId,
          contentId: mockContentMetrics.contentId,
          contentType: mockContentMetrics.contentType,
          audience: mockContentMetrics.audience
        })
      );

      expect(appInsights.trackMetric).toHaveBeenCalledWith(
        'ContentPerformance:EngagementScore',
        mockContentMetrics.engagementScore,
        expect.objectContaining({
          contentType: mockContentMetrics.contentType,
          audience: mockContentMetrics.audience
        })
      );
    });

    it('should trigger immediate analysis for poor performance', async () => {
      const poorMetrics: ContentPerformanceMetrics = {
        ...mockContentMetrics,
        engagementScore: 15, // Below threshold
        conversionRate: 0.5, // Below threshold
        bounceRate: 85 // Above threshold
      };

      await service.recordContentPerformance(poorMetrics);

      expect(appInsights.trackEvent).toHaveBeenCalledWith(
        'FeedbackLoop:PerformanceIssueDetected',
        expect.objectContaining({
          contentId: poorMetrics.contentId,
          contentType: poorMetrics.contentType
        })
      );
    });
  });

  describe('recordLayerPerformance', () => {
    it('should record layer performance metrics', async () => {
      await service.recordLayerPerformance(mockLayerMetrics);

      expect(appInsights.trackMetric).toHaveBeenCalledWith(
        `LayerPerformance:${mockLayerMetrics.layer}:ProcessingTime`,
        mockLayerMetrics.processingTime,
        expect.objectContaining({
          service: mockLayerMetrics.service,
          jobId: mockLayerMetrics.jobId
        })
      );

      expect(appInsights.trackMetric).toHaveBeenCalledWith(
        `LayerPerformance:${mockLayerMetrics.layer}:SuccessRate`,
        mockLayerMetrics.successRate,
        expect.objectContaining({
          service: mockLayerMetrics.service
        })
      );
    });
  });

  describe('generateImprovementSuggestions', () => {
    it('should generate B2B improvement suggestions', async () => {
      const b2bMetrics = {
        technicalAccuracyScore: 65, // Below threshold
        comprehensivenessMeasure: 55, // Below threshold
        citationQualityScore: 75, // Below threshold
        conversionRate: 3 // Below threshold
      };

      const result = await service.generateImprovementSuggestions('content-123', b2bMetrics);

      expect(result).toMatchObject({
        contentId: 'content-123',
        timestamp: expect.any(String),
        suggestions: expect.arrayContaining([
          expect.stringContaining('technical specifications'),
          expect.stringContaining('case studies'),
          expect.stringContaining('citations'),
          expect.stringContaining('ROI calculations')
        ]),
        priority: expect.any(String),
        metrics: expect.objectContaining({
          analyzed: expect.any(Number),
          belowThreshold: expect.any(Number)
        })
      });

      expect(appInsights.trackEvent).toHaveBeenCalledWith(
        'FeedbackLoop:SuggestionsGenerated',
        expect.objectContaining({
          contentId: 'content-123',
          clientType: 'b2b'
        })
      );
    });

    it('should generate B2C improvement suggestions', async () => {
      const b2cMetrics = {
        engagementScore: 55, // Below threshold
        emotionalResonanceIndex: 65, // Below threshold
        socialSharingProbability: 45, // Below threshold
        conversionRate: 1.5 // Below threshold
      };

      const result = await service.generateImprovementSuggestions('content-456', b2cMetrics);

      expect(result).toMatchObject({
        contentId: 'content-456',
        timestamp: expect.any(String),
        suggestions: expect.arrayContaining([
          expect.stringContaining('emotional appeal'),
          expect.stringContaining('conversational'),
          expect.stringContaining('social proof'),
          expect.stringContaining('call-to-action')
        ]),
        priority: expect.any(String)
      });

      expect(appInsights.trackEvent).toHaveBeenCalledWith(
        'FeedbackLoop:SuggestionsGenerated',
        expect.objectContaining({
          contentId: 'content-456',
          clientType: 'b2c'
        })
      );
    });

    it('should calculate priority correctly', async () => {
      const highPriorityMetrics = {
        technicalAccuracyScore: 30,
        comprehensivenessMeasure: 25,
        citationQualityScore: 35
      };

      const result = await service.generateImprovementSuggestions('content-high', highPriorityMetrics);
      expect(result.priority).toBe('high');

      const lowPriorityMetrics = {
        technicalAccuracyScore: 85,
        comprehensivenessMeasure: 90,
        citationQualityScore: 88
      };

      const result2 = await service.generateImprovementSuggestions('content-low', lowPriorityMetrics);
      expect(result2.priority).toBe('low');
    });
  });

  describe('applyAutomatedImprovements', () => {
    it('should apply improvements with realistic success rates', async () => {
      const improvements = [
        'Enhance technical specifications',
        'Add more case studies',
        'Improve citation quality',
        'Strengthen ROI calculations'
      ];

      const result = await service.applyAutomatedImprovements('content-123', improvements);

      expect(result).toMatchObject({
        contentId: 'content-123',
        timestamp: expect.any(String),
        appliedImprovements: expect.arrayContaining([
          expect.objectContaining({
            improvement: expect.any(String),
            applied: expect.any(Boolean),
            reason: expect.any(String)
          })
        ]),
        summary: expect.objectContaining({
          total: improvements.length,
          successful: expect.any(Number),
          successRate: expect.any(Number)
        }),
        status: expect.stringMatching(/^(completed|partial)$/)
      });

      expect(appInsights.trackEvent).toHaveBeenCalledWith(
        'FeedbackLoop:ImprovementSessionCompleted',
        expect.objectContaining({
          contentId: 'content-123',
          totalImprovements: improvements.length.toString()
        })
      );
    });
  });

  describe('getOptimizationSuggestions', () => {
    beforeEach(async () => {
      // Add some test data
      await service.recordContentPerformance(mockContentMetrics);
      await service.recordContentPerformance({
        ...mockContentMetrics,
        contentId: 'content-2',
        engagementScore: 45,
        conversionRate: 3,
        loadTime: 4000
      });
    });

    it('should provide optimization suggestions based on historical data', async () => {
      const suggestions = await service.getOptimizationSuggestions('blog_post', 'b2b');

      expect(suggestions).toMatchObject({
        contentStrategy: expect.any(Array),
        technicalOptimizations: expect.any(Array),
        workflowRecommendations: expect.any(Array)
      });

      // Should include technical optimizations for slow load times
      expect(suggestions.technicalOptimizations).toEqual(
        expect.arrayContaining([
          expect.stringContaining('images'),
          expect.stringContaining('CDN'),
          expect.stringContaining('JavaScript')
        ])
      );
    });

    it('should handle insufficient data gracefully', async () => {
      const suggestions = await service.getOptimizationSuggestions('unknown_type', 'b2c');

      expect(suggestions).toMatchObject({
        contentStrategy: ['Insufficient data for specific recommendations'],
        technicalOptimizations: ['Collect more performance data'],
        workflowRecommendations: ['Monitor content performance closely']
      });
    });
  });

  describe('analyzePerformanceTrends', () => {
    beforeEach(async () => {
      // Add multiple data points for trend analysis
      const baseTime = new Date();
      
      for (let i = 0; i < 10; i++) {
        await service.recordContentPerformance({
          ...mockContentMetrics,
          contentId: `content-${i}`,
          engagementScore: 60 + i * 2, // Improving trend
          conversionRate: 5 + i * 0.5,
          recordedAt: new Date(baseTime.getTime() - (10 - i) * 24 * 60 * 60 * 1000).toISOString()
        });
      }
    });

    it('should analyze performance trends successfully', async () => {
      const analysis = await service.analyzePerformanceTrends();

      expect(analysis).toMatchObject({
        timeRange: expect.objectContaining({
          start: expect.any(String),
          end: expect.any(String)
        }),
        dataPoints: expect.any(Number),
        contentTypeTrends: expect.any(Object),
        audienceInsights: expect.any(Object),
        recommendations: expect.any(Array),
        generatedAt: expect.any(String)
      });

      expect(analysis.dataPoints).toBeGreaterThan(0);
      expect(analysis.recommendations.length).toBeGreaterThan(0);

      expect(appInsights.trackEvent).toHaveBeenCalledWith(
        'FeedbackLoop:TrendAnalysisCompleted',
        expect.objectContaining({
          dataPoints: expect.any(String)
        })
      );
    });

    it('should handle empty data gracefully', async () => {
      // Create a new service instance without data
      const emptyService = new FeedbackLoopService(configService, appInsights);
      
      const analysis = await emptyService.analyzePerformanceTrends();

      expect(analysis).toMatchObject({
        message: 'Insufficient data for trend analysis',
        timeRange: expect.any(Object),
        dataPoints: 0
      });
    });

    it('should analyze trends for specific time range', async () => {
      const timeRange = {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        end: new Date()
      };

      const analysis = await service.analyzePerformanceTrends(timeRange);

      expect(analysis.timeRange.start).toBe(timeRange.start.toISOString());
      expect(analysis.timeRange.end).toBe(timeRange.end.toISOString());
    });
  });

  describe('Error Handling', () => {
    it('should handle Application Insights errors gracefully', async () => {
      appInsights.trackEvent.mockImplementation(() => {
        throw new Error('Application Insights unavailable');
      });

      await expect(service.recordContentPerformance(mockContentMetrics))
        .rejects.toThrow();

      expect(appInsights.trackException).toHaveBeenCalled();
    });

    it('should handle invalid metrics gracefully', async () => {
      const invalidMetrics = {
        ...mockContentMetrics,
        engagementScore: undefined,
        conversionRate: null as any
      };

      await expect(service.recordContentPerformance(invalidMetrics))
        .resolves.not.toThrow();
    });
  });

  describe('Performance', () => {
    it('should handle large datasets efficiently', async () => {
      const startTime = Date.now();
      
      // Add 100 data points
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(service.recordContentPerformance({
          ...mockContentMetrics,
          contentId: `perf-test-${i}`,
          engagementScore: Math.random() * 100
        }));
      }
      
      await Promise.all(promises);
      
      const processingTime = Date.now() - startTime;
      expect(processingTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should analyze trends efficiently with large datasets', async () => {
      // Add 50 data points
      for (let i = 0; i < 50; i++) {
        await service.recordContentPerformance({
          ...mockContentMetrics,
          contentId: `trend-test-${i}`,
          contentType: i % 2 === 0 ? 'blog_post' : 'technical_guide',
          audience: i % 2 === 0 ? 'b2b' : 'b2c',
          engagementScore: Math.random() * 100
        });
      }

      const startTime = Date.now();
      const analysis = await service.analyzePerformanceTrends();
      const processingTime = Date.now() - startTime;

      expect(processingTime).toBeLessThan(2000); // Should complete within 2 seconds
      expect(analysis.dataPoints).toBe(50);
    });
  });
});
