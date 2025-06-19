"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ContentFreshnessScorer_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentFreshnessScorer = void 0;
const common_1 = require("@nestjs/common");
let ContentFreshnessScorer = ContentFreshnessScorer_1 = class ContentFreshnessScorer {
    constructor() {
        this.logger = new common_1.Logger(ContentFreshnessScorer_1.name);
    }
    calculateFreshnessScore(content, segment) {
        try {
            const publishDate = new Date(content.publishedDate);
            const currentDate = new Date();
            const contentAgeInDays = Math.max(0, Math.floor((currentDate.getTime() - publishDate.getTime()) / (1000 * 60 * 60 * 24)));
            if (segment === 'b2b') {
                return this.calculateB2BFreshnessScore(content, contentAgeInDays);
            }
            else {
                return this.calculateB2CFreshnessScore(content, contentAgeInDays);
            }
        }
        catch (error) {
            this.logger.error(`Error calculating freshness score: ${error.message}`);
            return 50;
        }
    }
    calculateB2BFreshnessScore(content, contentAgeInDays) {
        const ageDecayFactor = this.getAgeDecayFactor(content.contentType, 'b2b');
        const maxAgeDays = this.getMaxAgeDays(content.contentType, 'b2b');
        const ageScore = Math.max(0, 1 - (contentAgeInDays / maxAgeDays));
        const comprehensivenessScore = this.estimateComprehensiveness(content);
        const authorityScore = this.estimateAuthority(content);
        return Math.min(100, Math.round((ageDecayFactor * ageScore * 100) +
            (0.3 * comprehensivenessScore) +
            (0.3 * authorityScore)));
    }
    calculateB2CFreshnessScore(content, contentAgeInDays) {
        const ageDecayFactor = this.getAgeDecayFactor(content.contentType, 'b2c');
        const maxAgeDays = this.getMaxAgeDays(content.contentType, 'b2c');
        const ageScore = Math.max(0, 1 - (contentAgeInDays / maxAgeDays));
        const engagementScore = this.estimateEngagement(content);
        const relevanceScore = content.relevanceScore || 70;
        return Math.min(100, Math.round((ageDecayFactor * ageScore * 100) +
            (0.3 * engagementScore) +
            (0.1 * relevanceScore)));
    }
    getAgeDecayFactor(contentType, segment) {
        if (segment === 'b2b') {
            switch (contentType) {
                case 'news':
                    return 0.7;
                case 'blog_post':
                    return 0.5;
                case 'white_paper':
                case 'research_paper':
                    return 0.3;
                case 'case_study':
                    return 0.4;
                default:
                    return 0.5;
            }
        }
        else {
            switch (contentType) {
                case 'news':
                case 'social_post':
                    return 0.8;
                case 'blog_post':
                    return 0.7;
                case 'review':
                    return 0.6;
                case 'tutorial':
                case 'guide':
                    return 0.4;
                default:
                    return 0.6;
            }
        }
    }
    getMaxAgeDays(contentType, segment) {
        if (segment === 'b2b') {
            switch (contentType) {
                case 'news':
                    return 30;
                case 'blog_post':
                    return 180;
                case 'white_paper':
                case 'research_paper':
                    return 730;
                case 'case_study':
                    return 365;
                default:
                    return 180;
            }
        }
        else {
            switch (contentType) {
                case 'news':
                    return 14;
                case 'social_post':
                    return 7;
                case 'blog_post':
                    return 90;
                case 'review':
                    return 180;
                case 'tutorial':
                case 'guide':
                    return 365;
                default:
                    return 90;
            }
        }
    }
    estimateComprehensiveness(content) {
        switch (content.contentType) {
            case 'white_paper':
            case 'research_paper':
                return 85;
            case 'case_study':
                return 80;
            case 'blog_post':
                return 65;
            case 'news':
                return 50;
            default:
                return 60;
        }
    }
    estimateAuthority(content) {
        const domain = content.domain || this.extractDomain(content.url);
        const highAuthorityDomains = [
            'harvard.edu', 'mit.edu', 'stanford.edu',
            'mckinsey.com', 'gartner.com', 'forrester.com',
            'hbr.org', 'wsj.com', 'economist.com',
            'techcrunch.com', 'wired.com', 'bloomberg.com'
        ];
        if (highAuthorityDomains.some(d => domain.includes(d))) {
            return 90;
        }
        return 60;
    }
    estimateEngagement(content) {
        if (content.socialMetrics) {
            const { shares, likes, comments, engagement } = content.socialMetrics;
            if (engagement !== undefined) {
                return Math.min(100, engagement);
            }
            if (shares !== undefined || likes !== undefined || comments !== undefined) {
                const shareScore = shares ? Math.min(100, shares / 10) : 0;
                const likeScore = likes ? Math.min(100, likes / 50) : 0;
                const commentScore = comments ? Math.min(100, comments * 2) : 0;
                let totalWeight = 0;
                let totalScore = 0;
                if (shares !== undefined) {
                    totalWeight += 0.4;
                    totalScore += 0.4 * shareScore;
                }
                if (likes !== undefined) {
                    totalWeight += 0.3;
                    totalScore += 0.3 * likeScore;
                }
                if (comments !== undefined) {
                    totalWeight += 0.3;
                    totalScore += 0.3 * commentScore;
                }
                return totalWeight > 0 ? totalScore / totalWeight : 50;
            }
        }
        return 50;
    }
    extractDomain(url) {
        try {
            const hostname = new URL(url).hostname;
            return hostname.startsWith('www.') ? hostname.substring(4) : hostname;
        }
        catch (error) {
            return '';
        }
    }
    getFreshnessLevel(freshnessScore) {
        if (freshnessScore >= 80) {
            return 'very_fresh';
        }
        else if (freshnessScore >= 60) {
            return 'fresh';
        }
        else if (freshnessScore >= 40) {
            return 'moderate';
        }
        else {
            return 'needs_updating';
        }
    }
    generateFreshnessIndicators(freshnessLevel, publishedDate) {
        const recencyStatement = this.getRecencyStatement(freshnessLevel);
        const lastUpdatedDisplay = `Last updated: ${new Date(publishedDate).toLocaleDateString()}`;
        const freshnessSignals = this.getFreshnessSignals(freshnessLevel);
        return {
            recencyStatement,
            lastUpdatedDisplay,
            freshnessSignals
        };
    }
    getRecencyStatement(freshnessLevel) {
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
    getFreshnessSignals(freshnessLevel) {
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
};
exports.ContentFreshnessScorer = ContentFreshnessScorer;
exports.ContentFreshnessScorer = ContentFreshnessScorer = ContentFreshnessScorer_1 = __decorate([
    (0, common_1.Injectable)()
], ContentFreshnessScorer);
//# sourceMappingURL=content-freshness-scorer.service.js.map