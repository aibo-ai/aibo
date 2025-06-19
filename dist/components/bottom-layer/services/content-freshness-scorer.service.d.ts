import { FreshContentItem, FreshnessLevel, Segment } from '../interfaces/freshness.interfaces';
export declare class ContentFreshnessScorer {
    private readonly logger;
    calculateFreshnessScore(content: FreshContentItem, segment: Segment): number;
    private calculateB2BFreshnessScore;
    private calculateB2CFreshnessScore;
    private getAgeDecayFactor;
    private getMaxAgeDays;
    private estimateComprehensiveness;
    private estimateAuthority;
    private estimateEngagement;
    private extractDomain;
    getFreshnessLevel(freshnessScore: number): FreshnessLevel;
    generateFreshnessIndicators(freshnessLevel: FreshnessLevel, publishedDate: string): any;
    private getRecencyStatement;
    private getFreshnessSignals;
}
