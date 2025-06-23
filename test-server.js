console.log('Starting test server...');

const http = require('http');

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Health check
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() }));
    return;
  }
  
  // Content generation endpoint
  if (req.method === 'POST' && req.url === '/llm-content/generate') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const requestData = JSON.parse(body);
        console.log('Content generation request:', requestData);
        
        // Mock response with AI features
        const response = {
          success: true,
          data: {
            id: `content-${Date.now()}`,
            title: `${requestData.topic || 'Sample Topic'}: A Comprehensive Guide`,
            summary: `This comprehensive guide explores ${requestData.topic || 'the topic'} for ${requestData.audience || 'business'} audiences.`,
            sections: [
              {
                title: "Introduction",
                content: `Welcome to our guide on ${requestData.topic || 'this topic'}. This content is optimized for ${requestData.audience || 'business'} audiences and provides valuable insights.`
              },
              {
                title: "Key Concepts",
                content: `Understanding the fundamental concepts is crucial for success. This section covers the essential elements you need to know.`
              },
              {
                title: "Best Practices",
                content: `Implementing best practices ensures optimal results. Follow these proven strategies for maximum effectiveness.`
              },
              {
                title: "Conclusion",
                content: `In conclusion, applying these principles will help you achieve your goals and drive meaningful results.`
              }
            ],
            metadata: {
              contentType: requestData.contentType || 'blog_post',
              audience: requestData.audience || 'b2b',
              toneOfVoice: requestData.toneOfVoice || 'professional',
              wordCount: 450,
              readingTime: 3,
              fleschReadingEase: 72,
              readingLevel: 'Standard',
              hasImage: requestData.enableImageGeneration || false,
              hasAudio: requestData.enableTextToSpeech || false,
              imageStyle: requestData.enableImageGeneration ? (requestData.imageStyle || 'professional') : null,
              voiceUsed: requestData.enableTextToSpeech ? (requestData.voiceSettings?.voice || 'alloy') : null,
              generatedAt: new Date().toISOString(),
              qualityScore: 85
            }
          },
          message: 'Content generated successfully',
          aiFeatures: {
            imageGenerated: requestData.enableImageGeneration || false,
            audioGenerated: requestData.enableTextToSpeech || false,
            imageStyle: requestData.enableImageGeneration ? (requestData.imageStyle || 'professional') : null,
            voiceUsed: requestData.enableTextToSpeech ? (requestData.voiceSettings?.voice || 'alloy') : null
          }
        };
        
        // Add mock AI-generated image if enabled
        if (requestData.enableImageGeneration) {
          response.data.imageGeneration = {
            imageUrl: `data:image/svg+xml;base64,${Buffer.from(`
              <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
                <rect width="100%" height="100%" fill="#f0f9ff"/>
                <circle cx="200" cy="150" r="80" fill="#3b82f6" opacity="0.7"/>
                <text x="200" y="160" text-anchor="middle" font-family="Arial" font-size="16" fill="#1e40af">
                  AI Generated Image
                </text>
                <text x="200" y="180" text-anchor="middle" font-family="Arial" font-size="12" fill="#64748b">
                  Style: ${requestData.imageStyle || 'Professional'}
                </text>
                <text x="200" y="200" text-anchor="middle" font-family="Arial" font-size="12" fill="#64748b">
                  Topic: ${requestData.topic || 'Sample Topic'}
                </text>
              </svg>
            `).toString('base64')}`,
            prompt: `Professional ${requestData.imageStyle || 'business'} illustration about ${requestData.topic || 'the topic'}`,
            style: requestData.imageStyle || 'professional',
            generatedAt: new Date().toISOString()
          };
        }
        
        // Add mock AI-generated audio if enabled
        if (requestData.enableTextToSpeech) {
          // Create a simple audio data URL (silent audio for demo)
          const audioData = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT';
          
          response.data.audioGeneration = {
            audioData: audioData,
            audioUrl: audioData,
            audioFormat: 'wav',
            voiceId: requestData.voiceSettings?.voice || 'alloy',
            voiceProfile: requestData.voiceSettings?.voice || 'alloy',
            voiceSettings: requestData.voiceSettings || { voice: 'alloy', speed: 1.0, stability: 0.75 },
            textLength: response.data.sections.reduce((total, section) => total + section.content.length, 0),
            generatedAt: new Date().toISOString()
          };
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));
        
      } catch (error) {
        console.error('Error processing request:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Failed to process request' }));
      }
    });
    return;
  }
  
  // Default 404
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

const PORT = 3002;
server.listen(PORT, () => {
  console.log(`🚀 Test server running on port ${PORT}`);
  console.log(`📱 Frontend: http://localhost:${PORT}`);
  console.log(`🔗 API: http://localhost:${PORT}/llm-content/generate`);
  console.log(`❤️ Health: http://localhost:${PORT}/health`);
});

server.on('error', (error) => {
  console.error('Server error:', error);
});

console.log('Test server setup complete');
