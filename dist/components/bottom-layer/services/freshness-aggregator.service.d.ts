import { ConfigService } from '@nestjs/config';
import { MediastackApiService } from './api-clients/mediastack-api.service';
import { SerperApiService } from './api-clients/serper-api.service';
import { ExaApiService } from './api-clients/exa-api.service';
import { QDFAlgorithmService } from './qdf-algorithm.service';
import { FreshnessThresholdsService } from './freshness-thresholds.service';
import { ContentFreshnessScorer } from './content-freshness-scorer.service';
import { FreshContentResult, Segment } from '../interfaces/freshness.interfaces';
export declare class FreshnessAggregatorService {
    private configService;
    private mediaStackApi;
    private serperApi;
    private exaApi;
    private qdfAlgorithm;
    private freshnessThresholds;
    private freshnessScorer;
    private readonly logger;
    private freshContentContainer;
    constructor(configService: ConfigService, mediaStackApi: MediastackApiService, serperApi: SerperApiService, exaApi: ExaApiService, qdfAlgorithm: QDFAlgorithmService, freshnessThresholds: FreshnessThresholdsService, freshnessScorer: ContentFreshnessScorer);
    aggregateFreshContent(topic: string, segment: Segment): Promise<FreshContentResult>;
    30: 7;
}
