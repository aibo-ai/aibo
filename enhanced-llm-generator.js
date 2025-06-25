const http = require('http');
const url = require('url');
const { LayeredContentProcessor } = require('./layered-content-processor');
const { ContentVersioningService } = require('./content-versioning-service');
const { ABTestingService } = require('./ab-testing-service');
const { FeedbackLoopService } = require('./feedback-loop-service');

const PORT = 3006;

class EnhancedLLMGenerator {
  constructor() {
    this.contentProcessor = new LayeredContentProcessor();
    this.versioningService = new ContentVersioningService();
    this.abTestingService = new ABTestingService();
    this.feedbackService = new FeedbackLoopService();
  }

  /**
   * Generate content with versioning, A/B testing, and feedback integration
   */
  async generateEnhancedContent(request, options = {}) {
    const startTime = Date.now();
    console.log('🚀 Starting enhanced content generation with advanced features...');

    try {
      // Step 1: Apply feedback-driven improvements
      const improvedRequest = await this.applyFeedbackImprovements(request);
      
      // Step 2: Check if this is part of an A/B test
      const abTestResult = await this.handleABTesting(improvedRequest, options);
      
      // Step 3: Generate content using 4-layer architecture
      const contentResult = await this.contentProcessor.processContent(
        abTestResult.request || improvedRequest
      );
      
      // Step 4: Create version and store in history
      const version = await this.createContentVersion(contentResult, {
        userId: options.userId,
        experimentId: abTestResult.experimentId,
        variantId: abTestResult.variantId,
        tags: options.tags || [],
        changeLog: options.changeLog || 'Generated with enhanced LLM generator'
      });
      
      // Step 5: Record A/B test metrics if applicable
      if (abTestResult.experimentId) {
        await this.recordABTestMetrics(abTestResult.experimentId, abTestResult.variantId, {
          qualityScore: contentResult.data?.metadata?.qualityScore || 0,
          eeatScore: contentResult.data?.metadata?.eeatScore || 0,
          processingTime: Date.now() - startTime,
          layerPerformance: contentResult.performanceMetrics?.layerBreakdown || {}
        });
      }
      
      // Step 6: Enhance result with advanced metadata
      const enhancedResult = {
        ...contentResult,
        enhancedMetadata: {
          versionId: version.id,
          version: version.version,
          experimentId: abTestResult.experimentId,
          variantId: abTestResult.variantId,
          feedbackImprovementsApplied: improvedRequest.improvementMetadata || null,
          generationMethod: 'enhanced_llm_generator',
          features: {
            versioning: true,
            abTesting: !!abTestResult.experimentId,
            feedbackLoop: true
          },
          processingTime: Date.now() - startTime,
          generatedAt: new Date().toISOString()
        }
      };

      console.log('✅ Enhanced content generation completed successfully');
      return enhancedResult;

    } catch (error) {
      console.error('❌ Enhanced content generation failed:', error);
      throw error;
    }
  }

  /**
   * Apply feedback-driven improvements to the request
   */
  async applyFeedbackImprovements(request) {
    try {
      console.log('🔄 Applying feedback-driven improvements...');
      
      // Get improvement recommendations based on historical feedback
      const recommendations = await this.feedbackService.getImprovementRecommendations(request);
      
      if (recommendations.recommendations && recommendations.confidence > 0.6) {
        const improvedRequest = await this.feedbackService.applyImprovements(
          request, 
          recommendations.recommendations
        );
        
        console.log(`✅ Applied ${Object.keys(recommendations.recommendations).length} improvement categories`);
        return improvedRequest;
      }
      
      return request;
    } catch (error) {
      console.error('⚠️ Could not apply feedback improvements:', error.message);
      return request; // Fallback to original request
    }
  }

  /**
   * Handle A/B testing logic
   */
  async handleABTesting(request, options) {
    try {
      if (!options.experimentId) {
        return { request, experimentId: null, variantId: null };
      }

      console.log(`🧪 Processing A/B test experiment: ${options.experimentId}`);
      
      // Get experiment details
      const experiment = await this.abTestingService.getExperiment(options.experimentId);
      if (!experiment || experiment.status !== 'running') {
        console.log('⚠️ Experiment not found or not running, proceeding without A/B test');
        return { request, experimentId: null, variantId: null };
      }

      // Determine variant (use provided or select based on traffic split)
      const variantId = options.variantId || this.selectVariant(experiment);
      
      // Generate content for the specific variant
      const variantResult = await this.abTestingService.generateVariant(
        options.experimentId,
        variantId,
        request
      );

      return {
        request: variantResult.request || request,
        experimentId: options.experimentId,
        variantId: variantId
      };

    } catch (error) {
      console.error('⚠️ A/B testing error:', error.message);
      return { request, experimentId: null, variantId: null };
    }
  }

