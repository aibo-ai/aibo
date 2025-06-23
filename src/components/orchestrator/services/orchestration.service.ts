import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ServiceBusClient, ServiceBusSender } from '@azure/service-bus';

// Layer imports
import { QueryIntentAnalyzerService } from '../../bottom-layer/services/query-intent-analyzer.service';
import { KeywordTopicAnalyzerService } from '../../bottom-layer/services/keyword-topic-analyzer.service';
import { ContentChunkerService } from '../../bottom-layer/services/content-chunker.service';
import { FreshnessAggregatorService } from '../../bottom-layer/freshness-aggregator/services/freshness-aggregator.service';

import { BlufContentStructurerService } from '../../middle-layer/services/bluf-content-structurer.service';
import { ConversationalQueryOptimizerService } from '../../middle-layer/services/conversational-query-optimizer.service';
import { SemanticRelationshipMapperService } from '../../middle-layer/services/semantic-relationship-mapper.service';
import { PlatformSpecificTunerService } from '../../middle-layer/services/platform-specific-tuner.service';

import { LLMContentOptimizerService } from '../../top-layer/services/llm-content-optimizer.service';
import { OriginalResearchEngineService } from '../../top-layer/services/original-research-engine.service';
import { CitationAuthorityVerifierService } from '../../top-layer/services/citation-authority-verifier.service';
import { EeatSignalGeneratorService } from '../../top-layer/services/eeat-signal-generator.service';
import { SchemaMarkupGeneratorService } from '../../top-layer/services/schema-markup-generator.service';

import { JobManagementService } from './job-management.service';
import { WorkflowEngineService } from './workflow-engine.service';
import { ApplicationInsightsService } from '../../../common/services/application-insights.service';

export interface OrchestrationContext {
  jobId: string;
  request: any;
  currentStep: string;
  completedSteps: string[];
  layerResults: {
    bottom?: any;
    middle?: any;
    top?: any;
  };
  metadata: {
    startTime: number;
    userId?: string;
    projectId?: string;
    priority: string;
  };
}

@Injectable()
export class OrchestrationService {
  private readonly logger = new Logger(OrchestrationService.name);
  private serviceBusClient: ServiceBusClient;
  private contentJobsSender: ServiceBusSender;

  constructor(
    private readonly configService: ConfigService,
    private readonly appInsights: ApplicationInsightsService,
    
    // Bottom Layer Services
    private readonly queryIntentAnalyzer: QueryIntentAnalyzerService,
    private readonly keywordTopicAnalyzer: KeywordTopicAnalyzerService,
    private readonly contentChunker: ContentChunkerService,
    private readonly freshnessAggregator: FreshnessAggregatorService,
    
    // Middle Layer Services
    private readonly blufContentStructurer: BlufContentStructurerService,
    private readonly conversationalQueryOptimizer: ConversationalQueryOptimizerService,
    private readonly semanticRelationshipMapper: SemanticRelationshipMapperService,
    private readonly platformSpecificTuner: PlatformSpecificTunerService,
    
    // Top Layer Services
    private readonly llmContentOptimizer: LLMContentOptimizerService,
    private readonly originalResearchEngine: OriginalResearchEngineService,
    private readonly citationAuthorityVerifier: CitationAuthorityVerifierService,
    private readonly eeatSignalGenerator: EeatSignalGeneratorService,
    private readonly schemaMarkupGenerator: SchemaMarkupGeneratorService,
    
    // Orchestration Services
    private readonly jobManagement: JobManagementService,
    private readonly workflowEngine: WorkflowEngineService
  ) {
    this.initializeServiceBus();
  }

