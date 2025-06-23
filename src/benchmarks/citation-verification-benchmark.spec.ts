import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CitationAuthorityVerifierService } from '../components/top-layer/services/citation-authority-verifier.service';
import { PerformanceBenchmarkService } from '../common/services/performance-benchmark.service';
import { ApplicationInsightsService } from '../common/services/application-insights.service';

describe('Citation Verification Performance Benchmarks', () => {
  let citationService: CitationAuthorityVerifierService;
  let benchmarkService: PerformanceBenchmarkService;
  let module: TestingModule;

  // Test data sets of varying complexity
  const testDataSets = {
    small: {
      name: 'Small Dataset',
      citations: [
        'Smith, J. (2023). "AI in Healthcare." Journal of Medical Technology, 15(3), 45-67.',
        'Johnson, M. (2022). "Machine Learning Applications." Tech Review, 8(2), 123-145.',
        'Brown, K. (2023). "Data Science Trends." Science Today, 12(4), 78-92.'
      ]
    },
    medium: {
      name: 'Medium Dataset',
      citations: Array.from({ length: 25 }, (_, i) => 
        `Author${i}, F. (${2020 + (i % 4)}). "Research Topic ${i}." Journal ${i % 5}, ${10 + i}(${1 + (i % 6)}), ${100 + i * 10}-${120 + i * 10}.`
      )
    },
    large: {
      name: 'Large Dataset',
      citations: Array.from({ length: 100 }, (_, i) => 
        `Researcher${i}, A. (${2018 + (i % 6)}). "Study on Topic ${i}." Academic Journal ${i % 10}, ${5 + i}(${1 + (i % 8)}), ${50 + i * 5}-${75 + i * 5}.`
      )
    },
    complex: {
      name: 'Complex Dataset',
      citations: [
        // Mix of different citation formats
        'Smith, J., Johnson, M., & Brown, K. (2023). "Complex AI Systems in Healthcare: A Comprehensive Review." Nature Medicine, 29(4), 567-589. DOI: 10.1038/s41591-023-02345-6',
        'García-López, M. A., et al. (2022). "Machine Learning for Predictive Analytics in Clinical Settings." The Lancet Digital Health, 4(8), e567-e578. https://doi.org/10.1016/S2589-7500(22)00123-4',
        'Chen, L., Wang, X., & Liu, Y. (2023). "Deep Learning Applications in Medical Imaging: Current State and Future Directions." IEEE Transactions on Medical Imaging, 42(7), 1234-1256.',
        'World Health Organization. (2023). "Global Health Observatory Data Repository." Retrieved from https://www.who.int/data/gho',
        'U.S. Department of Health and Human Services. (2022). "Health Information Technology for Economic and Clinical Health Act." Federal Register, 87(123), 45678-45723.'
      ]
    }
  };

  beforeAll(async () => {
    const mockConfigService = {
      get: jest.fn((key: string, defaultValue?: any) => {
        const config = {
          'CITATION_CACHE_ENABLED': 'false', // Disable cache for accurate benchmarks
          'MOZ_API_KEY': 'test-moz-key',
          'AHREFS_API_KEY': 'test-ahrefs-key',
          'CROSSREF_API_URL': 'https://api.crossref.org',
          'SEMANTIC_SCHOLAR_API_URL': 'https://api.semanticscholar.org'
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

    module = await Test.createTestingModule({
      providers: [
        CitationAuthorityVerifierService,
        PerformanceBenchmarkService,
        {
          provide: ConfigService,
          useValue: mockConfigService
        },
        {
          provide: ApplicationInsightsService,
          useValue: mockAppInsights
        }
      ],
    }).compile();

    citationService = module.get<CitationAuthorityVerifierService>(CitationAuthorityVerifierService);
    benchmarkService = module.get<PerformanceBenchmarkService>(PerformanceBenchmarkService);

    // Warm up the service
    await citationService.verifyCitations(['Test citation for warmup.'], 'test-content');
  });

  afterAll(async () => {
    await module.close();
  });

  describe('Citation Extraction Benchmarks', () => {
    it('should benchmark citation extraction performance', async () => {
      const suite = await benchmarkService.runBenchmarkSuite('CitationExtraction', [
        {
          name: 'extractCitations_small',
          operation: async () => {
            const content = `This is a test article with citations. ${testDataSets.small.citations.join(' ')} End of content.`;
            return await citationService.extractCitations(content);
          },
          iterations: 10,
          metadata: { datasetSize: 'small', citationCount: testDataSets.small.citations.length }
        },
        {
          name: 'extractCitations_medium',
          operation: async () => {
            const content = `Research article with multiple citations. ${testDataSets.medium.citations.join(' ')} Conclusion.`;
            return await citationService.extractCitations(content);
          },
          iterations: 5,
          metadata: { datasetSize: 'medium', citationCount: testDataSets.medium.citations.length }
        },
        {
          name: 'extractCitations_large',
          operation: async () => {
            const content = `Comprehensive review with extensive citations. ${testDataSets.large.citations.join(' ')} References complete.`;
            return await citationService.extractCitations(content);
          },
          iterations: 3,
          metadata: { datasetSize: 'large', citationCount: testDataSets.large.citations.length }
        }
      ]);

      // Verify performance expectations
      expect(suite.summary.successRate).toBeGreaterThan(90);
      expect(suite.summary.averageDuration).toBeLessThan(2000); // 2 seconds average
      expect(suite.summary.p95Duration).toBeLessThan(5000); // 5 seconds P95

      // Establish baseline if not exists
      const extractionMetrics = suite.metrics.filter(m => m.operation.includes('extractCitations'));
      await benchmarkService.establishBaseline('citation', 'extraction', extractionMetrics);

      console.log(`Citation Extraction Benchmark Results:`);
      console.log(`  Total Operations: ${suite.summary.totalOperations}`);
      console.log(`  Success Rate: ${suite.summary.successRate.toFixed(2)}%`);
      console.log(`  Average Duration: ${suite.summary.averageDuration.toFixed(2)}ms`);
      console.log(`  P95 Duration: ${suite.summary.p95Duration.toFixed(2)}ms`);
      console.log(`  Peak Memory: ${(suite.summary.peakMemoryUsed / 1024 / 1024).toFixed(2)}MB`);
    });
  });

  describe('Citation Verification Benchmarks', () => {
    it('should benchmark citation verification performance', async () => {
      const suite = await benchmarkService.runBenchmarkSuite('CitationVerification', [
        {
          name: 'verifyCitations_small',
          operation: async () => {
            return await citationService.verifyCitations(testDataSets.small.citations, 'test-content-small');
          },
          iterations: 5,
          metadata: { datasetSize: 'small', citationCount: testDataSets.small.citations.length }
        },
        {
          name: 'verifyCitations_medium',
          operation: async () => {
            return await citationService.verifyCitations(testDataSets.medium.citations, 'test-content-medium');
          },
          iterations: 3,
          metadata: { datasetSize: 'medium', citationCount: testDataSets.medium.citations.length }
        },
        {
          name: 'verifyCitations_complex',
          operation: async () => {
            return await citationService.verifyCitations(testDataSets.complex.citations, 'test-content-complex');
          },
          iterations: 3,
          metadata: { datasetSize: 'complex', citationCount: testDataSets.complex.citations.length }
        }
      ]);

      // Verify performance expectations
      expect(suite.summary.successRate).toBeGreaterThan(85);
      expect(suite.summary.averageDuration).toBeLessThan(10000); // 10 seconds average
      expect(suite.summary.p95Duration).toBeLessThan(30000); // 30 seconds P95

      // Compare against baseline
      const verificationMetrics = suite.metrics.filter(m => m.operation.includes('verifyCitations'));
      const comparison = await benchmarkService.compareAgainstBaseline('citation', 'verification', verificationMetrics);

      if (comparison.baseline) {
        console.log(`Citation Verification Baseline Comparison:`);
        console.log(`  Duration Status: ${comparison.comparison.durationStatus}`);
        console.log(`  Memory Status: ${comparison.comparison.memoryStatus}`);
        console.log(`  Success Rate Status: ${comparison.comparison.successRateStatus}`);
        
        if (comparison.comparison.recommendations.length > 0) {
          console.log(`  Recommendations:`);
          comparison.comparison.recommendations.forEach(rec => console.log(`    - ${rec}`));
        }
      }

      console.log(`Citation Verification Benchmark Results:`);
      console.log(`  Total Operations: ${suite.summary.totalOperations}`);
      console.log(`  Success Rate: ${suite.summary.successRate.toFixed(2)}%`);
      console.log(`  Average Duration: ${suite.summary.averageDuration.toFixed(2)}ms`);
      console.log(`  P95 Duration: ${suite.summary.p95Duration.toFixed(2)}ms`);
      console.log(`  Peak Memory: ${(suite.summary.peakMemoryUsed / 1024 / 1024).toFixed(2)}MB`);
    });
  });

  describe('Authority Scoring Benchmarks', () => {
    it('should benchmark authority scoring performance', async () => {
      const testUrls = [
        'https://www.nature.com/articles/s41591-023-02345-6',
        'https://www.thelancet.com/journals/landig/article/PIIS2589-7500(22)00123-4',
        'https://ieeexplore.ieee.org/document/9876543',
        'https://www.who.int/data/gho',
        'https://pubmed.ncbi.nlm.nih.gov/12345678'
      ];

      const suite = await benchmarkService.runBenchmarkSuite('AuthorityScoring', [
        {
          name: 'calculateAuthorityScore_single',
          operation: async () => {
            return await citationService.calculateAuthorityScore(testUrls[0]);
          },
          iterations: 10,
          metadata: { urlType: 'academic_journal' }
        },
        {
          name: 'calculateAuthorityScore_batch',
          operation: async () => {
            const promises = testUrls.map(url => citationService.calculateAuthorityScore(url));
            return await Promise.all(promises);
          },
          iterations: 5,
          metadata: { urlCount: testUrls.length, operationType: 'batch' }
        }
      ]);

      // Verify performance expectations
      expect(suite.summary.successRate).toBeGreaterThan(80);
      expect(suite.summary.averageDuration).toBeLessThan(5000); // 5 seconds average

      console.log(`Authority Scoring Benchmark Results:`);
      console.log(`  Total Operations: ${suite.summary.totalOperations}`);
      console.log(`  Success Rate: ${suite.summary.successRate.toFixed(2)}%`);
      console.log(`  Average Duration: ${suite.summary.averageDuration.toFixed(2)}ms`);
      console.log(`  P95 Duration: ${suite.summary.p95Duration.toFixed(2)}ms`);
    });
  });

  describe('End-to-End Citation Pipeline Benchmarks', () => {
    it('should benchmark complete citation processing pipeline', async () => {
      const testContent = `
        Artificial Intelligence in Healthcare: A Comprehensive Review
        
        The integration of artificial intelligence (AI) in healthcare has shown remarkable progress in recent years. 
        According to Smith et al. (2023), AI applications in medical diagnosis have achieved accuracy rates exceeding 95% 
        in certain domains (Smith, J., Johnson, M., & Brown, K. (2023). "AI in Medical Diagnosis." Nature Medicine, 29(4), 567-589).
        
        Furthermore, machine learning algorithms have demonstrated significant potential in drug discovery processes. 
        The work by García-López et al. (2022) highlights the effectiveness of deep learning models in identifying 
        potential drug compounds (García-López, M. A., et al. (2022). "ML in Drug Discovery." Science, 376(6594), 789-801).
        
        Recent studies have also explored the ethical implications of AI in healthcare. The World Health Organization (2023) 
        has published comprehensive guidelines addressing these concerns (World Health Organization. (2023). "AI Ethics in Healthcare." 
        WHO Technical Report Series, No. 1001).
      `;

      const suite = await benchmarkService.runBenchmarkSuite('CitationPipelineE2E', [
        {
          name: 'fullCitationPipeline',
          operation: async () => {
            // Extract citations
            const extractedCitations = await citationService.extractCitations(testContent);
            
            // Verify citations
            const verificationResult = await citationService.verifyCitations(extractedCitations, testContent);
            
            return {
              extractedCount: extractedCitations.length,
              verificationResult
            };
          },
          iterations: 3,
          metadata: { 
            contentLength: testContent.length,
            operationType: 'end_to_end_pipeline'
          }
        }
      ]);

      // Verify end-to-end performance
      expect(suite.summary.successRate).toBeGreaterThan(85);
      expect(suite.summary.averageDuration).toBeLessThan(15000); // 15 seconds for full pipeline

      // Establish baseline for end-to-end pipeline
      await benchmarkService.establishBaseline('citation', 'pipeline_e2e', suite.metrics);

      console.log(`End-to-End Citation Pipeline Benchmark Results:`);
      console.log(`  Total Operations: ${suite.summary.totalOperations}`);
      console.log(`  Success Rate: ${suite.summary.successRate.toFixed(2)}%`);
      console.log(`  Average Duration: ${suite.summary.averageDuration.toFixed(2)}ms`);
      console.log(`  P95 Duration: ${suite.summary.p95Duration.toFixed(2)}ms`);
      console.log(`  Peak Memory: ${(suite.summary.peakMemoryUsed / 1024 / 1024).toFixed(2)}MB`);
    });
  });

  describe('Stress Testing', () => {
    it('should handle high concurrency citation verification', async () => {
      const concurrentRequests = 10;
      const citationsPerRequest = 5;

      const suite = await benchmarkService.runBenchmarkSuite('CitationStressTest', [
        {
          name: 'concurrentVerification',
          operation: async () => {
            const promises = Array.from({ length: concurrentRequests }, (_, i) => 
              citationService.verifyCitations(
                testDataSets.small.citations.slice(0, citationsPerRequest),
                `stress-test-content-${i}`
              )
            );
            
            return await Promise.all(promises);
          },
          iterations: 2,
          metadata: { 
            concurrentRequests,
            citationsPerRequest,
            totalCitations: concurrentRequests * citationsPerRequest
          }
        }
      ]);

      // Verify stress test performance
      expect(suite.summary.successRate).toBeGreaterThan(80);
      expect(suite.summary.averageDuration).toBeLessThan(30000); // 30 seconds under stress

      console.log(`Citation Stress Test Results:`);
      console.log(`  Concurrent Requests: ${concurrentRequests}`);
      console.log(`  Citations per Request: ${citationsPerRequest}`);
      console.log(`  Success Rate: ${suite.summary.successRate.toFixed(2)}%`);
      console.log(`  Average Duration: ${suite.summary.averageDuration.toFixed(2)}ms`);
      console.log(`  Peak Memory: ${(suite.summary.peakMemoryUsed / 1024 / 1024).toFixed(2)}MB`);
    });
  });

  describe('Memory Efficiency Tests', () => {
    it('should maintain memory efficiency with large datasets', async () => {
      const initialMemory = process.memoryUsage();

      const suite = await benchmarkService.runBenchmarkSuite('CitationMemoryEfficiency', [
        {
          name: 'largeDatasetProcessing',
          operation: async () => {
            // Process large dataset multiple times to test memory management
            for (let i = 0; i < 5; i++) {
              await citationService.verifyCitations(testDataSets.large.citations, `memory-test-${i}`);
              
              // Force garbage collection if available
              if (global.gc) {
                global.gc();
              }
            }
          },
          iterations: 2,
          metadata: { 
            datasetSize: 'large',
            iterations: 5,
            citationCount: testDataSets.large.citations.length
          }
        }
      ]);

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      // Verify memory efficiency
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // Less than 100MB increase
      expect(suite.summary.successRate).toBeGreaterThan(90);

      console.log(`Memory Efficiency Test Results:`);
      console.log(`  Initial Memory: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
      console.log(`  Final Memory: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
      console.log(`  Memory Increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
      console.log(`  Peak Memory During Test: ${(suite.summary.peakMemoryUsed / 1024 / 1024).toFixed(2)}MB`);
    });
  });

  afterAll(() => {
    // Generate final performance report
    const report = benchmarkService.generatePerformanceReport();
    
    console.log('\n=== CITATION VERIFICATION PERFORMANCE REPORT ===');
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
