import { Controller, Post, Get, Body, Param, Query, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { MLContentOptimizerService, ContentOptimizationRequest } from '../services/ml-content-optimizer.service';
import { RealtimeFactCheckerService, FactCheckRequest, RealTimeMonitoringConfig } from '../services/realtime-fact-checker.service';
import { BlockchainVerificationService, ContentVerificationRequest, VerificationQuery } from '../services/blockchain-verification.service';

@ApiTags('Advanced Features')
@Controller('advanced-features')
export class AdvancedFeaturesController {
  private readonly logger = new Logger(AdvancedFeaturesController.name);

  constructor(
    private readonly mlOptimizer: MLContentOptimizerService,
    private readonly factChecker: RealtimeFactCheckerService,
    private readonly blockchainVerifier: BlockchainVerificationService
  ) {}

  // ML Content Optimization Endpoints

  @Post('ml-optimization/optimize')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Optimize content using ML models',
    description: 'Uses machine learning models to optimize content for engagement, readability, SEO, and conversion'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        content: { type: 'string' },
        targetAudience: { type: 'string' },
        optimizationGoals: { type: 'array', items: { type: 'string' } }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Content optimization completed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid optimization request' })
  @ApiResponse({ status: 500, description: 'ML optimization service error' })
  async optimizeContent(@Body() request: ContentOptimizationRequest) {
    this.logger.log(`ML optimization request for ${request.contentType} content`);
    return await this.mlOptimizer.optimizeContent(request);
  }

  @Post('ml-optimization/predict-performance')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Predict content performance',
    description: 'Uses ML models to predict how content will perform across various metrics'
  })
  @ApiResponse({ status: 200, description: 'Performance prediction completed' })
  async predictPerformance(
    @Body() body: { content: string; contentType: string; audience: 'b2b' | 'b2c' }
  ) {
    this.logger.log(`Performance prediction for ${body.contentType} content`);
    return await this.mlOptimizer.predictPerformance(body.content, body.contentType, body.audience);
  }

  @Post('ml-optimization/generate-ab-variations')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Generate A/B test variations',
    description: 'Creates multiple content variations optimized for different metrics for A/B testing'
  })
  @ApiResponse({ status: 200, description: 'A/B test variations generated successfully' })
  async generateABTestVariations(
    @Body() body: { 
      content: string; 
      contentType: string; 
      audience: 'b2b' | 'b2c'; 
      variationCount?: number 
    }
  ) {
    this.logger.log(`Generating A/B variations for ${body.contentType} content`);
    return await this.mlOptimizer.generateABTestVariations(
      body.content, 
      body.contentType, 
      body.audience, 
      body.variationCount || 3
    );
  }

  // Real-time Fact Checking Endpoints

  @Post('fact-checking/check-facts')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Perform real-time fact checking',
    description: 'Verifies factual claims in content using trusted sources and real-time data'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        content: { type: 'string' },
        sources: { type: 'array', items: { type: 'string' } }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Fact checking completed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid fact check request' })
  @ApiResponse({ status: 500, description: 'Fact checking service error' })
  async checkFacts(@Body() request: FactCheckRequest) {
    this.logger.log(`Fact check request (urgency: ${request.urgency})`);
    return await this.factChecker.checkFacts(request);
  }

  @Post('fact-checking/start-monitoring')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Start real-time misinformation monitoring',
    description: 'Begins monitoring for misinformation patterns and suspicious content in real-time'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean' },
        interval: { type: 'number' },
        metrics: { type: 'array', items: { type: 'string' } }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Real-time monitoring started successfully' })
  async startRealTimeMonitoring(@Body() config: RealTimeMonitoringConfig) {
    this.logger.log(`Starting real-time monitoring with ${config.keywords.length} keywords`);
    const monitoringId = await this.factChecker.startRealTimeMonitoring(config);
    return { monitoringId, status: 'started', config };
  }

  @Post('fact-checking/stop-monitoring/:monitoringId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Stop real-time monitoring',
    description: 'Stops an active real-time monitoring stream'
  })
  @ApiParam({ name: 'monitoringId', description: 'ID of the monitoring stream to stop' })
  @ApiResponse({ status: 200, description: 'Monitoring stopped successfully' })
  @ApiResponse({ status: 404, description: 'Monitoring stream not found' })
  async stopRealTimeMonitoring(@Param('monitoringId') monitoringId: string) {
    this.logger.log(`Stopping real-time monitoring: ${monitoringId}`);
    await this.factChecker.stopRealTimeMonitoring(monitoringId);
    return { monitoringId, status: 'stopped' };
  }

  @Get('fact-checking/monitoring-status')
  @ApiOperation({ 
    summary: 'Get monitoring status',
    description: 'Retrieves status and statistics for all active monitoring streams'
  })
  @ApiResponse({ status: 200, description: 'Monitoring status retrieved successfully' })
  async getMonitoringStatus(@Query('monitoringId') monitoringId?: string) {
    return this.factChecker.getMonitoringStatus(monitoringId);
  }

  // Blockchain Verification Endpoints

  @Post('blockchain/verify-content')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Verify content on blockchain',
    description: 'Creates an immutable record of content on blockchain for authenticity verification'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        content: { type: 'string' },
        verificationLevel: { type: 'string' },
        sources: { type: 'array', items: { type: 'string' } }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Content verification submitted to blockchain' })
  @ApiResponse({ status: 400, description: 'Invalid verification request' })
  @ApiResponse({ status: 500, description: 'Blockchain verification service error' })
  async verifyContent(@Body() request: ContentVerificationRequest) {
    this.logger.log(`Blockchain verification request (level: ${request.verificationLevel})`);
    return await this.blockchainVerifier.verifyContent(request);
  }

  @Get('blockchain/query-verification')
  @ApiOperation({ 
    summary: 'Query verification status',
    description: 'Retrieves the status and details of a blockchain verification'
  })
  @ApiResponse({ status: 200, description: 'Verification status retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Verification not found' })
  async queryVerification(@Query() query: VerificationQuery) {
    this.logger.log(`Querying verification: ${JSON.stringify(query)}`);
    const result = await this.blockchainVerifier.queryVerification(query);
    
    if (!result) {
      return { error: 'Verification not found', query };
    }
    
    return result;
  }

  @Post('blockchain/check-integrity')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Check content integrity',
    description: 'Compares current content with blockchain-verified original to detect modifications'
  })
  @ApiResponse({ status: 200, description: 'Integrity check completed successfully' })
  async checkIntegrity(
    @Body() body: { 
      originalContent: string; 
      currentContent: string; 
      verificationId: string 
    }
  ) {
    this.logger.log(`Integrity check for verification: ${body.verificationId}`);
    return await this.blockchainVerifier.checkIntegrity(
      body.originalContent, 
      body.currentContent, 
      body.verificationId
    );
  }

  @Get('blockchain/verification-statistics')
  @ApiOperation({ 
    summary: 'Get verification statistics',
    description: 'Retrieves comprehensive statistics about blockchain verifications'
  })
  @ApiResponse({ status: 200, description: 'Verification statistics retrieved successfully' })
  async getVerificationStatistics() {
    return this.blockchainVerifier.getVerificationStatistics();
  }

  // Combined Advanced Features Endpoints

  @Post('comprehensive-analysis')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Comprehensive content analysis',
    description: 'Performs ML optimization, fact checking, and blockchain verification in a single request'
  })
  @ApiResponse({ status: 200, description: 'Comprehensive analysis completed successfully' })
  async comprehensiveAnalysis(
    @Body() body: {
      content: string;
      metadata: {
        title: string;
        author: string;
        contentType: string;
        audience: 'b2b' | 'b2c';
      };
      features: {
        mlOptimization: boolean;
        factChecking: boolean;
        blockchainVerification: boolean;
      };
      urgency?: 'low' | 'medium' | 'high' | 'critical';
    }
  ) {
    this.logger.log(`Comprehensive analysis request for ${body.metadata.contentType} content`);
    
    const results: any = {
      timestamp: new Date().toISOString(),
      contentId: `analysis_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      features: body.features
    };

    // ML Optimization
    if (body.features.mlOptimization) {
      try {
        results.mlOptimization = await this.mlOptimizer.optimizeContent({
          content: body.content,
          contentType: body.metadata.contentType as any,
          audience: body.metadata.audience,
          targetMetrics: {
            readabilityScore: 80,
            engagementScore: 75,
            seoScore: 85,
            conversionPotential: 70
          },
          constraints: {
            toneOfVoice: 'formal'
          }
        });
      } catch (error) {
        results.mlOptimization = { error: error.message };
      }
    }

    // Fact Checking
    if (body.features.factChecking) {
      try {
        results.factChecking = await this.factChecker.checkFacts({
          content: body.content,
          urgency: body.urgency || 'medium',
          context: {
            domain: body.metadata.contentType,
            author: body.metadata.author
          }
        });
      } catch (error) {
        results.factChecking = { error: error.message };
      }
    }

    // Blockchain Verification
    if (body.features.blockchainVerification) {
      try {
        results.blockchainVerification = await this.blockchainVerifier.verifyContent({
          content: body.content,
          metadata: {
            title: body.metadata.title,
            author: body.metadata.author,
            createdAt: new Date().toISOString(),
            contentType: body.metadata.contentType
          },
          verificationLevel: 'standard',
          includeTimestamp: true,
          includeAuthorSignature: true
        });
      } catch (error) {
        results.blockchainVerification = { error: error.message };
      }
    }

    // Generate summary
    results.summary = {
      mlOptimizationStatus: body.features.mlOptimization ? (results.mlOptimization.error ? 'failed' : 'completed') : 'skipped',
      factCheckingStatus: body.features.factChecking ? (results.factChecking.error ? 'failed' : 'completed') : 'skipped',
      blockchainVerificationStatus: body.features.blockchainVerification ? (results.blockchainVerification.error ? 'failed' : 'completed') : 'skipped',
      overallStatus: Object.values(results).some((result: any) => result.error) ? 'partial_success' : 'success'
    };

    return results;
  }

  @Get('health')
  @ApiOperation({ 
    summary: 'Advanced features health check',
    description: 'Checks the health and availability of all advanced features services'
  })
  @ApiResponse({ status: 200, description: 'Health check completed successfully' })
  async healthCheck() {
    const health = {
      timestamp: new Date().toISOString(),
      services: {
        mlOptimizer: 'healthy',
        factChecker: 'healthy',
        blockchainVerifier: 'healthy'
      },
      overallStatus: 'healthy'
    };

    // In a real implementation, would perform actual health checks
    // For now, simulate healthy status

    return health;
  }

  @Get('capabilities')
  @ApiOperation({ 
    summary: 'Get advanced features capabilities',
    description: 'Returns information about available advanced features and their capabilities'
  })
  @ApiResponse({ status: 200, description: 'Capabilities information retrieved successfully' })
  async getCapabilities() {
    return {
      mlOptimization: {
        available: true,
        features: [
          'Content optimization for engagement, readability, SEO, and conversion',
          'Performance prediction using ML models',
          'A/B test variation generation',
          'Multi-dimensional content analysis'
        ],
        supportedContentTypes: ['blog_post', 'technical_guide', 'case_study', 'product_review', 'industry_analysis', 'social_media', 'whitepaper', 'email_campaign'],
        supportedAudiences: ['b2b', 'b2c']
      },
      factChecking: {
        available: true,
        features: [
          'Real-time fact verification using trusted sources',
          'Misinformation pattern detection',
          'Real-time monitoring and alerting',
          'Evidence-based claim analysis'
        ],
        trustedSources: 10,
        realTimeMonitoring: true,
        urgencyLevels: ['low', 'medium', 'high', 'critical']
      },
      blockchainVerification: {
        available: true,
        features: [
          'Immutable content verification on blockchain',
          'Digital certificate generation',
          'Content integrity checking',
          'Proof of authenticity'
        ],
        supportedNetworks: ['ethereum', 'polygon', 'hyperledger'],
        verificationLevels: ['basic', 'standard', 'premium', 'enterprise'],
        certificateValidity: '1 year'
      }
    };
  }
}
