import { ConfigService } from '@nestjs/config';
import { BaseApiClient } from './base-api-client.service';
export interface MediastackNewsParams {
    keywords?: string;
    categories?: string;
    countries?: string;
    languages?: string;
    sources?: string;
    limit?: number;
    offset?: number;
    sort?: 'published_desc' | 'published_asc' | 'popularity';
    date?: string;
}
export interface MediastackNewsResponse {
    pagination: {
        limit: number;
        offset: number;
        count: number;
        total: number;
    };
    data: MediastackNewsItem[];
}
export interface MediastackNewsItem {
    title: string;
    description: string;
    url: string;
    source: string;
    image?: string;
    category: string;
    language: string;
    country: string;
    published_at: string;
}
export declare class MediastackApiService extends BaseApiClient {
    private configService;
    constructor(configService: ConfigService);
    searchNews(params: MediastackNewsParams): Promise<MediastackNewsResponse>;
    getRecentNews(topic: string, daysBack?: number, limit?: number): Promise<MediastackNewsResponse>;
}
