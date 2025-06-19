import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';

// Define interfaces for Claude API requests and responses
interface ClaudeCompletionRequest {
  model: string;
  max_tokens: number;
  temperature: number;
  messages: Array<{role: string, content: string}>;
  system?: string;
}

interface ClaudeCompletionResponse {
  id: string;
  content: Array<{type: string, text: string}>;
  model: string;
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

@Injectable()
export class ClaudeAIService {
  private readonly apiKey: string;
  private readonly logger = new Logger(ClaudeAIService.name);
  private isApiKeyValid: boolean = false;
  
  constructor(private readonly configService: ConfigService) {
    this.logger = new Logger(ClaudeAIService.name);
    this.apiKey = this.configService.get<string>('CLAUDE_API_KEY');
    
    if (!this.apiKey) {
      this.logger.warn('CLAUDE_API_KEY is not set in environment variables');
    } else {
      // Log that we found the API key (without revealing the actual key)
      this.logger.log('CLAUDE_API_KEY found in environment variables');
      
      // Validate API key format (basic check)
      if (!this.apiKey.startsWith('sk-') || this.apiKey.length < 20) {
        this.logger.warn('CLAUDE_API_KEY appears to be in an invalid format');
      } else {
        // Will be set to true after successful validation
        this.validateApiKey().catch(err => {
          this.logger.error(`Failed to validate Claude API key: ${err.message}`);
        });
      }
    }
  }
  
  /**
   * Generate a completion using Claude's latest messages API
   * @param prompt The prompt to send
   * @param options Additional options for the model
   */
  /**
   * Validate the Claude API key by making a minimal API call
   * This helps us determine if we can use Claude or need to fall back to other services
   */
  private async validateApiKey(): Promise<boolean> {
    try {
      const requestId = crypto.randomBytes(4).toString('hex');
      this.logger.log(`[${requestId}] Validating Claude API key...`);
      
      // Make a minimal API call to validate the key
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: 'claude-3-haiku-20240307',
          max_tokens: 10,
          temperature: 0.7,
          messages: [{ role: 'user', content: 'Hello' }]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01'
          },
          timeout: 5000 // Short timeout for validation
        }
      );
      
      if (response.status === 200 || response.status === 201) {
        this.logger.log(`[${requestId}] Claude API key is valid`);
        this.isApiKeyValid = true;
        return true;
      }
      
