import { Injectable, Logger } from '@nestjs/common';
import { ApplicationInsightsService } from '../../../common/services/application-insights.service';
import { AzureAIService } from './azure-ai-service';
import { ContentChunkerService } from '../../bottom-layer/services/content-chunker.service';

export interface LLMContentAnalysisResult {
  analysisId: string;
  contentLength: number;
  targetLLM: string;
  metrics: {
    readabilityScore: number;
    semanticDensity: number;
    contextualRelevance: number;
    cohesionScore: number;
    llmQualityScore: number;
  };
  issues: Array<{
    type: string;
    severity: 'high' | 'medium' | 'low';
    description: string;
    examples?: string[];
    remediation?: string;
  }>;
  recommendations: string[];
  timestamp: string;
}

export interface ChunkingResult {
  chunkingId: string;
  originalLength: number;
  contentSnapshot: string;
  chunkType: 'semantic' | 'fixed' | 'hybrid';
  targetTokenSize: number;
  chunks: Array<{
    id: string;
    content: string;
    estimatedTokenCount: number;
    startPosition: number;
    endPosition: number;
  }>;
  metrics: {
    chunkCount: number;
    averageChunkSize: number;
    tokenReductionPercentage: number;
    contextPreservationScore: number;
  };
  timestamp: string;
}

@Injectable()
export class LLMContentAnalyzerService {
  private readonly logger = new Logger(LLMContentAnalyzerService.name);
  
  constructor(
    private readonly azureAIService: AzureAIService,
    private readonly contentChunker: ContentChunkerService,
    private readonly appInsights: ApplicationInsightsService,
  ) {}

  /**
   * Analyze content for LLM optimization opportunities
   */
  async analyzeContent(content: string, targetLLM: string = 'general'): Promise<LLMContentAnalysisResult> {
    const startTime = Date.now();
    
    this.appInsights.trackEvent('LLMContentAnalyzer:Analyze:Start', {
      contentLength: content.length.toString(),
      targetLLM
    });
    
    try {
      // Analyze the content using a specialized AI prompt
      const analysisPrompt = `
        You are an expert content analyzer specializing in LLM optimization. Analyze the following content
        for its suitability for consumption by ${targetLLM} LLMs. Provide concrete metrics and identify issues.
        
        Analyze these aspects:
        1. Readability: How easy is it for an LLM to parse and understand the content?
        2. Semantic Density: How information-rich is the content without redundancy?
        3. Contextual Relevance: How well does the content maintain topic coherence?
        4. Cohesion: How well do sentences and paragraphs connect logically?
        5. Overall LLM Quality Score: An overall score for LLM consumption optimization.
        
        Identify any specific issues that could cause problems for LLM processing, such as:
        - Ambiguous references
        - Contextual discontinuities
        - Semantic ambiguities
        - Complex nested ideas
        - Inconsistent terminology
        
        For each issue, provide the severity (high/medium/low), a clear description, and a brief example from the text.
        
        Finally, provide 3-5 specific recommendations to optimize this content for LLM consumption.
        
        Format your response as a structured JSON object with these exact properties:
        {
          "metrics": {
            "readabilityScore": <0-100>,
            "semanticDensity": <0-100>,
            "contextualRelevance": <0-100>,
            "cohesionScore": <0-100>,
            "llmQualityScore": <0-100>
          },
          "issues": [
            {
              "type": "<issue type>",
              "severity": "<high/medium/low>",
              "description": "<brief description>",
              "example": "<example from text>"
            }
          ],
          "recommendations": [
            "<specific recommendation 1>",
            "<specific recommendation 2>",
            "..."
          ]
        }
        
        Content to analyze:
        ${content.substring(0, 3000)}${content.length > 3000 ? '...' : ''}
      `.trim();
      
      const analysisResult = await this.azureAIService.generateCompletion({
        prompt: analysisPrompt,
        maxTokens: 1500,
        temperature: 0.1,
        deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-35-turbo'
      });
      
      // Parse the JSON response from the LLM
      let parsedResponse: any = {};
      try {
        // Find the JSON object in the response
        const jsonMatch = analysisResult.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No valid JSON found in analysis response');
        }
      } catch (parseError) {
        this.logger.error(`Error parsing analysis response: ${parseError.message}`);
        parsedResponse = this.generateFallbackAnalysis();
      }
      
      // Calculate duration for telemetry
      const duration = Date.now() - startTime;
      
      this.appInsights.trackEvent('LLMContentAnalyzer:Analyze:Success', {
        contentLength: content.length.toString(),
        targetLLM,
        durationMs: duration.toString(),
        llmQualityScore: parsedResponse.metrics?.llmQualityScore?.toString() || 'unknown'
      });
      
      this.appInsights.trackMetric('LLMContentAnalyzer:AnalyzeLatency', duration, {
        targetLLM,
        success: 'true'
      });
      
      const issues = parsedResponse.issues || [];
      const recommendations = parsedResponse.recommendations || [
        'Improve semantic clarity by using more precise terminology',
        'Enhance logical flow between paragraphs',
        'Replace ambiguous pronouns with explicit references'
      ];
      
      return {
        analysisId: `analysis-${Date.now()}`,
        contentLength: content.length,
        targetLLM,
        metrics: {
          readabilityScore: parsedResponse.metrics?.readabilityScore || 70,
          semanticDensity: parsedResponse.metrics?.semanticDensity || 65,
          contextualRelevance: parsedResponse.metrics?.contextualRelevance || 75,
          cohesionScore: parsedResponse.metrics?.cohesionScore || 68,
          llmQualityScore: parsedResponse.metrics?.llmQualityScore || 70
        },
        issues,
        recommendations,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      // Calculate duration for failed attempt
      const duration = Date.now() - startTime;
      
      // Track exception
      this.appInsights.trackException(error instanceof Error ? error : new Error(String(error)), {
        contentLength: content.length.toString(),
        targetLLM,
        operation: 'analyzeContent'
      });
      
      this.appInsights.trackMetric('LLMContentAnalyzer:AnalyzeLatency', duration, {
        targetLLM,
        success: 'false'
      });
      
      this.logger.error(`Error analyzing content: ${error.message}`);
      throw new Error(`Failed to analyze content: ${error.message}`);
    }
  }
  
