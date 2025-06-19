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
exports.OriginalResearchEngineService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const azure_ai_service_1 = require("../../../shared/services/azure-ai.service");
let OriginalResearchEngineService = class OriginalResearchEngineService {
    constructor(configService, azureAIService) {
        this.configService = configService;
        this.azureAIService = azureAIService;
    }
    generateResearchPrompt(topic, contentType, segment, searchResults = { value: [] }) {
        const contextBuilder = [];
        if (searchResults.value && searchResults.value.length > 0) {
            const topResults = searchResults.value.slice(0, 3);
            contextBuilder.push('Based on the following information:');
            topResults.forEach((result, index) => {
                if (result.content) {
                    contextBuilder.push(`Source ${index + 1}: ${result.content.substring(0, 200)}...`);
                }
            });
        }
        if (segment === 'b2b') {
            contextBuilder.push('Generate original business research data focused on industry insights, market trends, and professional use cases.');
        }
        else {
            contextBuilder.push('Generate original consumer research data focused on user behavior, preferences, and demographic insights.');
        }
        switch (contentType.toLowerCase()) {
            case 'blog':
            case 'article':
                contextBuilder.push('Format the data to include statistics and insights suitable for article citations.');
                break;
            case 'whitepaper':
            case 'report':
                contextBuilder.push('Include detailed methodology information and comprehensive data analysis suitable for in-depth reports.');
                break;
            case 'landing page':
            case 'product page':
                contextBuilder.push('Focus on value proposition metrics and competitive advantages that highlight key benefits.');
                break;
            default:
                contextBuilder.push('Provide balanced research data with key statistics and actionable insights.');
        }
        const prompt = `${contextBuilder.join('\n\n')}\n\n
      Please generate original research findings on "${topic}" for ${segment} audiences.
      
      FORMAT YOUR RESPONSE AS A JSON OBJECT with the following structure:
      {
        "researchType": "[type of research study]",
        "data": {
          [key data points and statistics as appropriate for the research type],
          "demographics": [demographic breakdown if relevant],
          "trends": [identified trends if relevant],
          "comparativeAnalysis": [comparative data if relevant]
        },
        "methodology": "[description of the research methodology]"
      }
      
      Ensure all data is presented with appropriate context and confidence levels.
    `;
        return prompt;
    }
    extractResearchType(text) {
        const researchTypePatterns = [
            /research type[:\s]+([\w\s-]+)/i,
            /type of (research|study)[:\s]+([\w\s-]+)/i,
            /conducted (a|an) ([\w\s-]+) (research|study|analysis)/i,
            /([\w\s-]+) (research|study|analysis) was conducted/i
        ];
        for (const pattern of researchTypePatterns) {
            const match = text.match(pattern);
            if (match && match.length > 1) {
                return match.length > 2 ? match[2].trim() : match[1].trim();
            }
        }
        return undefined;
    }
    extractResearchData(text, researchType) {
        const data = {};
        const demographics = this.extractDemographicData(text);
        if (Object.keys(demographics).length > 0) {
            data.demographics = demographics;
        }
        const trends = this.extractTrendData(text);
        if (trends.length > 0) {
            data.trends = trends;
        }
        const comparativeAnalysis = this.extractComparativeData(text);
        if (Object.keys(comparativeAnalysis).length > 0) {
            data.comparativeAnalysis = comparativeAnalysis;
        }
        const keyFindings = this.extractKeyFindings(text, researchType);
        if (keyFindings.length > 0) {
            data.keyFindings = keyFindings;
        }
        if (Object.keys(data).length === 0) {
            data.summary = text.substring(0, 200) + '...';
            data.extractionNote = 'Limited structured data could be extracted from the AI response';
        }
        return data;
    }
    extractMethodology(text) {
        const methodologyPatterns = [
            /methodology[:\s]+([^\n.]+)/i,
            /research method[:\s]+([^\n.]+)/i,
            /conducted using ([^\n.]+)/i,
            /based on ([^\n.]+) (methodology|approach|method)/i
        ];
        for (const pattern of methodologyPatterns) {
            const match = text.match(pattern);
            if (match && match.length > 1) {
                return match[1].trim();
            }
        }
        return undefined;
    }
    extractDemographicData(text) {
        const demographics = {};
        const ageGroupPattern = /(\d+[-%]\d*\s*(?:of\s*)?(?:respondents|users|consumers|participants|people)?\s*(?:were|are|aged|in the age group|between)?\s*(?:aged\s*)?(?:between\s*)?(?:\d+[-–]\d+|\d+\+|\d+\s*(?:or|and)\s*(?:above|older|younger|under)))/gi;
        const ageMatches = text.match(ageGroupPattern);
        if (ageMatches && ageMatches.length > 0) {
            demographics.ageGroups = ageMatches.map(match => match.trim());
        }
        const genderPattern = /(\d+[-%]\d*\s*(?:of\s*)?(?:respondents|users|consumers|participants|people)?\s*(?:were|are|identified as)\s*(?:male|female|non-binary|other))/gi;
        const genderMatches = text.match(genderPattern);
        if (genderMatches && genderMatches.length > 0) {
            demographics.gender = genderMatches.map(match => match.trim());
        }
        const incomePattern = /(\d+[-%]\d*\s*(?:of\s*)?(?:respondents|users|consumers|participants|people|organizations|companies)?\s*(?:were|are|had|have|reported|with)\s*(?:income|revenue|employees|size|budget)\s*(?:of|over|under|between)?\s*(?:\$?\d+[kmbt]?\+?|\$?\d+[kmbt]?[-–]\$?\d+[kmbt]?))/gi;
        const incomeMatches = text.match(incomePattern);
        if (incomeMatches && incomeMatches.length > 0) {
            demographics.income = incomeMatches.map(match => match.trim());
        }
        const geoPattern = /(\d+[-%]\d*\s*(?:of\s*)?(?:respondents|users|consumers|participants|people)?\s*(?:were|are|from|located in|reside in|based in)\s*(?:North America|USA|Europe|Asia|Africa|South America|Australia|specific regions|urban areas|rural areas))/gi;
        const geoMatches = text.match(geoPattern);
        if (geoMatches && geoMatches.length > 0) {
            demographics.geography = geoMatches.map(match => match.trim());
        }
        return demographics;
    }
    extractTrendData(text) {
        const trends = [];
        const trendPatterns = [
            /(increase[sd]|decrease[sd]|grew|declined|rose|fell|surge[sd]|drop[ps]?ed|climbing|falling) (by|to|from) (\d+[.,]?\d*[%]?)/gi,
            /(\d+[.,]?\d*[%]?)\s*(increase|decrease|growth|decline|rise|fall|surge|drop)/gi,
            /(upward|downward|rising|declining|growing)\s*trend/gi,
            /trend(?:s|ing)?\s*(?:show(?:s|ing|ed)?|indicate[sd]?|suggest[s]?|point[s]? to)\s*([^.,;]+)/gi
        ];
        trendPatterns.forEach(pattern => {
            const matches = text.matchAll(pattern);
            for (const match of matches) {
                const trendText = match[0].trim();
                if (trendText && !trends.includes(trendText)) {
                    trends.push(trendText);
                }
            }
        });
        const yearComparisonPattern = /(?:year[- ]over[- ]year|YoY|year[- ]on[- ]year|compared to (?:last|previous) (?:year|quarter|month)|\d{4}\s*(?:to|vs\.?)\s*\d{4})[^.,;]{3,50}/gi;
        const yearMatches = text.match(yearComparisonPattern);
        if (yearMatches) {
            yearMatches.forEach(match => {
                const trendText = match.trim();
                if (!trends.includes(trendText)) {
                    trends.push(trendText);
                }
            });
        }
        return trends;
    }
    extractComparativeData(text) {
        const comparative = {};
        const comparisonSectionPattern = /(comparison|comparative analysis|vs\.|versus)[^.]*\./gi;
        const sections = text.match(comparisonSectionPattern);
        if (sections && sections.length > 0) {
            comparative.sections = sections.map(section => section.trim());
        }
        const entityPattern = /([\w\s]+) (?:outperform(?:s|ed)?|exceed(?:s|ed)?|surpass(?:es|ed)?|better than|worse than|compared to|versus) ([\w\s]+) (?:by|with|at) ([^.,;]+)/gi;
        const entities = [];
        const entityMatches = text.matchAll(entityPattern);
        for (const match of entityMatches) {
            if (match.length >= 4) {
                entities.push({
                    entity1: match[1].trim(),
                    entity2: match[2].trim(),
                    comparisonMetric: match[3].trim(),
                    fullText: match[0].trim()
                });
            }
        }
        if (entities.length > 0) {
            comparative.entityComparisons = entities;
        }
        const percentPattern = /(\d+[.,]?\d*%)\s*(?:more|less|higher|lower|better|worse|greater|smaller)\s*than/gi;
        const percentMatches = text.match(percentPattern);
        if (percentMatches && percentMatches.length > 0) {
            comparative.percentageComparisons = percentMatches.map(match => match.trim());
        }
        return comparative;
    }
    extractKeyFindings(text, researchType) {
        const findings = [];
        const keyFindingSections = [
            /key findings?[:\s]+([^\n]+)/gi,
            /main results?[:\s]+([^\n]+)/gi,
            /findings? showed that[:\s]+([^\n]+)/gi,
            /research (revealed|showed|indicated)[:\s]+([^\n]+)/gi
        ];
        keyFindingSections.forEach(pattern => {
            const matches = text.match(pattern);
            if (matches) {
                matches.forEach(match => {
                    const findingText = match.replace(/key findings?[:\s]+|main results?[:\s]+|findings? showed that[:\s]+|research (revealed|showed|indicated)[:\s]+/gi, '').trim();
                    if (findingText && !findings.includes(findingText)) {
                        findings.push(findingText);
                    }
                });
            }
        });
        const bulletPattern = /(•|\*|\d+\.)\s*([^\n•*\d][^\n]+)/gi;
        const bulletMatches = text.matchAll(bulletPattern);
        for (const match of bulletMatches) {
            if (match[2]) {
                const finding = match[2].trim();
                if (finding && !findings.includes(finding) && finding.length > 10) {
                    findings.push(finding);
                }
            }
        }
        if (findings.length === 0) {
            const statsPattern = /[^.!?]*\d+[.,]?\d*%[^.!?]*/g;
            const statsMatches = text.match(statsPattern);
            if (statsMatches) {
                statsMatches.forEach(match => {
                    const finding = match.trim();
                    if (finding && !findings.includes(finding) && finding.length > 10 && finding.length < 200) {
                        findings.push(finding);
                    }
                });
            }
        }
        if (findings.length > 5) {
            const prioritized = findings.filter(finding => {
                const lowerFinding = finding.toLowerCase();
                const lowerType = researchType.toLowerCase();
                return lowerFinding.includes(lowerType) ||
                    (lowerType.includes('survey') && lowerFinding.includes('respondent')) ||
                    (lowerType.includes('analysis') && (lowerFinding.includes('analysis') || lowerFinding.includes('compared')));
            });
            return prioritized.length > 0 ? prioritized.slice(0, 5) : findings.slice(0, 5);
        }
        return findings;
    }
    async generateOriginalResearch(topic, contentType, segment) {
        console.log(`Generating original research for ${segment} content on topic: ${topic}`);
        try {
            const researchTypes = segment === 'b2b'
                ? ['industry survey', 'comparative analysis', 'case study', 'market forecast']
                : ['consumer survey', 'usage statistics', 'demographic analysis', 'trend analysis'];
            const searchQuery = `${topic} ${segment === 'b2b' ? 'business industry' : 'consumer'} research data statistics`;
            let searchResults;
            try {
                searchResults = await this.azureAIService.search(searchQuery, 'content-index');
                console.log('Research search results retrieved from Azure AI');
            }
            catch (error) {
                console.error('Error searching for research data:', error);
                searchResults = { value: [] };
            }
            const researchPrompt = this.generateResearchPrompt(topic, contentType, segment, searchResults);
            const researchOptions = {
                maxTokens: 1000,
                temperature: 0.4,
                systemMessage: 'You are an expert research analyst specializing in data generation and analysis.'
            };
            const aiCompletionResult = await this.azureAIService.generateCompletion(researchPrompt, researchOptions);
            let researchData;
            const researchText = aiCompletionResult.choices[0].text;
            try {
                if (researchText.includes('{\'') || researchText.includes('"')) {
                    const jsonStart = researchText.indexOf('{');
                    const jsonEnd = researchText.lastIndexOf('}') + 1;
                    if (jsonStart !== -1 && jsonEnd !== -1) {
                        const jsonStr = researchText.substring(jsonStart, jsonEnd);
                        researchData = JSON.parse(jsonStr);
                    }
                }
            }
            catch (error) {
                console.error('Error parsing research JSON:', error);
            }
            if (!researchData) {
                const selectedType = researchTypes[Math.floor(Math.random() * researchTypes.length)];
                researchData = {
                    researchType: this.extractResearchType(researchText) || selectedType,
                    data: this.extractResearchData(researchText, selectedType),
                    methodology: this.extractMethodology(researchText) || 'AI-assisted data analysis',
                };
            }
            const researchTextForEmbedding = JSON.stringify(researchData);
            let embeddings;
            try {
                embeddings = await this.azureAIService.generateEmbeddings(researchTextForEmbedding);
            }
            catch (error) {
                console.error('Error generating embeddings for research data:', error);
            }
            return {
                researchType: researchData.researchType || researchTypes[Math.floor(Math.random() * researchTypes.length)],
                topic,
                segment,
                contentType,
                data: researchData.data || {},
                methodology: researchData.methodology || 'AI-assisted research generation',
                aiGenerated: true,
                embeddings,
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            console.error('Error generating research with Azure AI:', error);
            console.log('Falling back to mock research generation');
            const researchTypes = segment === 'b2b'
                ? ['industry survey', 'comparative analysis', 'case study', 'market forecast']
                : ['consumer survey', 'usage statistics', 'demographic analysis', 'trend analysis'];
            const selectedType = researchTypes[Math.floor(Math.random() * researchTypes.length)];
            const mockData = {};
            if (selectedType === 'industry survey' || selectedType === 'consumer survey') {
                mockData['sampleSize'] = Math.floor(segment === 'b2b' ? 100 + Math.random() * 900 : 500 + Math.random() * 1500);
                mockData['keyFindings'] = [
                    `${Math.floor(50 + Math.random() * 40)}% of respondents reported increased adoption`,
                    `${Math.floor(20 + Math.random() * 30)}% cited cost as a major concern`,
                    `${Math.floor(60 + Math.random() * 30)}% expressed interest in advanced features`
                ];
            }
            else if (selectedType === 'comparative analysis') {
                mockData['comparisonFactors'] = ['cost', 'efficiency', 'scalability', 'implementation time'];
                mockData['entities'] = ['Solution A', 'Solution B', 'Solution C'];
                mockData['topPerformer'] = 'Solution B';
            }
            else if (selectedType === 'demographic analysis') {
                mockData['ageGroups'] = {
                    '18-24': `${Math.floor(10 + Math.random() * 20)}%`,
                    '25-34': `${Math.floor(20 + Math.random() * 30)}%`,
                    '35-44': `${Math.floor(15 + Math.random() * 25)}%`,
                    '45-54': `${Math.floor(10 + Math.random() * 20)}%`,
                    '55+': `${Math.floor(5 + Math.random() * 15)}%`
                };
                mockData['primaryDemographic'] = '25-34';
            }
            else if (selectedType === 'trend analysis') {
                mockData['trends'] = [
                    { name: 'Mobile usage', growth: `${Math.floor(10 + Math.random() * 30)}%` },
                    { name: 'Social commerce', growth: `${Math.floor(20 + Math.random() * 40)}%` },
                    { name: 'Voice search', growth: `${Math.floor(30 + Math.random() * 50)}%` }
                ];
                mockData['prediction'] = 'Continued growth in voice search adoption';
            }
            return {
                researchType: selectedType,
                topic,
                segment,
                contentType,
                data: mockData,
                methodology: 'Generated data (fallback method)',
                timestamp: new Date().toISOString(),
            };
        }
    }
    async integrateResearchIntoContent(content, researchData) {
        console.log('Integrating research data into content');
        const enhancedContent = Object.assign({}, content);
        enhancedContent.researchHighlights = {
            title: `Original Research: ${researchData.topic}`,
            keyFindings: researchData.insights.slice(0, 3),
            methodology: researchData.methodology,
            dataVisualizations: researchData.visualizations,
        };
        if (enhancedContent.sections) {
            Object.keys(enhancedContent.sections).forEach(sectionKey => {
                if (Math.random() > 0.6) {
                    const relevantDataPoints = researchData.dataPoints
                        .filter(() => Math.random() > 0.5)
                        .slice(0, 2);
                    if (relevantDataPoints.length > 0) {
                        enhancedContent.sections[sectionKey] = Object.assign(Object.assign({}, enhancedContent.sections[sectionKey]), { researchData: relevantDataPoints, originalResearchFlag: true });
                    }
                }
            });
        }
        return {
            originalContent: content,
            enhancedContent,
            integratedResearch: researchData,
            integrationPoints: this.getIntegrationPoints(enhancedContent),
            timestamp: new Date().toISOString(),
        };
    }
    async identifyResearchGaps(content, segment) {
        console.log(`Identifying research gaps for ${segment} content`);
        const analyzeContentSections = (sections) => {
            if (!sections)
                return [];
            return Object.keys(sections).map(sectionKey => {
                const gapScore = Math.random();
                return {
                    section: sectionKey,
                    gapScore: parseFloat(gapScore.toFixed(2)),
                    gapSeverity: gapScore < 0.3 ? 'low' : (gapScore < 0.7 ? 'medium' : 'high'),
                    researchOpportunities: this.getResearchOpportunities(segment, gapScore),
                };
            });
        };
        const gapAnalysis = analyzeContentSections(content.sections);
        const prioritizedGaps = [...gapAnalysis]
            .sort((a, b) => b.gapScore - a.gapScore)
            .slice(0, 3);
        return {
            contentSummary: {
                topic: content.title || 'Untitled Content',
                sectionCount: content.sections ? Object.keys(content.sections).length : 0,
            },
            gapAnalysis,
            prioritizedResearchOpportunities: prioritizedGaps,
            recommendedApproach: this.getRecommendedApproach(segment, prioritizedGaps),
            timestamp: new Date().toISOString(),
        };
    }
    generateDataPoints(segment, count) {
        const dataPoints = [];
        for (let i = 0; i < count; i++) {
            if (segment === 'b2b') {
                dataPoints.push({
                    metric: ['ROI', 'Efficiency Gain', 'Implementation Success Rate', 'Cost Reduction', 'Time Saved'][i % 5],
                    value: `${(Math.random() * 100).toFixed(1)}%`,
                    context: 'Based on surveyed organizations in 2025',
                    confidence: parseFloat((0.7 + Math.random() * 0.3).toFixed(2)),
                });
            }
            else {
                dataPoints.push({
                    metric: ['Satisfaction Rating', 'Usage Frequency', 'Recommendation Rate', 'Perceived Value', 'Pain Point Reduction'][i % 5],
                    value: `${(Math.random() * 10).toFixed(1)}/10`,
                    context: 'Based on consumer survey data from Q2 2025',
                    confidence: parseFloat((0.7 + Math.random() * 0.3).toFixed(2)),
                });
            }
        }
        return dataPoints;
    }
    generateVisualizations(segment) {
        const visualizationTypes = segment === 'b2b'
            ? ['comparison chart', 'trend analysis', 'implementation timeline']
            : ['satisfaction matrix', 'preference distribution', 'journey map'];
        return visualizationTypes.map(type => ({
            type,
            title: `${type.charAt(0).toUpperCase() + type.slice(1)} for Key Metrics`,
            dataSource: 'Original research conducted in 2025',
            insightSummary: 'Reveals significant patterns in user behavior and preferences',
        }));
    }
    generateInsights(segment) {
        if (segment === 'b2b') {
            return [
                'Industry adoption is accelerating in the enterprise sector',
                'Cost remains the primary barrier to implementation',
                'Integration capabilities are a key differentiator for leading solutions'
            ];
        }
        else {
            return [
                'User engagement increases with personalized experiences',
                'Mobile usage dominates consumer interaction patterns',
                'Privacy concerns impact adoption among older demographics',
                'Pain point reduction was most significant in the 25-34 age demographic',
                'Usage frequency was 2.3x higher than competing products'
            ];
        }
    }
    getDataSources(segment) {
        if (segment === 'b2b') {
            return [
                'Industry survey (n=235)',
                'Implementation case studies (n=42)',
                'Technical performance metrics',
                'Financial ROI analysis',
            ];
        }
        else {
            return [
                'Consumer survey (n=412)',
                'Usage analytics data',
                'Sentiment analysis',
                'Comparative product testing',
            ];
        }
    }
    getIntegrationPoints(content) {
        if (!content.sections)
            return [];
        return Object.keys(content.sections)
            .filter(section => content.sections[section].originalResearchFlag)
            .map(section => {
            var _a;
            return ({
                section,
                researchDataCount: ((_a = content.sections[section].researchData) === null || _a === void 0 ? void 0 : _a.length) || 0,
                enhancementType: 'data-driven insights',
            });
        });
    }
    getResearchOpportunities(segment, gapScore) {
        const opportunities = [];
        if (segment === 'b2b') {
            if (gapScore > 0.7)
                opportunities.push('Conduct industry-specific ROI analysis');
            if (gapScore > 0.5)
                opportunities.push('Benchmark implementation metrics against competitors');
            if (gapScore > 0.3)
                opportunities.push('Survey technical decision makers on key criteria');
        }
        else {
            if (gapScore > 0.7)
                opportunities.push('Perform user satisfaction comparative study');
            if (gapScore > 0.5)
                opportunities.push('Analyze usage patterns across demographics');
            if (gapScore > 0.3)
                opportunities.push('Conduct preference testing for key features');
        }
        return opportunities;
    }
    getRecommendedApproach(segment, prioritizedGaps) {
        const avgGapScore = prioritizedGaps.reduce((sum, gap) => sum + gap.gapScore, 0) / prioritizedGaps.length;
        if (segment === 'b2b') {
            return {
                researchType: avgGapScore > 0.6 ? 'Comprehensive Industry Analysis' : 'Targeted Benchmark Study',
                suggestedMethodology: avgGapScore > 0.6 ? 'Mixed methods (survey + interviews)' : 'Quantitative survey',
                estimatedSampleSize: avgGapScore > 0.6 ? '200-300 respondents' : '100-150 respondents',
                keyMetrics: prioritizedGaps.map(gap => gap.section),
            };
        }
        else {
            return {
                researchType: avgGapScore > 0.6 ? 'Comprehensive Consumer Study' : 'Targeted User Testing',
                suggestedMethodology: avgGapScore > 0.6 ? 'Mixed methods (survey + usability testing)' : 'Qualitative interviews',
                estimatedSampleSize: avgGapScore > 0.6 ? '350-500 respondents' : '50-100 respondents',
                keyMetrics: prioritizedGaps.map(gap => gap.section),
            };
        }
    }
};
exports.OriginalResearchEngineService = OriginalResearchEngineService;
exports.OriginalResearchEngineService = OriginalResearchEngineService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        azure_ai_service_1.AzureAIService])
], OriginalResearchEngineService);
//# sourceMappingURL=original-research-engine.service.js.map