const http = require('http');
const url = require('url');
const path = require('path');
const fs = require('fs');

const PORT = process.env.PORT || 3001;

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

// Create HTTP server
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const method = req.method;

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Health check endpoint
  if (method === 'GET' && parsedUrl.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      server: 'working-server'
    }));
    return;
  }

  // LLM Content Generation endpoint
  if (method === 'POST' && parsedUrl.pathname === '/llm-content/generate') {
    parseBody(req, async (error, body) => {
      if (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid JSON' }));
        return;
      }
      try {
        console.log('🚀 Content generation request received:', body);

        const {
          topic,
          audience,
          contentType,
          toneOfVoice,
          keyPoints,
          llmTarget,
          enableImageGeneration,
          enableTextToSpeech,
          imageStyle,
          voiceSettings
        } = body;

        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Generate mock content with AI features
        const generatedContent = {
      id: `content-${Date.now()}`,
      title: `${topic}: A Comprehensive Guide`,
      summary: `This comprehensive guide explores ${topic} for ${audience} audiences, providing valuable insights and actionable strategies.`,
      sections: [
        {
          title: "Introduction",
          content: `Welcome to our comprehensive guide on ${topic}. In today's rapidly evolving landscape, understanding ${topic} is crucial for ${audience} success. This guide will provide you with the essential knowledge and practical insights needed to excel in this area.`
        },
        {
          title: "Key Concepts",
          content: `Let's explore the fundamental concepts of ${topic}. ${keyPoints ? keyPoints.map(point => `Understanding ${point} is essential for success.`).join(' ') : 'These concepts form the foundation of effective implementation.'} By mastering these principles, you'll be well-equipped to navigate the complexities of this field.`
        },
        {
          title: "Best Practices",
          content: `Implementing best practices in ${topic} requires a strategic approach. Focus on continuous learning, staying updated with industry trends, and applying proven methodologies. Remember that success in ${topic} comes from consistent application of these principles.`
        },
        {
          title: "Conclusion",
          content: `In conclusion, ${topic} represents a significant opportunity for ${audience} organizations. By following the strategies outlined in this guide, you'll be positioned to achieve meaningful results and drive success in your initiatives.`
        }
      ],
      metadata: {
        contentType,
        audience,
        toneOfVoice,
        llmTarget,
        wordCount: 450,
        readingTime: 3,
        fleschReadingEase: 72,
        readingLevel: 'Standard',
        hasImage: enableImageGeneration,
        hasAudio: enableTextToSpeech,
        imageStyle: enableImageGeneration ? imageStyle : null,
        voiceUsed: enableTextToSpeech ? voiceSettings?.voice || 'alloy' : null,
        generatedAt: new Date().toISOString(),
        qualityScore: 85
      }
    };

    // Add AI-generated image if enabled
    if (enableImageGeneration) {
      generatedContent.imageGeneration = {
        imageUrl: `data:image/svg+xml;base64,${Buffer.from(`
          <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="#f0f9ff"/>
            <circle cx="200" cy="150" r="80" fill="#3b82f6" opacity="0.7"/>
            <text x="200" y="160" text-anchor="middle" font-family="Arial" font-size="16" fill="#1e40af">
              AI Generated Image
            </text>
            <text x="200" y="180" text-anchor="middle" font-family="Arial" font-size="12" fill="#64748b">
              Style: ${imageStyle || 'Professional'}
            </text>
            <text x="200" y="200" text-anchor="middle" font-family="Arial" font-size="12" fill="#64748b">
              Topic: ${topic}
            </text>
          </svg>
        `).toString('base64')}`,
        prompt: `Professional ${imageStyle || 'business'} illustration about ${topic}`,
        style: imageStyle || 'professional',
        generatedAt: new Date().toISOString()
      };
    }

    // Add AI-generated audio if enabled
    if (enableTextToSpeech) {
      // Create a simple audio data URL (silent audio for demo)
      const audioData = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT';
      
      generatedContent.audioGeneration = {
        audioData: audioData,
        audioUrl: audioData,
        audioFormat: 'wav',
        voiceId: voiceSettings?.voice || 'alloy',
        voiceProfile: voiceSettings?.voice || 'alloy',
        voiceSettings: voiceSettings || { voice: 'alloy', speed: 1.0, stability: 0.75 },
        textLength: generatedContent.sections.reduce((total, section) => total + section.content.length, 0),
        generatedAt: new Date().toISOString()
      };
    }

        console.log('✅ Content generation completed successfully');
        console.log(`📊 Generated content with ${generatedContent.sections.length} sections`);
        console.log(`🖼️ Image generation: ${enableImageGeneration ? 'Enabled' : 'Disabled'}`);
        console.log(`🎵 Audio generation: ${enableTextToSpeech ? 'Enabled' : 'Disabled'}`);

        const response = {
          success: true,
          data: generatedContent,
          message: 'Content generated successfully',
          aiFeatures: {
            imageGenerated: enableImageGeneration,
            audioGenerated: enableTextToSpeech,
            imageStyle: enableImageGeneration ? imageStyle : null,
            voiceUsed: enableTextToSpeech ? voiceSettings?.voice || 'alloy' : null
          }
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));

      } catch (error) {
        console.error('❌ Content generation failed:', error.message);
        const errorResponse = {
          success: false,
          error: 'Content generation failed',
          message: error.message
        };
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(errorResponse));
      }
    });
    return;
  }

  // Serve React app for all other routes
  if (method === 'GET') {
    const filePath = path.join(__dirname, 'client/build', 'index.html');
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath);
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(content);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
    return;
  }

  // Default 404
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Working server running on port ${PORT}`);
  console.log(`📱 Frontend: http://localhost:${PORT}`);
  console.log(`🔗 API: http://localhost:${PORT}/llm-content/generate`);
  console.log(`❤️ Health: http://localhost:${PORT}/health`);
});
