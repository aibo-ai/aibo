import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { QueryIntentAnalyzerService } from '../services/query-intent-analyzer.service';
import { FreshnessAggregatorService } from '../services/freshness-aggregator.service';
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
    @Query('segment') segment: 'b2b' | 'b2c',
  ) {
    return this.queryIntentAnalyzerService.createContentStrategy(
      intentAnalysis,
      segment,
    );
  }

  @Get('fresh-content')
  @ApiOperation({ summary: 'Aggregate fresh content for a topic' })
  async getFreshContent(
    @Query('topic') topic: string,
    @Query('segment') segment: 'b2b' | 'b2c',
  ) {
    return this.freshnessAggregatorService.aggregateFreshContent(topic, segment);
  }

  @Post('calculate-freshness')
  @ApiOperation({ summary: 'Calculate freshness score for content' })
  async calculateFreshness(
    @Body() content: any,
    @Query('segment') segment: 'b2b' | 'b2c',
  ) {
    return this.freshnessAggregatorService.calculateFreshnessScore(
      content,
      segment,
    );
  }

  @Post('enrich-freshness')
  @ApiOperation({ summary: 'Enrich content with freshness indicators' })
  async enrichWithFreshness(
    @Body() params: { content: any; freshnessScore: number },
  ) {
    return this.freshnessAggregatorService.enrichWithFreshnessIndicators(
      params.content,
      params.freshnessScore,
    );
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
