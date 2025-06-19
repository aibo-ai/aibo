import { QueryIntentAnalyzerService } from '../services/query-intent-analyzer.service';
import { FreshnessAggregatorService } from '../services/freshness-aggregator.service';
import { ContentChunkerService } from '../services/content-chunker.service';
import { KeywordTopicAnalyzerService } from '../services/keyword-topic-analyzer.service';
export declare class BottomLayerController {
    private readonly queryIntentAnalyzerService;
    private readonly freshnessAggregatorService;
    private readonly contentChunkerService;
    private readonly keywordTopicAnalyzerService;
    constructor(queryIntentAnalyzerService: QueryIntentAnalyzerService, freshnessAggregatorService: FreshnessAggregatorService, contentChunkerService: ContentChunkerService, keywordTopicAnalyzerService: KeywordTopicAnalyzerService);
    analyzeIntent(userInput: any, segment: 'b2b' | 'b2c'): Promise<import("../services/query-intent-analyzer.service").QueryIntent>;
    generateContentStrategy(intentAnalysis: any, segment: 'b2b' | 'b2c'): Promise<any>;
    getFreshContent(topic: string, segment: 'b2b' | 'b2c'): Promise<import("../interfaces/freshness.interfaces").FreshContentResult>;
    calculateFreshness(content: any, segment: 'b2b' | 'b2c'): Promise<any>;
    enrichWithFreshness(params: {
        content: any;
        freshnessScore: number;
    }): Promise<any>;
    chunkContent(params: {
        content: string;
        chunkType: 'semantic' | 'fixed' | 'hybrid';
    }): Promise<any>;
    mergeChunks(params: {
        chunks: any[];
        overlapPercentage: number;
    }): Promise<any[]>;
    optimizeChunks(params: {
        chunks: any[];
        targetTokenCount: number;
    }): Promise<any[]>;
    analyzeContent(params: {
        content: string;
        segment: 'b2b' | 'b2c';
    }): Promise<any>;
    generateTopicCluster(params: {
        seedTopic: string;
        segment: 'b2b' | 'b2c';
        depth?: number;
    }): Promise<any>;
    optimizeKeywords(params: {
        content: string;
        keywords: string[];
    }): Promise<any>;
}
