import { Injectable, Logger } from '@nestjs/common';
import { ApplicationInsightsService } from '../../../common/services/application-insights.service';
import { AzureAIService, TextGenerationOutput } from './azure-ai-service';
import { BlufContentStructurerService } from '../../middle-layer/services/bluf-content-structurer.service';
import { ContentChunkerService } from '../../bottom-layer/services/content-chunker.service';
import { ClaudeAIService } from '../../../shared/services/claude-ai.service';

export interface LLMContentInput {
  topic: string;
  contentType: 'blog_post' | 'technical_guide' | 'case_study' | 'product_review' | 'industry_analysis' | 'social_media' | string;
  audience: 'b2b' | 'b2c';
  keyPoints?: string[];
  toneOfVoice?: 'formal' | 'conversational' | 'technical' | 'friendly' | string;
  targetLength?: 'short' | 'medium' | 'long';
  purpose?: string;
  searchKeywords?: string[];
  llmTarget?: 'general' | 'gpt4' | 'claude' | 'palm' | string;
}

export interface LLMContentSection {
  title: string;
  content: string;
}

export interface LLMContentOutput {
  id: string;
  topic: string;
  contentType: string;
  audience: string;
  toneOfVoice: string;
  title: string;
  summary: string;
  sections: LLMContentSection[];
  metadata: {
    optimizedFor: string;
    readabilityScore: number;
    semanticDensity: number;
    contextualRelevance: number;
    estimatedTokenCount: number;
    llmQualityScore: number;
  };
  generatedAt: string;
}

@Injectable()
export class LLMContentOptimizerService {
  private readonly logger = new Logger(LLMContentOptimizerService.name);
  
  constructor(
    private readonly azureAIService: AzureAIService,
    private readonly blufContentStructurer: BlufContentStructurerService,
    private readonly contentChunker: ContentChunkerService,
    private readonly appInsights: ApplicationInsightsService,
    private readonly claudeAIService: ClaudeAIService,
  ) {}

  /**
   * Optimizes existing content for LLM consumption
   * @param input The content input to optimize
   */
  async optimizeContent(input: LLMContentInput): Promise<LLMContentOutput> {
    console.log(`Optimizing content for LLM: ${input.topic}`);

    return this.generateLLMOptimizedContent(input);
  }

  /**
   * Generate content optimized for LLM consumption
   */
  async generateLLMOptimizedContent(input: LLMContentInput): Promise<LLMContentOutput> {
    const startTime = Date.now();
    
    // Track the request start
    this.appInsights.trackEvent('LLMContentOptimizer:Generate:Start', {
      contentType: input.contentType,
      audience: input.audience,
      targetLLM: input.llmTarget || 'general'
    });
    
    try {
      // 1. Generate optimized content structure based on content type and audience
      const structureTemplate = await this.blufContentStructurer.getStructureTemplate(
        input.contentType,
        input.audience
      );
      
      // 2. Generate the title using a specialized prompt
      const titleResult = await this.generateOptimizedTitle(input);
      
      // 3. Generate the content sections using the structure template
      const sections = await this.generateContentSections(input, structureTemplate, titleResult);
      
      // 4. Generate a concise summary optimized for LLMs
      const summaryResult = await this.generateContentSummary(input, titleResult, sections);
      
      // 5. Calculate metadata and quality metrics
      const metadata = await this.calculateContentMetrics(input, titleResult, sections, summaryResult);

      // Calculate performance metrics for telemetry
      const duration = Date.now() - startTime;
      
      const result: LLMContentOutput = {
        id: `content-${Date.now()}`,
        topic: input.topic,
        contentType: input.contentType,
        audience: input.audience,
        toneOfVoice: input.toneOfVoice || 'conversational',
        title: titleResult,
        summary: summaryResult,
        sections,
        metadata,
        generatedAt: new Date().toISOString()
      };
      
      // Track successful content generation
      this.appInsights.trackEvent('LLMContentOptimizer:Generate:Success', {
        contentType: input.contentType,
        audience: input.audience,
        durationMs: duration.toString(),
        sectionCount: sections.length.toString(),
        llmQualityScore: metadata.llmQualityScore.toString()
      });
      
      this.appInsights.trackMetric('LLMContentOptimizer:GenerateLatency', duration, {
        contentType: input.contentType,
        audience: input.audience,
        success: 'true'
      });
      
      return result;
    } catch (error) {
      // Calculate duration for failed attempt
      const duration = Date.now() - startTime;
      
      // Track exception
      this.appInsights.trackException(error instanceof Error ? error : new Error(String(error)), {
        contentType: input.contentType,
        audience: input.audience,
        durationMs: duration.toString(),
        operation: 'generateLLMOptimizedContent'
      });
      
      this.appInsights.trackMetric('LLMContentOptimizer:GenerateLatency', duration, {
        contentType: input.contentType,
        audience: input.audience,
        success: 'false'
      });
      
      this.logger.error(`Error generating LLM-optimized content: ${error.message}`);
      throw new Error(`Failed to generate LLM-optimized content: ${error.message}`);
    }
  }

