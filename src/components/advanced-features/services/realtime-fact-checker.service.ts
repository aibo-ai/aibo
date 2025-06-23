import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApplicationInsightsService } from '../../../common/services/application-insights.service';

export interface FactCheckRequest {
  content: string;
  claims?: string[]; // Specific claims to verify
  urgency: 'low' | 'medium' | 'high' | 'critical';
  context?: {
    domain: string;
    publishDate?: string;
    author?: string;
    sources?: string[];
  };
}

export interface FactCheckResult {
  overallVeracity: 'true' | 'mostly_true' | 'mixed' | 'mostly_false' | 'false' | 'unverifiable';
  confidence: number;
  claimResults: Array<{
    claim: string;
    veracity: 'true' | 'mostly_true' | 'mixed' | 'mostly_false' | 'false' | 'unverifiable';
    confidence: number;
    evidence: Array<{
      source: string;
      url: string;
      relevance: number;
      credibility: number;
      supportLevel: 'supports' | 'contradicts' | 'neutral' | 'unclear';
      excerpt: string;
    }>;
    reasoning: string;
  }>;
  flags: Array<{
    type: 'misinformation' | 'outdated' | 'bias' | 'unsubstantiated' | 'misleading_context';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    location: string;
    suggestion: string;
  }>;
  metadata: {
    processingTime: number;
    sourcesChecked: number;
    lastUpdated: string;
    factCheckVersion: string;
  };
}

export interface RealTimeMonitoringConfig {
  keywords: string[];
  domains: string[];
  alertThresholds: {
    misinformationScore: number;
    viralityScore: number;
    credibilityScore: number;
  };
  notificationChannels: string[];
}

@Injectable()
export class RealtimeFactCheckerService {
  private readonly logger = new Logger(RealtimeFactCheckerService.name);
  private readonly factCheckApiEndpoint: string;
  private readonly apiKey: string;
  private readonly factCheckVersion = 'realtime-v1.2';
  
  // Trusted fact-checking sources
  private readonly trustedSources = [
    'snopes.com',
    'factcheck.org',
    'politifact.com',
    'reuters.com/fact-check',
    'apnews.com/hub/ap-fact-check',
    'bbc.com/reality-check',
    'washingtonpost.com/news/fact-checker',
    'cnn.com/factsfirst',
    'fullfact.org',
    'factchecker.in'
  ];

  // Real-time monitoring streams
  private readonly monitoringStreams = new Map<string, any>();

  constructor(
    private readonly configService: ConfigService,
    private readonly appInsights: ApplicationInsightsService
  ) {
    this.factCheckApiEndpoint = this.configService.get('FACT_CHECK_API_ENDPOINT', 'https://factcheck-api.azure.com');
    this.apiKey = this.configService.get('FACT_CHECK_API_KEY', '');
    
    this.initializeRealTimeMonitoring();
  }

