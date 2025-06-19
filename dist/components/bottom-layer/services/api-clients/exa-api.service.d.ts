import { ConfigService } from '@nestjs/config';
import { BaseApiClient } from './base-api-client.service';
export interface ExaSearchParams {
    query: string;
    numResults?: number;
    startCursor?: string;
    useAutoprompt?: boolean;
    type?: 'keyword' | 'neural';
    highlights?: boolean;
    includeDomains?: string[];
    excludeDomains?: string[];
    startPublishedDate?: string;
    endPublishedDate?: string;
    maxContentLength?: number;
    minContentLength?: number;
}
export interface ExaSearchResponse {
    results: ExaResult[];
    autopromptString?: string;
    nextCursor?: string;
}
export interface ExaResult {
    title: string;
    url: string;
    publishedDate?: string;
    author?: string;
    text: string;
    highlights?: {
        text: string[];
    };
    score?: number;
}
export declare class ExaApiService extends BaseApiClient {
    private configService;
    constructor(configService: ConfigService);
    search(params: ExaSearchParams): Promise<ExaSearchResponse>;
    getRecentContent(topic: string, daysBack?: number, limit?: number): Promise<ExaSearchResponse>;
}
