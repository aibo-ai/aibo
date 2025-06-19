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
exports.SchemaMarkupGeneratorService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let SchemaMarkupGeneratorService = class SchemaMarkupGeneratorService {
    constructor(configService) {
        this.configService = configService;
    }
    async generateSchemaMarkup(content, contentType, segment) {
        console.log(`Generating schema markup for ${contentType} content (${segment})`);
        const schemaType = this.determineSchemaType(contentType, segment);
        const schema = this.createSchemaForType(schemaType, content, segment);
        return {
            contentSummary: {
                title: content.title || 'Untitled Content',
                type: contentType,
            },
            recommendedSchema: schemaType,
            schema,
            segment,
            timestamp: new Date().toISOString(),
        };
    }
    async analyzeContentForSchemaRecommendations(content, segment) {
        console.log(`Analyzing content for schema recommendations (${segment})`);
        const contentStructure = this.analyzeContentStructure(content);
        const recommendations = this.generateSchemaRecommendations(contentStructure, segment);
        return {
            contentSummary: {
                title: content.title || 'Untitled Content',
                sections: content.sections ? Object.keys(content.sections).length : 0,
            },
            contentAnalysis: contentStructure,
            schemaRecommendations: recommendations,
            implementationPriority: recommendations.map(rec => ({
                schema: rec.schema,
                priority: rec.compatibilityScore > 0.8 ? 'high' : (rec.compatibilityScore > 0.6 ? 'medium' : 'low'),
            })),
            segment,
            timestamp: new Date().toISOString(),
        };
    }
    async enhanceSchemaMarkup(existingSchema, content, segment) {
        console.log(`Enhancing schema markup for ${segment} content`);
        if (!existingSchema || !existingSchema['@type']) {
            throw new Error('Invalid schema markup provided');
        }
        const enhancedSchema = Object.assign({}, existingSchema);
        const schemaType = existingSchema['@type'];
        const enhancedProperties = this.generateEnhancedProperties(schemaType, content, segment);
        Object.keys(enhancedProperties).forEach(property => {
            if (!enhancedSchema[property]) {
                enhancedSchema[property] = enhancedProperties[property];
            }
        });
        return {
            originalSchema: existingSchema,
            enhancedSchema,
            addedProperties: Object.keys(enhancedProperties).filter(property => !existingSchema[property]),
            segment,
            timestamp: new Date().toISOString(),
        };
    }
    determineSchemaType(contentType, segment) {
        const schemaMap = {
            article: segment === 'b2b' ? 'TechArticle' : 'Article',
            blog: segment === 'b2b' ? 'TechArticle' : 'BlogPosting',
            faq: 'FAQPage',
            product: 'Product',
            service: 'Service',
            review: 'Review',
            event: 'Event',
            course: 'Course',
            howto: 'HowTo',
            comparison: segment === 'b2b' ? 'TechArticle' : 'Article',
            guide: segment === 'b2b' ? 'TechArticle' : 'HowTo',
        };
        return schemaMap[contentType] || 'Article';
    }
    createSchemaForType(schemaType, content, segment) {
        const schema = {
            '@context': 'https://schema.org',
            '@type': schemaType,
        };
        if (content.title)
            schema['name'] = content.title;
        if (content.description)
            schema['description'] = content.description;
        switch (schemaType) {
            case 'Article':
            case 'BlogPosting':
            case 'TechArticle':
                schema['headline'] = content.title;
                schema['datePublished'] = new Date().toISOString();
                if (content.author) {
                    schema['author'] = {
                        '@type': 'Person',
                        'name': content.author,
                    };
                }
                if (content.image)
                    schema['image'] = content.image;
                break;
            case 'FAQPage':
                schema['mainEntity'] = this.generateFaqEntities(content);
                break;
            case 'HowTo':
                schema['step'] = this.generateHowToSteps(content);
                if (content.totalTime)
                    schema['totalTime'] = content.totalTime;
                break;
            case 'Product':
            case 'Service':
                if (content.price) {
                    schema['offers'] = {
                        '@type': 'Offer',
                        'price': content.price,
                        'priceCurrency': content.currency || 'USD',
                    };
                }
                if (content.ratings) {
                    schema['aggregateRating'] = {
                        '@type': 'AggregateRating',
                        'ratingValue': content.ratings.value || 4.5,
                        'reviewCount': content.ratings.count || 27,
                    };
                }
                break;
        }
        if (segment === 'b2b') {
            schema['audience'] = {
                '@type': 'BusinessAudience',
                'audienceType': content.audience || 'Enterprise',
            };
        }
        return schema;
    }
    generateFaqEntities(content) {
        if (!content.faqs || !Array.isArray(content.faqs)) {
            return Array.from({ length: 3 }, (_, i) => ({
                '@type': 'Question',
                'name': `Sample Question ${i + 1}?`,
                'acceptedAnswer': {
                    '@type': 'Answer',
                    'text': `This is a sample answer for question ${i + 1}.`,
                },
            }));
        }
        return content.faqs.map(faq => ({
            '@type': 'Question',
            'name': faq.question,
            'acceptedAnswer': {
                '@type': 'Answer',
                'text': faq.answer,
            },
        }));
    }
    generateHowToSteps(content) {
        if (!content.steps || !Array.isArray(content.steps)) {
            return Array.from({ length: 3 }, (_, i) => ({
                '@type': 'HowToStep',
                'name': `Step ${i + 1}`,
                'text': `This is a description for step ${i + 1}.`,
                'position': i + 1,
            }));
        }
        return content.steps.map((step, index) => ({
            '@type': 'HowToStep',
            'name': step.title || `Step ${index + 1}`,
            'text': step.description,
            'position': index + 1,
            'image': step.image,
        }));
    }
    analyzeContentStructure(content) {
        const structure = {
            hasQuestionAnswerPairs: Math.random() > 0.5,
            hasStepsOrInstructions: Math.random() > 0.6,
            hasProductInformation: Math.random() > 0.7,
            hasPricing: Math.random() > 0.8,
            hasComparisons: Math.random() > 0.6,
            hasDefinitions: Math.random() > 0.5,
            topicCategory: ['Technology', 'Business', 'Marketing', 'Healthcare', 'Finance'][Math.floor(Math.random() * 5)],
        };
        return structure;
    }
    generateSchemaRecommendations(contentStructure, segment) {
        const recommendations = [];
        if (contentStructure.hasQuestionAnswerPairs) {
            recommendations.push({
                schema: 'FAQPage',
                compatibilityScore: parseFloat((0.7 + Math.random() * 0.3).toFixed(2)),
                reasoning: 'Content contains multiple question-answer pairs',
            });
        }
        if (contentStructure.hasStepsOrInstructions) {
            recommendations.push({
                schema: 'HowTo',
                compatibilityScore: parseFloat((0.7 + Math.random() * 0.3).toFixed(2)),
                reasoning: 'Content contains step-by-step instructions',
            });
        }
        if (contentStructure.hasProductInformation) {
            recommendations.push({
                schema: 'Product',
                compatibilityScore: parseFloat((0.7 + Math.random() * 0.3).toFixed(2)),
                reasoning: 'Content describes product specifications and features',
            });
        }
        recommendations.push({
            schema: segment === 'b2b' ? 'TechArticle' : 'Article',
            compatibilityScore: parseFloat((0.6 + Math.random() * 0.4).toFixed(2)),
            reasoning: 'General article schema suitable for most content',
        });
        return recommendations.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
    }
    generateEnhancedProperties(schemaType, content, segment) {
        const enhancedProps = {};
        if (content.keywords)
            enhancedProps['keywords'] = content.keywords;
        if (content.category)
            enhancedProps['articleSection'] = content.category;
        if (content.author) {
            enhancedProps['author'] = {
                '@type': 'Person',
                'name': content.author,
                'url': content.authorUrl,
            };
        }
        switch (schemaType) {
            case 'Article':
            case 'BlogPosting':
            case 'TechArticle':
                enhancedProps['dateModified'] = new Date().toISOString();
                enhancedProps['publisher'] = {
                    '@type': 'Organization',
                    'name': content.publisher || 'ContentArchitect',
                    'logo': content.publisherLogo || 'https://example.com/logo.png',
                };
                if (content.citations && Array.isArray(content.citations)) {
                    enhancedProps['citation'] = content.citations.map(citation => ({
                        '@type': 'CreativeWork',
                        'name': citation.title,
                        'author': citation.author,
                        'datePublished': citation.year,
                    }));
                }
                if (segment === 'b2b') {
                    enhancedProps['proficiencyLevel'] = 'Expert';
                    enhancedProps['backstory'] = 'This article provides in-depth technical information for industry professionals.';
                }
                break;
            case 'Product':
                enhancedProps['brand'] = {
                    '@type': 'Brand',
                    'name': content.brand || 'Sample Brand',
                };
                if (content.reviews && Array.isArray(content.reviews)) {
                    enhancedProps['review'] = content.reviews.map(review => ({
                        '@type': 'Review',
                        'reviewBody': review.text,
                        'reviewRating': {
                            '@type': 'Rating',
                            'ratingValue': review.rating,
                        },
                        'author': {
                            '@type': 'Person',
                            'name': review.author,
                        },
                    }));
                }
                break;
        }
        return enhancedProps;
    }
};
exports.SchemaMarkupGeneratorService = SchemaMarkupGeneratorService;
exports.SchemaMarkupGeneratorService = SchemaMarkupGeneratorService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SchemaMarkupGeneratorService);
//# sourceMappingURL=schema-markup-generator.service.js.map