  /**
   * Generate an LLM-optimized title
   */
  private async generateOptimizedTitle(input: LLMContentInput): Promise<string> {
    const prompt = this.buildTitlePrompt(input);
    let title = '';
    let claudeError = null;
    let azureError = null;
    
    // First try with Claude AI
    try {
      this.logger.log('Attempting to generate title with Claude AI');
      
      const result = await this.claudeAIService.generateCompletion(prompt, {
        model: 'claude-3-haiku-20240307', // Using a more widely available model
        maxTokens: 50,
        temperature: 0.7
      });
      
      // Check if we got a valid response
      if (result && result.completion) {
        title = result.completion.trim();
        this.logger.log('Successfully generated title with Claude AI');
        return title;
      }
      
      this.logger.warn('Claude AI returned unexpected response format');
    } catch (error) {
      // Log the Claude error but don't rethrow - we'll try Azure instead
      claudeError = error;
      this.logger.warn(`Claude AI title generation failed: ${error.message}`);
    }
    
    // Fallback to Azure OpenAI
    try {
      this.logger.log('Falling back to Azure OpenAI for title generation');
      
      const azureResult = await this.azureAIService.generateCompletion({
        prompt,
        maxTokens: 50,
        temperature: 0.7,
        deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-35-turbo'
      });
      
      title = azureResult.text.trim();
      this.logger.log('Successfully generated title with Azure OpenAI');
      return title;
    } catch (error) {
      azureError = error;
      this.logger.error(`Azure OpenAI title generation failed: ${error.message}`);
    }
    
    // If both services failed, generate a basic title from the input
    this.logger.warn('All LLM services failed for title generation, using fallback title');
    
    // Create a basic title from the topic and content type
    const fallbackTitle = `${input.contentType.charAt(0).toUpperCase() + input.contentType.slice(1).replace('_', ' ')}: ${input.topic}`;
    
    // Log the errors for debugging
    this.logger.error(`Claude error: ${claudeError?.message || 'Unknown'}, Azure error: ${azureError?.message || 'Unknown'}`);
    
    return fallbackTitle;
  }
  
