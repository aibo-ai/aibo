import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApplicationInsightsService } from '../../../common/services/application-insights.service';
import { 
  CitationVerificationResult, 
  CitationAnalysisMetrics,
  ExtractedCitation 
} from './interfaces/citation-verification.interfaces';

@Injectable()
export class CitationMonitoringService {
  private readonly logger = new Logger(CitationMonitoringService.name);
  private readonly metricsBuffer: Map<string, any> = new Map();
  private readonly alertThresholds: any;

  constructor(
    private readonly configService: ConfigService,
    private readonly appInsights: ApplicationInsightsService
  ) {
    this.alertThresholds = {
      lowVerificationRate: parseFloat(this.configService.get('CITATION_ALERT_LOW_VERIFICATION_RATE', '0.5')),
      highErrorRate: parseFloat(this.configService.get('CITATION_ALERT_HIGH_ERROR_RATE', '0.1')),
      slowResponseTime: parseInt(this.configService.get('CITATION_ALERT_SLOW_RESPONSE_MS', '10000')),
      lowCacheHitRate: parseFloat(this.configService.get('CITATION_ALERT_LOW_CACHE_HIT_RATE', '0.3'))
    };

    // Flush metrics every 5 minutes
    setInterval(() => this.flushMetrics(), 5 * 60 * 1000);
  }

  /**
   * Track citation verification session metrics
   */
  trackVerificationSession(sessionId: string, metrics: {
    segment: string;
    contentLength: number;
    citationsFound: number;
    verificationTime: number;
    successfulVerifications: number;
    failedVerifications: number;
    cacheHits: number;
    apiCalls: number;
    overallScore: number;
  }): void {
    this.logger.debug(`Tracking verification session: ${sessionId}`);

    // Track individual metrics
    this.appInsights.trackMetric('CitationVerification:SessionDuration', metrics.verificationTime, {
      sessionId,
      segment: metrics.segment,
      citationsFound: metrics.citationsFound.toString()
    });

    this.appInsights.trackMetric('CitationVerification:CitationsFound', metrics.citationsFound, {
      sessionId,
      segment: metrics.segment,
      contentLength: metrics.contentLength.toString()
    });

    this.appInsights.trackMetric('CitationVerification:SuccessRate', 
      metrics.successfulVerifications / (metrics.successfulVerifications + metrics.failedVerifications), {
      sessionId,
      segment: metrics.segment
    });

    this.appInsights.trackMetric('CitationVerification:CacheHitRate', 
      metrics.cacheHits / (metrics.cacheHits + metrics.apiCalls), {
      sessionId,
      segment: metrics.segment
    });

    this.appInsights.trackMetric('CitationVerification:OverallScore', metrics.overallScore, {
      sessionId,
      segment: metrics.segment
    });

    // Store for aggregation
    this.metricsBuffer.set(sessionId, {
      timestamp: new Date().toISOString(),
      ...metrics
    });

    // Check for alerts
    this.checkAlerts(metrics);
  }

  /**
   * Track external API performance
   */
  trackApiCall(apiName: string, metrics: {
    duration: number;
    success: boolean;
    statusCode?: number;
    errorType?: string;
    cacheHit?: boolean;
  }): void {
    this.appInsights.trackMetric(`ExternalApi:${apiName}:Duration`, metrics.duration, {
      success: metrics.success.toString(),
      statusCode: metrics.statusCode?.toString(),
      cacheHit: metrics.cacheHit?.toString()
    });

    this.appInsights.trackMetric(`ExternalApi:${apiName}:SuccessRate`, metrics.success ? 1 : 0, {
      errorType: metrics.errorType
    });

    if (!metrics.success) {
      this.appInsights.trackEvent(`ExternalApi:${apiName}:Error`, {
        duration: metrics.duration.toString(),
        statusCode: metrics.statusCode?.toString(),
        errorType: metrics.errorType || 'unknown'
      });
    }

    // Alert on slow API responses
    if (metrics.duration > this.alertThresholds.slowResponseTime) {
      this.sendAlert('SlowApiResponse', {
        apiName,
        duration: metrics.duration,
        threshold: this.alertThresholds.slowResponseTime
      });
    }
  }

