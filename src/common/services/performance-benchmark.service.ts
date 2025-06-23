import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApplicationInsightsService } from './application-insights.service';

export interface BenchmarkMetrics {
  operation: string;
  startTime: number;
  endTime: number;
  duration: number;
  memoryUsage: {
    before: NodeJS.MemoryUsage;
    after: NodeJS.MemoryUsage;
    peak: NodeJS.MemoryUsage;
  };
  cpuUsage: {
    before: NodeJS.CpuUsage;
    after: NodeJS.CpuUsage;
  };
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export interface BenchmarkSuite {
  name: string;
  description: string;
  metrics: BenchmarkMetrics[];
  summary: {
    totalOperations: number;
    successfulOperations: number;
    failedOperations: number;
    averageDuration: number;
    medianDuration: number;
    p95Duration: number;
    p99Duration: number;
    totalMemoryUsed: number;
    averageMemoryUsed: number;
    peakMemoryUsed: number;
    successRate: number;
  };
  timestamp: string;
}

export interface PerformanceBaseline {
  component: string;
  operation: string;
  expectedDuration: number;
  maxDuration: number;
  expectedMemoryUsage: number;
  maxMemoryUsage: number;
  expectedSuccessRate: number;
  minSuccessRate: number;
  sampleSize: number;
  confidence: number;
  lastUpdated: string;
}

@Injectable()
export class PerformanceBenchmarkService {
  private readonly logger = new Logger(PerformanceBenchmarkService.name);
  private readonly benchmarkResults = new Map<string, BenchmarkSuite>();
  private readonly performanceBaselines = new Map<string, PerformanceBaseline>();
  private readonly activeBenchmarks = new Map<string, {
    startTime: number;
    startMemory: NodeJS.MemoryUsage;
    startCpu: NodeJS.CpuUsage;
    peakMemory: NodeJS.MemoryUsage;
    operation: string;
    metadata?: Record<string, any>;
  }>();

  constructor(
    private readonly configService: ConfigService,
    private readonly appInsights: ApplicationInsightsService
  ) {
    this.initializeBaselines();
    this.startMemoryMonitoring();
  }