  /**
   * Queue content generation job for async processing
   */
  async queueContentGeneration(request: any): Promise<string> {
    const jobId = `job-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    
    try {
      this.logger.log(`Queueing content generation job: ${jobId}`);
      
      // Create job record
      await this.jobManagement.createJob({
        id: jobId,
        type: 'content_generation',
        status: 'queued',
        request,
        priority: request.priority || 'normal',
        userId: request.userId,
        projectId: request.projectId,
        createdAt: new Date().toISOString()
      });

      // Send message to Service Bus
      const message = {
        jobId,
        type: 'content_generation',
        request,
        queuedAt: new Date().toISOString()
      };

      if (this.contentJobsSender) {
        await this.contentJobsSender.sendMessages({
          body: message,
          messageId: jobId,
          sessionId: request.userId || 'default'
        });
      } else {
        // Fallback: process immediately if Service Bus is not available
        this.logger.warn('Service Bus not available, processing job immediately');
        this.processContentGenerationJob(message).catch(error => {
          this.logger.error(`Job processing failed: ${error.message}`, error.stack);
        });
      }

      this.appInsights.trackEvent('ContentGeneration:JobQueued', {
        jobId,
        contentType: request.contentType,
        audience: request.audience,
        priority: request.priority
      });

      return jobId;

    } catch (error) {
      this.logger.error(`Failed to queue job ${jobId}: ${error.message}`, error.stack);
      
      // Update job status to failed
      await this.jobManagement.updateJobStatus(jobId, 'failed', error.message);
      
      throw error;
    }
  }

  /**
   * Generate content synchronously
   */
  async generateContentSync(request: any): Promise<any> {
    const jobId = `sync-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    
    try {
      this.logger.log(`Starting synchronous content generation: ${jobId}`);
      
      const context: OrchestrationContext = {
        jobId,
        request,
        currentStep: 'initializing',
        completedSteps: [],
        layerResults: {},
        metadata: {
          startTime: Date.now(),
          userId: request.userId,
          projectId: request.projectId,
          priority: request.priority || 'normal'
        }
      };

      // Execute workflow
      const workflow = await this.workflowEngine.getWorkflow(request.workflowType || 'standard');
      const result = await this.executeWorkflow(workflow, context);

      this.appInsights.trackEvent('ContentGeneration:SyncCompleted', {
        jobId,
        processingTime: Date.now() - context.metadata.startTime,
        contentType: request.contentType,
        audience: request.audience
      });

      return result;

    } catch (error) {
      this.logger.error(`Sync content generation failed: ${error.message}`, error.stack);
      
      this.appInsights.trackException(error, {
        jobId,
        operation: 'SyncContentGeneration'
      });
      
      throw error;
    }
  }

  /**
   * Process content generation job (called by Azure Function)
   */
  async processContentGenerationJob(message: any): Promise<void> {
    const { jobId, request } = message;
    
    try {
      this.logger.log(`Processing content generation job: ${jobId}`);
      
      // Update job status
      await this.jobManagement.updateJobStatus(jobId, 'processing', 'Job processing started');

      const context: OrchestrationContext = {
        jobId,
        request,
        currentStep: 'initializing',
        completedSteps: [],
        layerResults: {},
        metadata: {
          startTime: Date.now(),
          userId: request.userId,
          projectId: request.projectId,
          priority: request.priority || 'normal'
        }
      };

      // Execute workflow
      const workflow = await this.workflowEngine.getWorkflow(request.workflowType || 'standard');
      const result = await this.executeWorkflow(workflow, context);

      // Update job with results
      await this.jobManagement.updateJobStatus(jobId, 'completed', 'Content generation completed', result);

      // Send callback if provided
      if (request.callbackUrl) {
        await this.sendCallback(request.callbackUrl, {
          jobId,
          status: 'completed',
          result
        });
      }

      this.appInsights.trackEvent('ContentGeneration:JobCompleted', {
        jobId,
        processingTime: Date.now() - context.metadata.startTime,
        contentType: request.contentType,
        audience: request.audience
      });

    } catch (error) {
      this.logger.error(`Job processing failed for ${jobId}: ${error.message}`, error.stack);
      
      // Update job status to failed
      await this.jobManagement.updateJobStatus(jobId, 'failed', error.message);
      
      // Send failure callback if provided
      if (message.request.callbackUrl) {
        await this.sendCallback(message.request.callbackUrl, {
          jobId,
          status: 'failed',
          error: error.message
        });
      }

      this.appInsights.trackException(error, {
        jobId,
        operation: 'JobProcessing'
      });
    }
  }

