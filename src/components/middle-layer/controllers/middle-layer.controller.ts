import { Controller, Post, Body, Get, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { BlufContentStructurerService } from '../services/bluf-content-structurer.service';
import { ConversationalQueryOptimizerService } from '../services/conversational-query-optimizer.service';
import { SemanticRelationshipMapperService } from '../services/semantic-relationship-mapper.service';
import { PlatformSpecificTunerService } from '../services/platform-specific-tuner.service';

@ApiTags('middle-layer')
@Controller('middle-layer')
export class MiddleLayerController {
  constructor(
    private readonly blufContentStructurerService: BlufContentStructurerService,
    private readonly conversationalQueryOptimizerService: ConversationalQueryOptimizerService,
    private readonly semanticRelationshipMapperService: SemanticRelationshipMapperService,
    private readonly platformSpecificTunerService: PlatformSpecificTunerService,
  ) {}

  @Post('structure-bluf')
  @ApiOperation({ summary: 'Structure content using BLUF methodology' })
  @ApiBody({ 
    schema: {
      type: 'object', 
      properties: {
        content: { type: 'object', description: 'Content to structure' },
        segment: { type: 'string', enum: ['b2b', 'b2c'], description: 'Target segment' },
        contentType: { type: 'string', description: 'Type of content' },
      },
      required: ['content', 'segment'],
    },
  })
  @ApiResponse({ status: 201, description: 'Content structured successfully' })
  async structureContentBluf(@Body() data: any) {
    return this.blufContentStructurerService.structureWithBluf(
      data.content, 
      data.segment,
      data.contentType
    );
  }

  @Post('structure-layered')
  @ApiOperation({ summary: 'Structure content in layered format' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        content: { type: 'object', description: 'Content to structure' },
        maxDepth: { type: 'number', description: 'Maximum depth of layers' },
        segment: { type: 'string', enum: ['b2b', 'b2c'], description: 'Target segment' },
      },
      required: ['content', 'segment'],
    },
  })
  @ApiResponse({ status: 201, description: 'Content structured successfully in layers' })
  async createLayeredStructure(@Body() data: any) {
    return this.blufContentStructurerService.createLayeredStructure(
      data.content,
      data.maxDepth || 3,
      data.segment
    );
  }

  @Post('optimize-conversation')
  @ApiOperation({ summary: 'Optimize content for conversational queries' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        content: { type: 'object', description: 'Content to optimize' },
        targetQueries: { type: 'array', items: { type: 'string' }, description: 'Target queries to optimize for' },
      },
      required: ['content', 'targetQueries'],
    },
  })
  @ApiResponse({ status: 201, description: 'Content optimized for conversational use' })
  async optimizeForConversation(@Body() data: any) {
    return this.conversationalQueryOptimizerService.optimizeForConversationalQueries(
      data.content,
      data.targetQueries
    );
  }

  @Post('identify-query-gaps')
  @ApiOperation({ summary: 'Identify content gaps for given queries' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        queries: { type: 'array', items: { type: 'string' }, description: 'Queries to analyze' },
        content: { type: 'object', description: 'Content to check against queries' },
      },
      required: ['queries', 'content'],
    },
  })
  @ApiResponse({ status: 201, description: 'Query gaps identified' })
  async findQueryGaps(@Body() data: any) {
    return this.conversationalQueryOptimizerService.identifyQueryGaps(
      data.queries,
      data.content
    );
  }

  @Post('generate-anticipatory-questions')
  @ApiOperation({ summary: 'Generate anticipatory follow-up questions' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        content: { type: 'object', description: 'Content to generate questions for' },
        count: { type: 'number', description: 'Number of questions to generate' },
      },
      required: ['content'],
    },
  })
  @ApiResponse({ status: 201, description: 'Anticipatory questions generated' })
  async generateFollowupQuestions(@Body() data: any) {
    return this.conversationalQueryOptimizerService.generateAnticipatoryQuestions(
      data.content,
      data.count || 5
    );
  }

  @Post('map-semantic-relationships')
  @ApiOperation({ summary: 'Map semantic relationships between content entities' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        content: { type: 'object', description: 'Content to analyze for relationships' },
        segment: { type: 'string', enum: ['b2b', 'b2c'], description: 'Target segment' },
      },
      required: ['content', 'segment'],
    },
  })
  @ApiResponse({ status: 201, description: 'Semantic relationships mapped' })
  async mapRelationships(@Body() data: any) {
    return this.semanticRelationshipMapperService.mapSemanticRelationships(
      data.content,
      data.segment
    );
  }

  @Post('enhance-semantic-inferences')
  @ApiOperation({ summary: 'Enhance content with semantic inferences' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        content: { type: 'object', description: 'Content to enhance' },
        knowledgeGraph: { type: 'object', description: 'Knowledge graph to use for inference' },
      },
      required: ['content', 'knowledgeGraph'],
    },
  })
  @ApiResponse({ status: 201, description: 'Content enhanced with semantic inferences' })
  async enhanceWithInferences(@Body() data: any) {
    return this.semanticRelationshipMapperService.enhanceWithSemanticInferences(
      data.content,
      data.knowledgeGraph
    );
  }

  @Post('generate-cross-reference')
  @ApiOperation({ summary: 'Generate cross-reference map between concepts' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        concepts: { type: 'array', items: { type: 'string' }, description: 'Concepts to cross-reference' },
      },
      required: ['concepts'],
    },
  })
  @ApiResponse({ status: 201, description: 'Cross-reference map generated' })
  async generateCrossReferences(@Body() data: any) {
    return this.semanticRelationshipMapperService.generateCrossReferenceMap(
      data.concepts
    );
  }

  @Post('optimize-for-platform')
  @ApiOperation({ summary: 'Optimize content for specific LLM platform' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        content: { type: 'object', description: 'Content to optimize' },
        platform: { type: 'string', enum: ['chatgpt', 'perplexity', 'gemini', 'grok'], description: 'Target platform' },
      },
      required: ['content', 'platform'],
    },
  })
  @ApiResponse({ status: 201, description: 'Content optimized for platform' })
  async optimizeForPlatform(@Body() data: any) {
    return this.platformSpecificTunerService.optimizeForPlatform(
      data.content,
      data.platform
    );
  }

  @Post('optimize-multi-platform')
  @ApiOperation({ summary: 'Optimize content for multiple LLM platforms' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        content: { type: 'object', description: 'Content to optimize' },
        platforms: { type: 'array', items: { type: 'string', enum: ['chatgpt', 'perplexity', 'gemini', 'grok'] }, description: 'Target platforms' },
      },
      required: ['content', 'platforms'],
    },
  })
  @ApiResponse({ status: 201, description: 'Content optimized for multiple platforms' })
  async optimizeForMultiplePlatforms(@Body() data: any) {
    return this.platformSpecificTunerService.optimizeForMultiplePlatforms(
      data.content,
      data.platforms
    );
  }

  @Post('test-cross-platform')
  @ApiOperation({ summary: 'Test content performance across platforms' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        content: { type: 'object', description: 'Content to test' },
        platforms: { type: 'array', items: { type: 'string' }, description: 'Platforms to test on' },
      },
      required: ['content', 'platforms'],
    },
  })
  @ApiResponse({ status: 201, description: 'Cross-platform performance results' })
  async testCrossPlatformPerformance(@Body() data: any) {
    return this.platformSpecificTunerService.testCrossplatformPerformance(
      data.content,
      data.platforms
    );
  }
}
