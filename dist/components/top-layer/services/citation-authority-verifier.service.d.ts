import { ConfigService } from '@nestjs/config';
export declare class CitationAuthorityVerifierService {
    private configService;
    constructor(configService: ConfigService);
    verifyCitations(content: any, segment: 'b2b' | 'b2c'): Promise<any>;
    enhanceCitationAuthority(content: any, segment: 'b2b' | 'b2c'): Promise<any>;
    generateCitationStrategy(topic: string, segment: 'b2b' | 'b2c'): Promise<any>;
    private extractCitations;
    private generateSampleCitationText;
    private generateSampleSource;
    private verifySingleCitation;
    private calculateOverallCredibility;
    private generateEnhancedCitations;
    private integrateCitationsIntoContent;
    private generateAuthorityHierarchy;
}