  /**
   * Execute workflow steps
   */
  private async executeWorkflow(workflow: any, context: OrchestrationContext): Promise<any> {
    const results = {
      jobId: context.jobId,
      content: {},
      completedSteps: [],
      totalSteps: workflow.steps.length,
      processingTime: 0
    };

    for (const step of workflow.steps) {
      try {
        this.logger.log(`Executing step: ${step.name} for job ${context.jobId}`);
        
        context.currentStep = step.name;
        
        // Update job progress
        await this.jobManagement.updateJobProgress(context.jobId, {
          currentStep: step.name,
          completedSteps: context.completedSteps,
          totalSteps: workflow.steps.length,
          percentage: (context.completedSteps.length / workflow.steps.length) * 100
        });

        // Execute step based on layer
        let stepResult;
        switch (step.layer) {
          case 'bottom':
            stepResult = await this.executeBottomLayerStep(step, context);
            break;
          case 'middle':
            stepResult = await this.executeMiddleLayerStep(step, context);
            break;
          case 'top':
            stepResult = await this.executeTopLayerStep(step, context);
            break;
          default:
            throw new Error(`Unknown layer: ${step.layer}`);
        }

        // Store step result
        if (!context.layerResults[step.layer]) {
          context.layerResults[step.layer] = {};
        }
        context.layerResults[step.layer][step.service] = stepResult;
        
        context.completedSteps.push(step.name);
        results.completedSteps.push(step.name);

        this.logger.log(`Step completed: ${step.name}`);

      } catch (error) {
        this.logger.error(`Step failed: ${step.name} - ${error.message}`, error.stack);
        throw new Error(`Workflow step '${step.name}' failed: ${error.message}`);
      }
    }

    // Compile final results
    results.content = await this.compileResults(context);
    results.processingTime = Date.now() - context.metadata.startTime;

    return results;
  }

  /**
   * Execute bottom layer step
   */
  private async executeBottomLayerStep(step: any, context: OrchestrationContext): Promise<any> {
    const { request } = context;
    
    switch (step.service) {
      case 'queryIntentAnalyzer':
        return await this.queryIntentAnalyzer.analyzeIntent(request.topic, request.audience);
        
      case 'keywordTopicAnalyzer':
        return await this.keywordTopicAnalyzer.analyzeKeywords(
          request.searchKeywords || [request.topic], 
          request.audience
        );
        
      case 'contentChunker':
        // Use previous results if available
        const content = context.layerResults.middle?.blufContentStructurer?.structuredContent || request.topic;
        return await this.contentChunker.chunkContent(content, request.audience);
        
      case 'freshnessAggregator':
        return await this.freshnessAggregator.aggregateFreshness(request.topic, request.audience);
        
      default:
        throw new Error(`Unknown bottom layer service: ${step.service}`);
    }
  }

  /**
   * Execute middle layer step
   */
  private async executeMiddleLayerStep(step: any, context: OrchestrationContext): Promise<any> {
    const { request } = context;
    
    switch (step.service) {
      case 'blufContentStructurer':
        return await this.blufContentStructurer.structureWithBluf(
          { topic: request.topic, keyPoints: request.keyPoints },
          request.audience,
          request.contentType
        );
        
      case 'conversationalQueryOptimizer':
        const queries = context.layerResults.bottom?.keywordTopicAnalyzer?.queries || [request.topic];
        return await this.conversationalQueryOptimizer.optimizeForConversational(queries, request.audience);
        
      case 'semanticRelationshipMapper':
        return await this.semanticRelationshipMapper.mapRelationships(request.topic, request.audience);
        
      case 'platformSpecificTuner':
        const platform = this.determinePlatform(request.contentType);
        return await this.platformSpecificTuner.tuneForPlatform(
          { content: request.topic },
          platform,
          request.audience
        );
        
      default:
        throw new Error(`Unknown middle layer service: ${step.service}`);
    }
  }

