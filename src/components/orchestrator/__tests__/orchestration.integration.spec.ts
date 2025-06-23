import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

// Orchestration services
import { OrchestrationService } from '../services/orchestration.service';
import { JobManagementService } from '../services/job-management.service';
import { WorkflowEngineService } from '../services/workflow-engine.service';
import { RealtimeUpdatesService } from '../services/realtime-updates.service';

// Mock layer services
import { QueryIntentAnalyzerService } from '../../bottom-layer/services/query-intent-analyzer.service';
import { KeywordTopicAnalyzerService } from '../../bottom-layer/services/keyword-topic-analyzer.service';
import { BlufContentStructurerService } from '../../middle-layer/services/bluf-content-structurer.service';
import { LLMContentOptimizerService } from '../../top-layer/services/llm-content-optimizer.service';
import { ApplicationInsightsService } from '../../../common/services/application-insights.service';

// Mock all layer services
jest.mock('../../bottom-layer/services/query-intent-analyzer.service');
jest.mock('../../bottom-layer/services/keyword-topic-analyzer.service');
jest.mock('../../bottom-layer/services/content-chunker.service');
jest.mock('../../bottom-layer/freshness-aggregator/services/freshness-aggregator.service');
jest.mock('../../middle-layer/services/bluf-content-structurer.service');
jest.mock('../../middle-layer/services/conversational-query-optimizer.service');
jest.mock('../../middle-layer/services/semantic-relationship-mapper.service');
jest.mock('../../middle-layer/services/platform-specific-tuner.service');
jest.mock('../../top-layer/services/llm-content-optimizer.service');
jest.mock('../../top-layer/services/original-research-engine.service');
jest.mock('../../top-layer/services/citation-authority-verifier.service');
jest.mock('../../top-layer/services/eeat-signal-generator.service');
jest.mock('../../top-layer/services/schema-markup-generator.service');
jest.mock('../../../common/services/application-insights.service');

