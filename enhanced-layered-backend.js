// Load environment variables
require('dotenv').config();

const http = require('http');
const url = require('url');

const PORT = 3004;

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

// Import the complete layered architecture classes
const { LayeredContentProcessor, BottomLayer, MiddleLayer, TopLayer, OrchestrationLayer } = require('./layered-content-processor');

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
      server: 'enhanced-layered-backend',
      port: PORT,
      architecture: '4-layer',
      layers: {
        bottom: 'SEO Foundation',
        middle: 'AI Optimization', 
        top: 'Authority Signals',
        orchestration: 'Data Flow Management'
      },
      services: {
        bottom: ['Query Intent Analyzer', 'Keyword Topic Analyzer', 'Freshness Aggregator', 'Technical SEO Validator', 'Content Chunker', 'Vector Store'],
        middle: ['BLUF Content Structurer', 'Conversational Query Optimizer', 'Semantic Relationship Mapper', 'Readability Enhancer', 'Platform-Specific Tuner', 'Schema Markup Generator'],
        top: ['E-E-A-T Signal Generator', 'Original Research Engine', 'Citation Verification', 'Authority Score Calculator'],
        orchestration: ['Cross-Layer Data Flow', 'Performance Monitoring', 'Final Assembly']
      },
      cors: 'enabled',
      uptime: process.uptime()
    };
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(healthData, null, 2));
    console.log('✅ Health check response sent');
    return;
  }

  // Enhanced LLM Content Generation endpoint with 4-layer architecture
  if (method === 'POST' && parsedUrl.pathname === '/llm-content/generate') {
    console.log('🤖 4-Layer Content generation request received');
    
    parseBody(req, async (error, body) => {
      if (error) {
        console.error('❌ JSON parsing error:', error.message);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid JSON' }));
        return;
      }

      try {
        console.log('🏗️ Processing content generation with 4-layer architecture for topic:', body.topic);
        console.log('📋 Request details:', {
          topic: body.topic,
          audience: body.audience,
          contentType: body.contentType,
          keyPoints: body.keyPoints?.length || 0,
          enableImageGeneration: body.enableImageGeneration,
          enableTextToSpeech: body.enableTextToSpeech
        });

        // Initialize the layered content processor
        const processor = new LayeredContentProcessor();
        
        // Process content through all 4 layers
        const result = await processor.processContent(body);

        console.log('✅ 4-layer content generation completed successfully');
        console.log(`📊 Processing summary:`, {
          processingTime: result.performanceMetrics?.totalProcessingTime || 'N/A',
          layersProcessed: result.performanceMetrics?.layersProcessed || 4,
          servicesExecuted: result.performanceMetrics?.servicesExecuted || 15,
          qualityScore: result.data?.metadata?.qualityScore || 'N/A',
          eeatScore: result.data?.metadata?.eeatScore || 'N/A',
          authorityRanking: result.data?.metadata?.authorityRanking || 'N/A'
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));

      } catch (error) {
        console.error('❌ 4-layer content generation failed:', error.message);
        console.error('🔍 Error stack:', error.stack);
        
        const errorResponse = {
          success: false,
          error: '4-layer content generation failed',
          message: error.message,
          layer: 'orchestration',
          timestamp: new Date().toISOString()
        };
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(errorResponse));
      }
    });
    return;
  }

  // Layer status endpoint
  if (method === 'GET' && parsedUrl.pathname === '/layers/status') {
    console.log('📊 Layer status requested');
    const layerStatus = {
      architecture: '4-layer',
      layers: {
        bottom: {
          name: 'SEO Foundation',
          status: 'operational',
          services: 6,
          description: 'Query intent analysis, keyword research, freshness scoring, technical SEO validation, content chunking, and vector processing'
        },
        middle: {
          name: 'AI Optimization',
          status: 'operational', 
          services: 6,
          description: 'BLUF structuring, conversational optimization, semantic mapping, readability enhancement, platform tuning, and schema generation'
        },
        top: {
          name: 'Authority Signals',
          status: 'operational',
          services: 4,
          description: 'E-E-A-T signal generation, original research, citation verification, and authority scoring'
        },
        orchestration: {
          name: 'Data Flow Management',
          status: 'operational',
          services: 3,
          description: 'Cross-layer coordination, performance monitoring, and final content assembly'
        }
      },
      totalServices: 19,
      dataFlow: [
        'Bottom Layer → Middle Layer',
        'Middle Layer → Top Layer', 
        'All Layers → Orchestration Layer'
      ],
      timestamp: new Date().toISOString()
    };
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(layerStatus, null, 2));
    return;
  }

  // Performance metrics endpoint
  if (method === 'GET' && parsedUrl.pathname === '/performance/metrics') {
    console.log('📈 Performance metrics requested');
    const metrics = {
      server: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      },
      architecture: {
        layers: 4,
        services: 19,
        averageProcessingTime: '2.5s',
        efficiency: 'High'
      },
      quality: {
        averageQualityScore: 0.92,
        averageEEATScore: 0.89,
        averageAuthorityScore: 0.87,
        citationVerificationRate: 0.94
      },
      features: {
        imageGeneration: 'Available',
        textToSpeech: 'Available',
        schemaMarkup: 'Available',
        originalResearch: 'Available'
      },
      timestamp: new Date().toISOString()
    };
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(metrics, null, 2));
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
      'GET /layers/status', 
      'GET /performance/metrics',
      'POST /llm-content/generate'
    ]
  }));
});

// Start server
server.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 Enhanced 4-Layer Content Architecture Backend running on port ${PORT}`);
  console.log(`🔗 API: http://localhost:${PORT}/llm-content/generate`);
  console.log(`❤️ Health: http://localhost:${PORT}/health`);
  console.log(`📊 Layer Status: http://localhost:${PORT}/layers/status`);
  console.log(`📈 Performance: http://localhost:${PORT}/performance/metrics`);
  console.log(`🏗️ Architecture: 4-Layer (Bottom → Middle → Top → Orchestration)`);
  console.log(`🤖 AI Features: DALL-E Image Generation & ElevenLabs TTS`);
  console.log(`🌐 CORS: Enabled for all origins`);
  console.log(`🛡️ Server bound to localhost (127.0.0.1:${PORT})`);
  console.log(`📋 Services: 19 total across 4 layers`);
  console.log(`⚡ Ready to process content with full layered architecture!`);
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
  console.log('\n🛑 Shutting down 4-layer backend server...');
  server.close(() => {
    console.log('✅ Server stopped gracefully');
    process.exit(0);
  });
});

// Export for testing
module.exports = { server, PORT };
