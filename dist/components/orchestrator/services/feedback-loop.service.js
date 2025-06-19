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
exports.FeedbackLoopService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let FeedbackLoopService = class FeedbackLoopService {
    constructor(configService) {
        this.configService = configService;
    }
    async collectPerformanceMetrics(contentId, clientType) {
        console.log(`Collecting ${clientType} performance metrics for content ${contentId}`);
        const metrics = clientType === 'b2b'
            ? {
                technicalAccuracyScore: Math.random() * 100,
                comprehensivenessMeasure: Math.random() * 100,
                industryAlignmentIndex: Math.random() * 100,
                citationQualityScore: Math.random() * 100,
            }
            : {
                engagementScore: Math.random() * 100,
                emotionalResonanceIndex: Math.random() * 100,
                conversionPotentialScore: Math.random() * 100,
                socialSharingProbability: Math.random() * 100,
            };
        return {
            contentId,
            clientType,
            timestamp: new Date().toISOString(),
            metrics,
        };
    }
    async generateImprovementSuggestions(contentId, metrics) {
        console.log(`Generating improvement suggestions for content ${contentId}`);
        const isB2B = metrics.hasOwnProperty('technicalAccuracyScore');
        const suggestions = isB2B
            ? [
                'Enhance technical specifications with more recent data',
                'Include additional case studies from related industries',
                'Strengthen ROI calculations with more comparative analysis',
                'Add more citations from academic and industry research',
            ]
            : [
                'Increase emotional appeal in the introduction',
                'Add more visual content descriptions',
                'Incorporate more conversational question-answer sections',
                'Include more social proof elements and consumer testimonials',
            ];
        return {
            contentId,
            timestamp: new Date().toISOString(),
            suggestions,
            priority: 'medium',
        };
    }
    async applyAutomatedImprovements(contentId, improvements) {
        console.log(`Applying automated improvements to content ${contentId}`);
        return {
            contentId,
            timestamp: new Date().toISOString(),
            appliedImprovements: improvements.map(improvement => ({
                improvement,
                applied: Math.random() > 0.2,
            })),
            status: 'completed',
        };
    }
};
exports.FeedbackLoopService = FeedbackLoopService;
exports.FeedbackLoopService = FeedbackLoopService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], FeedbackLoopService);
//# sourceMappingURL=feedback-loop.service.js.map