describe('Orchestration Integration Tests', () => {
  let orchestrationService: OrchestrationService;
  let jobManagementService: JobManagementService;
  let workflowEngineService: WorkflowEngineService;
  let realtimeUpdatesService: RealtimeUpdatesService;
  
  // Mock services
  let queryIntentAnalyzer: jest.Mocked<QueryIntentAnalyzerService>;
  let keywordTopicAnalyzer: jest.Mocked<KeywordTopicAnalyzerService>;
  let blufContentStructurer: jest.Mocked<BlufContentStructurerService>;
  let llmContentOptimizer: jest.Mocked<LLMContentOptimizerService>;
  let appInsights: jest.Mocked<ApplicationInsightsService>;

  const mockRequest = {
    topic: 'Artificial Intelligence in Healthcare',
    contentType: 'blog_post',
    audience: 'b2b',
    targetLength: 'medium',
    toneOfVoice: 'professional',
    includeResearch: true,
    includeCitations: true,
    includeEEAT: true,
    workflowType: 'standard',
    priority: 'normal',
    userId: 'test-user-123',
    projectId: 'test-project-456'
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [
        OrchestrationService,
        JobManagementService,
        WorkflowEngineService,
        RealtimeUpdatesService,
        
        // Mock layer services
        QueryIntentAnalyzerService,
        KeywordTopicAnalyzerService,
        {
          provide: 'ContentChunkerService',
          useValue: { chunkContent: jest.fn() }
        },
        {
          provide: 'FreshnessAggregatorService',
          useValue: { aggregateFreshness: jest.fn() }
        },
        BlufContentStructurerService,
        {
          provide: 'ConversationalQueryOptimizerService',
          useValue: { optimizeForConversational: jest.fn() }
        },
        {
          provide: 'SemanticRelationshipMapperService',
          useValue: { mapRelationships: jest.fn() }
        },
        {
          provide: 'PlatformSpecificTunerService',
          useValue: { tuneForPlatform: jest.fn() }
        },
        LLMContentOptimizerService,
        {
          provide: 'OriginalResearchEngineService',
          useValue: { generateOriginalResearch: jest.fn() }
        },
        {
          provide: 'CitationAuthorityVerifierService',
          useValue: { verifyCitations: jest.fn() }
        },
        {
          provide: 'EeatSignalGeneratorService',
          useValue: { generateEEATSignals: jest.fn() }
        },
        {
          provide: 'SchemaMarkupGeneratorService',
          useValue: { generateSchemaMarkup: jest.fn() }
        },
        ApplicationInsightsService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config = {
                'AZURE_SERVICE_BUS_CONNECTION_STRING': 'mock-connection-string',
                'JOB_MAX_RETRIES': '3'
              };
              return config[key] || defaultValue;
            })
          }
        }
      ],
    }).compile();

    orchestrationService = module.get<OrchestrationService>(OrchestrationService);
    jobManagementService = module.get<JobManagementService>(JobManagementService);
    workflowEngineService = module.get<WorkflowEngineService>(WorkflowEngineService);
    realtimeUpdatesService = module.get<RealtimeUpdatesService>(RealtimeUpdatesService);
    
    // Get mock services
    queryIntentAnalyzer = module.get(QueryIntentAnalyzerService);
    keywordTopicAnalyzer = module.get(KeywordTopicAnalyzerService);
    blufContentStructurer = module.get(BlufContentStructurerService);
    llmContentOptimizer = module.get(LLMContentOptimizerService);
    appInsights = module.get(ApplicationInsightsService);

    // Setup mock implementations
    queryIntentAnalyzer.analyzeIntent.mockResolvedValue({
      intent: 'informational',
      confidence: 0.9,
      entities: ['AI', 'healthcare'],
      sentiment: 'neutral'
    });

    keywordTopicAnalyzer.analyzeKeywords.mockResolvedValue({
      primaryKeywords: ['artificial intelligence', 'healthcare', 'medical AI'],
      secondaryKeywords: ['machine learning', 'diagnosis', 'treatment'],
      topicClusters: ['AI applications', 'healthcare technology'],
      searchVolume: { 'artificial intelligence': 50000 }
    });

    blufContentStructurer.structureWithBluf.mockResolvedValue({
      structuredContent: {
        bottom_line: 'AI is transforming healthcare',
        up_front: 'Key benefits and applications',
        sections: ['Introduction', 'Applications', 'Benefits', 'Challenges']
      }
    });

    llmContentOptimizer.optimizeContent.mockResolvedValue({
      optimizedContent: {
        title: 'AI in Healthcare: Transforming Patient Care',
        content: 'Comprehensive article about AI in healthcare...',
        sections: {
          introduction: 'AI introduction content...',
          applications: 'AI applications content...',
          benefits: 'AI benefits content...'
        }
      },
      optimizationMetrics: {
        readabilityScore: 85,
        seoScore: 90,
        engagementScore: 88
      }
    });

    appInsights.trackEvent.mockImplementation();
    appInsights.trackException.mockImplementation();
    appInsights.trackMetric.mockImplementation();
  });

  describe('End-to-End Orchestration Workflow', () => {
    it('should complete full content generation workflow', async () => {
      const startTime = Date.now();

      // Test synchronous content generation
      const result = await orchestrationService.generateContentSync(mockRequest);

      // Verify result structure
      expect(result).toMatchObject({
        jobId: expect.stringMatching(/^sync-/),
        content: expect.objectContaining({
          metadata: expect.objectContaining({
            topic: mockRequest.topic,
            contentType: mockRequest.contentType,
            audience: mockRequest.audience
          }),
          bottomLayer: expect.any(Object),
          middleLayer: expect.any(Object),
          topLayer: expect.any(Object),
          finalContent: expect.any(Object)
        }),
        completedSteps: expect.arrayContaining([
          'analyze_intent',
          'analyze_keywords',
          'structure_content',
          'optimize_content'
        ]),
        totalSteps: expect.any(Number),
        processingTime: expect.any(Number)
      });

      // Verify all layer services were called
      expect(queryIntentAnalyzer.analyzeIntent).toHaveBeenCalledWith(
        mockRequest.topic,
        mockRequest.audience
      );
      expect(keywordTopicAnalyzer.analyzeKeywords).toHaveBeenCalled();
      expect(blufContentStructurer.structureWithBluf).toHaveBeenCalled();
      expect(llmContentOptimizer.optimizeContent).toHaveBeenCalled();

      // Verify processing time is reasonable
      expect(result.processingTime).toBeLessThan(10000); // Less than 10 seconds

      console.log(`Full workflow completed in ${result.processingTime}ms`);
    });

    it('should handle async job queueing and processing', async () => {
      // Queue async job
      const jobId = await orchestrationService.queueContentGeneration(mockRequest);

      expect(jobId).toMatch(/^job-/);

      // Verify job was created
      const job = await jobManagementService.getJobStatus(jobId);
      expect(job).toMatchObject({
        id: jobId,
        type: 'content_generation',
        status: 'queued',
        request: mockRequest,
        priority: 'normal',
        userId: mockRequest.userId,
        projectId: mockRequest.projectId
      });

      // Simulate job processing (normally done by Azure Function)
      const message = {
        jobId,
        type: 'content_generation',
        request: mockRequest
      };

      await orchestrationService.processContentGenerationJob(message);

      // Verify job completion
      const completedJob = await jobManagementService.getJobStatus(jobId);
      expect(completedJob?.status).toBe('completed');
      expect(completedJob?.result).toBeDefined();
    });

    it('should handle different workflow types', async () => {
      // Test research-heavy workflow
      const researchRequest = {
        ...mockRequest,
        workflowType: 'research_heavy',
        includeResearch: true,
        includeCitations: true
      };

      const workflow = await workflowEngineService.getWorkflow('research_heavy');
      expect(workflow.type).toBe('research_heavy');
      expect(workflow.steps.length).toBeGreaterThan(5);

      // Test SEO-focused workflow
      const seoRequest = {
        ...mockRequest,
        workflowType: 'seo_focused',
        includeSchemaMarkup: true
      };

      const seoWorkflow = await workflowEngineService.getWorkflow('seo_focused');
      expect(seoWorkflow.type).toBe('seo_focused');
      expect(seoWorkflow.steps.some(step => step.service === 'schemaMarkupGenerator')).toBe(true);
    });
  });

  describe('Job Management', () => {
    it('should manage job lifecycle correctly', async () => {
      // Create job
      const job = await jobManagementService.createJob({
        type: 'content_generation',
        request: mockRequest,
        userId: mockRequest.userId,
        priority: 'high'
      });

      expect(job.status).toBe('queued');
      expect(job.priority).toBe('high');

      // Update job status
      await jobManagementService.updateJobStatus(job.id, 'processing', 'Job started');
      
      let updatedJob = await jobManagementService.getJobStatus(job.id);
      expect(updatedJob?.status).toBe('processing');
      expect(updatedJob?.startedAt).toBeDefined();

      // Update progress
      await jobManagementService.updateJobProgress(job.id, {
        currentStep: 'analyze_intent',
        completedSteps: [],
        totalSteps: 4,
        percentage: 25
      });

      updatedJob = await jobManagementService.getJobStatus(job.id);
      expect(updatedJob?.progress?.percentage).toBe(25);

      // Complete job
      await jobManagementService.updateJobStatus(job.id, 'completed', 'Job completed', {
        content: 'Generated content'
      });

      updatedJob = await jobManagementService.getJobStatus(job.id);
      expect(updatedJob?.status).toBe('completed');
      expect(updatedJob?.result).toEqual({ content: 'Generated content' });
      expect(updatedJob?.processingTime).toBeGreaterThan(0);
    });

    it('should list and filter jobs correctly', async () => {
      // Create multiple jobs
      const jobs = await Promise.all([
        jobManagementService.createJob({
          type: 'content_generation',
          request: mockRequest,
          userId: 'user1',
          priority: 'high'
        }),
        jobManagementService.createJob({
          type: 'citation_verification',
          request: mockRequest,
          userId: 'user1',
          priority: 'normal'
        }),
        jobManagementService.createJob({
          type: 'content_generation',
          request: mockRequest,
          userId: 'user2',
          priority: 'low'
        })
      ]);

      // Test filtering by user
      const user1Jobs = await jobManagementService.listJobs({ userId: 'user1' });
      expect(user1Jobs.jobs).toHaveLength(2);
      expect(user1Jobs.jobs.every(job => job.userId === 'user1')).toBe(true);

      // Test filtering by type
      const contentJobs = await jobManagementService.listJobs({ type: 'content_generation' });
      expect(contentJobs.jobs).toHaveLength(2);
      expect(contentJobs.jobs.every(job => job.type === 'content_generation')).toBe(true);

      // Test filtering by priority
      const highPriorityJobs = await jobManagementService.listJobs({ priority: 'high' });
      expect(highPriorityJobs.jobs).toHaveLength(1);
      expect(highPriorityJobs.jobs[0].priority).toBe('high');
    });

    it('should handle job retry correctly', async () => {
      // Create and fail a job
      const job = await jobManagementService.createJob({
        type: 'content_generation',
        request: mockRequest
      });

      await jobManagementService.setJobError(job.id, 'Network timeout');
      
      let failedJob = await jobManagementService.getJobStatus(job.id);
      expect(failedJob?.status).toBe('failed');
      expect(failedJob?.error).toBe('Network timeout');

      // Retry job
      await jobManagementService.retryJob(job.id);
      
      let retriedJob = await jobManagementService.getJobStatus(job.id);
      expect(retriedJob?.status).toBe('queued');
      expect(retriedJob?.retryCount).toBe(1);
      expect(retriedJob?.error).toBeUndefined();
    });
  });

  describe('Real-time Updates', () => {
    it('should manage connections and subscriptions', async () => {
      const connectionId = 'conn-123';
      const userId = 'user-456';
      const jobId = 'job-789';

      // Register connection
      await realtimeUpdatesService.registerConnection(connectionId, userId);

      // Subscribe to job
      await realtimeUpdatesService.subscribeToJob(connectionId, jobId);

      // Send updates
      await realtimeUpdatesService.sendJobStatusUpdate(jobId, 'processing', 'Job started');
      await realtimeUpdatesService.sendJobProgressUpdate(jobId, {
        currentStep: 'analyze_intent',
        percentage: 25
      });

      // Get connection stats
      const stats = await realtimeUpdatesService.getConnectionStatistics();
      expect(stats.totalConnections).toBe(1);
      expect(stats.activeJobs).toBe(1);

      // Unregister connection
      await realtimeUpdatesService.unregisterConnection(connectionId);
      
      const finalStats = await realtimeUpdatesService.getConnectionStatistics();
      expect(finalStats.totalConnections).toBe(0);
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle layer service failures gracefully', async () => {
      // Mock service failure
      queryIntentAnalyzer.analyzeIntent.mockRejectedValueOnce(new Error('Service unavailable'));

      // Should throw error and not continue workflow
      await expect(orchestrationService.generateContentSync(mockRequest))
        .rejects.toThrow('Workflow step \'analyze_intent\' failed');

      expect(appInsights.trackException).toHaveBeenCalled();
    });

    it('should handle invalid workflow types', async () => {
      const invalidRequest = {
        ...mockRequest,
        workflowType: 'invalid_workflow'
      };

      await expect(orchestrationService.generateContentSync(invalidRequest))
        .rejects.toThrow('Workflow not found for type: invalid_workflow');
    });

    it('should handle malformed job messages', async () => {
      const invalidMessage = {
        // Missing required fields
        type: 'content_generation'
      };

      await expect(orchestrationService.processContentGenerationJob(invalidMessage))
        .rejects.toThrow();
    });
  });

  describe('Performance and Monitoring', () => {
    it('should track performance metrics', async () => {
      const result = await orchestrationService.generateContentSync(mockRequest);

      // Verify metrics were tracked
      expect(appInsights.trackEvent).toHaveBeenCalledWith(
        'ContentGeneration:SyncCompleted',
        expect.objectContaining({
          processingTime: expect.any(Number),
          contentType: mockRequest.contentType,
          audience: mockRequest.audience
        })
      );

      // Verify reasonable performance
      expect(result.processingTime).toBeLessThan(5000); // Less than 5 seconds for sync
    });

    it('should provide health status', async () => {
      const health = await orchestrationService.getHealthStatus();

      expect(health).toMatchObject({
        orchestration: 'healthy',
        serviceBus: expect.any(String),
        layers: {
          bottom: 'healthy',
          middle: 'healthy',
          top: 'healthy'
        },
        timestamp: expect.any(String)
      });
    });
  });
});