  /**
   * Create content version with metadata
   */
  async createContentVersion(contentResult, metadata) {
    try {
      console.log('📝 Creating content version...');
      
      const version = await this.versioningService.createVersion(contentResult, {
        ...metadata,
        qualityMetrics: {
          qualityScore: contentResult.data?.metadata?.qualityScore || 0,
          eeatScore: contentResult.data?.metadata?.eeatScore || 0,
          authorityRanking: contentResult.data?.metadata?.authorityRanking || 'Unknown',
          readabilityScore: contentResult.data?.metadata?.fleschReadingEase || 0
        },
        performanceMetrics: contentResult.performanceMetrics || {},
        layerResults: contentResult.layerResults || {}
      });

      console.log(`✅ Version ${version.version} created for content ${contentResult.data?.contentId}`);
      return version;
    } catch (error) {
      console.error('⚠️ Could not create version:', error.message);
      return { id: 'unknown', version: 1 }; // Fallback
    }
  }

  /**
   * Record A/B test metrics
   */
  async recordABTestMetrics(experimentId, variantId, metrics) {
    try {
      console.log(`📊 Recording A/B test metrics for variant ${variantId}...`);
      
      await this.abTestingService.recordMetrics(experimentId, variantId, metrics);
      
      console.log('✅ A/B test metrics recorded successfully');
    } catch (error) {
      console.error('⚠️ Could not record A/B test metrics:', error.message);
    }
  }

  /**
   * Select variant based on traffic split
   */
  selectVariant(experiment) {
    const random = Math.random() * 100;
    let cumulative = 0;
    
    for (let i = 0; i < experiment.variants.length; i++) {
      cumulative += experiment.trafficSplit[i];
      if (random <= cumulative) {
        return experiment.variants[i].id;
      }
    }
    
    // Fallback to first variant
    return experiment.variants[0].id;
  }

  /**
   * Get content history with versions
   */
  async getContentHistory(contentId, options = {}) {
    try {
      const versionHistory = await this.versioningService.getVersionHistory(contentId, options);
      const contentHistory = await this.versioningService.getContentHistory(contentId);
      
      return {
        versions: versionHistory.versions,
        history: contentHistory,
        total: versionHistory.total,
        hasMore: versionHistory.hasMore
      };
    } catch (error) {
      console.error('❌ Error getting content history:', error);
      throw error;
    }
  }

  /**
   * Compare content versions
   */
  async compareVersions(versionId1, versionId2) {
    try {
      return await this.versioningService.compareVersions(versionId1, versionId2);
    } catch (error) {
      console.error('❌ Error comparing versions:', error);
      throw error;
    }
  }

  /**
   * Submit feedback for content
   */
  async submitFeedback(feedbackData) {
    try {
      const feedback = await this.feedbackService.collectFeedback(feedbackData);
      
      // Process feedback asynchronously
      setTimeout(async () => {
        try {
          await this.feedbackService.processFeedback(feedback.id);
        } catch (error) {
          console.error('⚠️ Async feedback processing failed:', error.message);
        }
      }, 1000);
      
      return feedback;
    } catch (error) {
      console.error('❌ Error submitting feedback:', error);
      throw error;
    }
  }

  /**
   * Get analytics and insights
   */
  async getAnalytics(type = 'all', filters = {}) {
    try {
      const analytics = {};

      if (type === 'all' || type === 'feedback') {
        analytics.feedback = await this.feedbackService.getFeedbackAnalytics(filters);
      }

      if (type === 'all' || type === 'experiments') {
        const experiments = await this.abTestingService.listExperiments(filters);
        analytics.experiments = {
          total: experiments.length,
          running: experiments.filter(e => e.status === 'running').length,
          completed: experiments.filter(e => e.status === 'completed').length,
          experiments: experiments
        };
      }

      if (type === 'all' || type === 'quality') {
        analytics.quality = await this.feedbackService.generateQualityReport();
      }

      return analytics;
    } catch (error) {
      console.error('❌ Error getting analytics:', error);
      throw error;
    }
  }
}

