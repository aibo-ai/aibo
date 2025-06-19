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
exports.BlufContentStructurerService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let BlufContentStructurerService = class BlufContentStructurerService {
    constructor(configService) {
        this.configService = configService;
    }
    async structureContent(content, segment, contentType) {
        console.log(`Structuring ${segment} content with BLUF approach`);
        const structureTemplate = segment === 'b2b'
            ? {
                sections: [
                    'Executive Summary',
                    'Key Findings',
                    'Detailed Analysis',
                    'Implementation Considerations',
                    'Supporting Evidence',
                    'Next Steps',
                ],
                answerStrategy: 'detailed_upfront_summary',
            }
            : {
                sections: [
                    'Quick Answer',
                    'Benefits Overview',
                    'Detailed Explanation',
                    'Practical Tips',
                    'Supporting Information',
                    'Wrap-Up',
                ],
                answerStrategy: 'concise_upfront_answer',
            };
        return {
            originalContent: content,
            structuredContent: this.applyStructure(content, structureTemplate),
            structureType: 'BLUF',
            segment,
            structureTemplate,
            timestamp: new Date().toISOString(),
        };
    }
    async structureWithBluf(content, segment, contentType) {
        return this.structureContent(content, segment, contentType);
    }
    async createLayeredStructure(content, maxDepth = 3, segment) {
        console.log(`Creating layered structure for ${segment} content with max depth ${maxDepth}`);
        const layeredContent = this.createContentLayers(content, maxDepth, segment);
        return {
            originalContent: content,
            layeredContent,
            structureType: 'LAYERED',
            segment,
            maxDepth,
            timestamp: new Date().toISOString(),
        };
    }
    createContentLayers(content, maxDepth, segment) {
        const layers = [];
        for (let i = 1; i <= maxDepth; i++) {
            layers.push({
                depth: i,
                title: `Layer ${i}`,
                content: i === 1 ?
                    'High-level summary of the content' :
                    `Detailed content for layer ${i}`,
                wordCount: 100 * i,
            });
        }
        return layers;
    }
    async getStructureTemplate(contentType, segment) {
        console.log(`Getting BLUF structure template for ${segment} ${contentType}`);
        if (segment === 'b2b') {
            switch (contentType) {
                case 'technical_guide':
                    return {
                        sections: [
                            'Key Implementation Takeaways',
                            'Technical Overview',
                            'Step-by-Step Implementation',
                            'Configuration Details',
                            'Troubleshooting',
                            'Advanced Considerations',
                        ],
                    };
                case 'case_study':
                    return {
                        sections: [
                            'Results Summary',
                            'Business Challenge',
                            'Solution Approach',
                            'Implementation Process',
                            'Outcomes and ROI',
                            'Lessons Learned',
                        ],
                    };
                case 'industry_analysis':
                    return {
                        sections: [
                            'Key Industry Insights',
                            'Market Overview',
                            'Trend Analysis',
                            'Competitive Landscape',
                            'Strategic Implications',
                            'Future Outlook',
                        ],
                    };
                default:
                    return {
                        sections: [
                            'Executive Summary',
                            'Key Findings',
                            'Detailed Analysis',
                            'Implementation Considerations',
                            'Supporting Evidence',
                            'Next Steps',
                        ],
                    };
            }
        }
        else {
            switch (contentType) {
                case 'product_review':
                    return {
                        sections: [
                            'Verdict and Rating',
                            'Key Benefits',
                            'Product Overview',
                            'Features and Experience',
                            'Comparisons',
                            'Recommendations',
                        ],
                    };
                case 'how_to_guide':
                    return {
                        sections: [
                            "What You'll Achieve",
                            'Quick Steps Summary',
                            'Detailed Instructions',
                            'Tips for Success',
                            'Common Questions',
                            'Next Projects',
                        ],
                    };
                case 'lifestyle_content':
                    return {
                        sections: [
                            'Key Takeaways',
                            'The Inspiration',
                            'Detailed Approach',
                            'Personal Experience',
                            'Expert Tips',
                            'Next Steps',
                        ],
                    };
                default:
                    return {
                        sections: [
                            'Quick Answer',
                            'Benefits Overview',
                            'Detailed Explanation',
                            'Practical Tips',
                            'Supporting Information',
                            'Wrap-Up',
                        ],
                    };
            }
        }
    }
    async createLayeredAnswer(question, content, depth = 2) {
        console.log(`Creating layered answer for question with depth: ${depth}`);
        const answerLayers = [];
        answerLayers.push({
            level: 1,
            content: this.generateMockAnswer(question, 1),
            wordCount: Math.floor(Math.random() * 15) + 15,
        });
        if (depth >= 2) {
            answerLayers.push({
                level: 2,
                content: this.generateMockAnswer(question, 2),
                wordCount: Math.floor(Math.random() * 70) + 50,
            });
        }
        if (depth >= 3) {
            answerLayers.push({
                level: 3,
                content: this.generateMockAnswer(question, 3),
                wordCount: Math.floor(Math.random() * 200) + 150,
            });
        }
        return {
            question,
            answerLayers,
            recommendedLayer: Math.min(depth, 3),
            timestamp: new Date().toISOString(),
        };
    }
    applyStructure(content, template) {
        const structuredContent = {
            title: content.title || 'Untitled Content',
            sections: {},
        };
        template.sections.forEach((section, index) => {
            structuredContent.sections[section] = {
                order: index,
                content: this.generateSectionContent(section, content, template.answerStrategy),
            };
        });
        return structuredContent;
    }
    generateSectionContent(section, content, strategy) {
        const lowerSection = section.toLowerCase();
        if (lowerSection.includes('summary') || lowerSection.includes('key') || lowerSection.includes('quick')) {
            return `This section provides a ${strategy === 'detailed_upfront_summary' ? 'comprehensive' : 'concise'} overview of the main points covered in this content. The most important takeaway is that [key insight from content]. Additional important points include: [Point 1], [Point 2], and [Point 3].`;
        }
        if (lowerSection.includes('detail') || lowerSection.includes('analysis')) {
            return `This section explores the details behind our key findings. First, we examine [topic 1] and its implications for [relevant area]. Next, we analyze [topic 2], particularly focusing on [specific aspect]. Finally, we investigate [topic 3] and how it relates to [broader context].`;
        }
        if (lowerSection.includes('implementation') || lowerSection.includes('tips') || lowerSection.includes('steps')) {
            return `This section provides practical guidance for implementation. Begin by [first step] to establish [foundation]. Next, [second step] will help you [achieve specific outcome]. Be sure to consider [important consideration] during this process. For best results, also [expert tip].`;
        }
        if (lowerSection.includes('evidence') || lowerSection.includes('supporting')) {
            return `This section presents supporting evidence for our findings. Research by [authority source] demonstrates that [relevant finding]. Additionally, [data point] from [credible source] further validates our approach. Case studies from [industry examples] show successful implementation resulting in [positive outcomes].`;
        }
        return `This section covers important information related to ${section.toLowerCase()}. Various aspects are explored in detail, with emphasis on practical application and valuable insights based on industry expertise and research.`;
    }
    generateMockAnswer(question, depth) {
        const answers = {
            1: `The key answer is that [concise solution/answer to question]. This addresses the core issue directly.`,
            2: `The main answer is that [concise solution/answer to question]. This works because [brief explanation of mechanism or principle].
      
      There are several important factors to consider:
      1. [First key point relevant to the question]
      2. [Second key point with slight elaboration]
      3. [Third key point with context]
      
      Most users find that [common experience or outcome] after implementing this approach.`,
            3: `The comprehensive answer is that [concise solution/answer to question]. This approach is based on [theoretical foundation or principle], which has been established by [authoritative source or research].
      
      There are several important dimensions to consider:
      1. [First key point with detailed explanation]
      2. [Second key point with examples and context]
      3. [Third key point with nuanced analysis]
      4. [Fourth key point addressing edge cases]
      
      The implementation typically involves [detailed process explanation]. During this process, it's critical to [important consideration] to avoid [potential pitfall].
      
      Research by [expert or organization] has shown that this approach results in [specific outcomes or benefits] in approximately [success rate] of cases. Alternative approaches include [alternative 1] and [alternative 2], but these are generally less effective because [comparative limitation].
      
      In conclusion, [reinforcement of main answer with contextual nuance].`
        };
        return answers[depth];
    }
};
exports.BlufContentStructurerService = BlufContentStructurerService;
exports.BlufContentStructurerService = BlufContentStructurerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], BlufContentStructurerService);
//# sourceMappingURL=bluf-content-structurer.service.js.map