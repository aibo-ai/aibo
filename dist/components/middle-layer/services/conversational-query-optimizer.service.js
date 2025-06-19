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
exports.ConversationalQueryOptimizerService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let ConversationalQueryOptimizerService = class ConversationalQueryOptimizerService {
    constructor(configService) {
        this.configService = configService;
    }
    async optimizeForConversationalQueries(content, targetQueries) {
        console.log(`Optimizing content for ${targetQueries.length} conversational queries`);
        const optimizedContent = Object.assign(Object.assign({}, content), { optimizedSections: {}, queryResponseMap: {} });
        if (content.sections) {
            Object.keys(content.sections).forEach(sectionKey => {
                const section = content.sections[sectionKey];
                optimizedContent.optimizedSections[sectionKey] = Object.assign(Object.assign({}, section), { content: this.enhanceWithConversationalPatterns(section.content) });
            });
        }
        targetQueries.forEach(query => {
            optimizedContent.queryResponseMap[query] = {
                primarySection: this.findMostRelevantSection(query, content.sections),
                secondarySections: this.findSecondaryRelevantSections(query, content.sections),
                suggestedFollowUps: this.generateFollowUpQuestions(query),
            };
        });
        return {
            originalContent: content,
            optimizedContent,
            targetQueries,
            optimizationTechniques: [
                'question_answer_format',
                'contextual_transitions',
                'conversation_continuity_hooks',
                'follow_up_anticipation',
            ],
            timestamp: new Date().toISOString(),
        };
    }
    async identifyQueryGaps(queries, content) {
        console.log(`Analyzing ${queries.length} queries for content gaps`);
        const queryCoverage = queries.map(query => {
            return {
                query,
                isCovered: Math.random() > 0.3,
                coverageScore: Math.random(),
                relevantSections: this.findRelevantSections(query, content),
                missingAspects: this.isCovered(query, content) ? [] : this.identifyMissingAspects(query),
            };
        });
        const aggregateAnalysis = {
            overallCoverageScore: queryCoverage.reduce((total, q) => total + q.coverageScore, 0) / queryCoverage.length,
            fullyCoveredQueries: queryCoverage.filter(q => q.isCovered).length,
            partiallyCoveredQueries: queryCoverage.filter(q => !q.isCovered && q.coverageScore > 0.3).length,
            uncoveredQueries: queryCoverage.filter(q => q.coverageScore < 0.3).length,
            topContentGaps: this.identifyTopContentGaps(queryCoverage),
        };
        return {
            queryCoverage,
            aggregateAnalysis,
            timestamp: new Date().toISOString(),
        };
    }
    async generateAnticipatoryQuestions(content, count = 5) {
        console.log(`Generating ${count} anticipatory follow-up questions`);
        const questions = [];
        if (content.sections) {
            const mainTopic = content.title || Object.keys(content.sections)[0];
            const questionPatterns = [
                `What are the best practices for implementing ${mainTopic}?`,
                `How does ${mainTopic} compare to alternative approaches?`,
                `What are common challenges when working with ${mainTopic}?`,
                `How can I measure the success of ${mainTopic}?`,
                `What tools or resources are recommended for ${mainTopic}?`,
                `How has ${mainTopic} evolved over time?`,
                `What are experts saying about the future of ${mainTopic}?`,
                `How can I get started with ${mainTopic} quickly?`,
                `What are the costs associated with ${mainTopic}?`,
                `How can I explain the benefits of ${mainTopic} to stakeholders?`,
            ];
            for (let i = 0; i < count && i < questionPatterns.length; i++) {
                questions.push(questionPatterns[i]);
            }
        }
        return questions;
    }
    enhanceWithConversationalPatterns(text) {
        const conversationalEnhancements = [
            `You might be wondering about this topic. Here's what you need to know: ${text}`,
            `A common question we hear is related to this area. ${text}`,
            `Let's address what many people ask about: ${text}`,
            `To answer your question directly: ${text}`,
            `Here's what you should understand: ${text}`,
        ];
        return conversationalEnhancements[Math.floor(Math.random() * conversationalEnhancements.length)];
    }
    findMostRelevantSection(query, sections) {
        if (!sections)
            return null;
        const sectionKeys = Object.keys(sections);
        if (sectionKeys.length === 0)
            return null;
        return sectionKeys[Math.floor(Math.random() * sectionKeys.length)];
    }
    findSecondaryRelevantSections(query, sections) {
        if (!sections)
            return [];
        const sectionKeys = Object.keys(sections);
        if (sectionKeys.length <= 1)
            return [];
        const primarySection = this.findMostRelevantSection(query, sections);
        const secondarySections = sectionKeys.filter(key => key !== primarySection);
        const count = Math.min(2, secondarySections.length);
        const results = [];
        for (let i = 0; i < count; i++) {
            const randomIndex = Math.floor(Math.random() * secondarySections.length);
            results.push(secondarySections.splice(randomIndex, 1)[0]);
        }
        return results;
    }
    generateFollowUpQuestions(query) {
        const followUps = [
            `What are the best practices for this?`,
            `How does this compare to alternatives?`,
            `Can you provide examples of this in action?`,
            `What are common challenges with this approach?`,
            `How can I measure the success of this implementation?`,
        ];
        const count = Math.floor(Math.random() * 2) + 2;
        const results = [];
        for (let i = 0; i < count; i++) {
            const randomIndex = Math.floor(Math.random() * followUps.length);
            results.push(followUps.splice(randomIndex, 1)[0]);
        }
        return results;
    }
    findRelevantSections(query, content) {
        if (!content.sections)
            return [];
        const sectionKeys = Object.keys(content.sections);
        const count = Math.floor(Math.random() * 3) + 1;
        const selectedSections = [];
        for (let i = 0; i < count && i < sectionKeys.length; i++) {
            selectedSections.push(sectionKeys[i]);
        }
        return selectedSections;
    }
    isCovered(query, content) {
        return Math.random() > 0.3;
    }
    identifyMissingAspects(query) {
        const possibleAspects = [
            'comparative analysis',
            'implementation details',
            'cost considerations',
            'expert opinions',
            'case examples',
            'performance metrics',
            'alternative approaches',
            'compliance considerations',
        ];
        const count = Math.floor(Math.random() * 3) + 1;
        const results = [];
        for (let i = 0; i < count; i++) {
            const randomIndex = Math.floor(Math.random() * possibleAspects.length);
            results.push(possibleAspects.splice(randomIndex, 1)[0]);
        }
        return results;
    }
    identifyTopContentGaps(queryCoverage) {
        const missingAspectCounts = {};
        queryCoverage.forEach(q => {
            if (q.missingAspects && q.missingAspects.length > 0) {
                q.missingAspects.forEach(aspect => {
                    if (!missingAspectCounts[aspect]) {
                        missingAspectCounts[aspect] = 0;
                    }
                    missingAspectCounts[aspect]++;
                });
            }
        });
        const sortedGaps = Object.entries(missingAspectCounts)
            .map(([aspect, count]) => ({ aspect, count }))
            .sort((a, b) => b.count - a.count);
        return sortedGaps.slice(0, 5);
    }
};
exports.ConversationalQueryOptimizerService = ConversationalQueryOptimizerService;
exports.ConversationalQueryOptimizerService = ConversationalQueryOptimizerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ConversationalQueryOptimizerService);
//# sourceMappingURL=conversational-query-optimizer.service.js.map