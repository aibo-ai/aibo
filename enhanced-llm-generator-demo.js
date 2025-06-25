const http = require('http');
const url = require('url');
const crypto = require('crypto');
const { LayeredContentProcessor } = require('./layered-content-processor');

const PORT = 3006;

// Mock services for demonstration
class MockContentVersioningService {
  constructor() {
    this.versions = new Map();
    this.history = new Map();
  }

  async createVersion(contentData, metadata = {}) {
    const versionId = `version_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const version = {
      id: versionId,
      contentId: contentData.data?.contentId || `content_${Date.now()}`,
      version: await this.getNextVersionNumber(contentData.data?.contentId),
      content: contentData,
      metadata: {
        ...metadata,
        createdAt: new Date().toISOString(),
        qualityScore: contentData.data?.metadata?.qualityScore || 0,
        eeatScore: contentData.data?.metadata?.eeatScore || 0
      }
    };

    this.versions.set(versionId, version);
    
    // Add to history
    const historyEntry = {
      id: `history_${Date.now()}`,
      contentId: version.contentId,
      versionId: versionId,
      action: 'CREATE_VERSION',
      timestamp: new Date().toISOString()
    };
    
    if (!this.history.has(version.contentId)) {
      this.history.set(version.contentId, []);
    }
    this.history.get(version.contentId).push(historyEntry);

    return version;
  }

  async getVersionHistory(contentId, options = {}) {
    const versions = Array.from(this.versions.values())
      .filter(v => v.contentId === contentId)
      .sort((a, b) => b.version - a.version)
      .slice(0, options.limit || 50);

    return {
      versions,
      total: versions.length,
      hasMore: false
    };
  }

  async getContentHistory(contentId) {
    return this.history.get(contentId) || [];
  }

  async compareVersions(versionId1, versionId2) {
    const version1 = this.versions.get(versionId1);
    const version2 = this.versions.get(versionId2);

    if (!version1 || !version2) {
      throw new Error('One or both versions not found');
    }

    return {
      version1: { id: version1.id, version: version1.version },
      version2: { id: version2.id, version: version2.version },
      qualityImprovement: (version2.metadata.qualityScore || 0) - (version1.metadata.qualityScore || 0),
      eeatImprovement: (version2.metadata.eeatScore || 0) - (version1.metadata.eeatScore || 0)
    };
  }

  async getNextVersionNumber(contentId) {
    const versions = Array.from(this.versions.values())
      .filter(v => v.contentId === contentId);
    return versions.length + 1;
  }
}

class MockABTestingService {
  constructor() {
    this.experiments = new Map();
    this.metrics = new Map();
  }

  async createExperiment(config) {
    const experimentId = `exp_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const experiment = {
      id: experimentId,
      name: config.name,
      description: config.description,
      status: 'draft',
      variants: config.variants || [],
      trafficSplit: config.trafficSplit || [50, 50],
      createdAt: new Date().toISOString()
    };

    this.experiments.set(experimentId, experiment);
    return experiment;
  }

  async startExperiment(experimentId) {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) throw new Error('Experiment not found');

    experiment.status = 'running';
    experiment.startDate = new Date().toISOString();
    
    return { experimentId, startDate: experiment.startDate };
  }

  async generateVariant(experimentId, variantId, request) {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) throw new Error('Experiment not found');

    const variant = experiment.variants.find(v => v.id === variantId);
    if (!variant) throw new Error('Variant not found');

    // Apply variant modifications
    const modifiedRequest = { ...request };
    if (variant.modifications) {
      Object.assign(modifiedRequest, variant.modifications);
    }

    return { request: modifiedRequest, experimentId, variantId };
  }

  async recordMetrics(experimentId, variantId, metrics) {
    const key = `${experimentId}_${variantId}`;
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }
    
    this.metrics.get(key).push({
      ...metrics,
      timestamp: new Date().toISOString()
    });
  }

  async getExperimentResults(experimentId) {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) throw new Error('Experiment not found');

    const results = {
      experimentId,
      experimentName: experiment.name,
      status: experiment.status,
      variants: {},
      winner: null,
      statisticalSignificance: false
    };

    // Calculate results for each variant
    experiment.variants.forEach(variant => {
      const key = `${experimentId}_${variant.id}`;
      const variantMetrics = this.metrics.get(key) || [];
      
      results.variants[variant.id] = {
        variantId: variant.id,
        variantName: variant.name,
        sampleSize: variantMetrics.length,
        averageQualityScore: this.calculateAverage(variantMetrics, 'qualityScore'),
        averageEEATScore: this.calculateAverage(variantMetrics, 'eeatScore')
      };
    });

    return results;
  }

  async listExperiments(filters = {}) {
    return Array.from(this.experiments.values())
      .filter(exp => !filters.status || exp.status === filters.status);
  }

  calculateAverage(metrics, field) {
    if (metrics.length === 0) return 0;
    const sum = metrics.reduce((total, metric) => total + (metric[field] || 0), 0);
    return sum / metrics.length;
  }
}

class MockFeedbackLoopService {
  constructor() {
    this.feedback = new Map();
    this.improvements = new Map();
  }

