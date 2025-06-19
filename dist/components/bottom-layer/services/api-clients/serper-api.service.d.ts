import { ConfigService } from '@nestjs/config';
import { BaseApiClient } from './base-api-client.service';
export interface SerperSearchParams {
    q: string;
    gl?: string;
    hl?: string;
    num?: number;
    page?: number;
    type?: 'search' | 'news' | 'places' | 'images' | 'shopping';
    tbs?: string;
}
export interface SerperSearchResult {
    searchParameters: {
        q: string;
        gl: string;
        hl: string;
        num: number;
        type: string;
        page: number;
    };
    organic: SerperOrganicResult[];
    news?: SerperNewsResult[];
    knowledgeGraph?: any;
    relatedSearches?: string[];
    peopleAlsoAsk?: string[];
    pagination?: {
        currentPage: number;
        nextPage?: number;
    };
}
export interface SerperOrganicResult {
    title: string;
    link: string;
    snippet: string;
    position: number;
    date?: string;
    sitelinks?: {
        title: string;
        link: string;
        snippet?: string;
    }[];
}
export interface SerperNewsResult {
    title: string;
    link: string;
    snippet: string;
    date: string;
    source: string;
    imageUrl?: string;
    position: number;
}
export declare class SerperApiService extends BaseApiClient {
    private configService;
    constructor(configService: ConfigService);
    search(params: SerperSearchParams): Promise<SerperSearchResult>;
    searchRecent(topic: string, timeframe?: 'd1' | 'w1' | 'm1' | 'y1', resultType?: 'search' | 'news', limit?: number): Promise<SerperSearchResult>;
    getRecentNews(topic: string, daysBack?: number, limit?: number): Promise<SerperSearchResult>;
}
