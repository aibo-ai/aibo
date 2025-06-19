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
var FreshnessThresholdsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FreshnessThresholdsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let FreshnessThresholdsService = FreshnessThresholdsService_1 = class FreshnessThresholdsService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(FreshnessThresholdsService_1.name);
        this.thresholds = [];
        this.initializeThresholds();
    }
    initializeThresholds() {
        this.thresholds.push({ contentType: 'news', segment: 'b2b', maxAgeDays: 14, minFreshnessScore: 70 }, { contentType: 'blog_post', segment: 'b2b', maxAgeDays: 90, minFreshnessScore: 60 }, { contentType: 'white_paper', segment: 'b2b', maxAgeDays: 365, minFreshnessScore: 50 }, { contentType: 'case_study', segment: 'b2b', maxAgeDays: 365, minFreshnessScore: 55 }, { contentType: 'research_paper', segment: 'b2b', maxAgeDays: 730, minFreshnessScore: 45 }, { contentType: 'ebook', segment: 'b2b', maxAgeDays: 365, minFreshnessScore: 55 }, { contentType: 'article', segment: 'b2b', maxAgeDays: 180, minFreshnessScore: 60 }, { contentType: 'video', segment: 'b2b', maxAgeDays: 365, minFreshnessScore: 55 }, { contentType: 'podcast', segment: 'b2b', maxAgeDays: 180, minFreshnessScore: 60 }, { contentType: 'default', segment: 'b2b', maxAgeDays: 180, minFreshnessScore: 60 });
        this.thresholds.push({ contentType: 'news', segment: 'b2c', maxAgeDays: 7, minFreshnessScore: 80 }, { contentType: 'blog_post', segment: 'b2c', maxAgeDays: 30, minFreshnessScore: 70 }, { contentType: 'article', segment: 'b2c', maxAgeDays: 60, minFreshnessScore: 65 }, { contentType: 'social_post', segment: 'b2c', maxAgeDays: 3, minFreshnessScore: 85 }, { contentType: 'review', segment: 'b2c', maxAgeDays: 90, minFreshnessScore: 60 }, { contentType: 'video', segment: 'b2c', maxAgeDays: 90, minFreshnessScore: 65 }, { contentType: 'tutorial', segment: 'b2c', maxAgeDays: 180, minFreshnessScore: 55 }, { contentType: 'guide', segment: 'b2c', maxAgeDays: 180, minFreshnessScore: 55 }, { contentType: 'product_page', segment: 'b2c', maxAgeDays: 90, minFreshnessScore: 70 }, { contentType: 'default', segment: 'b2c', maxAgeDays: 60, minFreshnessScore: 70 });
        this.logger.log(`Initialized ${this.thresholds.length} freshness thresholds`);
    }
    getFreshnessThreshold(contentType, segment) {
        const threshold = this.thresholds.find(t => t.contentType === contentType && t.segment === segment);
        if (!threshold) {
            const defaultThreshold = this.thresholds.find(t => t.contentType === 'default' && t.segment === segment);
            return defaultThreshold || {
                contentType: 'default',
                segment,
                maxAgeDays: segment === 'b2b' ? 180 : 60,
                minFreshnessScore: segment === 'b2b' ? 60 : 70
            };
        }
        return threshold;
    }
    adjustThresholdByQDF(threshold, qdfScore) {
        const qdfFactor = qdfScore * 2;
        const adjustedMaxAgeDays = Math.max(1, Math.round(threshold.maxAgeDays / qdfFactor));
        const adjustedMinFreshnessScore = Math.min(95, Math.round(threshold.minFreshnessScore + (qdfScore * 20)));
        return Object.assign(Object.assign({}, threshold), { maxAgeDays: adjustedMaxAgeDays, minFreshnessScore: adjustedMinFreshnessScore });
    }
    setCustomThreshold(threshold) {
        this.thresholds = this.thresholds.filter(t => !(t.contentType === threshold.contentType && t.segment === threshold.segment));
        this.thresholds.push(threshold);
        this.logger.log(`Set custom threshold for ${threshold.contentType} (${threshold.segment}): ${threshold.maxAgeDays} days`);
    }
    getAllThresholds() {
        return [...this.thresholds];
    }
};
exports.FreshnessThresholdsService = FreshnessThresholdsService;
exports.FreshnessThresholdsService = FreshnessThresholdsService = FreshnessThresholdsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], FreshnessThresholdsService);
//# sourceMappingURL=freshness-thresholds.service.js.map