  /**
   * Track citation quality trends
   */
  trackCitationQuality(citations: CitationVerificationResult[], segment: string): void {
    const qualityMetrics = this.calculateQualityMetrics(citations);

    this.appInsights.trackMetric('CitationQuality:AverageAuthorityScore', qualityMetrics.averageAuthorityScore, {
      segment,
      citationCount: citations.length.toString()
    });

    this.appInsights.trackMetric('CitationQuality:HighAuthorityPercentage', qualityMetrics.highAuthorityPercentage, {
      segment
    });

    this.appInsights.trackMetric('CitationQuality:AverageRecencyScore', qualityMetrics.averageRecencyScore, {
      segment
    });

    this.appInsights.trackMetric('CitationQuality:SourceDiversity', qualityMetrics.sourceDiversity, {
      segment
    });

    // Track citation type distribution
    Object.entries(qualityMetrics.typeDistribution).forEach(([type, count]) => {
      this.appInsights.trackMetric(`CitationQuality:TypeDistribution:${type}`, Number(count), {
        segment
      });
    });
  }

  /**
   * Track cache performance
   */
  trackCachePerformance(metrics: {
    totalRequests: number;
    cacheHits: number;
    cacheMisses: number;
    cacheSize: number;
    evictions: number;
  }): void {
    const hitRate = metrics.cacheHits / metrics.totalRequests;

    this.appInsights.trackMetric('CitationCache:HitRate', hitRate);
    this.appInsights.trackMetric('CitationCache:Size', metrics.cacheSize);
    this.appInsights.trackMetric('CitationCache:Evictions', metrics.evictions);

    if (hitRate < this.alertThresholds.lowCacheHitRate) {
      this.sendAlert('LowCacheHitRate', {
        hitRate,
        threshold: this.alertThresholds.lowCacheHitRate,
        cacheSize: metrics.cacheSize
      });
    }
  }

  /**
   * Generate comprehensive analytics report
   */
  generateAnalyticsReport(timeRange: { start: Date; end: Date }): CitationAnalysisMetrics {
    const sessions = Array.from(this.metricsBuffer.values())
      .filter(session => {
        const sessionTime = new Date(session.timestamp);
        return sessionTime >= timeRange.start && sessionTime <= timeRange.end;
      });

    if (sessions.length === 0) {
      return this.getEmptyMetrics();
    }

    const totalCitations = sessions.reduce((sum, s) => sum + s.citationsFound, 0);
    const totalSuccessful = sessions.reduce((sum, s) => sum + s.successfulVerifications, 0);
    const totalFailed = sessions.reduce((sum, s) => sum + s.failedVerifications, 0);

    return {
      totalCitations,
      verifiedCitations: totalSuccessful,
      highAuthorityCitations: 0, // Would need to calculate from detailed data
      moderateAuthorityCitations: 0,
      lowAuthorityCitations: 0,
      unverifiedCitations: totalFailed,
      averageAuthorityScore: sessions.reduce((sum, s) => sum + s.overallScore, 0) / sessions.length,
      averageRecencyScore: 0, // Would need detailed citation data
      citationDensity: 0, // Would need content length data
      sourceTypeDistribution: {},
      issuesFound: [],
      improvementSuggestions: this.generateImprovementSuggestions(sessions)
    };
  }

