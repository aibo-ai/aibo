import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { 
  GeminiService, 
  GeminiAnalysisRequest, 
  GeminiMultimodalRequest, 
  GeminiContentGeneration 
} from '../services/gemini.service';

@Controller('gemini')
export class GeminiController {
  constructor(private geminiService: GeminiService) {}

  /**
   * Analyze content using Gemini AI
   */
  @Post('analyze')
  async analyzeContent(@Body() request: GeminiAnalysisRequest) {
    try {
      const analysis = await this.geminiService.analyzeContent(request);
      
      return {
        success: true,
        data: analysis,
        message: 'Content analysis completed successfully'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Analyze multimodal content (text + images)
   */
  @Post('analyze-multimodal')
  async analyzeMultimodal(@Body() request: GeminiMultimodalRequest) {
    try {
      const analysis = await this.geminiService.analyzeMultimodal(request);
      
      return {
        success: true,
        data: analysis,
        message: 'Multimodal analysis completed successfully'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate content using Gemini AI
   */
  @Post('generate-content')
  async generateContent(@Body() request: GeminiContentGeneration) {
    try {
      const content = await this.geminiService.generateContent(request);
      
      return {
        success: true,
        data: content,
        message: 'Content generated successfully'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Perform competitive analysis
   */
  @Post('competitive-analysis')
  async performCompetitiveAnalysis(@Body() body: {
    competitors: string[];
    industry: string;
  }) {
    try {
      const analysis = await this.geminiService.performCompetitiveAnalysis(
        body.competitors,
        body.industry
      );
      
      return {
        success: true,
        data: analysis,
        message: 'Competitive analysis completed successfully'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Analyze market trends
   */
  @Post('trend-analysis')
  async analyzeTrends(@Body() body: {
    data: string[];
    timeframe: string;
  }) {
    try {
      const analysis = await this.geminiService.analyzeTrends(
        body.data,
        body.timeframe
      );
      
      return {
        success: true,
        data: analysis,
        message: 'Trend analysis completed successfully'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Quick content analysis for specific types
   */
  @Post('quick-analysis/:type')
  async quickAnalysis(
    @Param('type') type: string,
    @Body() body: { content: string; context?: string }
  ) {
    try {
      const request: GeminiAnalysisRequest = {
        content: body.content,
        analysisType: type as any,
        context: body.context,
        format: 'json'
      };

      const analysis = await this.geminiService.analyzeContent(request);
      
      return {
        success: true,
        data: analysis,
        message: `${type} analysis completed successfully`
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate content for specific use cases
   */
  @Post('generate/:contentType')
  async generateSpecificContent(
    @Param('contentType') contentType: string,
    @Body() body: {
      prompt: string;
      tone?: string;
      length?: string;
      targetAudience?: string;
      keywords?: string[];
    }
  ) {
    try {
      const request: GeminiContentGeneration = {
        prompt: body.prompt,
        contentType: contentType as any,
        tone: body.tone as any,
        length: body.length as any,
        targetAudience: body.targetAudience,
        keywords: body.keywords
      };

      const content = await this.geminiService.generateContent(request);
      
      return {
        success: true,
        data: content,
        message: `${contentType} content generated successfully`
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Batch analysis for multiple content pieces
   */
  @Post('batch-analysis')
  async batchAnalysis(@Body() body: {
    items: Array<{
      id: string;
      content: string;
      analysisType: string;
    }>;
  }) {
    try {
      const results = await Promise.all(
        body.items.map(async (item) => {
          const request: GeminiAnalysisRequest = {
            content: item.content,
            analysisType: item.analysisType as any,
            format: 'json'
          };

          const analysis = await this.geminiService.analyzeContent(request);
          
          return {
            id: item.id,
            analysis
          };
        })
      );
      
      return {
        success: true,
        data: results,
        message: `Batch analysis completed for ${results.length} items`
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get content suggestions based on topic
   */
  @Get('content-suggestions')
  async getContentSuggestions(
    @Query('topic') topic: string,
    @Query('contentType') contentType?: string,
    @Query('audience') audience?: string
  ) {
    try {
      if (!topic) {
        return {
          success: false,
          error: 'Topic is required'
        };
      }

      const request: GeminiAnalysisRequest = {
        content: `Generate content suggestions for topic: ${topic}`,
        analysisType: 'content',
        context: `Content type: ${contentType || 'general'}, Audience: ${audience || 'general'}`,
        format: 'json'
      };

      const analysis = await this.geminiService.analyzeContent(request);
      
      return {
        success: true,
        data: {
          topic,
          suggestions: analysis.recommendations,
          insights: analysis.insights
        },
        message: 'Content suggestions generated successfully'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Sentiment analysis
   */
  @Post('sentiment-analysis')
  async analyzeSentiment(@Body() body: { text: string; context?: string }) {
    try {
      const request: GeminiAnalysisRequest = {
        content: body.text,
        analysisType: 'sentiment',
        context: body.context,
        format: 'json'
      };

      const analysis = await this.geminiService.analyzeContent(request);
      
      return {
        success: true,
        data: {
          sentiment: analysis.analysis,
          insights: analysis.insights,
          confidence: analysis.confidence
        },
        message: 'Sentiment analysis completed successfully'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Strategic recommendations
   */
  @Post('strategic-recommendations')
  async getStrategicRecommendations(@Body() body: {
    businessContext: string;
    currentSituation: string;
    goals: string[];
    constraints?: string[];
  }) {
    try {
      const content = `
        Business Context: ${body.businessContext}
        Current Situation: ${body.currentSituation}
        Goals: ${body.goals.join(', ')}
        Constraints: ${body.constraints?.join(', ') || 'None specified'}
      `;

      const request: GeminiAnalysisRequest = {
        content,
        analysisType: 'strategy',
        format: 'json'
      };

      const analysis = await this.geminiService.analyzeContent(request);
      
      return {
        success: true,
        data: {
          recommendations: analysis.recommendations,
          insights: analysis.insights,
          strategicAnalysis: analysis.analysis
        },
        message: 'Strategic recommendations generated successfully'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Health check for Gemini service
   */
  @Get('health')
  async healthCheck() {
    try {
      const health = await this.geminiService.healthCheck();
      
      return {
        success: true,
        data: health,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}
