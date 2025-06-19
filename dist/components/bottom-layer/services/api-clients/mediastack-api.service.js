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
exports.MediastackApiService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const base_api_client_service_1 = require("./base-api-client.service");
let MediastackApiService = class MediastackApiService extends base_api_client_service_1.BaseApiClient {
    constructor(configService) {
        const apiUrl = configService.get('MEDIASTACK_API_URL');
        const apiKey = configService.get('MEDIASTACK_API_KEY');
        if (!apiUrl || !apiKey) {
            throw new Error('Mediastack API configuration missing');
        }
        super(apiUrl, apiKey);
        this.configService = configService;
    }
    async searchNews(params) {
        try {
            const config = {
                params: Object.assign({ access_key: this.apiKey }, params)
            };
            return this.get('', {}, config);
        }
        catch (error) {
            this.logger.error(`Failed to search news: ${error.message}`);
            throw error;
        }
    }
    async getRecentNews(topic, daysBack = 7, limit = 10) {
        const today = new Date();
        const pastDate = new Date();
        pastDate.setDate(today.getDate() - daysBack);
        const dateRange = `${pastDate.toISOString().split('T')[0]},${today.toISOString().split('T')[0]}`;
        return this.searchNews({
            keywords: topic,
            limit,
            sort: 'published_desc',
            date: dateRange
        });
    }
};
exports.MediastackApiService = MediastackApiService;
exports.MediastackApiService = MediastackApiService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], MediastackApiService);
//# sourceMappingURL=mediastack-api.service.js.map