  /**
   * Execute top layer step
   */
  private async executeTopLayerStep(step: any, context: OrchestrationContext): Promise<any> {
    const { request } = context;
    
    switch (step.service) {
      case 'llmContentOptimizer':
        const llmInput = {
          topic: request.topic,
          contentType: request.contentType,
          audience: request.audience,
          keyPoints: request.keyPoints,
          toneOfVoice: request.toneOfVoice,
          targetLength: request.targetLength,
          purpose: request.purpose,
          searchKeywords: request.searchKeywords
        };
        return await this.llmContentOptimizer.optimizeContent(llmInput);
        
      case 'originalResearchEngine':
        if (request.includeResearch) {
          return await this.originalResearchEngine.generateOriginalResearch(request.topic, request.audience);
        }
        return null;
        
      case 'citationAuthorityVerifier':
        if (request.includeCitations) {
          const content = context.layerResults.top?.llmContentOptimizer?.optimizedContent || { topic: request.topic };
          return await this.citationAuthorityVerifier.verifyCitations(content, request.audience);
        }
        return null;
        
      case 'eeatSignalGenerator':
        if (request.includeEEAT) {
          return await this.eeatSignalGenerator.generateEEATSignals(request.topic, request.audience);
        }
        return null;
        
      case 'schemaMarkupGenerator':
        if (request.includeSchemaMarkup) {
          const content = context.layerResults.top?.llmContentOptimizer?.optimizedContent || { topic: request.topic };
          return await this.schemaMarkupGenerator.generateSchemaMarkup(content, request.contentType);
        }
        return null;
        
      default:
        throw new Error(`Unknown top layer service: ${step.service}`);
    }
  }

  /**
   * Compile final results from all layers
   */
  private async compileResults(context: OrchestrationContext): Promise<any> {
    const { layerResults, request } = context;
    
    return {
      metadata: {
        jobId: context.jobId,
        topic: request.topic,
        contentType: request.contentType,
        audience: request.audience,
        processingTime: Date.now() - context.metadata.startTime,
        completedSteps: context.completedSteps
      },
      bottomLayer: layerResults.bottom || {},
      middleLayer: layerResults.middle || {},
      topLayer: layerResults.top || {},
      finalContent: this.assembleFinalContent(layerResults, request)
    };
  }

  /**
   * Assemble final content from layer results
   */
  private assembleFinalContent(layerResults: any, request: any): any {
    // This would be more sophisticated in production
    const baseContent = layerResults.top?.llmContentOptimizer?.optimizedContent || {};
    const structure = layerResults.middle?.blufContentStructurer?.structuredContent || {};
    const research = layerResults.top?.originalResearchEngine || null;
    const citations = layerResults.top?.citationAuthorityVerifier || null;
    const eeat = layerResults.top?.eeatSignalGenerator || null;
    const schema = layerResults.top?.schemaMarkupGenerator || null;

    return {
      ...baseContent,
      structure,
      research,
      citations,
      eeat,
      schema,
      metadata: {
        generatedAt: new Date().toISOString(),
        topic: request.topic,
        contentType: request.contentType,
        audience: request.audience
      }
    };
  }

  /**
   * Get health status of orchestration layer
   */
  async getHealthStatus(): Promise<any> {
    try {
      const status = {
        orchestration: 'healthy',
        serviceBus: this.serviceBusClient ? 'connected' : 'disconnected',
        layers: {
          bottom: 'healthy',
          middle: 'healthy',
          top: 'healthy'
        },
        timestamp: new Date().toISOString()
      };

      return status;
    } catch (error) {
      return {
        orchestration: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Initialize Azure Service Bus connection
   */
  private async initializeServiceBus(): Promise<void> {
    try {
      const connectionString = this.configService.get('AZURE_SERVICE_BUS_CONNECTION_STRING');
      
      if (connectionString) {
        this.serviceBusClient = new ServiceBusClient(connectionString);
        this.contentJobsSender = this.serviceBusClient.createSender('content-jobs');
        this.logger.log('Azure Service Bus initialized successfully');
      } else {
        this.logger.warn('Azure Service Bus connection string not provided, running in local mode');
      }
    } catch (error) {
      this.logger.error(`Failed to initialize Service Bus: ${error.message}`, error.stack);
    }
  }

  /**
   * Send callback notification
   */
  private async sendCallback(callbackUrl: string, data: any): Promise<void> {
    try {
      // Implementation would use HTTP client to send callback
      this.logger.log(`Sending callback to: ${callbackUrl}`);
      // await this.httpService.post(callbackUrl, data).toPromise();
    } catch (error) {
      this.logger.error(`Callback failed: ${error.message}`, error.stack);
    }
  }

  /**
   * Determine platform from content type
   */
  private determinePlatform(contentType: string): string {
    const platformMap = {
      'blog_post': 'blog',
      'social_media': 'social',
      'email_campaign': 'email',
      'technical_guide': 'documentation',
      'case_study': 'website',
      'product_review': 'ecommerce',
      'industry_analysis': 'report',
      'whitepaper': 'document'
    };
    
    return platformMap[contentType] || 'website';
  }
}
