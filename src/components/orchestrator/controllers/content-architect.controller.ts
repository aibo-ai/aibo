import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Param, 
  Query, 
  Logger,
  HttpStatus,
  HttpException
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBody, 
  ApiParam,
  ApiQuery
} from '@nestjs/swagger';
import { OrchestrationService } from '../services/orchestration.service';
import { JobManagementService } from '../services/job-management.service';
import { WorkflowEngineService } from '../services/workflow-engine.service';

export interface ContentArchitectRequest {
  // Content details
  topic: string;
  contentType: 'blog_post' | 'technical_guide' | 'case_study' | 'product_review' | 'industry_analysis' | 'social_media' | 'whitepaper' | 'email_campaign';
  audience: 'b2b' | 'b2c';
  
  // Content specifications
  targetLength?: 'short' | 'medium' | 'long';
  toneOfVoice?: 'formal' | 'conversational' | 'technical' | 'friendly' | 'authoritative';
  purpose?: string;
  keyPoints?: string[];
  searchKeywords?: string[];
  
  // Processing options
  includeResearch?: boolean;
  includeCitations?: boolean;
  includeEEAT?: boolean;
  includeSchemaMarkup?: boolean;
  includeSEOOptimization?: boolean;
  
  // Workflow configuration
  workflowType?: 'standard' | 'research_heavy' | 'seo_focused' | 'citation_heavy' | 'custom';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  
  // Async processing
  async?: boolean;
  callbackUrl?: string;
  
  // Metadata
  userId?: string;
  projectId?: string;
  tags?: string[];
}

export interface ContentArchitectResponse {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  message: string;
  estimatedCompletionTime?: string;
  result?: any;
  progress?: {
    currentStep: string;
    completedSteps: string[];
    totalSteps: number;
    percentage: number;
  };
  metadata: {
    createdAt: string;
    updatedAt: string;
    processingTime?: number;
  };
}

@ApiTags('Content Architect')
@Controller('content-architect')
export class ContentArchitectController {
  private readonly logger = new Logger(ContentArchitectController.name);

  constructor(
    private readonly orchestrationService: OrchestrationService,
    private readonly jobManagementService: JobManagementService,
    private readonly workflowEngineService: WorkflowEngineService
  ) {}

