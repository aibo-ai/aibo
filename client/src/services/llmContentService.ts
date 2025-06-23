import axios from 'axios';
import { API_BASE_URL, USE_MOCK_DATA } from '../config';
import {
  LLMContentInput,
  LLMContentOutput,
  LLMContentAnalysisResult,
  ChunkingResult,
  ApiResponse
} from '../types/llmContent';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Mock data generator for when backend is unavailable
const generateMockContent = async (data: LLMContentInput): Promise<ApiResponse<LLMContentOutput>> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  const sections = [
    {
      title: 'Introduction',
      content: `Welcome to this comprehensive guide on ${data.topic}. This content has been generated with AI-enhanced features for ${data.audience} audience, providing valuable insights and actionable strategies. Our advanced content generation system leverages multiple AI technologies to deliver high-quality, engaging content.`
    },
    {
      title: 'Key Concepts and Fundamentals',
      content: `Understanding ${data.topic} is essential for ${data.audience} success. This section covers fundamental concepts, best practices, and emerging trends that will help you stay ahead in your field. We explore the core principles that drive success in this area.`
    }
  ];

  // Add key points as sections if provided
  if (data.keyPoints && data.keyPoints.length > 0) {
    data.keyPoints.forEach((point, index) => {
      sections.push({
        title: `Key Focus Area ${index + 1}: ${point}`,
        content: `**${point}** represents a critical aspect of ${data.topic} implementation. This section provides detailed insights, practical applications, and proven strategies for maximizing impact in this area. Industry leaders consistently emphasize the importance of ${point} in achieving sustainable results.`
      });
    });
  } else {
    sections.push(
      {
        title: 'Implementation Strategy',
        content: `A practical approach to implementing ${data.topic} in your organization, with step-by-step guidance, proven methodologies, and expert recommendations for maximum impact. This strategic framework has been tested across various industries.`
      },
      {
        title: 'Best Practices & Recommendations',
        content: `Industry-leading practices for ${data.topic} implementation, including common pitfalls to avoid, success metrics to track, and optimization strategies for long-term success. These recommendations are based on extensive research and real-world applications.`
      }
    );
  }

  sections.push({
    title: 'Conclusion and Next Steps',
    content: `In conclusion, ${data.topic} represents a significant opportunity for ${data.audience} organizations to drive meaningful results. By implementing the strategies and best practices outlined in this guide, you can achieve sustainable success and competitive advantage.`
  });

  const mockContent: LLMContentOutput = {
    contentId: `ai_content_${Date.now()}`,
    title: `${data.topic}: A Comprehensive Guide for ${data.audience?.toUpperCase() || 'Business'} Success`,
    summary: `This comprehensive guide explores ${data.topic} for ${data.audience} audiences, providing AI-enhanced insights, actionable strategies, and practical implementation guidance.`,
    sections: sections,
    contentType: data.contentType || 'blog_post',
    audience: data.audience || 'b2b',
    toneOfVoice: data.toneOfVoice || 'professional',
    metadata: {
      optimizedFor: data.llmTarget || 'general',
      estimatedTokenCount: sections.reduce((total, section) => total + Math.floor(section.content.length / 4), 0),
      llmQualityScore: 0.92,
      semanticScore: 0.88,
      wordCount: sections.reduce((total, section) => total + section.content.split(' ').length, 0),
      readingTime: Math.ceil(sections.reduce((total, section) => total + section.content.split(' ').length, 0) / 200),
      fleschReadingEase: 72,
      readingLevel: 'Standard',
      hasImage: data.enableImageGeneration || false,
      hasAudio: data.enableTextToSpeech || false,
      imageStyle: data.enableImageGeneration ? (data.imageStyle || 'professional') : undefined,
      voiceUsed: data.enableTextToSpeech ? (data.voiceSettings?.voice || 'alloy') : undefined,
      qualityScore: 92,
      seoOptimized: true,
      aiEnhanced: true
    },
    generatedAt: new Date().toISOString()
  };

  // Add AI-generated image if enabled
  if (data.enableImageGeneration) {
    (mockContent as any).imageGeneration = {
      imageUrl: `data:image/svg+xml;base64,${btoa(`
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
            ${data.imageStyle || 'Professional'} Style
          </text>
          <text x="400" y="380" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#64748b">
            Topic: ${data.topic}
          </text>
          <text x="400" y="410" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#94a3b8">
            Generated with DALL-E Integration
          </text>
        </svg>
      `)}`,
      prompt: `Professional ${data.imageStyle || 'business'} illustration about ${data.topic} for ${data.audience} audience`,
      style: data.imageStyle || 'professional',
      generatedAt: new Date().toISOString(),
      aiProvider: 'DALL-E',
      dimensions: '800x600'
    };
  }

  // Add AI-generated audio if enabled
  if (data.enableTextToSpeech) {
    const audioData = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT';

    (mockContent as any).audioGeneration = {
      audioData: audioData,
      audioUrl: audioData,
      audioFormat: 'wav',
      voiceId: data.voiceSettings?.voice || 'alloy',
      voiceProfile: data.voiceSettings?.voice || 'alloy',
      voiceSettings: data.voiceSettings || { voice: 'alloy', speed: 1.0, stability: 0.75 },
      textLength: mockContent.sections.reduce((total, section) => total + section.content.length, 0),
      generatedAt: new Date().toISOString(),
      aiProvider: 'ElevenLabs',
      duration: '3:45'
    };
  }

  return {
    data: mockContent,
    success: true,
    message: 'Content generated successfully with AI enhancements (Mock Mode)'
  };
};

