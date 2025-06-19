"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExternalApisService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("axios");
let ExternalApisService = class ExternalApisService {
    constructor(configService) {
        this.configService = configService;
        this.exaApiUrl = this.configService.get('EXA_API_URL');
        this.exaApiKey = this.configService.get('EXA_API_KEY');
        this.serpApiUrl = this.configService.get('SERP_API_URL');
        this.serpApiKey = this.configService.get('SERP_API_KEY');
        this.socialSearcherUrl = this.configService.get('SOCIAL_SEARCHER_SEARCH_URL');
        this.socialSearcherApiKey = this.configService.get('SOCIAL_SEARCHER_API_KEY');
        this.xApiUrl = this.configService.get('X_API_URL');
        this.xApiKey = this.configService.get('X_API_KEY');
        this.xApiSecret = this.configService.get('X_API_SECRET');
        this.newsApiUrl = this.configService.get('NEWS_API_URL');
        this.newsApiKey = this.configService.get('NEWS_API_KEY');
        this.mediastackApiUrl = this.configService.get('MEDIASTACK_API_URL');
        this.mediastackApiKey = this.configService.get('MEDIASTACK_API_KEY');
    }
    async searchWeb(query, options = {}) {
        try {
            const response = await axios_1.default.get(this.exaApiUrl, {
                params: {
                    q: query,
                    numResults: options.numResults || 10,
                    includeDomains: options.includeDomains || '',
                    excludeDomains: options.excludeDomains || '',
                    useAutoprompt: options.useAutoprompt || true,
                },
                headers: {
                    'x-api-key': this.exaApiKey,
                    'Content-Type': 'application/json',
                },
            });
            return response.data.results || [];
        }
        catch (error) {
            console.error('Error searching web with Exa API:', error.message);
            throw new Error(`Failed to search web: ${error.message}`);
        }
    }
    async getSerpData(query, options = {}) {
        try {
            const baseUrl = this.serpApiUrl.split('?')[0];
            const response = await axios_1.default.get(baseUrl, {
                params: Object.assign({ engine: options.engine || 'google_trends', q: query, api_key: this.serpApiKey, gl: options.country || 'us', hl: options.language || 'en' }, options),
            });
            return response.data || {};
        }
        catch (error) {
            console.error('Error getting SERP data:', error.message);
            throw new Error(`Failed to get SERP data: ${error.message}`);
        }
    }
    async searchSocialMedia(query, options = {}) {
        try {
            const response = await axios_1.default.get(this.socialSearcherUrl, {
                params: {
                    q: query,
                    key: this.socialSearcherApiKey,
                    network: options.network || 'all',
                    limit: options.limit || 10,
                    type: options.type || 'recent',
                    lang: options.language || 'en',
                },
            });
            return response.data || {};
        }
        catch (error) {
            console.error('Error searching social media:', error.message);
            throw new Error(`Failed to search social media: ${error.message}`);
        }
    }
    async searchTwitter(query, options = {}) {
        try {
            const bearerToken = await this.getTwitterBearerToken();
            const response = await axios_1.default.get(this.xApiUrl, {
                params: {
                    query: query,
                    max_results: options.maxResults || 10,
                    'tweet.fields': options.tweetFields || 'created_at,author_id,public_metrics',
                    expansions: options.expansions || 'author_id',
                },
                headers: {
                    Authorization: `Bearer ${bearerToken}`,
                },
            });
            return response.data || {};
        }
        catch (error) {
            console.error('Error searching Twitter/X:', error.message);
            throw new Error(`Failed to search Twitter/X: ${error.message}`);
        }
    }
    async getTwitterBearerToken() {
        try {
            const encodedCredentials = Buffer.from(`${this.xApiKey}:${this.xApiSecret}`).toString('base64');
            const response = await axios_1.default.post('https://api.twitter.com/oauth2/token', 'grant_type=client_credentials', {
                headers: {
                    Authorization: `Basic ${encodedCredentials}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });
            return response.data.access_token;
        }
        catch (error) {
            console.error('Error getting Twitter/X bearer token:', error.message);
            throw new Error(`Failed to get Twitter/X bearer token: ${error.message}`);
        }
    }
    async searchNewsArticles(query, options = {}) {
        try {
            const response = await axios_1.default.get(this.newsApiUrl, {
                params: Object.assign({ q: query, apiKey: this.newsApiKey, pageSize: options.pageSize || 20, page: options.page || 1 }, options),
            });
            return response.data.articles || [];
        }
        catch (error) {
            console.error('Error searching news articles:', error.message);
            throw new Error(`Failed to search news articles: ${error.message}`);
        }
    }
    async searchMediaContent(query, options = {}) {
        try {
            const response = await axios_1.default.get(this.mediastackApiUrl, {
                params: {
                    access_key: this.mediastackApiKey,
                    keywords: query,
                    countries: options.countries || 'us',
                    limit: options.limit || 20,
                    offset: options.offset || 0,
                    sort: options.sort || 'published_desc',
                    languages: options.languages || 'en',
                },
            });
            return response.data.data || [];
        }
        catch (error) {
            console.error('Error searching media content:', error.message);
            throw new Error(`Failed to search media content: ${error.message}`);
        }
    }
    async aggregateNewsAndMedia(topic) {
        try {
            const [newsResults, mediaResults, socialResults] = await Promise.all([
                this.searchNewsArticles(topic).catch(err => {
                    console.warn('News API search failed:', err.message);
                    return [];
                }),
                this.searchMediaContent(topic).catch(err => {
                    console.warn('Mediastack search failed:', err.message);
                    return [];
                }),
                this.searchSocialMedia(topic).catch(err => {
                    console.warn('Social Searcher failed:', err.message);
                    return [];
                }),
            ]);
            return {
                news: newsResults,
                media: mediaResults,
                social: socialResults,
                timestamp: new Date().toISOString(),
                query: topic,
            };
        }
        catch (error) {
            console.error('Error aggregating news and media content:', error.message);
            throw new Error(`Failed to aggregate content: ${error.message}`);
        }
    }
    async getTrendData(topic) {
        try {
            const serpData = await this.getSerpData(topic, {
                engine: 'google_trends',
                data_type: 'TIMESERIES',
                cat: '0',
            }).catch(err => {
                console.warn('SERP API trends search failed:', err.message);
                return {};
            });
            return {
                topic,
                trends: serpData.interest_over_time || [],
                relatedTopics: serpData.related_topics || [],
                relatedQueries: serpData.related_queries || [],
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            console.error('Error getting trend data:', error.message);
            throw new Error(`Failed to get trend data: ${error.message}`);
        }
    }
    async getCitationSources(topic, preferredDomains = []) {
        try {
            const researchQuery = `${topic} research study data`;
            const searchResults = await this.searchWeb(researchQuery, {
                numResults: 15,
                includeDomains: preferredDomains.join(','),
            });
            const sources = searchResults.map(result => ({
                title: result.title,
                url: result.url,
                snippet: result.snippet,
                domain: new URL(result.url).hostname,
                authorityScore: this.calculateAuthorityScore(result.url),
                date: result.published_date || 'Unknown',
            }));
            return {
                topic,
                sources,
                preferredDomains,
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            console.error('Error getting citation sources:', error.message);
            throw new Error(`Failed to get citation sources: ${error.message}`);
        }
    }
    calculateAuthorityScore(url) {
        try {
            const domain = new URL(url).hostname;
            if (domain.endsWith('.gov'))
                return 0.9;
            if (domain.endsWith('.edu'))
                return 0.85;
            if (domain.endsWith('.org'))
                return 0.7;
            const authoritativeSites = [
                'nih.gov', 'who.int', 'cdc.gov', 'nasa.gov',
                'harvard.edu', 'stanford.edu', 'mit.edu',
                'nature.com', 'science.org', 'sciencedirect.com',
                'ieee.org', 'acm.org'
            ];
            for (const site of authoritativeSites) {
                if (domain.includes(site))
                    return 0.8;
            }
            const baseScore = Math.max(0.3, Math.min(0.6, 1 - (domain.length / 30)));
            return parseFloat(baseScore.toFixed(2));
        }
        catch (error) {
            console.warn('Error calculating authority score:', error.message);
            return 0.5;
        }
    }
};
exports.ExternalApisService = ExternalApisService;
exports.ExternalApisService = ExternalApisService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ExternalApisService);
//# sourceMappingURL=external-apis.service.js.map