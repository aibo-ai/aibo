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
var ClaudeAIService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClaudeAIService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("axios");
const crypto = require("crypto");
let ClaudeAIService = ClaudeAIService_1 = class ClaudeAIService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(ClaudeAIService_1.name);
        this.isApiKeyValid = false;
        this.logger = new common_1.Logger(ClaudeAIService_1.name);
        this.apiKey = this.configService.get('CLAUDE_API_KEY');
        if (!this.apiKey) {
            this.logger.warn('CLAUDE_API_KEY is not set in environment variables');
        }
        else {
            this.logger.log('CLAUDE_API_KEY found in environment variables');
            if (!this.apiKey.startsWith('sk-') || this.apiKey.length < 20) {
                this.logger.warn('CLAUDE_API_KEY appears to be in an invalid format');
            }
            else {
                this.validateApiKey().catch(err => {
                    this.logger.error(`Failed to validate Claude API key: ${err.message}`);
                });
            }
        }
    }
    async validateApiKey() {
        try {
            const requestId = crypto.randomBytes(4).toString('hex');
            this.logger.log(`[${requestId}] Validating Claude API key...`);
            const response = await axios_1.default.post('https://api.anthropic.com/v1/messages', {
                model: 'claude-3-haiku-20240307',
                max_tokens: 10,
                temperature: 0.7,
                messages: [{ role: 'user', content: 'Hello' }]
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01'
                },
                timeout: 5000
            });
            if (response.status === 200 || response.status === 201) {
                this.logger.log(`[${requestId}] Claude API key is valid`);
                this.isApiKeyValid = true;
                return true;
            }
            this.logger.warn(`[${requestId}] Claude API key validation failed with status ${response.status}`);
            return false;
        }
        catch (error) {
            this.logger.error(`Claude API key validation failed: ${error.message}`);
            this.isApiKeyValid = false;
            return false;
        }
    }
    async generateCompletion(prompt, options = {}) {
        var _a, _b, _c, _d, _e, _f;
        const requestId = crypto.randomBytes(4).toString('hex');
        this.logger.log(`[${requestId}] Starting Claude completion request`);
        if (this.apiKey && !this.isApiKeyValid) {
            this.logger.warn(`[${requestId}] Skipping Claude API call - API key is known to be invalid`);
            throw new Error('Claude API key is invalid or expired');
        }
        try {
            const models = [
                options.model,
                'claude-3-haiku-20240307',
                'claude-3-sonnet-20240229',
                'claude-3-opus-20240229',
                'claude-2.1',
                'claude-2.0'
            ].filter(Boolean);
            if (!this.apiKey) {
                this.logger.error(`[${requestId}] CLAUDE_API_KEY environment variable is not set or empty`);
                throw new Error('Claude API key is not configured');
            }
            for (const modelName of models) {
                try {
                    this.logger.log(`[${requestId}] Attempting completion with Claude model: ${modelName}`);
                    const payload = {
                        model: modelName,
                        max_tokens: options.maxTokens || 1000,
                        temperature: options.temperature || 0.7,
                        messages: [
                            { role: 'user', content: prompt }
                        ]
                    };
                    if (options.system) {
                        payload.system = options.system;
                    }
                    this.logger.debug(`[${requestId}] Sending request to Claude API`);
                    const response = await axios_1.default.post('https://api.anthropic.com/v1/messages', payload, {
                        headers: {
                            'Content-Type': 'application/json',
                            'x-api-key': this.apiKey,
                            'anthropic-version': '2023-06-01'
                        },
                        timeout: 60000
                    });
                    this.logger.log(`[${requestId}] Claude API responded successfully with status ${response.status}`);
                    if (response.data && response.data.content && response.data.content.length > 0) {
                        return {
                            completion: response.data.content[0].text,
                            stop_reason: response.data.stop_reason,
                            usage: response.data.usage,
                            model: response.data.model
                        };
                    }
                    else {
                        this.logger.warn(`[${requestId}] Unexpected response structure from Claude API`);
                        throw new Error('Unexpected response structure from Claude API');
                    }
                }
                catch (modelError) {
                    this.logger.warn(`[${requestId}] Failed with model ${modelName}: ${modelError.message}`);
                    if (modelName === models[models.length - 1]) {
                        throw modelError;
                    }
                    this.logger.log(`[${requestId}] Trying next model in fallback sequence...`);
                }
            }
            throw new Error('Failed to generate content with any Claude model');
        }
        catch (error) {
            const requestId = crypto.randomBytes(4).toString('hex');
            this.logger.error(`[${requestId}] Claude API error: ${((_a = error.response) === null || _a === void 0 ? void 0 : _a.status) || 'unknown'} - ${error.message}`);
            if (error.response) {
                this.logger.error(`[${requestId}] Response status: ${error.response.status}`);
                this.logger.error(`[${requestId}] Response headers: ${JSON.stringify(error.response.headers)}`);
                this.logger.error(`[${requestId}] Response data: ${JSON.stringify(error.response.data)}`);
                this.logger.error(`[${requestId}] Request URL: ${(_b = error.config) === null || _b === void 0 ? void 0 : _b.url}`);
                if ((_c = error.config) === null || _c === void 0 ? void 0 : _c.headers) {
                    const safeHeaders = Object.assign({}, error.config.headers);
                    if (safeHeaders['Authorization']) {
                        safeHeaders['Authorization'] = 'Bearer [REDACTED]';
                    }
                    if (safeHeaders['x-api-key']) {
                        safeHeaders['x-api-key'] = '[REDACTED]';
                    }
                    this.logger.error(`[${requestId}] Request headers: ${JSON.stringify(safeHeaders)}`);
                }
                this.logger.error(`[${requestId}] Request data: ${JSON.stringify((_d = error.config) === null || _d === void 0 ? void 0 : _d.data)}`);
                switch (error.response.status) {
                    case 401:
                        throw new Error('Authentication failed: Invalid Claude API key');
                    case 403:
                        throw new Error('Authorization failed: This API key does not have permission to use this model');
                    case 404:
                        throw new Error('Claude API endpoint not found: The API endpoint may have changed, the model may not exist, or the request was malformed');
                    case 429:
                        throw new Error('Claude API rate limit exceeded: Too many requests');
                    case 400:
                        const errorMessage = ((_f = (_e = error.response.data) === null || _e === void 0 ? void 0 : _e.error) === null || _f === void 0 ? void 0 : _f.message) || 'Unknown error';
                        throw new Error(`Bad request to Claude API: ${errorMessage}`);
                    case 500:
                    case 502:
                    case 503:
                    case 504:
                        throw new Error(`Claude API server error (${error.response.status}): The service may be temporarily unavailable`);
                    default:
                        throw new Error(`Failed to generate content: ${error.message}`);
                }
            }
            else {
                if (error.code === 'ECONNABORTED') {
                    throw new Error('Connection to Claude API timed out');
                }
                else if (error.code === 'ENOTFOUND') {
                    throw new Error('Could not connect to Claude API: Host not found');
                }
                else {
                    throw new Error(`Failed to generate content: ${error.message}`);
                }
            }
        }
    }
    async generateStructuredContent(content, instructions, outputFormat = 'json') {
        const prompt = `
I need to restructure the following content according to specific instructions.

CONTENT:
${content}

INSTRUCTIONS:
${instructions}

Please provide the restructured content in ${outputFormat} format.
`;
        try {
            const response = await this.generateCompletion(prompt, {
                maxTokens: 4000,
                temperature: 0.2,
            });
            if (outputFormat === 'json') {
                try {
                    const jsonMatch = response.completion.match(/```json\n([\s\S]*?)\n```/) ||
                        response.completion.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        const jsonString = jsonMatch[1] || jsonMatch[0];
                        return JSON.parse(jsonString);
                    }
                    return response.completion;
                }
                catch (parseError) {
                    console.error('Error parsing JSON from Claude response:', parseError.message);
                    return response.completion;
                }
            }
            return response.completion;
        }
        catch (error) {
            console.error('Error generating structured content:', error.message);
            throw new Error(`Failed to generate structured content: ${error.message}`);
        }
    }
    async analyzeContent(content, analysisType) {
        const analysisPrompts = {
            'eeat': 'Analyze this content for E-E-A-T signals (Expertise, Experience, Authoritativeness, Trustworthiness). Provide detailed scoring and suggestions for improvement.',
            'seo': 'Analyze this content for SEO optimization. Identify keywords, structure issues, meta description recommendations, and other SEO factors.',
            'readability': 'Analyze this content for readability. Consider sentence complexity, paragraph length, reading level, and engagement factors.',
            'competitive': 'Analyze this content compared to top-performing content in this niche. Identify gaps, strengths, and areas for improvement.',
            'citations': 'Analyze the citations and references in this content. Evaluate their authority, relevance, and credibility.'
        };
        const analysisPrompt = analysisPrompts[analysisType] ||
            `Analyze this content for ${analysisType} aspects and provide detailed feedback.`;
        const prompt = `
CONTENT TO ANALYZE:
${content}

ANALYSIS INSTRUCTIONS:
${analysisPrompt}

Provide your analysis in a structured JSON format with detailed insights and actionable recommendations.
`;
        try {
            const response = await this.generateCompletion(prompt, {
                maxTokens: 3000,
                temperature: 0.1,
            });
            try {
                const jsonMatch = response.completion.match(/```json\n([\s\S]*?)\n```/) ||
                    response.completion.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const jsonString = jsonMatch[1] || jsonMatch[0];
                    return JSON.parse(jsonString);
                }
                return response.completion;
            }
            catch (parseError) {
                console.error('Error parsing JSON from Claude response:', parseError.message);
                return response.completion;
            }
        }
        catch (error) {
            console.error(`Error analyzing content for ${analysisType}:`, error.message);
            throw new Error(`Failed to analyze content: ${error.message}`);
        }
    }
};
exports.ClaudeAIService = ClaudeAIService;
exports.ClaudeAIService = ClaudeAIService = ClaudeAIService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ClaudeAIService);
//# sourceMappingURL=claude-ai.service.js.map