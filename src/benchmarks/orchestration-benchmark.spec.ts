import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { OrchestrationService } from '../components/orchestrator/services/orchestration.service';
import { JobManagementService } from '../components/orchestrator/services/job-management.service';
import { WorkflowEngineService } from '../components/orchestrator/services/workflow-engine.service';
import { PerformanceBenchmarkService } from '../common/services/performance-benchmark.service';
import { ApplicationInsightsService } from '../common/services/application-insights.service';

describe('Orchestration Performance Benchmarks', () => {
  let orchestrationService: OrchestrationService;
  let jobManagementService: JobManagementService;
  let workflowEngineService: WorkflowEngineService;
  let benchmarkService: PerformanceBenchmarkService;
  let module: TestingModule;

  // Test request templates for different scenarios
  const testRequests = {
    simple: {
      topic: 'Introduction to Machine Learning',
      contentType: 'blog_post',
      audience: 'b2c',
      targetLength: 'short',
      toneOfVoice: 'friendly',
      workflowType: 'standard',
      priority: 'normal',
      userId: 'benchmark-user-1',
      projectId: 'benchmark-project-1'
    },
    complex: {
      topic: 'Advanced Neural Network Architectures for Medical Image Analysis',
      contentType: 'technical_guide',
      audience: 'b2b',
      targetLength: 'long',
      toneOfVoice: 'technical',
      purpose: 'Educate healthcare professionals about advanced AI techniques',
      keyPoints: [
        'Convolutional Neural Networks in medical imaging',
        'Transfer learning applications',
        'Attention mechanisms for diagnostic accuracy',
        'Ethical considerations in AI-assisted diagnosis'
      ],
      searchKeywords: ['medical AI', 'neural networks', 'image analysis', 'healthcare technology'],
      includeResearch: true,
      includeCitations: true,
      includeEEAT: true,
      includeSchemaMarkup: true,
      workflowType: 'research_heavy',
      priority: 'high',
      userId: 'benchmark-user-2',
      projectId: 'benchmark-project-2'
    },
    seoFocused: {
      topic: 'Best SEO Practices for E-commerce Websites',
      contentType: 'industry_analysis',
      audience: 'b2b',
      targetLength: 'medium',
      toneOfVoice: 'professional',
      purpose: 'Guide digital marketers on SEO optimization strategies',
      keyPoints: [
        'Technical SEO fundamentals',
        'Content optimization strategies',
        'Link building best practices',
        'Performance monitoring and analytics'
      ],
      searchKeywords: ['SEO optimization', 'e-commerce SEO', 'digital marketing', 'search rankings'],
      includeResearch: false,
      includeCitations: true,
      includeEEAT: false,
      includeSchemaMarkup: true,
      workflowType: 'seo_focused',
      priority: 'normal',
      userId: 'benchmark-user-3',
      projectId: 'benchmark-project-3'
    }
  };

  beforeAll(async () => {
    const mockConfigService = {
      get: jest.fn((key: string, defaultValue?: any) => {
        const config = {
          'AZURE_SERVICE_BUS_CONNECTION_STRING': 'mock-connection-string',
          'JOB_MAX_RETRIES': '3',
          'JOB_TIMEOUT_MINUTES': '15'
        };
        return config[key] || defaultValue;
      })
    };

    const mockAppInsights = {
      trackEvent: jest.fn(),
      trackMetric: jest.fn(),
      trackException: jest.fn(),
      isAppInsightsAvailable: jest.fn().mockReturnValue(true)
    };

    // Mock layer services for consistent benchmarking
    const mockLayerServices = {
      queryIntentAnalyzer: { analyzeIntent: jest.fn().mockResolvedValue({ intent: 'informational', confidence: 0.9 }) },
      keywordTopicAnalyzer: { analyzeKeywords: jest.fn().mockResolvedValue({ primaryKeywords: ['test'], secondaryKeywords: ['benchmark'] }) },
      blufContentStructurer: { structureWithBluf: jest.fn().mockResolvedValue({ structuredContent: { sections: ['intro', 'body', 'conclusion'] } }) },
      llmContentOptimizer: { optimizeContent: jest.fn().mockResolvedValue({ optimizedContent: { title: 'Test Title', content: 'Test content' } }) }
    };

    module = await Test.createTestingModule({
      providers: [
        OrchestrationService,
        JobManagementService,
        WorkflowEngineService,
        PerformanceBenchmarkService,
        {
          provide: ConfigService,
          useValue: mockConfigService
        },
        {
          provide: ApplicationInsightsService,
          useValue: mockAppInsights
        },
        // Mock layer services
        { provide: 'QueryIntentAnalyzerService', useValue: mockLayerServices.queryIntentAnalyzer },
        { provide: 'KeywordTopicAnalyzerService', useValue: mockLayerServices.keywordTopicAnalyzer },
        { provide: 'BlufContentStructurerService', useValue: mockLayerServices.blufContentStructurer },
        { provide: 'LLMContentOptimizerService', useValue: mockLayerServices.llmContentOptimizer },
        // Mock other services
        { provide: 'ContentChunkerService', useValue: { chunkContent: jest.fn().mockResolvedValue([]) } },
        { provide: 'FreshnessAggregatorService', useValue: { aggregateFreshness: jest.fn().mockResolvedValue({}) } },
        { provide: 'ConversationalQueryOptimizerService', useValue: { optimizeForConversational: jest.fn().mockResolvedValue({}) } },
        { provide: 'SemanticRelationshipMapperService', useValue: { mapRelationships: jest.fn().mockResolvedValue({}) } },
        { provide: 'PlatformSpecificTunerService', useValue: { tuneForPlatform: jest.fn().mockResolvedValue({}) } },
        { provide: 'OriginalResearchEngineService', useValue: { generateOriginalResearch: jest.fn().mockResolvedValue({}) } },
        { provide: 'CitationAuthorityVerifierService', useValue: { verifyCitations: jest.fn().mockResolvedValue({}) } },
        { provide: 'EeatSignalGeneratorService', useValue: { generateEEATSignals: jest.fn().mockResolvedValue({}) } },
        { provide: 'SchemaMarkupGeneratorService', useValue: { generateSchemaMarkup: jest.fn().mockResolvedValue({}) } }
      ],
    }).compile();

    orchestrationService = module.get<OrchestrationService>(OrchestrationService);
    jobManagementService = module.get<JobManagementService>(JobManagementService);
    workflowEngineService = module.get<WorkflowEngineService>(WorkflowEngineService);
    benchmarkService = module.get<PerformanceBenchmarkService>(PerformanceBenchmarkService);

    // Warm up services
    await orchestrationService.generateContentSync(testRequests.simple);
  });

  afterAll(async () => {
    await module.close();
  });

  describe('Synchronous Content Generation Benchmarks', () => {
    it('should benchmark sync content generation performance', async () => {
      const suite = await benchmarkService.runBenchmarkSuite('SyncContentGeneration', [
        {
          name: 'generateContentSync_simple',
          operation: async () => {
            return await orchestrationService.generateContentSync(testRequests.simple);
          },
          iterations: 10,
          metadata: { 
            workflowType: testRequests.simple.workflowType,
            contentType: testRequests.simple.contentType,
            complexity: 'simple'
          }
        },
        {
          name: 'generateContentSync_complex',
          operation: async () => {
            return await orchestrationService.generateContentSync(testRequests.complex);
          },
          iterations: 5,
          metadata: { 
            workflowType: testRequests.complex.workflowType,
            contentType: testRequests.complex.contentType,
            complexity: 'complex'
          }
        },
        {
          name: 'generateContentSync_seoFocused',
          operation: async () => {
            return await orchestrationService.generateContentSync(testRequests.seoFocused);
          },
          iterations: 7,
          metadata: { 
            workflowType: testRequests.seoFocused.workflowType,
            contentType: testRequests.seoFocused.contentType,
            complexity: 'medium'
          }
        }
      ]);

      // Verify performance expectations
      expect(suite.summary.successRate).toBeGreaterThan(95);
      expect(suite.summary.averageDuration).toBeLessThan(10000); // 10 seconds average
      expect(suite.summary.p95Duration).toBeLessThan(20000); // 20 seconds P95

      // Establish baseline
      await benchmarkService.establishBaseline('orchestration', 'sync_generation', suite.metrics);

      console.log(`Sync Content Generation Benchmark Results:`);
      console.log(`  Total Operations: ${suite.summary.totalOperations}`);
      console.log(`  Success Rate: ${suite.summary.successRate.toFixed(2)}%`);
      console.log(`  Average Duration: ${suite.summary.averageDuration.toFixed(2)}ms`);
      console.log(`  P95 Duration: ${suite.summary.p95Duration.toFixed(2)}ms`);
      console.log(`  Peak Memory: ${(suite.summary.peakMemoryUsed / 1024 / 1024).toFixed(2)}MB`);
    });
  });

  describe('Asynchronous Job Processing Benchmarks', () => {
    it('should benchmark async job queueing and processing', async () => {
      const suite = await benchmarkService.runBenchmarkSuite('AsyncJobProcessing', [
        {
          name: 'queueContentGeneration_batch',
          operation: async () => {
            const jobIds = await Promise.all([
              orchestrationService.queueContentGeneration(testRequests.simple),
              orchestrationService.queueContentGeneration(testRequests.seoFocused),
              orchestrationService.queueContentGeneration({
                ...testRequests.simple,
                topic: 'Batch Processing Test',
                userId: 'batch-user'
              })
            ]);
            
            // Simulate processing
            for (const jobId of jobIds) {
              await jobManagementService.updateJobStatus(jobId, 'processing', 'Job started');
              await jobManagementService.updateJobStatus(jobId, 'completed', 'Job completed', { content: 'Generated content' });
            }
            
            return jobIds;
          },
          iterations: 5,
          metadata: { 
            batchSize: 3,
            operationType: 'batch_queue_and_process'
          }
        },
        {
          name: 'queueContentGeneration_single',
          operation: async () => {
            const jobId = await orchestrationService.queueContentGeneration(testRequests.simple);
            await jobManagementService.updateJobStatus(jobId, 'processing', 'Job started');
            await jobManagementService.updateJobStatus(jobId, 'completed', 'Job completed', { content: 'Generated content' });
            return jobId;
          },
          iterations: 15,
          metadata: { 
            batchSize: 1,
            operationType: 'single_queue_and_process'
          }
        }
      ]);

      // Verify async performance
      expect(suite.summary.successRate).toBeGreaterThan(98);
      expect(suite.summary.averageDuration).toBeLessThan(1000); // 1 second for queueing

      console.log(`Async Job Processing Benchmark Results:`);
      console.log(`  Total Operations: ${suite.summary.totalOperations}`);
      console.log(`  Success Rate: ${suite.summary.successRate.toFixed(2)}%`);
      console.log(`  Average Duration: ${suite.summary.averageDuration.toFixed(2)}ms`);
      console.log(`  P95 Duration: ${suite.summary.p95Duration.toFixed(2)}ms`);
    });
  });

  describe('Job Management Benchmarks', () => {
    it('should benchmark job management operations', async () => {
      const suite = await benchmarkService.runBenchmarkSuite('JobManagement', [
        {
          name: 'createJob',
          operation: async () => {
            return await jobManagementService.createJob({
              type: 'content_generation',
              request: testRequests.simple,
              userId: 'benchmark-user',
              priority: 'normal'
            });
          },
          iterations: 20,
          metadata: { operationType: 'create' }
        },
        {
          name: 'getJobStatus',
          operation: async () => {
            const job = await jobManagementService.createJob({
              type: 'content_generation',
              request: testRequests.simple,
              userId: 'benchmark-user'
            });
            return await jobManagementService.getJobStatus(job.id);
          },
          iterations: 50,
          metadata: { operationType: 'read' }
        },
        {
          name: 'updateJobStatus',
          operation: async () => {
            const job = await jobManagementService.createJob({
              type: 'content_generation',
              request: testRequests.simple,
              userId: 'benchmark-user'
            });
            await jobManagementService.updateJobStatus(job.id, 'processing', 'Job started');
            return await jobManagementService.updateJobStatus(job.id, 'completed', 'Job completed');
          },
          iterations: 30,
          metadata: { operationType: 'update' }
        },
        {
          name: 'listJobs',
          operation: async () => {
            return await jobManagementService.listJobs({ limit: 50 });
          },
          iterations: 25,
          metadata: { operationType: 'list' }
        }
      ]);

      // Verify job management performance
      expect(suite.summary.successRate).toBeGreaterThan(99);
      expect(suite.summary.averageDuration).toBeLessThan(100); // 100ms average

      console.log(`Job Management Benchmark Results:`);
      console.log(`  Total Operations: ${suite.summary.totalOperations}`);
      console.log(`  Success Rate: ${suite.summary.successRate.toFixed(2)}%`);
      console.log(`  Average Duration: ${suite.summary.averageDuration.toFixed(2)}ms`);
      console.log(`  P95 Duration: ${suite.summary.p95Duration.toFixed(2)}ms`);
    });
  });

  describe('Workflow Engine Benchmarks', () => {
    it('should benchmark workflow engine operations', async () => {
      const suite = await benchmarkService.runBenchmarkSuite('WorkflowEngine', [
        {
          name: 'getWorkflow',
          operation: async () => {
            return await workflowEngineService.getWorkflow('standard');
          },
          iterations: 100,
          metadata: { operationType: 'get_workflow' }
        },
        {
          name: 'getAvailableWorkflows',
          operation: async () => {
            return await workflowEngineService.getAvailableWorkflows();
          },
          iterations: 50,
          metadata: { operationType: 'list_workflows' }
        },
        {
          name: 'validateWorkflowDependencies',
          operation: async () => {
            const workflow = await workflowEngineService.getWorkflow('research_heavy');
            return await workflowEngineService.validateWorkflowDependencies(workflow);
          },
          iterations: 30,
          metadata: { operationType: 'validate_dependencies' }
        },
        {
          name: 'getExecutionOrder',
          operation: async () => {
            const workflow = await workflowEngineService.getWorkflow('seo_focused');
            return await workflowEngineService.getExecutionOrder(workflow);
          },
          iterations: 40,
          metadata: { operationType: 'execution_order' }
        }
      ]);

      // Verify workflow engine performance
      expect(suite.summary.successRate).toBeGreaterThan(99);
      expect(suite.summary.averageDuration).toBeLessThan(50); // 50ms average

      console.log(`Workflow Engine Benchmark Results:`);
      console.log(`  Total Operations: ${suite.summary.totalOperations}`);
      console.log(`  Success Rate: ${suite.summary.successRate.toFixed(2)}%`);
      console.log(`  Average Duration: ${suite.summary.averageDuration.toFixed(2)}ms`);
      console.log(`  P95 Duration: ${suite.summary.p95Duration.toFixed(2)}ms`);
    });
  });

  describe('Concurrent Processing Benchmarks', () => {
    it('should handle high concurrency orchestration requests', async () => {
      const concurrentRequests = 20;

      const suite = await benchmarkService.runBenchmarkSuite('ConcurrentProcessing', [
        {
          name: 'concurrentSyncGeneration',
          operation: async () => {
            const promises = Array.from({ length: concurrentRequests }, (_, i) => 
              orchestrationService.generateContentSync({
                ...testRequests.simple,
                topic: `Concurrent Test ${i}`,
                userId: `concurrent-user-${i}`
              })
            );
            
            return await Promise.all(promises);
          },
          iterations: 3,
          metadata: { 
            concurrentRequests,
            operationType: 'concurrent_sync'
          }
        },
        {
          name: 'concurrentAsyncQueueing',
          operation: async () => {
            const promises = Array.from({ length: concurrentRequests }, (_, i) => 
              orchestrationService.queueContentGeneration({
                ...testRequests.simple,
                topic: `Async Concurrent Test ${i}`,
                userId: `async-concurrent-user-${i}`
              })
            );
            
            return await Promise.all(promises);
          },
          iterations: 5,
          metadata: { 
            concurrentRequests,
            operationType: 'concurrent_async'
          }
        }
      ]);

      // Verify concurrent processing performance
      expect(suite.summary.successRate).toBeGreaterThan(90);
      expect(suite.summary.averageDuration).toBeLessThan(60000); // 60 seconds under high concurrency

      console.log(`Concurrent Processing Benchmark Results:`);
      console.log(`  Concurrent Requests: ${concurrentRequests}`);
      console.log(`  Success Rate: ${suite.summary.successRate.toFixed(2)}%`);
      console.log(`  Average Duration: ${suite.summary.averageDuration.toFixed(2)}ms`);
      console.log(`  Peak Memory: ${(suite.summary.peakMemoryUsed / 1024 / 1024).toFixed(2)}MB`);
    });
  });

  describe('Memory and Resource Efficiency', () => {
    it('should maintain resource efficiency under load', async () => {
      const initialMemory = process.memoryUsage();

      const suite = await benchmarkService.runBenchmarkSuite('ResourceEfficiency', [
        {
          name: 'sustainedLoad',
          operation: async () => {
            // Process multiple requests in sequence to test resource management
            const results = [];
            for (let i = 0; i < 10; i++) {
              const result = await orchestrationService.generateContentSync({
                ...testRequests.simple,
                topic: `Sustained Load Test ${i}`
              });
              results.push(result);
              
              // Force garbage collection if available
              if (global.gc) {
                global.gc();
              }
            }
            return results;
          },
          iterations: 3,
          metadata: { 
            sequentialRequests: 10,
            operationType: 'sustained_load'
          }
        }
      ]);

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      // Verify resource efficiency
      expect(memoryIncrease).toBeLessThan(200 * 1024 * 1024); // Less than 200MB increase
      expect(suite.summary.successRate).toBeGreaterThan(95);

      console.log(`Resource Efficiency Test Results:`);
      console.log(`  Initial Memory: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
      console.log(`  Final Memory: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
      console.log(`  Memory Increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
      console.log(`  Peak Memory During Test: ${(suite.summary.peakMemoryUsed / 1024 / 1024).toFixed(2)}MB`);
    });
  });

  afterAll(() => {
    // Generate final performance report
    const report = benchmarkService.generatePerformanceReport();
    
    console.log('\n=== ORCHESTRATION PERFORMANCE REPORT ===');
    console.log(`Total Benchmark Suites: ${report.summary.totalSuites}`);
    console.log(`Total Operations: ${report.summary.totalOperations}`);
    console.log(`Average Success Rate: ${report.summary.averageSuccessRate.toFixed(2)}%`);
    console.log(`Total Baselines Established: ${report.summary.totalBaselines}`);
    
    if (report.recommendations.length > 0) {
      console.log('\nPerformance Recommendations:');
      report.recommendations.forEach(rec => console.log(`  - ${rec}`));
    }
    
    console.log('\n=== END PERFORMANCE REPORT ===\n');
  });
});