// Helper function to parse JSON body
function parseBody(req, callback) {
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });
  req.on('end', () => {
    try {
      const parsed = body ? JSON.parse(body) : {};
      callback(null, parsed);
    } catch (error) {
      callback(error, null);
    }
  });
}

// Enhanced CORS headers function
function setCORSHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');
}

// Create enhanced LLM generator instance
const enhancedGenerator = new EnhancedLLMGenerator();

// Create HTTP server
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const method = req.method;

  console.log(`📥 ${method} ${parsedUrl.pathname} - ${new Date().toISOString()}`);

  // Set CORS headers for all requests
  setCORSHeaders(res);

  // Handle preflight requests
  if (method === 'OPTIONS') {
    console.log('✅ CORS preflight request handled');
    res.writeHead(200);
    res.end();
    return;
  }

  // Health check endpoint
  if (method === 'GET' && parsedUrl.pathname === '/health') {
    console.log('❤️ Health check requested');
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      server: 'enhanced-llm-generator',
      port: PORT,
      features: {
        contentVersioning: 'enabled',
        abTesting: 'enabled',
        feedbackLoops: 'enabled',
        layeredArchitecture: '4-layer'
      },
      services: {
        contentProcessor: 'operational',
        versioningService: 'operational',
        abTestingService: 'operational',
        feedbackService: 'operational'
      },
      uptime: process.uptime()
    };
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(healthData, null, 2));
    console.log('✅ Health check response sent');
    return;
  }

  // Enhanced content generation endpoint
  if (method === 'POST' && parsedUrl.pathname === '/enhanced-content/generate') {
    console.log('🚀 Enhanced content generation request received');
    
    parseBody(req, async (error, body) => {
      if (error) {
        console.error('❌ JSON parsing error:', error.message);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid JSON' }));
        return;
      }

      try {
        const options = {
          userId: body.userId,
          experimentId: body.experimentId,
          variantId: body.variantId,
          tags: body.tags,
          changeLog: body.changeLog
        };

        const result = await enhancedGenerator.generateEnhancedContent(body, options);

        console.log('✅ Enhanced content generation completed successfully');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));

      } catch (error) {
        console.error('❌ Enhanced content generation failed:', error.message);
        
        const errorResponse = {
          success: false,
          error: 'Enhanced content generation failed',
          message: error.message,
          timestamp: new Date().toISOString()
        };
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(errorResponse));
      }
    });
    return;
  }

  // Content history endpoint
  if (method === 'GET' && parsedUrl.pathname.startsWith('/content/')) {
    const pathParts = parsedUrl.pathname.split('/');
    const contentId = pathParts[2];
    const action = pathParts[3];

    if (action === 'history') {
      try {
        const options = {
          limit: parseInt(parsedUrl.query.limit) || 50,
          offset: parseInt(parsedUrl.query.offset) || 0,
          branchName: parsedUrl.query.branch
        };

        const history = await enhancedGenerator.getContentHistory(contentId, options);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(history));
      } catch (error) {
        console.error('❌ Error getting content history:', error.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to get content history' }));
      }
      return;
    }
  }

  // Version comparison endpoint
  if (method === 'GET' && parsedUrl.pathname === '/versions/compare') {
    try {
      const versionId1 = parsedUrl.query.version1;
      const versionId2 = parsedUrl.query.version2;

      if (!versionId1 || !versionId2) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Both version1 and version2 parameters are required' }));
        return;
      }

      const comparison = await enhancedGenerator.compareVersions(versionId1, versionId2);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(comparison));
    } catch (error) {
      console.error('❌ Error comparing versions:', error.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to compare versions' }));
    }
    return;
  }

  // Feedback submission endpoint
  if (method === 'POST' && parsedUrl.pathname === '/feedback/submit') {
    parseBody(req, async (error, body) => {
      if (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
        return;
      }

      try {
        const feedback = await enhancedGenerator.submitFeedback(body);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, feedbackId: feedback.id }));
      } catch (error) {
        console.error('❌ Error submitting feedback:', error.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to submit feedback' }));
      }
    });
    return;
  }

  // A/B Testing - Create experiment endpoint
  if (method === 'POST' && parsedUrl.pathname === '/experiments/create') {
    parseBody(req, async (error, body) => {
      if (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
        return;
      }

      try {
        const experiment = await enhancedGenerator.abTestingService.createExperiment(body);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, experiment }));
      } catch (error) {
        console.error('❌ Error creating experiment:', error.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to create experiment' }));
      }
    });
    return;
  }

  // A/B Testing - Start experiment endpoint
  if (method === 'POST' && parsedUrl.pathname.startsWith('/experiments/') && parsedUrl.pathname.endsWith('/start')) {
    const experimentId = parsedUrl.pathname.split('/')[2];

    try {
      const result = await enhancedGenerator.abTestingService.startExperiment(experimentId);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, result }));
    } catch (error) {
      console.error('❌ Error starting experiment:', error.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to start experiment' }));
    }
    return;
  }

  // A/B Testing - Get experiment results endpoint
  if (method === 'GET' && parsedUrl.pathname.startsWith('/experiments/') && parsedUrl.pathname.endsWith('/results')) {
    const experimentId = parsedUrl.pathname.split('/')[2];

    try {
      const results = await enhancedGenerator.abTestingService.getExperimentResults(experimentId);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(results));
    } catch (error) {
      console.error('❌ Error getting experiment results:', error.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to get experiment results' }));
    }
    return;
  }

  // A/B Testing - Stop experiment endpoint
  if (method === 'POST' && parsedUrl.pathname.startsWith('/experiments/') && parsedUrl.pathname.endsWith('/stop')) {
    const experimentId = parsedUrl.pathname.split('/')[2];

    try {
      const results = await enhancedGenerator.abTestingService.stopExperiment(experimentId);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, results }));
    } catch (error) {
      console.error('❌ Error stopping experiment:', error.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to stop experiment' }));
    }
    return;
  }

  // A/B Testing - List experiments endpoint
  if (method === 'GET' && parsedUrl.pathname === '/experiments') {
    try {
      const filters = {
        status: parsedUrl.query.status,
        category: parsedUrl.query.category
      };

      const experiments = await enhancedGenerator.abTestingService.listExperiments(filters);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ experiments }));
    } catch (error) {
      console.error('❌ Error listing experiments:', error.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to list experiments' }));
    }
    return;
  }

  // Analytics endpoint
  if (method === 'GET' && parsedUrl.pathname === '/analytics') {
    try {
      const type = parsedUrl.query.type || 'all';
      const filters = {
        timeRange: parseInt(parsedUrl.query.timeRange) || 30,
        status: parsedUrl.query.status,
        category: parsedUrl.query.category
      };

      const analytics = await enhancedGenerator.getAnalytics(type, filters);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(analytics));
    } catch (error) {
      console.error('❌ Error getting analytics:', error.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to get analytics' }));
    }
    return;
  }

  // Default 404
  console.log(`❌ 404 - Route not found: ${method} ${parsedUrl.pathname}`);
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ 
    error: 'Not Found', 
    path: parsedUrl.pathname,
    availableEndpoints: [
      'GET /health',
      'POST /enhanced-content/generate',
      'GET /content/{id}/history',
      'GET /versions/compare',
      'POST /feedback/submit',
      'GET /analytics',
      'POST /experiments/create',
      'POST /experiments/{id}/start',
      'POST /experiments/{id}/stop',
      'GET /experiments/{id}/results',
      'GET /experiments'
    ]
  }));
});

// Start server
server.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 Enhanced LLM Generator running on port ${PORT}`);
  console.log(`🔗 API: http://localhost:${PORT}/enhanced-content/generate`);
  console.log(`❤️ Health: http://localhost:${PORT}/health`);
  console.log(`📊 Analytics: http://localhost:${PORT}/analytics`);
  console.log(`🎯 Features: Content Versioning + A/B Testing + Feedback Loops`);
  console.log(`🏗️ Architecture: 4-Layer with Advanced Features`);
  console.log(`🌐 CORS: Enabled for all origins`);
  console.log(`⚡ Ready for enhanced content generation!`);
});

// Handle server errors
server.on('error', (error) => {
  console.error('❌ Server error:', error.message);
  if (error.code === 'EADDRINUSE') {
    console.log(`⚠️ Port ${PORT} is already in use. Trying port ${PORT + 1}...`);
    server.listen(PORT + 1);
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down Enhanced LLM Generator...');
  server.close(() => {
    console.log('✅ Server stopped gracefully');
    process.exit(0);
  });
});

module.exports = { EnhancedLLMGenerator, server, PORT };
