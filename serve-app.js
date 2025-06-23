const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from React build
app.use(express.static(path.join(__dirname, 'client/build')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Content Architect Frontend'
  });
});

// Mock LLM Content Generation endpoint
app.post('/llm-content/generate', async (req, res) => {
  try {
    console.log('🚀 Content generation request received:', req.body);
    
    const {
      topic,
      contentType,
      audience,
      keyPoints,
      toneOfVoice,
      targetLength,
      purpose,
      searchKeywords,
      llmTarget,
      enableImageGeneration,
      enableTextToSpeech,
      imageStyle,
      voiceSettings
    } = req.body;

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Generate content sections
    const sections = [
      {
        title: 'Introduction',
        content: `Welcome to this comprehensive guide on ${topic}. This content has been generated with AI-enhanced features for ${audience} audience, providing valuable insights and actionable strategies. Our advanced content generation system leverages multiple AI technologies to deliver high-quality, engaging content.`
      },
      {
        title: 'Key Concepts and Fundamentals',
        content: `Understanding ${topic} is essential for ${audience} success. This section covers fundamental concepts, best practices, and emerging trends that will help you stay ahead in your field. We explore the core principles that drive success in this area.`
      }
    ];

    // Add key points as sections if provided
    if (keyPoints && keyPoints.length > 0) {
      keyPoints.forEach((point, index) => {
        sections.push({
          title: `Key Focus Area ${index + 1}: ${point}`,
          content: `**${point}** represents a critical aspect of ${topic} implementation. This section provides detailed insights, practical applications, and proven strategies for maximizing impact in this area. Industry leaders consistently emphasize the importance of ${point} in achieving sustainable results.`
        });
      });
    } else {
      sections.push(
        {
          title: 'Implementation Strategy',
          content: `A practical approach to implementing ${topic} in your organization, with step-by-step guidance, proven methodologies, and expert recommendations for maximum impact. This strategic framework has been tested across various industries.`
        },
        {
          title: 'Best Practices & Recommendations',
          content: `Industry-leading practices for ${topic} implementation, including common pitfalls to avoid, success metrics to track, and optimization strategies for long-term success. These recommendations are based on extensive research and real-world applications.`
        }
      );
    }

    sections.push({
      title: 'Conclusion and Next Steps',
      content: `In conclusion, ${topic} represents a significant opportunity for ${audience} organizations to drive meaningful results. By implementing the strategies and best practices outlined in this guide, you can achieve sustainable success and competitive advantage.`
    });

    const generatedContent = {
      contentId: `ai_content_${Date.now()}`,
      title: `${topic}: A Comprehensive Guide for ${audience?.toUpperCase() || 'Business'} Success`,
      summary: `This comprehensive guide explores ${topic} for ${audience} audiences, providing AI-enhanced insights, actionable strategies, and practical implementation guidance.`,
      sections: sections,
      contentType: contentType || 'blog_post',
      audience: audience || 'b2b',
      toneOfVoice: toneOfVoice || 'professional',
      metadata: {
        optimizedFor: llmTarget || 'general',
        estimatedTokenCount: sections.reduce((total, section) => total + Math.floor(section.content.length / 4), 0),
        llmQualityScore: 0.92,
        semanticScore: 0.88,
        wordCount: sections.reduce((total, section) => total + section.content.split(' ').length, 0),
        readingTime: Math.ceil(sections.reduce((total, section) => total + section.content.split(' ').length, 0) / 200),
        fleschReadingEase: 72,
        readingLevel: 'Standard',
        hasImage: enableImageGeneration || false,
        hasAudio: enableTextToSpeech || false,
        imageStyle: enableImageGeneration ? (imageStyle || 'professional') : null,
        voiceUsed: enableTextToSpeech ? (voiceSettings?.voice || 'alloy') : null,
        qualityScore: 92,
        seoOptimized: true,
        aiEnhanced: true
      },
      generatedAt: new Date().toISOString()
    };

    // Add AI-generated image if enabled
    if (enableImageGeneration) {
      generatedContent.imageGeneration = {
        imageUrl: `data:image/svg+xml;base64,${Buffer.from(`
          <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:0.1" />
                <stop offset="100%" style="stop-color:#1e40af;stop-opacity:0.2" />
              </linearGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#bg)"/>
            <circle cx="400" cy="300" r="120" fill="#3b82f6" opacity="0.7"/>
            <rect x="320" y="220" width="160" height="160" fill="none" stroke="#1e40af" stroke-width="3" opacity="0.8"/>
            <text x="400" y="320" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#1e40af">
              AI Generated
            </text>
            <text x="400" y="350" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="#64748b">
              ${imageStyle || 'Professional'} Style
            </text>
            <text x="400" y="380" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#64748b">
              Topic: ${topic}
            </text>
            <text x="400" y="410" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#94a3b8">
              Generated with DALL-E Integration
            </text>
          </svg>
        `).toString('base64')}`,
        prompt: `Professional ${imageStyle || 'business'} illustration about ${topic} for ${audience} audience`,
        style: imageStyle || 'professional',
        generatedAt: new Date().toISOString(),
        aiProvider: 'DALL-E',
        dimensions: '800x600'
      };
    }

    // Add AI-generated audio if enabled
    if (enableTextToSpeech) {
      const audioData = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT';
      
      generatedContent.audioGeneration = {
        audioData: audioData,
        audioUrl: audioData,
        audioFormat: 'wav',
        voiceId: voiceSettings?.voice || 'alloy',
        voiceProfile: voiceSettings?.voice || 'alloy',
        voiceSettings: voiceSettings || { voice: 'alloy', speed: 1.0, stability: 0.75 },
        textLength: generatedContent.sections.reduce((total, section) => total + section.content.length, 0),
        generatedAt: new Date().toISOString(),
        aiProvider: 'ElevenLabs',
        duration: '3:45'
      };
    }

    console.log('✅ Content generated successfully');

    res.json({
      success: true,
      data: generatedContent,
      message: 'Content generated successfully with AI enhancements'
    });

  } catch (error) {
    console.error('❌ Error generating content:', error);
    res.status(500).json({
      success: false,
      error: `Failed to generate content: ${error.message}`,
      message: 'Content generation failed'
    });
  }
});

// Mock endpoints for other LLM content services
app.post('/llm-content/analyze', (req, res) => {
  res.json({
    success: true,
    data: {
      analysisId: `analysis_${Date.now()}`,
      metrics: { readabilityScore: 0.85, llmQualityScore: 0.90 },
      recommendations: ['Add more semantic structure', 'Include relevant keywords']
    }
  });
});

app.post('/llm-content/chunk', (req, res) => {
  res.json({
    success: true,
    data: {
      chunkingId: `chunking_${Date.now()}`,
      chunks: [{ id: 'chunk_1', content: 'Sample chunk content' }]
    }
  });
});

// Catch all handler: send back React's index.html file for any non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Content Architect App running on port ${PORT}`);
  console.log(`📱 Frontend: http://localhost:${PORT}`);
  console.log(`🔗 API: http://localhost:${PORT}/llm-content/generate`);
  console.log(`❤️ Health: http://localhost:${PORT}/health`);
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});