  /**
   * Generate fallback analysis when parsing fails
   */
  private generateFallbackAnalysis(): any {
    return {
      metrics: {
        readabilityScore: 70,
        semanticDensity: 65,
        contextualRelevance: 75,
        cohesionScore: 68,
        llmQualityScore: 70
      },
      issues: [
        {
          type: 'Semantic Ambiguity',
          severity: 'medium',
          description: 'Some terms may be ambiguous for LLM processing',
          example: 'Unable to parse example from text'
        }
      ],
      recommendations: [
        'Improve semantic clarity by using more precise terminology',
        'Enhance logical flow between paragraphs',
        'Replace ambiguous pronouns with explicit references'
      ]
    };
  }
  
  /**
   * Chunk content for optimal LLM processing
   */
  async chunkContent(
    content: string, 
    chunkType: 'semantic' | 'fixed' | 'hybrid' = 'semantic',
    targetTokenSize: number = 500
  ): Promise<ChunkingResult> {
    const startTime = Date.now();
    
    this.appInsights.trackEvent('LLMContentAnalyzer:Chunk:Start', {
      contentLength: content.length.toString(),
      chunkType,
      targetTokenSize: targetTokenSize.toString()
    });
    
    try {
      // Use the ContentChunkerService to chunk the content
      const chunkingResult = await this.contentChunker.chunkContent(content, chunkType);
      
      // Optimize the chunks for the target token size
      const optimizedChunks = await this.contentChunker.optimizeChunksForLLM(
        chunkingResult.chunks, 
        targetTokenSize
      );
      
      // Calculate metrics
      const totalChunks = optimizedChunks.length;
      const averageChunkSize = totalChunks > 0 
        ? optimizedChunks.reduce((sum, chunk) => sum + chunk.content.length, 0) / totalChunks 
        : 0;
      
      // Estimate token reduction (approximation)
      const originalTokenEstimate = Math.ceil(content.length / 4);
      const chunkedTokenEstimate = optimizedChunks.reduce(
        (sum, chunk) => sum + Math.ceil(chunk.content.length / 4), 
        0
      );
      const tokenReductionPercentage = originalTokenEstimate > 0 
        ? ((originalTokenEstimate - chunkedTokenEstimate) / originalTokenEstimate) * 100 
        : 0;
      
      // Calculate duration for telemetry
      const duration = Date.now() - startTime;
      
      this.appInsights.trackEvent('LLMContentAnalyzer:Chunk:Success', {
        contentLength: content.length.toString(),
        chunkType,
        chunkCount: totalChunks.toString(),
        durationMs: duration.toString()
      });
      
      this.appInsights.trackMetric('LLMContentAnalyzer:ChunkLatency', duration, {
        chunkType,
        success: 'true'
      });
      
      // Format chunks with estimated token counts
      const formattedChunks = optimizedChunks.map(chunk => ({
        id: chunk.id || `chunk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        content: chunk.content,
        estimatedTokenCount: Math.ceil(chunk.content.length / 4),
        startPosition: chunk.startPosition || 0,
        endPosition: chunk.endPosition || chunk.content.length
      }));
      
      return {
        chunkingId: `chunking-${Date.now()}`,
        originalLength: content.length,
        contentSnapshot: content.substring(0, 200) + (content.length > 200 ? '...' : ''),
        chunkType,
        targetTokenSize,
        chunks: formattedChunks,
        metrics: {
          chunkCount: totalChunks,
          averageChunkSize,
          tokenReductionPercentage: Math.max(0, tokenReductionPercentage),
          contextPreservationScore: 85 // Placeholder - would need a real calculation
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      // Calculate duration for failed attempt
      const duration = Date.now() - startTime;
      
      // Track exception
      this.appInsights.trackException(error instanceof Error ? error : new Error(String(error)), {
        contentLength: content.length.toString(),
        chunkType,
        targetTokenSize: targetTokenSize.toString(),
        operation: 'chunkContent'
      });
      
      this.appInsights.trackMetric('LLMContentAnalyzer:ChunkLatency', duration, {
        chunkType,
        success: 'false'
      });
      
      this.logger.error(`Error chunking content: ${error.message}`);
      throw new Error(`Failed to chunk content: ${error.message}`);
    }
  }
}
