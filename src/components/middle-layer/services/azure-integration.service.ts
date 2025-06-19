import { Injectable, Logger } from '@nestjs/common';
import { AzureAIService } from '../../top-layer/services/azure-ai-service';

/**
 * Response interface that follows the structure used in frontend components
 * with a data object containing the actual content and a possible error field
 */
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

/**
 * Middle layer service to integrate Azure services with application business logic
 * This service provides a simplified interface for the application to interact with Azure services
 */
@Injectable()
export class AzureIntegrationService {
  private readonly logger = new Logger(AzureIntegrationService.name);

  constructor(private readonly azureAIService: AzureAIService) {}

  /**
   * Generate content based on a prompt and additional parameters
   * @param prompt The primary prompt for content generation
   * @param options Additional generation options
   */
  async generateContent(prompt: string, options: {
    maxTokens?: number;
    temperature?: number;
    keywords?: string[];
    contentType?: string;
    industry?: string;
  }): Promise<ApiResponse<{
    id: string;
    content: string;
    sections?: Array<{id: string; title: string; content: string}>;
  }>> {
    try {
      // Enhance prompt with additional context if available
      let enhancedPrompt = prompt;
      
      if (options.keywords && options.keywords.length > 0) {
        enhancedPrompt += `\n\nIncorporate these keywords: ${options.keywords.join(', ')}`;
      }
      
      if (options.contentType) {
        enhancedPrompt += `\n\nThis content should be formatted as a ${options.contentType}.`;
      }
      
      if (options.industry) {
        enhancedPrompt += `\n\nThis is for the ${options.industry} industry.`;
      }

      // Call the Azure AI service to generate content
      const generationResult = await this.azureAIService.generateCompletion({
        prompt: enhancedPrompt,
        maxTokens: options.maxTokens || 2000,
        temperature: options.temperature || 0.7,
      });

      // Process the generated text into a structured format
      const generatedText = generationResult.text.trim();
      const contentId = `content-${Date.now()}`;

      // Basic section detection - split by headings
      const sections = this.splitIntoSections(generatedText);

      return {
        data: {
          id: contentId,
          content: generatedText,
          sections: sections,
        }
      };
    } catch (error) {
      this.logger.error(`Error generating content: ${error.message}`);
      return {
        error: `Failed to generate content: ${error.message}`
      };
    }
  }

  /**
   * Optimize existing content based on keywords and optimization goals
   * @param content Existing content to optimize
   * @param options Optimization options
   */
  async optimizeContent(content: string, options: {
    keywords?: string[];
    goals?: Array<'readability' | 'seo' | 'engagement'>;
    contentId?: string;
  }): Promise<ApiResponse<{
    optimizedContent: string;
    improvementSuggestions: string[];
    scores: {
      overall: number;
      readability: number;
      seo: number;
      engagement: number;
    };
  }>> {
    try {
      // Create a specialized prompt for content optimization
      let optimizationPrompt = `Optimize the following content`;
      
      if (options.keywords && options.keywords.length > 0) {
        optimizationPrompt += ` for these keywords: ${options.keywords.join(', ')}`;
      }
      
      if (options.goals && options.goals.length > 0) {
        optimizationPrompt += `\nOptimize specifically for: ${options.goals.join(', ')}`;
      }
      
      optimizationPrompt += `\n\nOriginal content:\n${content}\n\nProvide the optimized content without any additional comments.`;

      // Generate optimized content
      const optimizationResult = await this.azureAIService.generateCompletion({
        prompt: optimizationPrompt,
        maxTokens: content.length * 1.2, // Allow for some expansion
        temperature: 0.3, // Lower temperature for more focused optimization
      });

      // Also generate improvement suggestions as a separate call
      const suggestionsPrompt = `Analyze the following content and provide 3-5 specific improvement suggestions:

${content}

Format each suggestion as a brief, actionable item.`;

      const suggestionsResult = await this.azureAIService.generateCompletion({
        prompt: suggestionsPrompt,
        maxTokens: 500,
        temperature: 0.7,
      });

      // Parse suggestions (simple line-by-line split)
      const suggestions = suggestionsResult.text
        .split('\n')
        .filter(line => line.trim().length > 0)
        .slice(0, 5);

      // Calculate estimated scores (would ideally use actual metrics)
      const scores = {
        overall: this.calculateScore(0.7, 0.9),
        readability: this.calculateScore(0.6, 0.85),
        seo: this.calculateScore(0.7, 0.95),
        engagement: this.calculateScore(0.65, 0.9),
      };

      return {
        data: {
          optimizedContent: optimizationResult.text.trim(),
          improvementSuggestions: suggestions,
          scores,
        }
      };
    } catch (error) {
      this.logger.error(`Error optimizing content: ${error.message}`);
      return {
        error: `Failed to optimize content: ${error.message}`
      };
    }
  }