  /**
   * Perform comprehensive fact-checking on content
   */
  async checkFacts(request: FactCheckRequest): Promise<FactCheckResult> {
    const startTime = Date.now();
    
    try {
      this.logger.log(`Starting fact-check for content (urgency: ${request.urgency})`);

      // Track fact-check request
      this.appInsights.trackEvent('RealtimeFactChecker:FactCheckStarted', {
        urgency: request.urgency,
        contentLength: request.content.length.toString(),
        domain: request.context?.domain || 'unknown',
        hasSpecificClaims: request.claims ? 'true' : 'false'
      });

      // Extract claims if not provided
      const claims = request.claims || await this.extractClaims(request.content);
      
      // Verify each claim
      const claimResults = await Promise.all(
        claims.map(claim => this.verifyClaim(claim, request.context))
      );

      // Analyze overall veracity
      const overallVeracity = this.calculateOverallVeracity(claimResults);
      const confidence = this.calculateOverallConfidence(claimResults);

      // Identify content flags
      const flags = await this.identifyContentFlags(request.content, claimResults);

      // Check for real-time misinformation patterns
      await this.checkMisinformationPatterns(request.content, claimResults);

      const processingTime = Date.now() - startTime;

      const result: FactCheckResult = {
        overallVeracity,
        confidence,
        claimResults,
        flags,
        metadata: {
          processingTime,
          sourcesChecked: this.countUniqueSources(claimResults),
          lastUpdated: new Date().toISOString(),
          factCheckVersion: this.factCheckVersion
        }
      };

      // Track successful fact-check
      this.appInsights.trackEvent('RealtimeFactChecker:FactCheckCompleted', {
        urgency: request.urgency,
        overallVeracity: result.overallVeracity,
        confidence: result.confidence.toString(),
        claimsChecked: claimResults.length.toString(),
        flagsFound: flags.length.toString(),
        processingTime: processingTime.toString()
      });

      this.appInsights.trackMetric('RealtimeFactChecker:ProcessingTime', processingTime, {
        urgency: request.urgency,
        claimCount: claimResults.length.toString()
      });

      // Alert if critical misinformation detected
      if (this.isCriticalMisinformation(result)) {
        await this.sendCriticalAlert(result, request);
      }

      this.logger.log(`Fact-check completed in ${processingTime}ms: ${overallVeracity} (${confidence.toFixed(2)} confidence)`);
      return result;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      this.logger.error(`Fact-check failed: ${error.message}`, error.stack);
      this.appInsights.trackException(error, {
        operation: 'CheckFacts',
        urgency: request.urgency,
        processingTime: processingTime.toString()
      });

      throw error;
    }
  }