  @Post('generate')
  @ApiOperation({ 
    summary: 'Generate comprehensive content using all layers',
    description: 'Main entry point for content generation. Orchestrates bottom, middle, and top layers to create high-quality content.'
  })
  @ApiBody({
    type: Object,
    description: 'Content generation request',
    schema: {
      type: 'object',
      properties: {
        topic: { type: 'string', description: 'Main topic for content generation' },
        contentType: { 
          type: 'string', 
          enum: ['blog_post', 'technical_guide', 'case_study', 'product_review', 'industry_analysis', 'social_media', 'whitepaper', 'email_campaign'],
          description: 'Type of content to generate'
        },
        audience: { type: 'string', enum: ['b2b', 'b2c'], description: 'Target audience' },
        targetLength: { type: 'string', enum: ['short', 'medium', 'long'], description: 'Desired content length' },
        toneOfVoice: { type: 'string', enum: ['formal', 'conversational', 'technical', 'friendly', 'authoritative'], description: 'Content tone' },
        purpose: { type: 'string', description: 'Purpose of the content' },
        keyPoints: { type: 'array', items: { type: 'string' }, description: 'Key points to include' },
        searchKeywords: { type: 'array', items: { type: 'string' }, description: 'SEO keywords to target' },
        includeResearch: { type: 'boolean', description: 'Include original research' },
        includeCitations: { type: 'boolean', description: 'Include citation verification' },
        includeEEAT: { type: 'boolean', description: 'Include E-E-A-T signals' },
        includeSchemaMarkup: { type: 'boolean', description: 'Generate schema markup' },
        includeSEOOptimization: { type: 'boolean', description: 'Apply SEO optimization' },
        workflowType: { 
          type: 'string', 
          enum: ['standard', 'research_heavy', 'seo_focused', 'citation_heavy', 'custom'],
          description: 'Type of workflow to execute'
        },
        priority: { type: 'string', enum: ['low', 'normal', 'high', 'urgent'], description: 'Processing priority' },
        async: { type: 'boolean', description: 'Process asynchronously' },
        callbackUrl: { type: 'string', description: 'Callback URL for async processing' },
        userId: { type: 'string', description: 'User identifier' },
        projectId: { type: 'string', description: 'Project identifier' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Content tags' }
      },
      required: ['topic', 'contentType', 'audience']
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Content generation initiated successfully',
    schema: {
      type: 'object',
      properties: {
        jobId: { type: 'string' },
        status: { type: 'string', enum: ['queued', 'processing', 'completed', 'failed'] },
        message: { type: 'string' },
        estimatedCompletionTime: { type: 'string' },
        result: { type: 'object' },
        progress: {
          type: 'object',
          properties: {
            currentStep: { type: 'string' },
            completedSteps: { type: 'array', items: { type: 'string' } },
            totalSteps: { type: 'number' },
            percentage: { type: 'number' }
          }
        },
        metadata: {
          type: 'object',
          properties: {
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' },
            processingTime: { type: 'number' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid request parameters' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async generateContent(@Body() request: ContentArchitectRequest): Promise<ContentArchitectResponse> {
    const startTime = Date.now();
    
    try {
      this.logger.log(`Content generation request received: ${request.topic} (${request.contentType})`);
      
      // Validate request
      this.validateRequest(request);
      
      // Determine processing mode
      const isAsync = request.async !== false; // Default to async
      
      if (isAsync) {
        // Async processing - queue the job
        const jobId = await this.orchestrationService.queueContentGeneration(request);
        
        return {
          jobId,
          status: 'queued',
          message: 'Content generation job queued successfully',
          estimatedCompletionTime: this.calculateEstimatedTime(request),
          metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        };
      } else {
        // Synchronous processing
        const result = await this.orchestrationService.generateContentSync(request);
        
        return {
          jobId: result.jobId,
          status: 'completed',
          message: 'Content generated successfully',
          result: result.content,
          progress: {
            currentStep: 'completed',
            completedSteps: result.completedSteps,
            totalSteps: result.totalSteps,
            percentage: 100
          },
          metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            processingTime: Date.now() - startTime
          }
        };
      }
      
    } catch (error) {
      this.logger.error(`Content generation failed: ${error.message}`, error.stack);
      
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Content generation failed',
          message: error.message,
          timestamp: new Date().toISOString()
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('job/:jobId')
  @ApiOperation({ 
    summary: 'Get job status and results',
    description: 'Retrieve the current status and results of a content generation job'
  })
  @ApiParam({ name: 'jobId', description: 'Job identifier' })
  @ApiResponse({ status: 200, description: 'Job status retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async getJobStatus(@Param('jobId') jobId: string): Promise<ContentArchitectResponse> {
    try {
      const job = await this.jobManagementService.getJobStatus(jobId);
      
      if (!job) {
        throw new HttpException('Job not found', HttpStatus.NOT_FOUND);
      }
      
      return {
        jobId: job.id,
        status: job.status,
        message: job.message || 'Job status retrieved',
        result: job.result,
        progress: job.progress,
        metadata: {
          createdAt: job.createdAt,
          updatedAt: job.updatedAt,
          processingTime: job.processingTime
        }
      };
      
    } catch (error) {
      this.logger.error(`Failed to get job status: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get('jobs')
  @ApiOperation({ 
    summary: 'List jobs with filtering',
    description: 'Get a list of content generation jobs with optional filtering'
  })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by job status' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID' })
  @ApiQuery({ name: 'projectId', required: false, description: 'Filter by project ID' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of results to return' })
  @ApiQuery({ name: 'offset', required: false, description: 'Number of results to skip' })
  @ApiResponse({ status: 200, description: 'Jobs retrieved successfully' })
  async listJobs(
    @Query('status') status?: string,
    @Query('userId') userId?: string,
    @Query('projectId') projectId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ) {
    try {
      const filters = {
        status,
        userId,
        projectId,
        limit: limit ? parseInt(limit) : 50,
        offset: offset ? parseInt(offset) : 0
      };
      
      return await this.jobManagementService.listJobs(filters);
      
    } catch (error) {
      this.logger.error(`Failed to list jobs: ${error.message}`, error.stack);
      throw new HttpException(
        'Failed to retrieve jobs',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('workflows')
  @ApiOperation({ 
    summary: 'Get available workflow types',
    description: 'Retrieve list of available workflow configurations'
  })
  @ApiResponse({ status: 200, description: 'Workflows retrieved successfully' })
  async getWorkflows() {
    try {
      return await this.workflowEngineService.getAvailableWorkflows();
    } catch (error) {
      this.logger.error(`Failed to get workflows: ${error.message}`, error.stack);
      throw new HttpException(
        'Failed to retrieve workflows',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('health')
  @ApiOperation({ 
    summary: 'Get orchestration layer health status',
    description: 'Check the health of the orchestration layer and all connected services'
  })
  @ApiResponse({ status: 200, description: 'Health status retrieved successfully' })
  async getHealth() {
    try {
      return await this.orchestrationService.getHealthStatus();
    } catch (error) {
      this.logger.error(`Health check failed: ${error.message}`, error.stack);
      throw new HttpException(
        'Health check failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  private validateRequest(request: ContentArchitectRequest): void {
    if (!request.topic || request.topic.trim().length === 0) {
      throw new HttpException('Topic is required', HttpStatus.BAD_REQUEST);
    }
    
    if (!request.contentType) {
      throw new HttpException('Content type is required', HttpStatus.BAD_REQUEST);
    }
    
    if (!request.audience || !['b2b', 'b2c'].includes(request.audience)) {
      throw new HttpException('Valid audience (b2b or b2c) is required', HttpStatus.BAD_REQUEST);
    }
    
    if (request.async && request.callbackUrl && !this.isValidUrl(request.callbackUrl)) {
      throw new HttpException('Invalid callback URL', HttpStatus.BAD_REQUEST);
    }
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private calculateEstimatedTime(request: ContentArchitectRequest): string {
    // Base time estimates in minutes
    let estimatedMinutes = 2; // Base processing time
    
    // Add time based on content type
    const contentTypeMultipliers = {
      'blog_post': 1,
      'technical_guide': 2,
      'case_study': 1.5,
      'product_review': 1,
      'industry_analysis': 2.5,
      'social_media': 0.5,
      'whitepaper': 3,
      'email_campaign': 0.5
    };
    
    estimatedMinutes *= contentTypeMultipliers[request.contentType] || 1;
    
    // Add time for optional features
    if (request.includeResearch) estimatedMinutes += 3;
    if (request.includeCitations) estimatedMinutes += 2;
    if (request.includeEEAT) estimatedMinutes += 1;
    if (request.includeSchemaMarkup) estimatedMinutes += 0.5;
    if (request.includeSEOOptimization) estimatedMinutes += 1;
    
    // Adjust for length
    const lengthMultipliers = { short: 0.7, medium: 1, long: 1.5 };
    estimatedMinutes *= lengthMultipliers[request.targetLength] || 1;
    
    const estimatedTime = new Date(Date.now() + estimatedMinutes * 60 * 1000);
    return estimatedTime.toISOString();
  }
}
