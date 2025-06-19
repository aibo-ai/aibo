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
exports.ExaApiService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const base_api_client_service_1 = require("./base-api-client.service");
let ExaApiService = class ExaApiService extends base_api_client_service_1.BaseApiClient {
    constructor(configService) {
        const apiUrl = configService.get('EXA_API_URL');
        const apiKey = configService.get('EXA_API_KEY');
        if (!apiUrl || !apiKey) {
            throw new Error('Exa API configuration missing');
        }
        super(apiUrl, apiKey, {
            headers: {
                'x-api-key': apiKey,
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
            this.logger.error(`Failed to search with Exa: ${error.message}`);
            throw error;
        }
    }
    async getRecentContent(topic, daysBack = 30, limit = 10) {
        const today = new Date();
        const pastDate = new Date();
        pastDate.setDate(today.getDate() - daysBack);
        return this.search({
            query: topic,
            numResults: limit,
            startPublishedDate: pastDate.toISOString(),
            endPublishedDate: today.toISOString(),
            highlights: true,
            type: 'neural'
        });
    }
};
exports.ExaApiService = ExaApiService;
exports.ExaApiService = ExaApiService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ExaApiService);
//# sourceMappingURL=exa-api.service.js.map