      this.logger.warn(`[${requestId}] Claude API key validation failed with status ${response.status}`);
      return false;
    } catch (error) {
      this.logger.error(`Claude API key validation failed: ${error.message}`);
      this.isApiKeyValid = false;
      return false;
    }
  }
  
  /**
   * Generate a completion using Claude's latest messages API with fallback mechanisms
   * @param prompt The prompt to send
   * @param options Additional options for the model
   */
  async generateCompletion(prompt: string, options: any = {}): Promise<any> {
    // Generate a unique request ID to track this specific request through logs
    const requestId = crypto.randomBytes(4).toString('hex');
    this.logger.log(`[${requestId}] Starting Claude completion request`);
    
    // If we already know the API key is invalid, throw early to allow fallback
    if (this.apiKey && !this.isApiKeyValid) {
      this.logger.warn(`[${requestId}] Skipping Claude API call - API key is known to be invalid`);
      throw new Error('Claude API key is invalid or expired');
    }
    
    try {
      // Define multiple Claude models to try in order (fallback sequence)
      const models = [
        options.model, // First try user-specified model if provided
        'claude-3-haiku-20240307', // Then try the most widely available model
        'claude-3-sonnet-20240229',
        'claude-3-opus-20240229',
        'claude-2.1',
        'claude-2.0'
      ].filter(Boolean); // Remove undefined/null entries
      
      // Check for valid API key before attempting any requests
      if (!this.apiKey) {
        this.logger.error(`[${requestId}] CLAUDE_API_KEY environment variable is not set or empty`);
        throw new Error('Claude API key is not configured');
      }
      
      // Try each model in sequence until one works
      for (const modelName of models) {
        try {
          this.logger.log(`[${requestId}] Attempting completion with Claude model: ${modelName}`);
          
          // Prepare the request payload according to Claude API specs
          const payload: ClaudeCompletionRequest = {
            model: modelName,
            max_tokens: options.maxTokens || 1000,
            temperature: options.temperature || 0.7,
            messages: [
              { role: 'user', content: prompt }
            ]
          };
          
          // Add system prompt if provided
          if (options.system) {
            payload.system = options.system;
          }
          
          this.logger.debug(`[${requestId}] Sending request to Claude API`);
          
          // Make the API call with proper headers
          const response = await axios.post<ClaudeCompletionResponse>(
            'https://api.anthropic.com/v1/messages',
            payload,
            {
              headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01'
              },
              timeout: 60000 // 60 seconds timeout
            }
          );
          
          this.logger.log(`[${requestId}] Claude API responded successfully with status ${response.status}`);
          
          // Process successful response
          if (response.data && response.data.content && response.data.content.length > 0) {
            // Return in a format compatible with existing code
            return {
              completion: response.data.content[0].text,
              stop_reason: response.data.stop_reason,
              usage: response.data.usage,
              model: response.data.model
            };
          } else {
            this.logger.warn(`[${requestId}] Unexpected response structure from Claude API`);
            throw new Error('Unexpected response structure from Claude API');
          }
        } catch (modelError) {
          // Log the error for this specific model attempt
          this.logger.warn(`[${requestId}] Failed with model ${modelName}: ${modelError.message}`);
          
          // If this is the last model in our list, rethrow the error
          if (modelName === models[models.length - 1]) {
            throw modelError;
          }
          
          // Otherwise continue to the next model
          this.logger.log(`[${requestId}] Trying next model in fallback sequence...`);
        }
      }
      
      // Should never reach here as the loop either returns or throws
      throw new Error('Failed to generate content with any Claude model');
    } catch (error) {
      const requestId = crypto.randomBytes(4).toString('hex');
      this.logger.error(`[${requestId}] Claude API error: ${error.response?.status || 'unknown'} - ${error.message}`);
      
      // Log detailed error information for debugging
      if (error.response) {
        this.logger.error(`[${requestId}] Response status: ${error.response.status}`);
        this.logger.error(`[${requestId}] Response headers: ${JSON.stringify(error.response.headers)}`);
        this.logger.error(`[${requestId}] Response data: ${JSON.stringify(error.response.data)}`);
        
        // Log request details that caused the error
        this.logger.error(`[${requestId}] Request URL: ${error.config?.url}`);
        if (error.config?.headers) {
          // Don't log the actual API key
          const safeHeaders = {...error.config.headers};
          if (safeHeaders['Authorization']) {
            safeHeaders['Authorization'] = 'Bearer [REDACTED]';
          }
          if (safeHeaders['x-api-key']) {
            safeHeaders['x-api-key'] = '[REDACTED]';
          }
          this.logger.error(`[${requestId}] Request headers: ${JSON.stringify(safeHeaders)}`);
        }
        this.logger.error(`[${requestId}] Request data: ${JSON.stringify(error.config?.data)}`);
        
        // Provide more meaningful error message based on status code
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
            const errorMessage = error.response.data?.error?.message || 'Unknown error';
            throw new Error(`Bad request to Claude API: ${errorMessage}`);
          case 500:
          case 502:
          case 503:
          case 504:
            throw new Error(`Claude API server error (${error.response.status}): The service may be temporarily unavailable`);
          default:
            throw new Error(`Failed to generate content: ${error.message}`);
        }
      } else {
        // Network errors or other non-HTTP response errors
        if (error.code === 'ECONNABORTED') {
          throw new Error('Connection to Claude API timed out');
        } else if (error.code === 'ENOTFOUND') {
          throw new Error('Could not connect to Claude API: Host not found');
        } else {
          throw new Error(`Failed to generate content: ${error.message}`);
        }
      }
    }
  }
  
  /**
   * Generate structured content using Claude API
   * @param content Original content to be structured/enhanced
   * @param instructions Instructions for restructuring
   * @param outputFormat Desired output format (markdown, json, etc.)
   */
  async generateStructuredContent(content: string, instructions: string, outputFormat: string = 'json'): Promise<any> {
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
        temperature: 0.2, // Lower temperature for more deterministic output
      });
      
      if (outputFormat === 'json') {
        // Try to parse the response as JSON
        try {
          // Extract JSON from the response
          const jsonMatch = response.completion.match(/```json\n([\s\S]*?)\n```/) || 
                           response.completion.match(/\{[\s\S]*\}/);
                           
          if (jsonMatch) {
            const jsonString = jsonMatch[1] || jsonMatch[0];
            return JSON.parse(jsonString);
          }
          
          return response.completion;
        } catch (parseError) {
          console.error('Error parsing JSON from Claude response:', parseError.message);
          return response.completion;
        }
      }
      
      return response.completion;
    } catch (error) {
      console.error('Error generating structured content:', error.message);
      throw new Error(`Failed to generate structured content: ${error.message}`);
    }
  }
  
  /**
   * Analyze content for specific aspects using Claude API
   * @param content Content to analyze
   * @param analysisType Type of analysis to perform
   */
  async analyzeContent(content: string, analysisType: string): Promise<any> {
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
      
      // Try to extract JSON from the response
      try {
        const jsonMatch = response.completion.match(/```json\n([\s\S]*?)\n```/) || 
                         response.completion.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
          const jsonString = jsonMatch[1] || jsonMatch[0];
          return JSON.parse(jsonString);
        }
        
        return response.completion;
      } catch (parseError) {
        console.error('Error parsing JSON from Claude response:', parseError.message);
        return response.completion;
      }
    } catch (error) {
      console.error(`Error analyzing content for ${analysisType}:`, error.message);
      throw new Error(`Failed to analyze content: ${error.message}`);
    }
  }
}