export const llmContentService = {
  /**
   * Generate LLM-optimized content based on input specifications
   */
  generateContent: async (data: LLMContentInput): Promise<ApiResponse<LLMContentOutput>> => {
    // Use mock data by default for demo purposes
    if (USE_MOCK_DATA) {
      console.log('Using mock data for content generation (demo mode)');
      return await generateMockContent(data);
    }

    try {
      const response = await api.post<ApiResponse<LLMContentOutput>>('/llm-content/generate', data);
      return response.data;
    } catch (error) {
      console.warn('Backend unavailable, using mock data:', error);
      // Fallback to mock data when backend is unavailable
      return await generateMockContent(data);
    }
  },

  /**
   * Enhance existing content to be more LLM-friendly
   */
  enhanceContent: async (data: { content: string; targetLLM?: string }): Promise<ApiResponse<{ enhancedContent: string }>> => {
    try {
      const response = await api.post<ApiResponse<{ enhancedContent: string }>>('/llm-content/enhance', data);
      return response.data;
    } catch (error) {
      console.warn('Backend unavailable for enhance, using mock data:', error);
      // Mock enhancement
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        data: {
          enhancedContent: `${data.content}\n\n[Enhanced for ${data.targetLLM || 'general'} LLM]\n\nThis content has been optimized for better LLM processing with improved structure, clarity, and search visibility. Key enhancements include semantic structure, improved keyword density, enhanced readability, and optimized formatting for AI consumption.`
        },
        success: true,
        message: 'Content enhanced successfully (Mock Mode)'
      };
    }
  },

  /**
   * Analyze content for LLM optimization opportunities
   */
  analyzeContent: async (data: { content: string; targetLLM?: string }): Promise<ApiResponse<LLMContentAnalysisResult>> => {
    try {
      const response = await api.post<ApiResponse<LLMContentAnalysisResult>>('/llm-content/analyze', data);
      return response.data;
    } catch (error) {
      console.warn('Backend unavailable for analyze, using mock data:', error);
      // Mock analysis
      await new Promise(resolve => setTimeout(resolve, 800));
      return {
        data: {
          analysisId: `analysis_${Date.now()}`,
          contentLength: data.content?.length || 0,
          targetLLM: data.targetLLM || 'general',
          metrics: {
            readabilityScore: 0.85,
            semanticDensity: 0.78,
            contextualRelevance: 0.92,
            cohesionScore: 0.88,
            llmQualityScore: 0.90
          },
          issues: [
            {
              type: 'readability',
              severity: 'low',
              description: 'Some sentences could be simplified for better readability',
              examples: ['Complex technical terminology'],
              remediation: 'Consider adding definitions for technical terms'
            }
          ],
          recommendations: [
            'Add more semantic structure with headings',
            'Include relevant keywords naturally',
            'Improve paragraph transitions',
            'Add examples and case studies'
          ],
          timestamp: new Date().toISOString()
        },
        success: true,
        message: 'Content analyzed successfully (Mock Mode)'
      };
    }
  },

  /**
   * Chunk content for optimal LLM processing
   */
  chunkContent: async (data: {
    content: string;
    chunkType?: 'semantic' | 'fixed' | 'hybrid';
    targetTokenSize?: number
  }): Promise<ApiResponse<ChunkingResult>> => {
    try {
      const response = await api.post<ApiResponse<ChunkingResult>>('/llm-content/chunk', data);
      return response.data;
    } catch (error) {
      console.warn('Backend unavailable for chunk, using mock data:', error);
      // Mock chunking
      await new Promise(resolve => setTimeout(resolve, 600));
      const chunks = data.content ? data.content.split('\n\n').filter(chunk => chunk.trim().length > 0) : [];

      return {
        data: {
          chunkingId: `chunking_${Date.now()}`,
          originalLength: data.content?.length || 0,
          contentSnapshot: data.content?.substring(0, 100) + '...' || '',
          chunkType: data.chunkType || 'semantic',
          targetTokenSize: data.targetTokenSize || 1000,
          chunks: chunks.map((chunk, index) => ({
            id: `chunk_${index}`,
            content: chunk,
            estimatedTokenCount: Math.floor(chunk.length / 4),
            startPosition: index * 100,
            endPosition: (index + 1) * 100
          })),
          metrics: {
            chunkCount: chunks.length,
            averageChunkSize: chunks.length > 0 ? Math.floor(chunks.reduce((total, chunk) => total + chunk.length, 0) / chunks.length) : 0,
            tokenReductionPercentage: 15,
            contextPreservationScore: 0.85
          },
          timestamp: new Date().toISOString()
        },
        success: true,
        message: 'Content chunked successfully (Mock Mode)'
      };
    }
  },
};

export default llmContentService;
