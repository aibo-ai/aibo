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
var QDFAlgorithmService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.QDFAlgorithmService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const cosmos_1 = require("@azure/cosmos");
let QDFAlgorithmService = QDFAlgorithmService_1 = class QDFAlgorithmService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(QDFAlgorithmService_1.name);
        const endpoint = this.configService.get('AZURE_COSMOS_ENDPOINT');
        const key = this.configService.get('AZURE_COSMOS_KEY');
        const databaseId = this.configService.get('AZURE_COSMOS_DATABASE');
        if (endpoint && key && databaseId) {
            const client = new cosmos_1.CosmosClient({ endpoint, key });
            const database = client.database(databaseId);
            this.qdfScoresContainer = database.container('qdfScores');
            this.logger.log('QDF Algorithm Service initialized with Cosmos DB connection');
        }
        else {
            this.logger.warn('Cosmos DB configuration missing, QDF scores will not be persisted');
        }
    }
    async calculateQDFScore(topic) {
        try {
            const existingScore = await this.getStoredQDFScore(topic);
            if (existingScore) {
                const scoreAge = (new Date().getTime() - new Date(existingScore.lastUpdated).getTime()) / (1000 * 60 * 60 * 24);
                if (scoreAge < 7) {
                    return existingScore.score;
                }
            }
            const trendingFactor = await this.calculateTrendingFactor(topic);
            const volatilityFactor = await this.calculateVolatilityFactor(topic);
            const seasonalityFactor = await this.calculateSeasonalityFactor(topic);
            const qdfScore = (0.5 * trendingFactor +
                0.3 * volatilityFactor +
                0.2 * seasonalityFactor);
            await this.storeQDFScore({
                topic,
                score: qdfScore,
                lastUpdated: new Date().toISOString(),
                trendingFactor,
                volatilityFactor,
                seasonalityFactor
            });
            return qdfScore;
        }
        catch (error) {
            this.logger.error(`Error calculating QDF score: ${error.message}`);
            return 0.5;
        }
    }
    async getStoredQDFScore(topic) {
        if (!this.qdfScoresContainer) {
            return null;
        }
        try {
            const querySpec = {
                query: "SELECT * FROM c WHERE c.topic = @topic",
                parameters: [{ name: "@topic", value: topic.toLowerCase() }]
            };
            const { resources } = await this.qdfScoresContainer.items.query(querySpec).fetchAll();
            if (resources && resources.length > 0) {
                return resources[0];
            }
            return null;
        }
        catch (error) {
            this.logger.error(`Error retrieving QDF score: ${error.message}`);
            return null;
        }
    }
    async storeQDFScore(qdfScore) {
        if (!this.qdfScoresContainer) {
            return;
        }
        try {
            const existingScore = await this.getStoredQDFScore(qdfScore.topic);
            if (existingScore) {
                await this.qdfScoresContainer.item(existingScore.topic, existingScore.topic).replace(Object.assign(Object.assign({}, qdfScore), { id: existingScore.topic }));
            }
            else {
                await this.qdfScoresContainer.items.create(Object.assign(Object.assign({}, qdfScore), { id: qdfScore.topic }));
            }
        }
        catch (error) {
            this.logger.error(`Error storing QDF score: ${error.message}`);
        }
    }
    async calculateTrendingFactor(topic) {
        return 0.3 + (Math.random() * 0.6);
    }
    async calculateVolatilityFactor(topic) {
        return 0.2 + (Math.random() * 0.6);
    }
    async calculateSeasonalityFactor(topic) {
        return 0.1 + (Math.random() * 0.6);
    }
};
exports.QDFAlgorithmService = QDFAlgorithmService;
exports.QDFAlgorithmService = QDFAlgorithmService = QDFAlgorithmService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], QDFAlgorithmService);
//# sourceMappingURL=qdf-algorithm.service.js.map