  /**
   * Start real-time monitoring for misinformation
   */
  async startRealTimeMonitoring(config: RealTimeMonitoringConfig): Promise<string> {
    const monitoringId = `monitor_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    
    try {
      this.logger.log(`Starting real-time monitoring: ${monitoringId}`);

      // Initialize monitoring stream
      const stream = {
        id: monitoringId,
        config,
        startTime: new Date().toISOString(),
        status: 'active',
        alertCount: 0,
        lastAlert: null
      };

      this.monitoringStreams.set(monitoringId, stream);

      // Start monitoring various sources
      await this.initializeSourceMonitoring(monitoringId, config);

      this.appInsights.trackEvent('RealtimeFactChecker:MonitoringStarted', {
        monitoringId,
        keywordCount: config.keywords.length.toString(),
        domainCount: config.domains.length.toString(),
        alertChannels: config.notificationChannels.length.toString()
      });

      this.logger.log(`Real-time monitoring started: ${monitoringId}`);
      return monitoringId;

    } catch (error) {
      this.logger.error(`Failed to start monitoring: ${error.message}`, error.stack);
      this.appInsights.trackException(error, {
        operation: 'StartRealTimeMonitoring',
        monitoringId
      });
      throw error;
    }
  }

  /**
   * Stop real-time monitoring
   */
  async stopRealTimeMonitoring(monitoringId: string): Promise<void> {
    try {
      const stream = this.monitoringStreams.get(monitoringId);
      if (!stream) {
        throw new Error(`Monitoring stream not found: ${monitoringId}`);
      }

      stream.status = 'stopped';
      stream.endTime = new Date().toISOString();

      this.appInsights.trackEvent('RealtimeFactChecker:MonitoringStopped', {
        monitoringId,
        duration: (Date.now() - new Date(stream.startTime).getTime()).toString(),
        alertCount: stream.alertCount.toString()
      });

      this.monitoringStreams.delete(monitoringId);
      this.logger.log(`Real-time monitoring stopped: ${monitoringId}`);

    } catch (error) {
      this.logger.error(`Failed to stop monitoring: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get monitoring status and statistics
   */
  getMonitoringStatus(monitoringId?: string): any {
    if (monitoringId) {
      return this.monitoringStreams.get(monitoringId) || null;
    }

    return {
      activeStreams: this.monitoringStreams.size,
      streams: Array.from(this.monitoringStreams.values()).map(stream => ({
        id: stream.id,
        status: stream.status,
        startTime: stream.startTime,
        alertCount: stream.alertCount,
        keywordCount: stream.config.keywords.length
      }))
    };
  }

  /**
   * Extract factual claims from content
   */
  private async extractClaims(content: string): Promise<string[]> {
    // Simulate claim extraction using NLP
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Identify sentences that contain factual claims
    const factualIndicators = [
      /\b(according to|research shows|studies indicate|data reveals|statistics show)\b/i,
      /\b(\d+%|\d+ percent|increased by|decreased by|rose to|fell to)\b/i,
      /\b(scientists|researchers|experts|study|report|survey)\b/i,
      /\b(in \d{4}|last year|this year|recently|new study)\b/i
    ];

    const claims = sentences.filter(sentence => 
      factualIndicators.some(pattern => pattern.test(sentence))
    ).map(sentence => sentence.trim());

    return claims.slice(0, 10); // Limit to 10 claims for performance
  }

  /**
   * Verify a specific claim
   */
  private async verifyClaim(claim: string, context?: any): Promise<FactCheckResult['claimResults'][0]> {
    try {
      // Search for evidence from trusted sources
      const evidence = await this.searchEvidence(claim, context);
      
      // Analyze evidence to determine veracity
      const veracity = this.analyzeEvidence(evidence);
      const confidence = this.calculateClaimConfidence(evidence, veracity);
      const reasoning = this.generateReasoning(claim, evidence, veracity);

      return {
        claim,
        veracity,
        confidence,
        evidence,
        reasoning
      };

    } catch (error) {
      this.logger.warn(`Failed to verify claim: ${claim}`, error.message);
      
      return {
        claim,
        veracity: 'unverifiable',
        confidence: 0,
        evidence: [],
        reasoning: 'Unable to verify due to insufficient evidence or technical error'
      };
    }
  }

  /**
   * Search for evidence from trusted sources
   */
  private async searchEvidence(claim: string, context?: any): Promise<FactCheckResult['claimResults'][0]['evidence']> {
    const evidence = [];
    
    // Simulate searching trusted fact-checking sources
    for (const source of this.trustedSources.slice(0, 5)) { // Check top 5 sources
      try {
        // Simulate API call to fact-checking source
        const searchResult = await this.simulateSourceSearch(claim, source);
        
        if (searchResult.relevant) {
          evidence.push({
            source: searchResult.sourceName,
            url: searchResult.url,
            relevance: searchResult.relevance,
            credibility: searchResult.credibility,
            supportLevel: searchResult.supportLevel,
            excerpt: searchResult.excerpt
          });
        }
      } catch (error) {
        this.logger.warn(`Failed to search ${source}: ${error.message}`);
      }
    }

    return evidence.sort((a, b) => (b.relevance * b.credibility) - (a.relevance * a.credibility));
  }

  /**
   * Simulate searching a fact-checking source
   */
  private async simulateSourceSearch(claim: string, source: string): Promise<any> {
    // Simulate API response with realistic data
    const relevance = Math.random() * 0.4 + 0.6; // 0.6-1.0
    const credibility = this.getSourceCredibility(source);
    
    // Simulate different support levels
    const supportLevels = ['supports', 'contradicts', 'neutral', 'unclear'];
    const supportLevel = supportLevels[Math.floor(Math.random() * supportLevels.length)];
    
    return {
      relevant: relevance > 0.7,
      sourceName: source,
      url: `https://${source}/fact-check/${encodeURIComponent(claim.substring(0, 50))}`,
      relevance,
      credibility,
      supportLevel,
      excerpt: `Fact-check excerpt for: ${claim.substring(0, 100)}...`
    };
  }

  /**
   * Get credibility score for a source
   */
  private getSourceCredibility(source: string): number {
    const credibilityScores = {
      'snopes.com': 0.95,
      'factcheck.org': 0.93,
      'politifact.com': 0.91,
      'reuters.com/fact-check': 0.94,
      'apnews.com/hub/ap-fact-check': 0.92,
      'bbc.com/reality-check': 0.90,
      'washingtonpost.com/news/fact-checker': 0.88,
      'cnn.com/factsfirst': 0.85,
      'fullfact.org': 0.89,
      'factchecker.in': 0.87
    };
    
    return credibilityScores[source] || 0.75;
  }

  /**
   * Analyze evidence to determine veracity
   */
  private analyzeEvidence(evidence: any[]): FactCheckResult['claimResults'][0]['veracity'] {
    if (evidence.length === 0) return 'unverifiable';
    
    const supportingEvidence = evidence.filter(e => e.supportLevel === 'supports');
    const contradictingEvidence = evidence.filter(e => e.supportLevel === 'contradicts');
    
    const supportScore = supportingEvidence.reduce((sum, e) => sum + (e.relevance * e.credibility), 0);
    const contradictScore = contradictingEvidence.reduce((sum, e) => sum + (e.relevance * e.credibility), 0);
    
    const ratio = supportScore / (supportScore + contradictScore + 0.1); // Avoid division by zero
    
    if (ratio > 0.8) return 'true';
    if (ratio > 0.6) return 'mostly_true';
    if (ratio > 0.4) return 'mixed';
    if (ratio > 0.2) return 'mostly_false';
    return 'false';
  }

  /**
   * Calculate confidence for a claim verification
   */
  private calculateClaimConfidence(evidence: any[], veracity: string): number {
    if (evidence.length === 0) return 0;
    
    const avgCredibility = evidence.reduce((sum, e) => sum + e.credibility, 0) / evidence.length;
    const avgRelevance = evidence.reduce((sum, e) => sum + e.relevance, 0) / evidence.length;
    const evidenceCount = Math.min(evidence.length / 5, 1); // Normalize to 0-1
    
    let confidence = (avgCredibility * 0.4 + avgRelevance * 0.4 + evidenceCount * 0.2);
    
    // Reduce confidence for mixed results
    if (veracity === 'mixed') confidence *= 0.7;
    if (veracity === 'unverifiable') confidence = 0;
    
    return Math.min(1, Math.max(0, confidence));
  }

  /**
   * Generate reasoning for claim verification
   */
  private generateReasoning(claim: string, evidence: any[], veracity: string): string {
    if (evidence.length === 0) {
      return 'No reliable evidence found to verify this claim.';
    }
    
    const sourceCount = evidence.length;
    const supportingCount = evidence.filter(e => e.supportLevel === 'supports').length;
    const contradictingCount = evidence.filter(e => e.supportLevel === 'contradicts').length;
    
    let reasoning = `Based on ${sourceCount} sources: `;
    
    if (supportingCount > contradictingCount) {
      reasoning += `${supportingCount} sources support this claim, while ${contradictingCount} contradict it.`;
    } else if (contradictingCount > supportingCount) {
      reasoning += `${contradictingCount} sources contradict this claim, while ${supportingCount} support it.`;
    } else {
      reasoning += `Evidence is mixed with ${supportingCount} supporting and ${contradictingCount} contradicting sources.`;
    }
    
    return reasoning;
  }

  /**
   * Calculate overall veracity from claim results
   */
  private calculateOverallVeracity(claimResults: any[]): FactCheckResult['overallVeracity'] {
    if (claimResults.length === 0) return 'unverifiable';
    
    const veracityScores = {
      'true': 1.0,
      'mostly_true': 0.75,
      'mixed': 0.5,
      'mostly_false': 0.25,
      'false': 0.0,
      'unverifiable': 0.5
    };
    
    const avgScore = claimResults.reduce((sum, result) => 
      sum + veracityScores[result.veracity], 0) / claimResults.length;
    
    if (avgScore >= 0.9) return 'true';
    if (avgScore >= 0.7) return 'mostly_true';
    if (avgScore >= 0.4) return 'mixed';
    if (avgScore >= 0.2) return 'mostly_false';
    return 'false';
  }

  /**
   * Calculate overall confidence
   */
  private calculateOverallConfidence(claimResults: any[]): number {
    if (claimResults.length === 0) return 0;
    
    return claimResults.reduce((sum, result) => sum + result.confidence, 0) / claimResults.length;
  }

  /**
   * Identify content flags
   */
  private async identifyContentFlags(content: string, claimResults: any[]): Promise<FactCheckResult['flags']> {
    const flags = [];
    
    // Check for misinformation
    const falseClaimsCount = claimResults.filter(r => r.veracity === 'false' || r.veracity === 'mostly_false').length;
    if (falseClaimsCount > 0) {
      flags.push({
        type: 'misinformation',
        severity: falseClaimsCount > 2 ? 'high' : 'medium',
        description: `${falseClaimsCount} potentially false claims detected`,
        location: 'content',
        suggestion: 'Review and verify claims with reliable sources'
      });
    }
    
    // Check for outdated information
    const currentYear = new Date().getFullYear();
    const oldYearPattern = new RegExp(`\\b(${currentYear - 3}|${currentYear - 4}|${currentYear - 5})\\b`, 'g');
    if (oldYearPattern.test(content)) {
      flags.push({
        type: 'outdated',
        severity: 'medium',
        description: 'Content may contain outdated information',
        location: 'content',
        suggestion: 'Update with more recent data and sources'
      });
    }
    
    // Check for bias indicators
    const biasWords = ['always', 'never', 'all experts agree', 'everyone knows', 'obviously'];
    const biasCount = biasWords.filter(word => content.toLowerCase().includes(word)).length;
    if (biasCount > 2) {
      flags.push({
        type: 'bias',
        severity: 'low',
        description: 'Content may contain biased language',
        location: 'content',
        suggestion: 'Use more neutral and balanced language'
      });
    }
    
    return flags;
  }

  /**
   * Check for misinformation patterns
   */
  private async checkMisinformationPatterns(content: string, claimResults: any[]): Promise<void> {
    // Check for known misinformation patterns
    const suspiciousPatterns = [
      /\b(they don't want you to know|hidden truth|cover-up|conspiracy)\b/i,
      /\b(miracle cure|secret remedy|doctors hate this)\b/i,
      /\b(100% effective|guaranteed results|instant cure)\b/i
    ];
    
    const patternMatches = suspiciousPatterns.filter(pattern => pattern.test(content));
    
    if (patternMatches.length > 0) {
      this.appInsights.trackEvent('RealtimeFactChecker:SuspiciousPatternDetected', {
        patternCount: patternMatches.length.toString(),
        contentLength: content.length.toString()
      });
    }
  }

  /**
   * Check if result indicates critical misinformation
   */
  private isCriticalMisinformation(result: FactCheckResult): boolean {
    return (
      result.overallVeracity === 'false' ||
      result.flags.some(flag => flag.type === 'misinformation' && flag.severity === 'high') ||
      result.confidence > 0.8 && result.overallVeracity === 'mostly_false'
    );
  }

  /**
   * Send critical misinformation alert
   */
  private async sendCriticalAlert(result: FactCheckResult, request: FactCheckRequest): Promise<void> {
    this.appInsights.trackEvent('RealtimeFactChecker:CriticalMisinformationDetected', {
      overallVeracity: result.overallVeracity,
      confidence: result.confidence.toString(),
      urgency: request.urgency,
      domain: request.context?.domain || 'unknown'
    });
    
    this.logger.warn(`Critical misinformation detected: ${result.overallVeracity} (${result.confidence.toFixed(2)} confidence)`);
  }

  /**
   * Count unique sources across claim results
   */
  private countUniqueSources(claimResults: any[]): number {
    const sources = new Set();
    claimResults.forEach(result => {
      result.evidence.forEach(evidence => sources.add(evidence.source));
    });
    return sources.size;
  }

  /**
   * Initialize real-time monitoring
   */
  private initializeRealTimeMonitoring(): void {
    // Set up periodic monitoring tasks
    setInterval(() => {
      this.performPeriodicMonitoring();
    }, 60000); // Every minute
  }

  /**
   * Initialize source monitoring for a specific stream
   */
  private async initializeSourceMonitoring(monitoringId: string, config: RealTimeMonitoringConfig): Promise<void> {
    // In a real implementation, this would set up webhooks, RSS feeds, API polling, etc.
    this.logger.log(`Initialized source monitoring for ${monitoringId} with ${config.keywords.length} keywords`);
  }

  /**
   * Perform periodic monitoring tasks
   */
  private performPeriodicMonitoring(): void {
    // Check active monitoring streams
    for (const [id, stream] of this.monitoringStreams.entries()) {
      if (stream.status === 'active') {
        // Simulate monitoring activity
        this.logger.debug(`Monitoring stream ${id} is active`);
      }
    }
  }
}
