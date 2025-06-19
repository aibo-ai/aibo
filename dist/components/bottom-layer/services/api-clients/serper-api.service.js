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
exports.SerperApiService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const base_api_client_service_1 = require("./base-api-client.service");
let SerperApiService = class SerperApiService extends base_api_client_service_1.BaseApiClient {
    constructor(configService) {
        const apiUrl = configService.get('SERPER_API_URL');
        const apiKey = configService.get('SERPER_API_KEY');
        if (!apiUrl || !apiKey) {
            throw new Error('Serper API configuration missing');
        }
        super(apiUrl, apiKey, {
            headers: {
                'X-API-KEY': apiKey,
                'Content-Type': 'application/json'
            }
        });
        this.configService = configService;
    }
    async search(params) {
        try {
            return this.post('', params);
        }
        catch (error) {
            this.logger.error(`Failed to perform search: ${error.message}`);
            throw error;
        }
    }
    async searchRecent(topic, timeframe = 'w1', resultType = 'search', limit = 10) {
        return this.search({
            q: topic,
            tbs: `qdr:${timeframe}`,
            type: resultType,
            num: limit
        });
    }
    async getRecentNews(topic, daysBack = 7, limit = 10) {
        let timeframe;
        if (daysBack <= 1)
            timeframe = 'd1';
        else if (daysBack <= 7)
            timeframe = 'w1';
        else if (daysBack <= 30)
            timeframe = 'm1';
        else
            timeframe = 'y1';
        return this.searchRecent(topic, timeframe, 'news', limit);
    }
};
exports.SerperApiService = SerperApiService;
exports.SerperApiService = SerperApiService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SerperApiService);
//# sourceMappingURL=serper-api.service.js.map