  /**
   * Get real-time health status
   */
  getHealthStatus(): any {
    const recentSessions = Array.from(this.metricsBuffer.values())
      .filter(session => {
        const sessionTime = new Date(session.timestamp);
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        return sessionTime >= fiveMinutesAgo;
      });

    const totalVerifications = recentSessions.reduce((sum, s) => 
      sum + s.successfulVerifications + s.failedVerifications, 0);
    const successfulVerifications = recentSessions.reduce((sum, s) => 
      sum + s.successfulVerifications, 0);

    const successRate = totalVerifications > 0 ? successfulVerifications / totalVerifications : 1;
    const averageResponseTime = recentSessions.length > 0 
      ? recentSessions.reduce((sum, s) => sum + s.verificationTime, 0) / recentSessions.length 
      : 0;

    return {
      status: this.determineHealthStatus(successRate, averageResponseTime),
      metrics: {
        successRate,
        averageResponseTime,
        activeVerifications: recentSessions.length,
        totalVerifications
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Calculate quality metrics from citation results
   */
  private calculateQualityMetrics(citations: CitationVerificationResult[]): any {
    if (citations.length === 0) {
      return {
        averageAuthorityScore: 0,
        highAuthorityPercentage: 0,
        averageRecencyScore: 0,
        sourceDiversity: 0,
        typeDistribution: {}
      };
    }

    const authorityScores = citations.map(c => c.verification.authorityScore || 0);
    const recencyScores = citations.map(c => c.verification.recency || 0);
    const highAuthority = citations.filter(c => c.verificationStatus === 'high_authority').length;
    
    const sources = new Set(citations.map(c => c.citation.source).filter(Boolean));
    const types = citations.reduce((acc, c) => {
      acc[c.citation.type] = (acc[c.citation.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      averageAuthorityScore: authorityScores.reduce((sum, score) => sum + score, 0) / authorityScores.length,
      highAuthorityPercentage: highAuthority / citations.length,
      averageRecencyScore: recencyScores.reduce((sum, score) => sum + score, 0) / recencyScores.length,
      sourceDiversity: sources.size,
      typeDistribution: types
    };
  }

  /**
   * Check for alert conditions
   */
  private checkAlerts(metrics: any): void {
    const verificationRate = metrics.successfulVerifications / 
      (metrics.successfulVerifications + metrics.failedVerifications);

    if (verificationRate < this.alertThresholds.lowVerificationRate) {
      this.sendAlert('LowVerificationRate', {
        rate: verificationRate,
        threshold: this.alertThresholds.lowVerificationRate,
        sessionMetrics: metrics
      });
    }

    if (metrics.verificationTime > this.alertThresholds.slowResponseTime) {
      this.sendAlert('SlowVerificationResponse', {
        duration: metrics.verificationTime,
        threshold: this.alertThresholds.slowResponseTime
      });
    }
  }

  /**
   * Send alert to monitoring system
   */
  private sendAlert(alertType: string, details: any): void {
    this.logger.warn(`Citation verification alert: ${alertType}`, details);
    
    this.appInsights.trackEvent(`CitationVerification:Alert:${alertType}`, {
      ...details,
      timestamp: new Date().toISOString()
    });

    // In production, you might also send to external alerting systems
    // like PagerDuty, Slack, or email notifications
  }

  /**
   * Flush accumulated metrics
   */
  private flushMetrics(): void {
    const bufferSize = this.metricsBuffer.size;
    
    if (bufferSize > 1000) {
      // Keep only recent entries to prevent memory issues
      const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours
      
      for (const [sessionId, session] of this.metricsBuffer.entries()) {
        if (new Date(session.timestamp) < cutoffTime) {
          this.metricsBuffer.delete(sessionId);
        }
      }

      this.logger.log(`Flushed old metrics: ${bufferSize} -> ${this.metricsBuffer.size} entries`);
    }
  }

  /**
   * Determine overall health status
   */
  private determineHealthStatus(successRate: number, averageResponseTime: number): string {
    if (successRate < 0.8 || averageResponseTime > this.alertThresholds.slowResponseTime) {
      return 'unhealthy';
    } else if (successRate < 0.95 || averageResponseTime > this.alertThresholds.slowResponseTime * 0.7) {
      return 'degraded';
    } else {
      return 'healthy';
    }
  }

  /**
   * Generate improvement suggestions based on metrics
   */
  private generateImprovementSuggestions(sessions: any[]): string[] {
    const suggestions: string[] = [];

    const avgCacheHitRate = sessions.reduce((sum, s) => 
      sum + (s.cacheHits / (s.cacheHits + s.apiCalls)), 0) / sessions.length;

    if (avgCacheHitRate < 0.5) {
      suggestions.push('Consider increasing cache TTL to improve cache hit rates');
    }

    const avgVerificationTime = sessions.reduce((sum, s) => sum + s.verificationTime, 0) / sessions.length;
    if (avgVerificationTime > 5000) {
      suggestions.push('Optimize external API calls or implement request batching');
    }

    return suggestions;
  }

  /**
   * Get empty metrics structure
   */
  private getEmptyMetrics(): CitationAnalysisMetrics {
    return {
      totalCitations: 0,
      verifiedCitations: 0,
      highAuthorityCitations: 0,
      moderateAuthorityCitations: 0,
      lowAuthorityCitations: 0,
      unverifiedCitations: 0,
      averageAuthorityScore: 0,
      averageRecencyScore: 0,
      citationDensity: 0,
      sourceTypeDistribution: {},
      issuesFound: [],
      improvementSuggestions: []
    };
  }
}
