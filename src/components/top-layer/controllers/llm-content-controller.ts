import { Controller, Post, Body, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { LLMContentOptimizerService, LLMContentInput, LLMContentOutput } from '../services/llm-content-optimizer.service';
import { LLMContentAnalyzerService, LLMContentAnalysisResult, ChunkingResult } from '../services/llm-content-analyzer.service';
import { ApiResponse as ApiResponseType } from '../../../common/interfaces/api-response.interface';

@ApiTags('llm-content')
@Controller('llm-content')
export class LLMContentController {
  constructor(
    private readonly llmContentOptimizerService: LLMContentOptimizerService,
    private readonly llmContentAnalyzerService: LLMContentAnalyzerService,
  ) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate content optimized for LLM consumption' })
  @ApiBody({ 
    schema: {
      type: 'object', 
      properties: {
        topic: { type: 'string', description: 'Main topic for content' },
        contentType: { 
          type: 'string', 
          enum: ['blog_post', 'technical_guide', 'case_study', 'product_review', 'industry_analysis', 'social_media'],
          description: 'Type of content to generate'
        },
        audience: { type: 'string', enum: ['b2b', 'b2c'], description: 'Target audience' },
        keyPoints: { type: 'array', items: { type: 'string' }, description: 'Key points to include' },
        toneOfVoice: { 
          type: 'string', 
          enum: ['formal', 'conversational', 'technical', 'friendly'],
          description: 'Tone of voice for content'
        },
        targetLength: { type: 'string', enum: ['short', 'medium', 'long'], description: 'Target content length' },
        purpose: { type: 'string', description: 'Content purpose' },
        searchKeywords: { type: 'array', items: { type: 'string' }, description: 'SEO keywords to include' },
        llmTarget: { 
          type: 'string', 
          enum: ['general', 'gpt4', 'claude', 'palm'],
          description: 'Target LLM to optimize for'
        },
      },
      required: ['topic', 'contentType', 'audience'],
    },
  })
  @ApiResponse({ status: 201, description: 'LLM-optimized content generated successfully' })
  async generateContent(@Body() contentInput: LLMContentInput): Promise<ApiResponseType<LLMContentOutput>> {
    try {
      const result = await this.llmContentOptimizerService.generateLLMOptimizedContent(contentInput);
      return {
        data: result
      };
    } catch (error) {
      return {
        error: error.message || 'Failed to generate LLM-optimized content'
      };
    }
  }

  @Post('enhance')
  @ApiOperation({ summary: 'Enhance existing content to be more LLM-friendly' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'Content to enhance for LLM consumption' },
        targetLLM: { 
          type: 'string', 
          enum: ['general', 'gpt4', 'claude', 'palm'],
          description: 'Target LLM to optimize for'
        },
      },
      required: ['content'],
    },
  })
  @ApiResponse({ status: 200, description: 'Content enhanced successfully' })
  async enhanceContent(@Body() data: { content: string; targetLLM?: string }): Promise<ApiResponseType<{ enhancedContent: string }>> {
    try {
      const enhancedContent = await this.llmContentOptimizerService.enhanceLLMOptimization(
        data.content,
        data.targetLLM || 'general'
      );
      
      return {
        data: { enhancedContent }
      };
    } catch (error) {
      return {
        error: error.message || 'Failed to enhance content'
      };
    }
  }
  
  @Post('analyze')
  @ApiOperation({ summary: 'Analyze content for LLM optimization opportunities' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'Content to analyze' },
        targetLLM: { 
          type: 'string', 
          enum: ['general', 'gpt4', 'claude', 'palm'],
          description: 'Target LLM to analyze against'
        },
      },
      required: ['content'],
    },
  })
  @ApiResponse({ status: 200, description: 'Content analyzed successfully' })
  async analyzeContent(@Body() data: { content: string; targetLLM?: string }): Promise<ApiResponseType<LLMContentAnalysisResult>> {
    try {
      const result = await this.llmContentAnalyzerService.analyzeContent(
        data.content,
        data.targetLLM || 'general'
      );
      
      return {
        data: result
      };
    } catch (error) {
      return {
        error: error.message || 'Failed to analyze content'
      };
    }
  }
  
  @Post('chunk')
  @ApiOperation({ summary: 'Chunk content for optimal LLM processing' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'Content to chunk' },
        chunkType: { 
          type: 'string', 
          enum: ['semantic', 'fixed', 'hybrid'],
          description: 'Chunking strategy'
        },
        targetTokenSize: { 
          type: 'number', 
          description: 'Target token size for each chunk'
        },
      },
      required: ['content'],
    },
  })
  @ApiResponse({ status: 200, description: 'Content chunked successfully' })
  async chunkContent(
    @Body() data: { content: string; chunkType?: 'semantic' | 'fixed' | 'hybrid'; targetTokenSize?: number }
  ): Promise<ApiResponseType<ChunkingResult>> {
    try {
      const result = await this.llmContentAnalyzerService.chunkContent(
        data.content,
        data.chunkType || 'semantic',
        data.targetTokenSize || 500
      );
      
      return {
        data: result
      };
    } catch (error) {
      return {
        error: error.message || 'Failed to chunk content'
      };
    }
  }
}
