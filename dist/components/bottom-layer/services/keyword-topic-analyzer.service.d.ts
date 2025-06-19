import { ConfigService } from '@nestjs/config';
export declare class KeywordTopicAnalyzerService {
    private configService;
    constructor(configService: ConfigService);
    analyzeContent(content: string, segment: 'b2b' | 'b2c'): Promise<any>;
    generateTopicCluster(seedTopic: string, segment: 'b2b' | 'b2c', depth?: number): Promise<any>;
    optimizeKeywordPlacement(content: string, keywords: string[]): Promise<any>;
    private extractTopics;
    private extractKeywords;
    private extractEntityRelationships;
    private identifySemanticFields;
    private generateRelatedTopics;
    private generateMockKeywords;
    private getRandomElements;
    private insertKeywordInSentence;
}
