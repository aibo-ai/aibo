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
exports.KeywordTopicAnalyzerService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let KeywordTopicAnalyzerService = class KeywordTopicAnalyzerService {
    constructor(configService) {
        this.configService = configService;
    }
    async analyzeContent(content, segment) {
        console.log(`Analyzing ${segment} content for keywords and topics`);
        return {
            primaryTopics: this.extractTopics(content, segment, 3),
            secondaryTopics: this.extractTopics(content, segment, 5),
            keywords: this.extractKeywords(content, segment, 10),
            entityRelationships: this.extractEntityRelationships(content, segment),
            semanticFields: this.identifySemanticFields(content, segment),
            timestamp: new Date().toISOString(),
        };
    }
    async generateTopicCluster(seedTopic, segment, depth = 2) {
        console.log(`Generating ${segment} topic cluster for seed: ${seedTopic}, depth: ${depth}`);
        const cluster = {
            seedTopic,
            segment,
            depth,
            topics: {},
            relationships: [],
            timestamp: new Date().toISOString(),
        };
        cluster.topics[seedTopic] = {
            level: 0,
            relevance: 1.0,
            keywords: this.generateMockKeywords(seedTopic, 5),
        };
        const level1Topics = this.generateRelatedTopics(seedTopic, segment, 3);
        level1Topics.forEach(topic => {
            cluster.topics[topic] = {
                level: 1,
                relevance: 0.7 + (Math.random() * 0.3),
                keywords: this.generateMockKeywords(topic, 5),
            };
            cluster.relationships.push({
                from: seedTopic,
                to: topic,
                type: 'parent_child',
                strength: 0.7 + (Math.random() * 0.3),
            });
            if (depth > 1) {
                const level2Topics = this.generateRelatedTopics(topic, segment, 2);
                level2Topics.forEach(subtopic => {
                    cluster.topics[subtopic] = {
                        level: 2,
                        relevance: 0.4 + (Math.random() * 0.3),
                        keywords: this.generateMockKeywords(subtopic, 3),
                    };
                    cluster.relationships.push({
                        from: topic,
                        to: subtopic,
                        type: 'parent_child',
                        strength: 0.4 + (Math.random() * 0.3),
                    });
                    if (Math.random() > 0.7) {
                        const randomTopic = level1Topics[Math.floor(Math.random() * level1Topics.length)];
                        if (randomTopic !== topic) {
                            cluster.relationships.push({
                                from: subtopic,
                                to: randomTopic,
                                type: 'related',
                                strength: 0.3 + (Math.random() * 0.3),
                            });
                        }
                    }
                });
            }
        });
        return cluster;
    }
    async optimizeKeywordPlacement(content, keywords) {
        console.log(`Optimizing keyword placement for ${keywords.length} keywords`);
        const sections = content.split('\n\n');
        const optimizedSections = sections.map((section, index) => {
            if (index < keywords.length && index < 3) {
                const keyword = keywords[index];
                if (/^#{1,6}\s+/.test(section)) {
                    return section.replace(/^(#{1,6}\s+)(.*)/, `$1$2 - ${keyword}`);
                }
                const firstSentenceEnd = section.indexOf('. ');
                if (firstSentenceEnd !== -1) {
                    const firstSentence = section.substring(0, firstSentenceEnd);
                    const restOfSection = section.substring(firstSentenceEnd);
                    if (!firstSentence.toLowerCase().includes(keyword.toLowerCase())) {
                        const modifiedSentence = this.insertKeywordInSentence(firstSentence, keyword);
                        return modifiedSentence + restOfSection;
                    }
                }
            }
            return section;
        });
        return {
            originalContent: content,
            optimizedContent: optimizedSections.join('\n\n'),
            keywordsUsed: keywords,
            placementStrategy: 'heading_and_first_sentence',
            timestamp: new Date().toISOString(),
        };
    }
    extractTopics(content, segment, count) {
        if (segment === 'b2b') {
            const b2bTopics = [
                'Digital Transformation',
                'Enterprise Architecture',
                'Cloud Migration',
                'Business Intelligence',
                'Data Security',
                'API Integration',
                'Process Automation',
                'Supply Chain Optimization',
                'Customer Data Platform',
                'Technology Implementation',
            ];
            return this.getRandomElements(b2bTopics, count);
        }
        else {
            const b2cTopics = [
                'Lifestyle Improvement',
                'Personal Development',
                'Health & Wellness',
                'Smart Home Technology',
                'Travel Experiences',
                'Sustainable Living',
                'Fashion Trends',
                'Entertainment Options',
                'Family Activities',
                'Consumer Electronics',
            ];
            return this.getRandomElements(b2cTopics, count);
        }
    }
    extractKeywords(content, segment, count) {
        if (segment === 'b2b') {
            const b2bKeywords = [
                'ROI',
                'implementation',
                'scalability',
                'enterprise-grade',
                'integration',
                'workflow',
                'efficiency',
                'compliance',
                'optimization',
                'security',
                'performance',
                'infrastructure',
                'strategy',
                'analytics',
                'automation',
            ];
            return this.getRandomElements(b2bKeywords, count);
        }
        else {
            const b2cKeywords = [
                'lifestyle',
                'experience',
                'easy-to-use',
                'affordable',
                'stylish',
                'innovative',
                'convenient',
                'trendy',
                'essential',
                'popular',
                'time-saving',
                'enjoyable',
                'comfortable',
                'high-quality',
                'value',
            ];
            return this.getRandomElements(b2cKeywords, count);
        }
    }
    extractEntityRelationships(content, segment) {
        const entities = segment === 'b2b'
            ? ['Company', 'Product', 'Service', 'Technology', 'Industry']
            : ['Consumer', 'Product', 'Brand', 'Trend', 'Lifestyle'];
        const relationships = [];
        for (let i = 0; i < 3; i++) {
            const entityA = entities[Math.floor(Math.random() * entities.length)];
            let entityB = entities[Math.floor(Math.random() * entities.length)];
            while (entityB === entityA) {
                entityB = entities[Math.floor(Math.random() * entities.length)];
            }
            const relationTypes = segment === 'b2b'
                ? ['provides', 'utilizes', 'implements', 'optimizes', 'supports']
                : ['uses', 'enjoys', 'prefers', 'recommends', 'values'];
            const relationType = relationTypes[Math.floor(Math.random() * relationTypes.length)];
            relationships.push({
                entityA,
                entityB,
                relationship: relationType,
                confidence: 0.7 + (Math.random() * 0.3),
            });
        }
        return relationships;
    }
    identifySemanticFields(content, segment) {
        const semanticFields = segment === 'b2b'
            ? [
                {
                    name: 'Technical Implementation',
                    relevance: 0.7 + (Math.random() * 0.3),
                    terms: ['deployment', 'integration', 'configuration', 'setup', 'installation'],
                },
                {
                    name: 'Business Value',
                    relevance: 0.7 + (Math.random() * 0.3),
                    terms: ['ROI', 'efficiency', 'productivity', 'cost-saving', 'revenue'],
                },
                {
                    name: 'Industry Standards',
                    relevance: 0.7 + (Math.random() * 0.3),
                    terms: ['compliance', 'regulation', 'best practice', 'framework', 'methodology'],
                },
            ]
            : [
                {
                    name: 'User Experience',
                    relevance: 0.7 + (Math.random() * 0.3),
                    terms: ['easy', 'intuitive', 'convenient', 'user-friendly', 'simple'],
                },
                {
                    name: 'Emotional Benefits',
                    relevance: 0.7 + (Math.random() * 0.3),
                    terms: ['happiness', 'satisfaction', 'enjoyment', 'delight', 'comfort'],
                },
                {
                    name: 'Social Validation',
                    relevance: 0.7 + (Math.random() * 0.3),
                    terms: ['popular', 'trending', 'recommended', 'top-rated', 'loved'],
                },
            ];
        return semanticFields;
    }
    generateRelatedTopics(topic, segment, count) {
        const b2bTopicMap = {
            'Digital Transformation': ['Cloud Migration', 'Process Automation', 'Data Strategy'],
            'Enterprise Architecture': ['System Integration', 'Technology Roadmap', 'Infrastructure Planning'],
            'Cloud Migration': ['Hybrid Cloud', 'Cloud Security', 'Migration Strategy'],
        };
        const b2cTopicMap = {
            'Lifestyle Improvement': ['Wellness Routines', 'Home Organization', 'Work-Life Balance'],
            'Personal Development': ['Skill Acquisition', 'Habit Formation', 'Goal Setting'],
            'Health & Wellness': ['Fitness Routines', 'Nutrition Plans', 'Mental Wellbeing'],
        };
        const topicMap = segment === 'b2b' ? b2bTopicMap : b2cTopicMap;
        let relatedTopics = topicMap[topic];
        if (!relatedTopics) {
            if (segment === 'b2b') {
                relatedTopics = [
                    `${topic} Strategy`,
                    `${topic} Implementation`,
                    `${topic} Best Practices`,
                    `${topic} ROI`,
                    `${topic} Case Study`,
                ];
            }
            else {
                relatedTopics = [
                    `${topic} Tips`,
                    `${topic} Guide`,
                    `${topic} Benefits`,
                    `${topic} Examples`,
                    `${topic} Reviews`,
                ];
            }
        }
        return this.getRandomElements(relatedTopics, count);
    }
    generateMockKeywords(topic, count) {
        const words = topic.toLowerCase().split(' ');
        const baseKeywords = [
            ...words,
            `${words[words.length - 1]} strategy`,
            `${words[0]} framework`,
            `optimize ${words[words.length - 1]}`,
            `${words[0]} management`,
            `${words[words.length - 1]} solution`,
            `effective ${words[0]}`,
            `${words[words.length - 1]} system`,
        ];
        return this.getRandomElements(baseKeywords, count);
    }
    getRandomElements(array, count) {
        const shuffled = [...array].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, Math.min(count, array.length));
    }
    insertKeywordInSentence(sentence, keyword) {
        if (sentence.toLowerCase().includes(keyword.toLowerCase())) {
            return sentence;
        }
        const words = sentence.split(' ');
        if (words.length >= 3) {
            const insertPoint = Math.min(3, Math.floor(words.length / 3));
            const firstPart = words.slice(0, insertPoint).join(' ');
            const lastPart = words.slice(insertPoint).join(' ');
            return `${firstPart} ${keyword} ${lastPart}`;
        }
        return `${sentence} ${keyword}`;
    }
};
exports.KeywordTopicAnalyzerService = KeywordTopicAnalyzerService;
exports.KeywordTopicAnalyzerService = KeywordTopicAnalyzerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], KeywordTopicAnalyzerService);
//# sourceMappingURL=keyword-topic-analyzer.service.js.map