  /**
   * Generate content sections based on structure template
   */
  private async generateContentSections(
    input: LLMContentInput,
    structureTemplate: any,
    title: string
  ): Promise<LLMContentSection[]> {
    const sections: LLMContentSection[] = [];
    let claudeFailureCount = 0;
    let totalSections = structureTemplate.sections.length;
    
    try {
      // Generate each section based on the structure template
      for (const sectionTitle of structureTemplate.sections) {
        const sectionPrompt = this.buildSectionPrompt(input, title, sectionTitle, sections);
        const sectionIndex = sections.length + 1;
        
        // If Claude has failed too many times already, skip directly to Azure
        const useClaudeForThisSection = claudeFailureCount < Math.ceil(totalSections / 2);
        
        if (useClaudeForThisSection) {
          try {
            this.logger.log(`Generating section ${sectionIndex}/${totalSections} "${sectionTitle}" with Claude AI`);
            
            // Use Claude AI for section content generation with a more widely available model
            const result = await this.claudeAIService.generateCompletion(sectionPrompt, {
              model: 'claude-3-haiku-20240307', // Using a more widely available model
              maxTokens: this.getTargetTokens(input.targetLength || 'medium'),
              temperature: 0.7
            });
            
            if (result && result.completion) {
              sections.push({
                title: sectionTitle,
                content: result.completion.trim()
              });
              this.logger.log(`Successfully generated section "${sectionTitle}" with Claude AI`);
              continue; // Skip the fallback if Claude succeeds
            }
            
            this.logger.warn(`Claude AI returned unexpected response format for section "${sectionTitle}"`);
            claudeFailureCount++;
          } catch (sectionError) {
            this.logger.warn(`Claude API error for section "${sectionTitle}": ${sectionError.message}`);
            claudeFailureCount++;
          }
        }
        
        // Fallback to Azure if Claude fails or is skipped
        try {
          this.logger.log(`Generating section ${sectionIndex}/${totalSections} "${sectionTitle}" with Azure OpenAI`);
          
          const azureResult = await this.azureAIService.generateCompletion({
            prompt: sectionPrompt,
            maxTokens: this.getTargetTokens(input.targetLength || 'medium'),
            temperature: 0.7,
            deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-35-turbo'
          });
          
          sections.push({
            title: sectionTitle,
            content: azureResult.text.trim()
          });
          
          this.logger.log(`Successfully generated section "${sectionTitle}" with Azure OpenAI`);
        } catch (azureError) {
          this.logger.error(`Azure OpenAI error for section "${sectionTitle}": ${azureError.message}`);
          
          // If both services fail, create a basic fallback content for this section
          this.logger.warn(`All LLM services failed for section "${sectionTitle}", using fallback content`);
          
          // Generate simple placeholder content based on section title and topic
          const fallbackContent = `This section covers ${sectionTitle.toLowerCase()} for ${input.topic}. ` +
            `Content will be added here with specific information about ${input.topic} ` +
            `tailored for ${input.audience} audience.`;
          
          sections.push({
            title: sectionTitle,
            content: fallbackContent
          });
          
          this.logger.log(`Added fallback content for section "${sectionTitle}"`);
        }
      }
      
      // Log summary of which service was used
      const claudeSections = totalSections - claudeFailureCount;
      const azureSections = claudeFailureCount;
      this.logger.log(`Content generation complete: ${claudeSections} sections by Claude AI, ${azureSections} sections by Azure OpenAI`);
      
      return sections;
    } catch (error) {
      this.logger.error(`Error generating content sections: ${error.message}`);
      throw new Error(`Failed to generate content sections: ${error.message}`);
    }
  }
  
  /**
   * Generate a concise summary optimized for LLMs
   */
  private async generateContentSummary(
    input: LLMContentInput, 
    title: string, 
    sections: LLMContentSection[]
  ): Promise<string> {
    try {
      // Build a condensed representation of the generated content
      const contentOverview = sections
        .map(section => `${section.title}: ${section.content.substring(0, 100)}...`)
        .join('\n\n');
      
      const summaryPrompt = `
        You are an expert content summarizer. Create a concise, information-dense summary of the following content.
        The summary must be optimized for LLM consumption with clear context and semantic richness.
        Make it 2-3 sentences maximum, focusing on the essential information.
        
        Title: ${title}
        Topic: ${input.topic}
        Content Type: ${input.contentType}
        Target audience: ${input.audience}
        Content overview:
        ${contentOverview}
        
        Summary:
      `.trim();
      
      // First try with Claude AI
      try {
        this.logger.log('Attempting to generate content summary with Claude AI');
        
        const result = await this.claudeAIService.generateCompletion(summaryPrompt, {
          model: 'claude-3-haiku-20240307', // Using a more widely available model
          maxTokens: 100,
          temperature: 0.3 // Lower temperature for more focused summary
        });
        
        if (result && result.completion) {
          this.logger.log('Successfully generated content summary with Claude AI');
          return result.completion.trim();
        }
        
        this.logger.warn('Claude AI returned unexpected response format for content summary');
      } catch (summaryError) {
        this.logger.warn(`Claude API error for summary generation: ${summaryError.message}`);
      }
        
      // Fallback to Azure if Claude fails
      try {
        this.logger.log('Falling back to Azure OpenAI for content summary generation');
        const azureResult = await this.azureAIService.generateCompletion({
          prompt: summaryPrompt,
          maxTokens: 100,
          temperature: 0.3, // Lower temperature for more focused summary
          deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-35-turbo'
        });
        
        this.logger.log('Successfully generated content summary with Azure OpenAI');
        return azureResult.text.trim();
      } catch (azureError) {
        this.logger.error(`Azure OpenAI error for summary generation: ${azureError.message}`);
        
        // If both services fail, create a basic fallback summary
        this.logger.warn('All LLM services failed for summary generation, using fallback summary');
        
        // Generate a simple summary based on the title and topic
        const fallbackSummary = `This ${input.contentType.replace('_', ' ')} explores ${input.topic} ` +
          `with a focus on providing valuable insights for ${input.audience} audiences. ` +
          `The content covers key aspects including ${sections.slice(0, 3).map(s => s.title.toLowerCase()).join(', ')}.`;
        
        return fallbackSummary;
      }
    } catch (error) {
      this.logger.error(`Error generating content summary: ${error.message}`);
      
      // Create a fallback summary even for unexpected errors
      const fallbackSummary = `This ${input.contentType.replace('_', ' ')} about ${input.topic} ` +
        `is designed for ${input.audience} audiences.`;
      
      return fallbackSummary;
    }
  }
  
