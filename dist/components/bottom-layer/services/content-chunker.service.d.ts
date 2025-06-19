import { ConfigService } from '@nestjs/config';
export declare class ContentChunkerService {
    private configService;
    constructor(configService: ConfigService);
    chunkContent(content: string, chunkType: 'semantic' | 'fixed' | 'hybrid'): Promise<any>;
    mergeChunksWithOverlap(chunks: any[], overlapPercentage: number): Promise<any[]>;
    optimizeChunksForLLM(chunks: any[], targetTokenCount: number): Promise<any[]>;
    private semanticChunking;
    private fixedSizeChunking;
    private hybridChunking;
    private truncateToTokenLimit;
}