  /**
   * Start benchmarking an operation
   */
  startBenchmark(operation: string, metadata?: Record<string, any>): string {
    const benchmarkId = `${operation}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    
    // Force garbage collection if available (for more accurate memory measurements)
    if (global.gc) {
      global.gc();
    }

    const startTime = performance.now();
    const startMemory = process.memoryUsage();
    const startCpu = process.cpuUsage();

    this.activeBenchmarks.set(benchmarkId, {
      startTime,
      startMemory,
      startCpu,
      peakMemory: startMemory,
      operation,
      metadata
    });

    this.logger.debug(`Started benchmark: ${operation} (${benchmarkId})`);
    return benchmarkId;
  }

  /**
   * End benchmarking an operation
   */
  endBenchmark(benchmarkId: string, success: boolean = true, errorMessage?: string): BenchmarkMetrics | null {
    const benchmark = this.activeBenchmarks.get(benchmarkId);
    if (!benchmark) {
      this.logger.warn(`Benchmark not found: ${benchmarkId}`);
      return null;
    }

    const endTime = performance.now();
    const endMemory = process.memoryUsage();
    const endCpu = process.cpuUsage(benchmark.startCpu);
    const duration = endTime - benchmark.startTime;

    const metrics: BenchmarkMetrics = {
      operation: benchmark.operation,
      startTime: benchmark.startTime,
      endTime,
      duration,
      memoryUsage: {
        before: benchmark.startMemory,
        after: endMemory,
        peak: benchmark.peakMemory
      },
      cpuUsage: {
        before: benchmark.startCpu,
        after: endCpu
      },
      success,
      errorMessage,
      metadata: benchmark.metadata
    };

    // Clean up
    this.activeBenchmarks.delete(benchmarkId);

    // Track in Application Insights
    this.appInsights.trackMetric(`Performance.${benchmark.operation}.Duration`, duration, {
      success: success.toString(),
      benchmarkId
    });

    this.appInsights.trackMetric(`Performance.${benchmark.operation}.MemoryUsage`, 
      endMemory.heapUsed - benchmark.startMemory.heapUsed, {
      success: success.toString(),
      benchmarkId
    });

    this.logger.debug(`Completed benchmark: ${benchmark.operation} (${duration.toFixed(2)}ms)`);
    return metrics;
  }

  /**
   * Run a benchmark suite for a specific component
   */
  async runBenchmarkSuite(
    suiteName: string, 
    operations: Array<{
      name: string;
      operation: () => Promise<any>;
      iterations?: number;
      metadata?: Record<string, any>;
    }>
  ): Promise<BenchmarkSuite> {
    this.logger.log(`Starting benchmark suite: ${suiteName}`);
    
    const metrics: BenchmarkMetrics[] = [];
    
    for (const op of operations) {
      const iterations = op.iterations || 1;
      
      for (let i = 0; i < iterations; i++) {
        const benchmarkId = this.startBenchmark(op.name, {
          ...op.metadata,
          iteration: i + 1,
          totalIterations: iterations
        });

        try {
          await op.operation();
          const metric = this.endBenchmark(benchmarkId, true);
          if (metric) metrics.push(metric);
        } catch (error) {
          const metric = this.endBenchmark(benchmarkId, false, error.message);
          if (metric) metrics.push(metric);
          this.logger.error(`Benchmark operation failed: ${op.name}`, error.stack);
        }

        // Small delay between iterations to allow system to stabilize
        if (i < iterations - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    }

    const suite: BenchmarkSuite = {
      name: suiteName,
      description: `Performance benchmark suite for ${suiteName}`,
      metrics,
      summary: this.calculateSummary(metrics),
      timestamp: new Date().toISOString()
    };

    this.benchmarkResults.set(suiteName, suite);
    
    // Track suite completion
    this.appInsights.trackEvent('PerformanceBenchmark:SuiteCompleted', {
      suiteName,
      totalOperations: suite.summary.totalOperations.toString(),
      successRate: suite.summary.successRate.toString(),
      averageDuration: suite.summary.averageDuration.toString()
    });

    this.logger.log(`Completed benchmark suite: ${suiteName} (${suite.summary.totalOperations} operations)`);
    return suite;
  }

  /**
   * Compare current performance against baseline
   */
  async compareAgainstBaseline(component: string, operation: string, metrics: BenchmarkMetrics[]): Promise<{
    baseline: PerformanceBaseline | null;
    comparison: {
      durationStatus: 'better' | 'worse' | 'within_range' | 'no_baseline';
      memoryStatus: 'better' | 'worse' | 'within_range' | 'no_baseline';
      successRateStatus: 'better' | 'worse' | 'within_range' | 'no_baseline';
      recommendations: string[];
    };
  }> {
    const baselineKey = `${component}.${operation}`;
    const baseline = this.performanceBaselines.get(baselineKey);

    if (!baseline) {
      return {
        baseline: null,
        comparison: {
          durationStatus: 'no_baseline',
          memoryStatus: 'no_baseline',
          successRateStatus: 'no_baseline',
          recommendations: ['Establish baseline metrics for this operation']
        }
      };
    }

    const summary = this.calculateSummary(metrics);
    const recommendations: string[] = [];

    // Compare duration
    let durationStatus: 'better' | 'worse' | 'within_range' = 'within_range';
    if (summary.averageDuration > baseline.maxDuration) {
      durationStatus = 'worse';
      recommendations.push(`Performance degradation detected: ${summary.averageDuration.toFixed(2)}ms vs baseline ${baseline.expectedDuration.toFixed(2)}ms`);
    } else if (summary.averageDuration < baseline.expectedDuration * 0.8) {
      durationStatus = 'better';
      recommendations.push(`Performance improvement detected: ${summary.averageDuration.toFixed(2)}ms vs baseline ${baseline.expectedDuration.toFixed(2)}ms`);
    }

    // Compare memory usage
    let memoryStatus: 'better' | 'worse' | 'within_range' = 'within_range';
    if (summary.averageMemoryUsed > baseline.maxMemoryUsage) {
      memoryStatus = 'worse';
      recommendations.push(`Memory usage increased: ${(summary.averageMemoryUsed / 1024 / 1024).toFixed(2)}MB vs baseline ${(baseline.expectedMemoryUsage / 1024 / 1024).toFixed(2)}MB`);
    } else if (summary.averageMemoryUsed < baseline.expectedMemoryUsage * 0.8) {
      memoryStatus = 'better';
      recommendations.push(`Memory usage improved: ${(summary.averageMemoryUsed / 1024 / 1024).toFixed(2)}MB vs baseline ${(baseline.expectedMemoryUsage / 1024 / 1024).toFixed(2)}MB`);
    }

    // Compare success rate
    let successRateStatus: 'better' | 'worse' | 'within_range' = 'within_range';
    if (summary.successRate < baseline.minSuccessRate) {
      successRateStatus = 'worse';
      recommendations.push(`Success rate below threshold: ${summary.successRate.toFixed(2)}% vs baseline ${baseline.expectedSuccessRate.toFixed(2)}%`);
    } else if (summary.successRate > baseline.expectedSuccessRate * 1.05) {
      successRateStatus = 'better';
      recommendations.push(`Success rate improved: ${summary.successRate.toFixed(2)}% vs baseline ${baseline.expectedSuccessRate.toFixed(2)}%`);
    }

    return {
      baseline,
      comparison: {
        durationStatus,
        memoryStatus,
        successRateStatus,
        recommendations
      }
    };
  }

  /**
   * Establish or update performance baseline
   */
  async establishBaseline(
    component: string, 
    operation: string, 
    metrics: BenchmarkMetrics[],
    confidence: number = 95
  ): Promise<PerformanceBaseline> {
    const summary = this.calculateSummary(metrics);
    const baselineKey = `${component}.${operation}`;

    // Calculate confidence intervals
    const durationMargin = this.calculateConfidenceMargin(metrics.map(m => m.duration), confidence);
    const memoryMargin = this.calculateConfidenceMargin(
      metrics.map(m => m.memoryUsage.after.heapUsed - m.memoryUsage.before.heapUsed), 
      confidence
    );

    const baseline: PerformanceBaseline = {
      component,
      operation,
      expectedDuration: summary.averageDuration,
      maxDuration: summary.averageDuration + durationMargin,
      expectedMemoryUsage: summary.averageMemoryUsed,
      maxMemoryUsage: summary.averageMemoryUsed + memoryMargin,
      expectedSuccessRate: summary.successRate,
      minSuccessRate: Math.max(0, summary.successRate - 5), // 5% tolerance
      sampleSize: metrics.length,
      confidence,
      lastUpdated: new Date().toISOString()
    };

    this.performanceBaselines.set(baselineKey, baseline);

    // Track baseline establishment
    this.appInsights.trackEvent('PerformanceBenchmark:BaselineEstablished', {
      component,
      operation,
      expectedDuration: baseline.expectedDuration.toString(),
      expectedMemoryUsage: baseline.expectedMemoryUsage.toString(),
      expectedSuccessRate: baseline.expectedSuccessRate.toString(),
      sampleSize: baseline.sampleSize.toString()
    });

    this.logger.log(`Established baseline for ${component}.${operation}: ${baseline.expectedDuration.toFixed(2)}ms, ${(baseline.expectedMemoryUsage / 1024 / 1024).toFixed(2)}MB`);
    return baseline;
  }

  /**
   * Get benchmark results
   */
  getBenchmarkResults(suiteName?: string): BenchmarkSuite[] {
    if (suiteName) {
      const suite = this.benchmarkResults.get(suiteName);
      return suite ? [suite] : [];
    }
    return Array.from(this.benchmarkResults.values());
  }

  /**
   * Get performance baselines
   */
  getPerformanceBaselines(component?: string): PerformanceBaseline[] {
    const baselines = Array.from(this.performanceBaselines.values());
    return component ? baselines.filter(b => b.component === component) : baselines;
  }

  /**
   * Generate performance report
   */
  generatePerformanceReport(): {
    summary: {
      totalSuites: number;
      totalOperations: number;
      averageSuccessRate: number;
      totalBaselines: number;
    };
    suites: BenchmarkSuite[];
    baselines: PerformanceBaseline[];
    recommendations: string[];
  } {
    const suites = this.getBenchmarkResults();
    const baselines = this.getPerformanceBaselines();
    
    const totalOperations = suites.reduce((sum, suite) => sum + suite.summary.totalOperations, 0);
    const averageSuccessRate = suites.length > 0 
      ? suites.reduce((sum, suite) => sum + suite.summary.successRate, 0) / suites.length 
      : 0;

    const recommendations: string[] = [];
    
    // Analyze performance trends
    suites.forEach(suite => {
      if (suite.summary.successRate < 95) {
        recommendations.push(`${suite.name}: Success rate below 95% (${suite.summary.successRate.toFixed(2)}%)`);
      }
      if (suite.summary.p95Duration > 5000) {
        recommendations.push(`${suite.name}: P95 response time above 5s (${suite.summary.p95Duration.toFixed(2)}ms)`);
      }
    });

    return {
      summary: {
        totalSuites: suites.length,
        totalOperations,
        averageSuccessRate,
        totalBaselines: baselines.length
      },
      suites,
      baselines,
      recommendations
    };
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummary(metrics: BenchmarkMetrics[]): BenchmarkSuite['summary'] {
    if (metrics.length === 0) {
      return {
        totalOperations: 0,
        successfulOperations: 0,
        failedOperations: 0,
        averageDuration: 0,
        medianDuration: 0,
        p95Duration: 0,
        p99Duration: 0,
        totalMemoryUsed: 0,
        averageMemoryUsed: 0,
        peakMemoryUsed: 0,
        successRate: 0
      };
    }

    const successfulOperations = metrics.filter(m => m.success).length;
    const failedOperations = metrics.length - successfulOperations;
    
    const durations = metrics.map(m => m.duration).sort((a, b) => a - b);
    const memoryUsages = metrics.map(m => m.memoryUsage.after.heapUsed - m.memoryUsage.before.heapUsed);
    const peakMemoryUsages = metrics.map(m => m.memoryUsage.peak.heapUsed);

    return {
      totalOperations: metrics.length,
      successfulOperations,
      failedOperations,
      averageDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      medianDuration: this.calculatePercentile(durations, 50),
      p95Duration: this.calculatePercentile(durations, 95),
      p99Duration: this.calculatePercentile(durations, 99),
      totalMemoryUsed: memoryUsages.reduce((sum, m) => sum + m, 0),
      averageMemoryUsed: memoryUsages.reduce((sum, m) => sum + m, 0) / memoryUsages.length,
      peakMemoryUsed: Math.max(...peakMemoryUsages),
      successRate: (successfulOperations / metrics.length) * 100
    };
  }

  /**
   * Calculate percentile
   */
  private calculatePercentile(sortedArray: number[], percentile: number): number {
    if (sortedArray.length === 0) return 0;
    
    const index = (percentile / 100) * (sortedArray.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    
    if (lower === upper) {
      return sortedArray[lower];
    }
    
    const weight = index - lower;
    return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
  }

  /**
   * Calculate confidence margin
   */
  private calculateConfidenceMargin(values: number[], confidence: number): number {
    if (values.length < 2) return 0;
    
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (values.length - 1);
    const standardError = Math.sqrt(variance / values.length);
    
    // Simplified confidence interval calculation (assumes normal distribution)
    const zScore = confidence === 95 ? 1.96 : confidence === 99 ? 2.576 : 1.645;
    return zScore * standardError;
  }

  /**
   * Initialize default baselines
   */
  private initializeBaselines(): void {
    // Citation verification baselines
    this.performanceBaselines.set('citation.extraction', {
      component: 'citation',
      operation: 'extraction',
      expectedDuration: 500,
      maxDuration: 1000,
      expectedMemoryUsage: 50 * 1024 * 1024, // 50MB
      maxMemoryUsage: 100 * 1024 * 1024, // 100MB
      expectedSuccessRate: 95,
      minSuccessRate: 90,
      sampleSize: 100,
      confidence: 95,
      lastUpdated: new Date().toISOString()
    });

    this.performanceBaselines.set('citation.verification', {
      component: 'citation',
      operation: 'verification',
      expectedDuration: 2000,
      maxDuration: 5000,
      expectedMemoryUsage: 25 * 1024 * 1024, // 25MB
      maxMemoryUsage: 50 * 1024 * 1024, // 50MB
      expectedSuccessRate: 90,
      minSuccessRate: 85,
      sampleSize: 100,
      confidence: 95,
      lastUpdated: new Date().toISOString()
    });

    // Content generation baselines
    this.performanceBaselines.set('content.generation', {
      component: 'content',
      operation: 'generation',
      expectedDuration: 30000,
      maxDuration: 60000,
      expectedMemoryUsage: 200 * 1024 * 1024, // 200MB
      maxMemoryUsage: 500 * 1024 * 1024, // 500MB
      expectedSuccessRate: 98,
      minSuccessRate: 95,
      sampleSize: 50,
      confidence: 95,
      lastUpdated: new Date().toISOString()
    });

    this.logger.log('Initialized default performance baselines');
  }

  /**
   * Start memory monitoring for active benchmarks
   */
  private startMemoryMonitoring(): void {
    setInterval(() => {
      const currentMemory = process.memoryUsage();
      
      // Update peak memory for active benchmarks
      for (const [id, benchmark] of this.activeBenchmarks.entries()) {
        if (currentMemory.heapUsed > benchmark.peakMemory.heapUsed) {
          benchmark.peakMemory = currentMemory;
        }
      }
    }, 100); // Check every 100ms
  }
}