  /**
   * Calculate content quality metrics specific to LLM optimization
   */
  private async calculateContentMetrics(
    input: LLMContentInput,
    title: string,
    sections: LLMContentSection[],
    summary: string
  ): Promise<any> {
    // Consolidate all content for analysis
    const fullContent = [
      title, 
      summary,
      ...sections.map(s => `${s.title} ${s.content}`)
    ].join('\n\n');
    
    // Estimate token count (rough approximation: 4 chars = 1 token)
    const estimatedTokenCount = Math.ceil(fullContent.length / 4);
    
    // Generate semantic metrics using Azure AI service
    const analysisPrompt = `
      You are an expert LLM content evaluator. Analyze the following content and provide scores 
      from 0-100 for these metrics:
      
      1. Readability: How easy is it for an LLM to parse and understand the content?
      2. Semantic Density: How information-rich is the content without redundancy?
      3. Contextual Relevance: How well does the content maintain topic coherence?
      4. LLM Quality Score: An overall score for LLM consumption optimization.
      
      Provide ONLY the four numeric scores in this exact format:
      Readability: [score]
      Semantic Density: [score]
      Contextual Relevance: [score]
      LLM Quality: [score]
      
      Content to analyze:
      ${fullContent.substring(0, 2000)}...
    `;
    
    const analysisResult = await this.azureAIService.generateCompletion({
      prompt: analysisPrompt.trim(),
      maxTokens: 100,
      temperature: 0.1, // Very low temperature for consistent scoring
      deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-35-turbo'
    });
    
    // Parse metrics from the analysis result
    const metrics = this.parseMetricsFromText(analysisResult.text);
    
    return {
      optimizedFor: input.llmTarget || 'general',
      readabilityScore: metrics.readability || 70,
      semanticDensity: metrics.semanticDensity || 65,
      contextualRelevance: metrics.contextualRelevance || 75,
      estimatedTokenCount,
      llmQualityScore: metrics.llmQuality || 70
    };
  }
  
  /**
   * Parse metrics from AI-generated text
   */
  private parseMetricsFromText(text: string): Record<string, number> {
    const metrics: Record<string, number> = {
      readability: 0,
      semanticDensity: 0,
      contextualRelevance: 0,
      llmQuality: 0
    };
    
    try {
      // Extract readability score
      const readabilityMatch = text.match(/Readability:\s*(\d+)/i);
      if (readabilityMatch && readabilityMatch[1]) {
        metrics.readability = parseInt(readabilityMatch[1], 10);
      }
      
      // Extract semantic density score
      const semanticDensityMatch = text.match(/Semantic Density:\s*(\d+)/i);
      if (semanticDensityMatch && semanticDensityMatch[1]) {
        metrics.semanticDensity = parseInt(semanticDensityMatch[1], 10);
      }
      
      // Extract contextual relevance score
      const contextualRelevanceMatch = text.match(/Contextual Relevance:\s*(\d+)/i);
      if (contextualRelevanceMatch && contextualRelevanceMatch[1]) {
        metrics.contextualRelevance = parseInt(contextualRelevanceMatch[1], 10);
      }
      
      // Extract LLM quality score
      const llmQualityMatch = text.match(/LLM Quality:\s*(\d+)/i);
      if (llmQualityMatch && llmQualityMatch[1]) {
        metrics.llmQuality = parseInt(llmQualityMatch[1], 10);
      }
    } catch (error) {
      this.logger.error(`Error parsing metrics: ${error.message}`);
      // Return default metrics on error
    }
    
    return metrics;
  }
  
  /**
   * Get target tokens based on requested length
   */
  private getTargetTokens(targetLength: string): number {
    switch (targetLength) {
      case 'short': return 200;
      case 'medium': return 500;
      case 'long': return 1000;
      default: return 500;
    }
  }
  
