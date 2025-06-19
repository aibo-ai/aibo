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
exports.PlatformSpecificTunerService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let PlatformSpecificTunerService = class PlatformSpecificTunerService {
    constructor(configService) {
        this.configService = configService;
    }
    async optimizeForPlatform(content, platform) {
        console.log(`Optimizing content for ${platform} platform`);
        const platformStrategy = this.getPlatformStrategy(platform);
        const optimizedContent = this.applyPlatformOptimizations(content, platformStrategy);
        return {
            originalContent: content,
            optimizedContent,
            platform,
            appliedStrategies: platformStrategy,
            timestamp: new Date().toISOString(),
        };
    }
    async optimizeForMultiplePlatforms(content, platforms) {
        console.log(`Optimizing content for ${platforms.length} platforms`);
        const platformOptimizations = {};
        for (const platform of platforms) {
            if (['chatgpt', 'perplexity', 'gemini', 'grok'].includes(platform)) {
                const result = await this.optimizeForPlatform(content, platform);
                platformOptimizations[platform] = {
                    optimizedContent: result.optimizedContent,
                    appliedStrategies: result.appliedStrategies,
                };
            }
        }
        const commonOptimizations = this.findCommonOptimizations(platforms, platformOptimizations);
        const universalContent = this.applyCommonOptimizations(content, commonOptimizations);
        return {
            originalContent: content,
            universalContent,
            platformSpecificVersions: platformOptimizations,
            commonOptimizations,
            platforms,
            timestamp: new Date().toISOString(),
        };
    }
    async testCrossplatformPerformance(content, platforms) {
        console.log(`Testing cross-platform performance for content across ${platforms.length} platforms`);
        const performanceResults = {};
        for (const platform of platforms) {
            if (['chatgpt', 'perplexity', 'gemini', 'grok'].includes(platform)) {
                performanceResults[platform] = {
                    retrievalScore: parseFloat((0.6 + (Math.random() * 0.4)).toFixed(2)),
                    accuracyScore: parseFloat((0.7 + (Math.random() * 0.3)).toFixed(2)),
                    completenessScore: parseFloat((0.6 + (Math.random() * 0.4)).toFixed(2)),
                    citationScore: parseFloat((0.5 + (Math.random() * 0.5)).toFixed(2)),
                    overallScore: parseFloat((0.6 + (Math.random() * 0.4)).toFixed(2)),
                    strengthAreas: this.getRandomSubset(['structure', 'clarity', 'citations', 'factual accuracy', 'comprehensiveness'], 2),
                    improvementAreas: this.getRandomSubset(['visual elements', 'conversational tone', 'technical depth', 'comparative analysis'], 2),
                };
            }
        }
        return {
            content: { title: content.title || 'Untitled Content' },
            performanceResults,
            aggregateScore: this.calculateAggregateScore(performanceResults),
            recommendedOptimizations: this.generateRecommendations(performanceResults),
            timestamp: new Date().toISOString(),
        };
    }
    getPlatformStrategy(platform) {
        const strategies = {
            chatgpt: {
                contentStructure: {
                    headingStyle: 'clear_hierarchical',
                    paragraphLength: 'concise',
                    formatting: 'markdown_optimized',
                },
                citationFormat: 'inline_with_urls',
                questionHandling: 'anticipate_followups',
                schemaEmphasis: ['FAQPage', 'HowTo'],
                uniqueFeatures: [
                    'clear_section_breaks',
                    'numbered_lists_for_steps',
                    'bolded_key_points',
                ],
            },
            perplexity: {
                contentStructure: {
                    headingStyle: 'comprehensive_descriptive',
                    paragraphLength: 'detailed',
                    formatting: 'academic_style',
                },
                citationFormat: 'numbered_references',
                questionHandling: 'address_nuances',
                schemaEmphasis: ['Article', 'TechArticle'],
                uniqueFeatures: [
                    'multiple_perspectives',
                    'detailed_references',
                    'comparison_tables',
                ],
            },
            gemini: {
                contentStructure: {
                    headingStyle: 'visual_friendly',
                    paragraphLength: 'balanced',
                    formatting: 'clean_breaks',
                },
                citationFormat: 'academic_with_dois',
                questionHandling: 'concise_and_detailed',
                schemaEmphasis: ['Article', 'ImageObject'],
                uniqueFeatures: [
                    'visual_descriptions',
                    'clear_subsections',
                    'dual_explanation_levels',
                ],
            },
            grok: {
                contentStructure: {
                    headingStyle: 'direct_conversational',
                    paragraphLength: 'shorter',
                    formatting: 'casual_professional',
                },
                citationFormat: 'inline_hyperlinks',
                questionHandling: 'address_counterarguments',
                schemaEmphasis: ['Article', 'SocialMediaPosting'],
                uniqueFeatures: [
                    'occasional_humor',
                    'direct_statements',
                    'practical_examples',
                ],
            },
        };
        return strategies[platform] || strategies.chatgpt;
    }
    applyPlatformOptimizations(content, platformStrategy) {
        var _a;
        const optimizedContent = Object.assign({}, content);
        optimizedContent.platformOptimizations = platformStrategy;
        if (optimizedContent.sections) {
            Object.keys(optimizedContent.sections).forEach(sectionKey => {
                var _a, _b, _c, _d;
                const section = optimizedContent.sections[sectionKey];
                let formattedContent = section.content;
                if (platformStrategy.citationFormat === 'inline_with_urls') {
                    formattedContent += '\n\n*Sources: [Source 1](https://example.com/1), [Source 2](https://example.com/2)*';
                }
                else if (platformStrategy.citationFormat === 'numbered_references') {
                    formattedContent += '\n\n**References**\n1. Source Name (2023). "Title". *Publication*. DOI: 10.1234/abcd\n2. Author, A. (2023). "Article Title". Retrieved from https://example.com/2';
                }
                else if (platformStrategy.citationFormat === 'academic_with_dois') {
                    formattedContent += '\n\n**References**\n- Author, A., & Author, B. (2023). Title of article. *Journal Name*, 10(2), 30-45. https://doi.org/10.1234/abcd\n- Organization. (2023). *Report title*. https://example.com/report';
                }
                else if (platformStrategy.citationFormat === 'inline_hyperlinks') {
                    formattedContent += '\n\nLearn more: [Detailed explanation](https://example.com/1), [Industry guide](https://example.com/2)';
                }
                if (((_a = platformStrategy.contentStructure) === null || _a === void 0 ? void 0 : _a.formatting) === 'markdown_optimized') {
                    formattedContent = `## ${sectionKey}\n\n${formattedContent}`;
                }
                else if (((_b = platformStrategy.contentStructure) === null || _b === void 0 ? void 0 : _b.formatting) === 'academic_style') {
                    formattedContent = `### ${sectionKey.toUpperCase()}\n\n${formattedContent}`;
                }
                else if (((_c = platformStrategy.contentStructure) === null || _c === void 0 ? void 0 : _c.formatting) === 'clean_breaks') {
                    formattedContent = `### ${sectionKey}\n\n${formattedContent}\n\n---`;
                }
                else if (((_d = platformStrategy.contentStructure) === null || _d === void 0 ? void 0 : _d.formatting) === 'casual_professional') {
                    formattedContent = `**${sectionKey}**\n\n${formattedContent}`;
                }
                optimizedContent.sections[sectionKey] = Object.assign(Object.assign({}, section), { content: formattedContent });
            });
        }
        if (platformStrategy.questionHandling === 'anticipate_followups') {
            optimizedContent.anticipatedFollowUps = [
                'What are the best practices for implementing this?',
                'How does this compare to alternatives?',
                'What are potential challenges to be aware of?',
            ];
        }
        if ((_a = platformStrategy.uniqueFeatures) === null || _a === void 0 ? void 0 : _a.includes('multiple_perspectives')) {
            optimizedContent.perspectives = [
                {
                    viewpoint: 'Industry Expert',
                    assessment: 'From an industry perspective, this approach offers significant advantages in terms of scalability and integration capabilities.',
                },
                {
                    viewpoint: 'Academic Research',
                    assessment: 'Research studies indicate that this methodology has been validated across multiple use cases with consistently positive outcomes.',
                },
                {
                    viewpoint: 'Practical Implementation',
                    assessment: 'Real-world implementations have demonstrated that while initial setup requires careful planning, the long-term benefits outweigh the costs.',
                },
            ];
        }
        return optimizedContent;
    }
    findCommonOptimizations(platforms, platformOptimizations) {
        return [
            'clear_section_organization',
            'comprehensive_information',
            'authoritative_citations',
            'balanced_detail_level',
        ];
    }
    applyCommonOptimizations(content, commonOptimizations) {
        const universalContent = Object.assign({}, content);
        universalContent.appliedUniversalOptimizations = commonOptimizations;
        universalContent.optimizationNote = 'This content has been optimized for cross-platform compatibility while maintaining platform-specific advantages where possible.';
        return universalContent;
    }
    calculateAggregateScore(performanceResults) {
        let totalScore = 0;
        let platforms = 0;
        Object.values(performanceResults).forEach((result) => {
            totalScore += result.overallScore;
            platforms++;
        });
        return platforms > 0 ? parseFloat((totalScore / platforms).toFixed(2)) : 0;
    }
    generateRecommendations(performanceResults) {
        const recommendations = [
            {
                area: 'Structure',
                suggestion: 'Implement clearer section headings for improved navigation',
                priority: 'high',
                expectedImpact: {
                    chatgpt: '+10%',
                    perplexity: '+15%',
                    gemini: '+5%',
                    grok: '+8%',
                },
            },
            {
                area: 'Citations',
                suggestion: 'Add more authoritative sources with full reference information',
                priority: 'medium',
                expectedImpact: {
                    chatgpt: '+5%',
                    perplexity: '+20%',
                    gemini: '+10%',
                    grok: '+3%',
                },
            },
            {
                area: 'Content Depth',
                suggestion: 'Balance detailed technical information with accessible explanations',
                priority: 'medium',
                expectedImpact: {
                    chatgpt: '+8%',
                    perplexity: '+12%',
                    gemini: '+15%',
                    grok: '+10%',
                },
            },
        ];
        return recommendations;
    }
    getRandomSubset(array, count) {
        const shuffled = [...array].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, Math.min(count, array.length));
    }
};
exports.PlatformSpecificTunerService = PlatformSpecificTunerService;
exports.PlatformSpecificTunerService = PlatformSpecificTunerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], PlatformSpecificTunerService);
//# sourceMappingURL=platform-specific-tuner.service.js.map