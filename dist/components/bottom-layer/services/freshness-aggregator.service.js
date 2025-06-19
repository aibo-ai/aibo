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
var FreshnessAggregatorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FreshnessAggregatorService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const cosmos_1 = require("@azure/cosmos");
const mediastack_api_service_1 = require("./api-clients/mediastack-api.service");
const serper_api_service_1 = require("./api-clients/serper-api.service");
const exa_api_service_1 = require("./api-clients/exa-api.service");
const qdf_algorithm_service_1 = require("./qdf-algorithm.service");
const freshness_thresholds_service_1 = require("./freshness-thresholds.service");
const content_freshness_scorer_service_1 = require("./content-freshness-scorer.service");
let FreshnessAggregatorService = FreshnessAggregatorService_1 = class FreshnessAggregatorService {
    constructor(configService, mediaStackApi, serperApi, exaApi, qdfAlgorithm, freshnessThresholds, freshnessScorer) {
        this.configService = configService;
        this.mediaStackApi = mediaStackApi;
        this.serperApi = serperApi;
        this.exaApi = exaApi;
        this.qdfAlgorithm = qdfAlgorithm;
        this.freshnessThresholds = freshnessThresholds;
        this.freshnessScorer = freshnessScorer;
        this.logger = new common_1.Logger(FreshnessAggregatorService_1.name);
        const endpoint = this.configService.get('AZURE_COSMOS_ENDPOINT');
        const key = this.configService.get('AZURE_COSMOS_KEY');
        const databaseId = this.configService.get('AZURE_COSMOS_DATABASE');
        const containerName = this.configService.get('COSMOS_DB_CONTAINER_FRESH_CONTENT') || 'freshContent';
        if (endpoint && key && databaseId) {
            const client = new cosmos_1.CosmosClient({ endpoint, key });
            const database = client.database(databaseId);
            this.freshContentContainer = database.container(containerName);
            this.logger.log('Freshness Aggregator Service initialized with Cosmos DB connection');
        }
        else {
            this.logger.warn('Cosmos DB configuration missing, fresh content will not be persisted');
        }
    }
    async aggregateFreshContent(topic, segment) {
        this.logger.log(`Aggregating fresh ${segment} content for topic: ${topic}`);
        try {
            const qdfScore = await this.qdfAlgorithm.getQDFScore(topic);
            const thresholds = await this.freshnessThresholds.getThresholds(segment, topic, qdfScore.score);
            const searchParams = {
                query: topic,
                maxAgeDays: thresholds.maxAgeDays,
                limit: 20,
                segment
            };
            const [newsContent, searchContent, semanticContent] = await Promise.all([
                this.collectNewsContent(searchParams),
                this.collectSearchContent(searchParams),
                this.collectSemanticContent(searchParams)
            ]);
            let allContent = [
                ...newsContent,
                ...searchContent,
                ...semanticContent
            ];
            allContent = await Promise.all(allContent.map(async (item) => {
                const freshnessScore = await this.freshnessScorer.calculateFreshnessScore(item, segment, qdfScore.score);
                const freshnessLevel = this.freshnessScorer.determineFreshnessLevel(freshnessScore, thresholds);
                const freshnessIndicators = this.freshnessScorer.generateFreshnessIndicators(item, freshnessScore, freshnessLevel);
                return Object.assign(Object.assign({}, item), { freshnessScore,
                    freshnessLevel,
                    freshnessIndicators });
            }));
            allContent = allContent.filter(item => item.freshnessScore >= thresholds.minFreshnessScore);
            allContent.sort((a, b) => b.freshnessScore - a.freshnessScore);
            const contentItems = allContent.slice(0, 10);
            const result = {
                topic,
                segment,
                qdfScore: qdfScore.score,
                freshnessThreshold: `${thresholds.maxAgeDays} days`,
                collectedAt: new Date().toISOString(),
                contentItems
            };
            await this.persistFreshContent(result);
            return result;
        }
        catch (error) {
            this.logger.error(`Error aggregating fresh content: ${error.message}`, error.stack);
            throw error;
        }
    }
};
exports.FreshnessAggregatorService = FreshnessAggregatorService;
exports.FreshnessAggregatorService = FreshnessAggregatorService = FreshnessAggregatorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        mediastack_api_service_1.MediastackApiService,
        serper_api_service_1.SerperApiService,
        exa_api_service_1.ExaApiService,
        qdf_algorithm_service_1.QDFAlgorithmService,
        freshness_thresholds_service_1.FreshnessThresholdsService,
        content_freshness_scorer_service_1.ContentFreshnessScorer])
], FreshnessAggregatorService);
return {
    topic,
    segment,
    freshnessThreshold: `${freshnessThreshold} days`,
    collectedAt: new Date().toISOString(),
    contentItems: this.generateMockFreshContent(topic, segment, 5),
};
async;
calculateFreshnessScore(content, any, segment, 'b2b' | 'b2c');
Promise < number > {
    const: contentAgeInDays = Math.floor(Math.random() * 30),
    const: topicTrendingScore = Math.random(),
    if(segment) { }
} === 'b2b';
{
    const accuracyScore = Math.random();
    const comprehensivenessScore = Math.random();
    return (0.3 * (1 - contentAgeInDays / 60) +
        0.2 * topicTrendingScore +
        0.25 * accuracyScore +
        0.25 * comprehensivenessScore) * 100;
}
{
    const viralPotential = Math.random();
    const socialEngagement = Math.random();
    return (0.4 * (1 - contentAgeInDays / 30) +
        0.3 * topicTrendingScore +
        0.15 * viralPotential +
        0.15 * socialEngagement) * 100;
}
async;
enrichWithFreshnessIndicators(content, any, freshnessScore, number);
Promise < any > {
    console, : .log(`Enriching content with freshness indicators, score: ${freshnessScore}`),
    const: freshnessLevel =
        freshnessScore >= 80 ? 'very_fresh' :
            freshnessScore >= 60 ? 'fresh' :
                freshnessScore >= 40 ? 'moderate' :
                    'needs_updating',
    const: freshnessIndicators = {
        recencyStatement: this.getRecencyStatement(freshnessLevel),
        lastUpdatedDisplay: `Last updated: ${new Date().toLocaleDateString()}`,
        freshnessSignals: this.getFreshnessSignals(freshnessLevel),
    },
    return: Object.assign(Object.assign({}, content), { freshnessScore,
        freshnessLevel,
        freshnessIndicators })
};
generateMockFreshContent(topic, string, segment, 'b2b' | 'b2c', count, number);
any[];
{
    const items = [];
    for (let i = 0; i < count; i++) {
        const dayOffset = Math.floor(Math.random() * (segment === 'b2b' ? 30 : 7));
        const date = new Date();
        date.setDate(date.getDate() - dayOffset);
        items.push({
            id: `content-${i}-${Date.now()}`,
            title: `${this.capitalizeFirstLetter(topic)} ${segment === 'b2b' ? 'Strategy' : 'Guide'} for ${new Date().getFullYear()}`,
            source: segment === 'b2b' ?
                ['Industry Report', 'Technical Blog', 'Research Paper', 'Case Study', 'White Paper'][Math.floor(Math.random() * 5)] :
                ['Lifestyle Blog', 'Social Media', 'User Review', 'News Article', 'Video Content'][Math.floor(Math.random() * 5)],
            publishedDate: date.toISOString(),
            relevanceScore: Math.floor(Math.random() * 40) + 60,
            url: `https://example.com/${topic.replace(/\\s+/g, '-').toLowerCase()}/${i}`,
        });
    }
    return items;
}
getRecencyStatement(freshnessLevel, string);
string;
{
    switch (freshnessLevel) {
        case 'very_fresh':
            return 'This content contains the most recent data and trends available.';
        case 'fresh':
            return 'This content is up-to-date with current industry standards.';
        case 'moderate':
            return 'This content contains mostly current information with some updates pending.';
        case 'needs_updating':
        default:
            return 'This content may contain information that needs updating.';
    }
}
getFreshnessSignals(freshnessLevel, string);
string[];
{
    switch (freshnessLevel) {
        case 'very_fresh':
            return [
                'Includes data from the past week',
                'References latest industry developments',
                'Incorporates recent statistical updates',
                'Mentions current market conditions',
            ];
        case 'fresh':
            return [
                'Includes recent industry standards',
                'References data from the current quarter',
                'Aligns with current best practices',
                'Reflects present market conditions',
            ];
        case 'moderate':
            return [
                'Contains some recent references',
                'Includes partially updated statistics',
                'Presents some current methodologies',
                'References some recent developments',
            ];
        case 'needs_updating':
        default:
            return [
                'May contain outdated statistics',
                'Could benefit from recent examples',
                'Should incorporate newer methodologies',
                'Needs alignment with current trends',
            ];
    }
}
capitalizeFirstLetter(string, string);
string;
{
    return string.charAt(0).toUpperCase() + string.slice(1);
}
//# sourceMappingURL=freshness-aggregator.service.js.map