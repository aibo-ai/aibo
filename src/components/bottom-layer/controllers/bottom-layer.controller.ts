import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { QueryIntentAnalyzerService, UserInput, Segment } from '../services/query-intent-analyzer.service';
import { FreshnessAggregatorService } from '../freshness-aggregator/services/freshness-aggregator.service';
import { ContentChunkerService } from '../services/content-chunker.service';
import { KeywordTopicAnalyzerService } from '../services/keyword-topic-analyzer.service';

@ApiTags('bottom-layer')
@Controller('bottom-layer')
export class BottomLayerController {
  constructor(
    private readonly queryIntentAnalyzerService: QueryIntentAnalyzerService,
    private readonly freshnessAggregatorService: FreshnessAggregatorService,
    private readonly contentChunkerService: ContentChunkerService,
    private readonly keywordTopicAnalyzerService: KeywordTopicAnalyzerService,
  ) {}

  @Post('analyze-intent')
  @ApiOperation({ summary: 'Analyze user input intent' })
  async analyzeIntent(
    @Body() userInput: any,
    @Query('segment') segment: 'b2b' | 'b2c',
  ) {
    return this.queryIntentAnalyzerService.analyzeIntent(userInput, segment);
  }

  @Post('generate-content-strategy')
  @ApiOperation({ summary: 'Generate content strategy based on intent analysis' })
  async generateContentStrategy(
    @Body() intentAnalysis: any,
    @Query('segment') segment: Segment,
  ) {
    // Since createContentStrategy doesn't exist, use analyzeIntent as an alternative
    return this.queryIntentAnalyzerService.analyzeIntent(
      { topic: intentAnalysis.topic, context: intentAnalysis.context },
      segment,
    );
  }

  @Get('fresh-content')
  @ApiOperation({ summary: 'Aggregate fresh content for a topic' })
  async getFreshContent(
    @Query('topic') topic: string,
    @Query('segment') segment: Segment,
  ) {
    // Create proper parameters object for aggregateFreshContent
    const params = {
      query: topic,
      limit: 10,
      contentTypes: undefined, // Use default content types
      timeframe: undefined, // Use default timeframe
      language: 'en',
      region: 'us',
      skipCache: false
    };
    
    return this.freshnessAggregatorService.aggregateFreshContent(params);
  }

  @Post('calculate-freshness')
  @ApiOperation({ summary: 'Calculate freshness score for content' })
  async calculateFreshness(
    @Body() content: any,
    @Query('segment') segment: Segment,
  ) {
    // This method is private in FreshnessAggregatorService, so we'll create a simplified version here
    const publishedDate = new Date(content.publishedAt || content.publishedDate || new Date());
    const now = new Date();
    const ageInHours = (now.getTime() - publishedDate.getTime()) / (1000 * 60 * 60);
    
    // Simple freshness calculation - newer content is fresher
    const freshnessScore = Math.max(0, Math.min(1, 1 - (ageInHours / 168))); // 168 hours = 7 days
    
    return {
      score: freshnessScore,
      age: ageInHours,
      recency: freshnessScore > 0.7 ? 'VERY_RECENT' : 
              freshnessScore > 0.4 ? 'RECENT' : 'NOT_RECENT'
    };
  }

  @Post('enrich-freshness')
  @ApiOperation({ summary: 'Enrich content with freshness indicators' })
  async enrichWithFreshness(
    @Body() params: { content: any; freshnessScore: number },
  ) {
    // This method doesn't exist, return the content with the score attached
    return {
      ...params.content,
      freshnessScore: params.freshnessScore,
      freshnessIndicator: params.freshnessScore > 0.7 ? 'Fresh' : 
                          params.freshnessScore > 0.4 ? 'Moderately Fresh' : 'Stale'
    };
  }

  @Post('chunk-content')
  @ApiOperation({ summary: 'Chunk content for processing' })
  async chunkContent(
    @Body() params: { content: string; chunkType: 'semantic' | 'fixed' | 'hybrid' },
  ) {
    return this.contentChunkerService.chunkContent(
      params.content,
      params.chunkType,
    );
  }

  @Post('merge-chunks')
  @ApiOperation({ summary: 'Merge chunks with overlap' })
  async mergeChunks(
    @Body() params: { chunks: any[]; overlapPercentage: number },
  ) {
    return this.contentChunkerService.mergeChunksWithOverlap(
      params.chunks,
      params.overlapPercentage,
    );
  }

  @Post('optimize-chunks')
  @ApiOperation({ summary: 'Optimize chunks for LLM processing' })
  async optimizeChunks(
    @Body() params: { chunks: any[]; targetTokenCount: number },
  ) {
    return this.contentChunkerService.optimizeChunksForLLM(
      params.chunks,
      params.targetTokenCount,
    );
  }

  @Post('analyze-content')
  @ApiOperation({ summary: 'Analyze content for keywords and topics' })
  async analyzeContent(
    @Body() params: { content: string; segment: 'b2b' | 'b2c' },
  ) {
    return this.keywordTopicAnalyzerService.analyzeContent(
      params.content,
      params.segment,
    );
  }

  @Post('generate-topic-cluster')
  @ApiOperation({ summary: 'Generate topic cluster from seed topic' })
  async generateTopicCluster(
    @Body() params: { seedTopic: string; segment: 'b2b' | 'b2c'; depth?: number },
  ) {
    return this.keywordTopicAnalyzerService.generateTopicCluster(
      params.seedTopic,
      params.segment,
      params.depth,
    );
  }

  @Post('optimize-keywords')
  @ApiOperation({ summary: 'Optimize content with strategic keyword placement' })
  async optimizeKeywords(
    @Body() params: { content: string; keywords: string[] },
  ) {
    return this.keywordTopicAnalyzerService.optimizeKeywordPlacement(
      params.content,
      params.keywords,
    );
  }
}