  async collectFeedback(feedbackData) {
    const feedbackId = `feedback_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const feedback = {
      id: feedbackId,
      ...feedbackData,
      timestamp: new Date().toISOString(),
      status: 'processed'
    };

    this.feedback.set(feedbackId, feedback);
    return feedback;
  }

  async getImprovementRecommendations(contentRequest) {
    // Mock recommendations based on request
    const recommendations = {
      layerOptimizations: {
        enhanceReadability: true,
        improveStructure: true
      },
      parameterAdjustments: {
        toneOfVoice: contentRequest.audience === 'b2b' ? 'professional' : 'conversational'
      },
      qualityEnhancements: {
        addMoreExamples: true,
        improveAuthority: true
      }
    };

    return {
      recommendations,
      confidence: 0.8,
      basedOnSamples: 25
    };
  }

  async applyImprovements(contentRequest, improvements) {
    const optimizedRequest = { ...contentRequest };
    
    // Apply improvements
    if (improvements.parameterAdjustments) {
      Object.assign(optimizedRequest, improvements.parameterAdjustments);
    }

    optimizedRequest.improvementMetadata = {
      appliedAt: new Date().toISOString(),
      confidence: 0.8,
      basedOnSamples: 25
    };

    return optimizedRequest;
  }

  async getFeedbackAnalytics(filters = {}) {
    const feedbackArray = Array.from(this.feedback.values());
    
    return {
      totalFeedback: feedbackArray.length,
      averageRating: this.calculateAverageRating(feedbackArray),
      feedbackBySource: this.groupBy(feedbackArray, 'source'),
      feedbackByType: this.groupBy(feedbackArray, 'type')
    };
  }

  async generateQualityReport() {
    return {
      totalImprovements: this.improvements.size,
      successfulImprovements: Math.floor(this.improvements.size * 0.8),
      averageImprovement: 15.5,
      generatedAt: new Date().toISOString()
    };
  }

  calculateAverageRating(feedback) {
    if (feedback.length === 0) return 0;
    const ratings = feedback.filter(f => f.rating).map(f => f.rating);
    return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
  }

  groupBy(array, field) {
    return array.reduce((groups, item) => {
      const key = item[field] || 'unknown';
      groups[key] = (groups[key] || 0) + 1;
      return groups;
    }, {});
  }
}

class EnhancedLLMGenerator {
  constructor() {
    this.contentProcessor = new LayeredContentProcessor();
    this.versioningService = new MockContentVersioningService();
    this.abTestingService = new MockABTestingService();
    this.feedbackService = new MockFeedbackLoopService();
  }

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
          processingTime: Date.now() - startTime
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

  async applyFeedbackImprovements(request) {
    try {
      console.log('🔄 Applying feedback-driven improvements...');
      
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
      return request;
    }
  }

  async handleABTesting(request, options) {
    try {
      if (!options.experimentId) {
        return { request, experimentId: null, variantId: null };
      }

      console.log(`🧪 Processing A/B test experiment: ${options.experimentId}`);
      
      const variantId = options.variantId || 'control';
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

  async createContentVersion(contentResult, metadata) {
    try {
      console.log('📝 Creating content version...');
      
      const version = await this.versioningService.createVersion(contentResult, metadata);
      console.log(`✅ Version ${version.version} created`);
      return version;
    } catch (error) {
      console.error('⚠️ Could not create version:', error.message);
      return { id: 'unknown', version: 1 };
    }
  }

  async recordABTestMetrics(experimentId, variantId, metrics) {
    try {
      console.log(`📊 Recording A/B test metrics for variant ${variantId}...`);
      await this.abTestingService.recordMetrics(experimentId, variantId, metrics);
      console.log('✅ A/B test metrics recorded successfully');
    } catch (error) {
      console.error('⚠️ Could not record A/B test metrics:', error.message);
    }
  }

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

  async compareVersions(versionId1, versionId2) {
    try {
      return await this.versioningService.compareVersions(versionId1, versionId2);
    } catch (error) {
      console.error('❌ Error comparing versions:', error);
      throw error;
    }
  }

  async submitFeedback(feedbackData) {
    try {
      const feedback = await this.feedbackService.collectFeedback(feedbackData);
      return feedback;
    } catch (error) {
      console.error('❌ Error submitting feedback:', error);
      throw error;
    }
  }

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
      server: 'enhanced-llm-generator-demo',
      port: PORT,
      features: {
        contentVersioning: 'enabled',
        abTesting: 'enabled',
        feedbackLoops: 'enabled',
        layeredArchitecture: '4-layer'
      },
      services: {
        contentProcessor: 'operational',
        versioningService: 'operational (mock)',
        abTestingService: 'operational (mock)',
        feedbackService: 'operational (mock)'
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
      'GET /experiments/{id}/results',
      'GET /experiments'
    ]
  }));
});

// Start server
server.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 Enhanced LLM Generator Demo running on port ${PORT}`);
  console.log(`🔗 API: http://localhost:${PORT}/enhanced-content/generate`);
  console.log(`❤️ Health: http://localhost:${PORT}/health`);
  console.log(`📊 Analytics: http://localhost:${PORT}/analytics`);
  console.log(`🎯 Features: Content Versioning + A/B Testing + Feedback Loops`);
  console.log(`🏗️ Architecture: 4-Layer with Advanced Features (Demo Mode)`);
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
  console.log('\n🛑 Shutting down Enhanced LLM Generator Demo...');
  server.close(() => {
    console.log('✅ Server stopped gracefully');
    process.exit(0);
  });
});

module.exports = { EnhancedLLMGenerator, server, PORT };
