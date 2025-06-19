import { ConfigService } from '@nestjs/config';
import { ContentType } from '../../../common/interfaces/content.interfaces';
import { FreshnessThreshold, Segment } from '../interfaces/freshness.interfaces';
export declare class FreshnessThresholdsService {
    private configService;
    private readonly logger;
    private thresholds;
    constructor(configService: ConfigService);
    private initializeThresholds;
    getFreshnessThreshold(contentType: ContentType, segment: Segment): FreshnessThreshold;
    adjustThresholdByQDF(threshold: FreshnessThreshold, qdfScore: number): FreshnessThreshold;
    setCustomThreshold(threshold: FreshnessThreshold): void;
    getAllThresholds(): FreshnessThreshold[];
}