  /**
   * Search for relevant content based on query
   * @param query Search query
   * @param options Search options
   */
  async searchContent(query: string, options: {
    filters?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<{
    results: Array<{id: string; title: string; snippet: string; score: number}>;
    totalCount: number;
  }>> {
    try {
      const searchResults = await this.azureAIService.search({
        query,
        filters: options.filters,
        top: options.limit || 10,
        skip: options.offset || 0,
      });

      return {
        data: {
          results: searchResults.results.map(result => ({
            id: result.id,
            title: result.title || 'Untitled',
            snippet: result.content?.substring(0, 200) || '',
            score: result.score,
          })),
          totalCount: searchResults.count,
        }
      };
    } catch (error) {
      this.logger.error(`Error searching content: ${error.message}`);
      return {
        error: `Failed to search content: ${error.message}`
      };
    }
  }

  /**
   * Generate embeddings for content
   * @param texts Array of text strings to generate embeddings for
   */
  async generateEmbeddings(texts: string[]): Promise<ApiResponse<{
    embeddings: number[][];
    dimensions: number;
  }>> {
    try {
      const embeddingsResult = await this.azureAIService.generateEmbeddings({
        text: texts,
      });

      return {
        data: {
          embeddings: embeddingsResult.embeddings,
          dimensions: embeddingsResult.dimensions,
        }
      };
    } catch (error) {
      this.logger.error(`Error generating embeddings: ${error.message}`);
      return {
        error: `Failed to generate embeddings: ${error.message}`
      };
    }
  }

  /**
   * Extract entities and key information from text
   * @param text Text to analyze
   */
  async analyzeContent(text: string): Promise<ApiResponse<{
    entities: Array<{text: string; category: string; confidenceScore: number}>;
    keyPhrases: string[];
    sentiment: {
      overall: string;
      positive: number;
      negative: number;
      neutral: number;
    };
  }>> {
    try {
      // Get entities
      const entityResult = await this.azureAIService.analyzeText({
        text,
        kind: 'EntityRecognition',
      });

      // Get key phrases
      const keyPhraseResult = await this.azureAIService.analyzeText({
        text,
        kind: 'KeyPhraseExtraction',
      });

      // Get sentiment
      const sentimentResult = await this.azureAIService.analyzeText({
        text,
        kind: 'SentimentAnalysis',
      });

      return {
        data: {
          entities: entityResult.entities || [],
          keyPhrases: keyPhraseResult.keyPhrases || [],
          sentiment: {
            overall: sentimentResult.sentiment || 'neutral',
            positive: sentimentResult.confidenceScores?.positive || 0,
            negative: sentimentResult.confidenceScores?.negative || 0,
            neutral: sentimentResult.confidenceScores?.neutral || 0,
          }
        }
      };
    } catch (error) {
      this.logger.error(`Error analyzing content: ${error.message}`);
      return {
        error: `Failed to analyze content: ${error.message}`
      };
    }
  }

  /**
   * Check the status of a content generation job
   * @param contentId ID of the content generation job
   */
  async getContentStatus(contentId: string): Promise<ApiResponse<{
    id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    estimatedCompletionTime?: string;
  }>> {
    // In a real implementation, this would check a database or Azure service
    // For now, we'll simulate based on the contentId
    const timestamp = parseInt(contentId.split('-')[1] || '0', 10);
    const currentTime = Date.now();
    const elapsedTime = currentTime - timestamp;
    
    // Simulate different statuses based on elapsed time
    if (elapsedTime < 5000) {
      return {
        data: {
          id: contentId,
          status: 'pending',
          progress: 10,
          estimatedCompletionTime: new Date(currentTime + 20000).toISOString(),
        }
      };
    } else if (elapsedTime < 15000) {
      const progress = Math.min(95, Math.floor(elapsedTime / 300));
      return {
        data: {
          id: contentId,
          status: 'processing',
          progress,
          estimatedCompletionTime: new Date(currentTime + 10000).toISOString(),
        }
      };
    } else {
      return {
        data: {
          id: contentId,
          status: 'completed',
          progress: 100,
        }
      };
    }
  }

  /**
   * Helper method to split text into sections based on headings
   * @param text Full text content
   */
  private splitIntoSections(text: string): Array<{id: string; title: string; content: string}> {
    // Simple implementation - split on markdown heading patterns
    const headingPattern = /^#{1,6}\s+(.+)$/gm;
    const sections: Array<{id: string; title: string; content: string}> = [];
    
    // If no headings found, return the whole text as one section
    if (!text.match(headingPattern)) {
      return [
        {
          id: '1',
          title: 'Main Content',
          content: text.trim(),
        }
      ];
    }
    
    // Find all headings and their positions
    const headings: Array<{index: number, title: string}> = [];
    let match;
    while ((match = headingPattern.exec(text)) !== null) {
      headings.push({
        index: match.index,
        title: match[1].trim(),
      });
    }
    
    // Split text based on heading positions
    for (let i = 0; i < headings.length; i++) {
      const currentHeading = headings[i];
      const nextHeading = headings[i + 1];
      
      const startIndex = currentHeading.index;
      const endIndex = nextHeading ? nextHeading.index : text.length;
      
      // Extract section content (exclude the heading line itself)
      let sectionContent = text.substring(startIndex, endIndex).trim();
      // Remove the heading line
      sectionContent = sectionContent.replace(/^#{1,6}\s+.+$/m, '').trim();
      
      sections.push({
        id: (i + 1).toString(),
        title: currentHeading.title,
        content: sectionContent,
      });
    }
    
    return sections;
  }

  /**
   * Helper method to generate a random score in a specified range
   * Used for demo purposes only - in production this would use real metrics
   */
  private calculateScore(min: number, max: number): number {
    return Number((Math.random() * (max - min) + min).toFixed(2));
  }
}