  /**
   * Build prompt template for title generation
   */
  private buildTitlePrompt(input: LLMContentInput): string {
    return `
      You are an expert content creator. Generate a compelling title for a ${input.contentType} 
      on the topic of "${input.topic}" for a ${input.audience === 'b2b' ? 'business' : 'consumer'} audience.
      
      The title should:
      - Be concise and information-dense for LLM consumption
      - Contain the main topic keywords for semantic clarity
      - Follow a ${input.toneOfVoice || 'conversational'} tone
      ${input.searchKeywords ? `- Include at least one of these keywords: ${input.searchKeywords.join(', ')}` : ''}
      ${input.llmTarget ? `- Be optimized for ${input.llmTarget} consumption` : ''}
      
      Write ONLY the title, nothing else.
    `.trim();
  }
  
  /**
   * Build prompt template for section generation
   */
  private buildSectionPrompt(
    input: LLMContentInput, 
    title: string, 
    sectionTitle: string, 
    previousSections: LLMContentSection[]
  ): string {
    // Create context from previously generated sections
    const previousSectionsContext = previousSections.length > 0
      ? `\nPreviously generated sections:\n${previousSections.map(s => `${s.title}: ${s.content.substring(0, 100)}...`).join('\n')}`
      : '';
    
    // Format key points if provided
    const keyPointsContext = input.keyPoints && input.keyPoints.length > 0
      ? `\nKey points to include:\n${input.keyPoints.map(point => `- ${point}`).join('\n')}`
      : '';
    
    return `
      You are an expert content creator specializing in LLM-optimized content.
      
      Create the "${sectionTitle}" section for a ${input.contentType} titled "${title}" about "${input.topic}".
      
      Content specifications:
      - Audience: ${input.audience === 'b2b' ? 'Business professionals' : 'General consumers'}
      - Tone of voice: ${input.toneOfVoice || 'Conversational'}
      - Purpose: ${input.purpose || 'To inform and engage the reader'}
      ${input.llmTarget ? `- Optimize for ${input.llmTarget} LLM consumption` : '- Optimize for general LLM consumption'}
      ${keyPointsContext}
      ${previousSectionsContext}
      
      Make your content:
      1. Information-dense with high semantic clarity
      2. Well-structured with logical paragraph progression
      3. Free from unnecessary repetition or filler
      4. Rich in relevant terminology and clear context
      5. Self-contained yet connected to the overall topic
      
      Write ONLY the section content, not the section title.
    `.trim();
  }
  
  /**
   * Enhance existing content by making it more LLM-friendly
   */
  async enhanceLLMOptimization(content: string, targetLLM: string = 'general'): Promise<string> {
    const startTime = Date.now();
    
    this.appInsights.trackEvent('LLMContentOptimizer:Enhance:Start', {
      contentLength: content.length.toString(),
      targetLLM
    });
    
    try {
      const enhancementPrompt = `
        You are an expert content optimizer for LLM consumption. 
        Enhance the following content to make it more optimized for ${targetLLM} LLM processing.
        
        Make these specific improvements:
        1. Increase semantic clarity by using more precise terminology
        2. Improve logical structure with clear transitions
        3. Remove any content that might confuse an LLM or cause context loss
        4. Ensure self-contained paragraphs with complete context
        5. Replace ambiguous pronouns with explicit references
        6. Maintain the original meaning and information
        
        Content to enhance:
        ${content}
        
        Enhanced content:
      `.trim();
      
      const result = await this.azureAIService.generateCompletion({
        prompt: enhancementPrompt,
        maxTokens: Math.min(4000, content.length / 2),
        temperature: 0.3,
        deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-35-turbo'
      });
      
      // Calculate duration for telemetry
      const duration = Date.now() - startTime;
      
      this.appInsights.trackEvent('LLMContentOptimizer:Enhance:Success', {
        contentLength: content.length.toString(),
        targetLLM,
        durationMs: duration.toString()
      });
      
      this.appInsights.trackMetric('LLMContentOptimizer:EnhanceLatency', duration, {
        targetLLM,
        success: 'true'
      });
      
      return result.text.trim();
    } catch (error) {
      // Calculate duration for failed attempt
      const duration = Date.now() - startTime;
      
      // Track exception
      this.appInsights.trackException(error instanceof Error ? error : new Error(String(error)), {
        contentLength: content.length.toString(),
        targetLLM,
        operation: 'enhanceLLMOptimization'
      });
      
      this.appInsights.trackMetric('LLMContentOptimizer:EnhanceLatency', duration, {
        targetLLM,
        success: 'false'
      });
      
      this.logger.error(`Error enhancing content: ${error.message}`);
      throw new Error(`Failed to enhance content: ${error.message}`);
    }
  }
}
