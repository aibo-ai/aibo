import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApplicationInsightsService } from '../../../common/services/application-insights.service';

export interface Job {
  id: string;
  type: 'content_generation' | 'citation_verification' | 'research_generation' | 'seo_optimization';
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  
  // Request data
  request: any;
  
  // Progress tracking
  progress?: {
    currentStep: string;
    completedSteps: string[];
    totalSteps: number;
    percentage: number;
  };
  
  // Results
  result?: any;
  error?: string;
  message?: string;
  
  // Metadata
  userId?: string;
  projectId?: string;
  tags?: string[];
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  
  // Processing info
  processingTime?: number;
  retryCount?: number;
  maxRetries?: number;
  
  // Callback info
  callbackUrl?: string;
  callbackSent?: boolean;
}

export interface JobFilter {
  status?: string;
  type?: string;
  userId?: string;
  projectId?: string;
  priority?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'priority';
  sortOrder?: 'asc' | 'desc';
}

@Injectable()
export class JobManagementService {
  private readonly logger = new Logger(JobManagementService.name);
  private readonly jobs = new Map<string, Job>(); // In-memory storage for demo
  private readonly jobHistory = new Map<string, Job[]>(); // Job history by user
  
  constructor(
    private readonly configService: ConfigService,
    private readonly appInsights: ApplicationInsightsService
  ) {
    // In production, this would connect to a database
    this.initializeJobStorage();
  }

  /**
   * Create a new job
   */
  async createJob(jobData: Partial<Job>): Promise<Job> {
    const job: Job = {
      id: jobData.id || this.generateJobId(),
      type: jobData.type || 'content_generation',
      status: 'queued',
      priority: jobData.priority || 'normal',
      request: jobData.request || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      retryCount: 0,
      maxRetries: this.configService.get('JOB_MAX_RETRIES', 3),
      ...jobData
    };

    // Store job
    this.jobs.set(job.id, job);
    
    // Add to user history
    if (job.userId) {
      if (!this.jobHistory.has(job.userId)) {
        this.jobHistory.set(job.userId, []);
      }
      this.jobHistory.get(job.userId)!.push(job);
    }

    this.logger.log(`Job created: ${job.id} (${job.type})`);
    
    this.appInsights.trackEvent('JobManagement:JobCreated', {
      jobId: job.id,
      type: job.type,
      priority: job.priority,
      userId: job.userId
    });

    return job;
  }

  /**
   * Get job by ID
   */
  async getJobStatus(jobId: string): Promise<Job | null> {
    const job = this.jobs.get(jobId);
    
    if (job) {
      this.appInsights.trackEvent('JobManagement:JobStatusRequested', {
        jobId,
        status: job.status,
        userId: job.userId
      });
    }
    
    return job || null;
  }

  /**
   * Update job status
   */
  async updateJobStatus(
    jobId: string, 
    status: Job['status'], 
    message?: string, 
    result?: any
  ): Promise<void> {
    const job = this.jobs.get(jobId);
    
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }

    const previousStatus = job.status;
    
    job.status = status;
    job.updatedAt = new Date().toISOString();
    
    if (message) {
      job.message = message;
    }
    
    if (result) {
      job.result = result;
    }

    // Set timestamps based on status
    if (status === 'processing' && !job.startedAt) {
      job.startedAt = new Date().toISOString();
    }
    
    if (['completed', 'failed', 'cancelled'].includes(status) && !job.completedAt) {
      job.completedAt = new Date().toISOString();
      
      if (job.startedAt) {
        job.processingTime = new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime();
      }
    }

    this.logger.log(`Job ${jobId} status updated: ${previousStatus} -> ${status}`);
    
    this.appInsights.trackEvent('JobManagement:JobStatusUpdated', {
      jobId,
      previousStatus,
      newStatus: status,
      processingTime: job.processingTime,
      userId: job.userId
    });

    // Update user history
    if (job.userId) {
      const userJobs = this.jobHistory.get(job.userId);
      if (userJobs) {
        const jobIndex = userJobs.findIndex(j => j.id === jobId);
        if (jobIndex >= 0) {
          userJobs[jobIndex] = { ...job };
        }
      }
    }
  }

  /**
   * Update job progress
   */
  async updateJobProgress(jobId: string, progress: Job['progress']): Promise<void> {
    const job = this.jobs.get(jobId);
    
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }

    job.progress = progress;
    job.updatedAt = new Date().toISOString();

    this.logger.debug(`Job ${jobId} progress updated: ${progress?.percentage}%`);
    
    this.appInsights.trackMetric('JobManagement:JobProgress', progress?.percentage || 0, {
      jobId,
      currentStep: progress?.currentStep,
      userId: job.userId
    });
  }

  /**
   * Set job error
   */
  async setJobError(jobId: string, error: string): Promise<void> {
    const job = this.jobs.get(jobId);
    
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }

    job.error = error;
    job.status = 'failed';
    job.updatedAt = new Date().toISOString();
    job.completedAt = new Date().toISOString();

    if (job.startedAt) {
      job.processingTime = new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime();
    }

    this.logger.error(`Job ${jobId} failed: ${error}`);
    
    this.appInsights.trackEvent('JobManagement:JobFailed', {
      jobId,
      error,
      processingTime: job.processingTime,
      userId: job.userId
    });
  }

  /**
   * List jobs with filtering
   */
  async listJobs(filter: JobFilter = {}): Promise<{
    jobs: Job[];
    total: number;
    hasMore: boolean;
  }> {
    let filteredJobs = Array.from(this.jobs.values());

    // Apply filters
    if (filter.status) {
      filteredJobs = filteredJobs.filter(job => job.status === filter.status);
    }
    
    if (filter.type) {
      filteredJobs = filteredJobs.filter(job => job.type === filter.type);
    }
    
    if (filter.userId) {
      filteredJobs = filteredJobs.filter(job => job.userId === filter.userId);
    }
    
    if (filter.projectId) {
      filteredJobs = filteredJobs.filter(job => job.projectId === filter.projectId);
    }
    
    if (filter.priority) {
      filteredJobs = filteredJobs.filter(job => job.priority === filter.priority);
    }

    // Sort jobs
    const sortBy = filter.sortBy || 'createdAt';
    const sortOrder = filter.sortOrder || 'desc';
    
    filteredJobs.sort((a, b) => {
      const aValue = a[sortBy] || '';
      const bValue = b[sortBy] || '';
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Apply pagination
    const offset = filter.offset || 0;
    const limit = filter.limit || 50;
    const total = filteredJobs.length;
    const paginatedJobs = filteredJobs.slice(offset, offset + limit);
    const hasMore = offset + limit < total;

    this.appInsights.trackEvent('JobManagement:JobsListed', {
      filterStatus: filter.status,
      filterUserId: filter.userId,
      total,
      returned: paginatedJobs.length
    });

    return {
      jobs: paginatedJobs,
      total,
      hasMore
    };
  }

  /**
   * Cancel job
   */
  async cancelJob(jobId: string, reason?: string): Promise<void> {
    const job = this.jobs.get(jobId);
    
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }

    if (['completed', 'failed', 'cancelled'].includes(job.status)) {
      throw new Error(`Cannot cancel job in status: ${job.status}`);
    }

    await this.updateJobStatus(jobId, 'cancelled', reason || 'Job cancelled by user');
    
    this.logger.log(`Job cancelled: ${jobId}`);
  }

  /**
   * Retry failed job
   */
  async retryJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }

    if (job.status !== 'failed') {
      throw new Error(`Cannot retry job in status: ${job.status}`);
    }

    if ((job.retryCount || 0) >= (job.maxRetries || 3)) {
      throw new Error(`Job has exceeded maximum retry attempts`);
    }

    // Reset job for retry
    job.status = 'queued';
    job.retryCount = (job.retryCount || 0) + 1;
    job.error = undefined;
    job.updatedAt = new Date().toISOString();
    job.startedAt = undefined;
    job.completedAt = undefined;
    job.processingTime = undefined;

    this.logger.log(`Job retry initiated: ${jobId} (attempt ${job.retryCount})`);
    
    this.appInsights.trackEvent('JobManagement:JobRetried', {
      jobId,
      retryCount: job.retryCount,
      userId: job.userId
    });
  }

  /**
   * Get job statistics
   */
  async getJobStatistics(userId?: string): Promise<any> {
    let jobs = Array.from(this.jobs.values());
    
    if (userId) {
      jobs = jobs.filter(job => job.userId === userId);
    }

    const stats = {
      total: jobs.length,
      byStatus: this.groupBy(jobs, 'status'),
      byType: this.groupBy(jobs, 'type'),
      byPriority: this.groupBy(jobs, 'priority'),
      averageProcessingTime: this.calculateAverageProcessingTime(jobs),
      successRate: this.calculateSuccessRate(jobs),
      recentJobs: jobs
        .filter(job => new Date(job.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000))
        .length
    };

    return stats;
  }

  /**
   * Clean up old jobs
   */
  async cleanupOldJobs(olderThanDays: number = 30): Promise<number> {
    const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
    let cleanedCount = 0;

    for (const [jobId, job] of this.jobs.entries()) {
      if (new Date(job.createdAt) < cutoffDate && ['completed', 'failed', 'cancelled'].includes(job.status)) {
        this.jobs.delete(jobId);
        cleanedCount++;
      }
    }

    this.logger.log(`Cleaned up ${cleanedCount} old jobs`);
    
    this.appInsights.trackEvent('JobManagement:JobsCleanedUp', {
      cleanedCount,
      olderThanDays
    });

    return cleanedCount;
  }

  /**
   * Initialize job storage (in production, this would be a database)
   */
  private initializeJobStorage(): void {
    // In production, this would initialize database connections
    this.logger.log('Job storage initialized (in-memory)');
    
    // Schedule periodic cleanup
    setInterval(() => {
      this.cleanupOldJobs().catch(error => {
        this.logger.error(`Job cleanup failed: ${error.message}`, error.stack);
      });
    }, 24 * 60 * 60 * 1000); // Daily cleanup
  }

  /**
   * Generate unique job ID
   */
  private generateJobId(): string {
    return `job-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  }

  /**
   * Group array by property
   */
  private groupBy(array: any[], property: string): Record<string, number> {
    return array.reduce((groups, item) => {
      const key = item[property] || 'unknown';
      groups[key] = (groups[key] || 0) + 1;
      return groups;
    }, {});
  }

  /**
   * Calculate average processing time
   */
  private calculateAverageProcessingTime(jobs: Job[]): number {
    const completedJobs = jobs.filter(job => job.processingTime);
    
    if (completedJobs.length === 0) return 0;
    
    const totalTime = completedJobs.reduce((sum, job) => sum + (job.processingTime || 0), 0);
    return Math.round(totalTime / completedJobs.length);
  }

  /**
   * Calculate success rate
   */
  private calculateSuccessRate(jobs: Job[]): number {
    const finishedJobs = jobs.filter(job => ['completed', 'failed'].includes(job.status));
    
    if (finishedJobs.length === 0) return 0;
    
    const successfulJobs = finishedJobs.filter(job => job.status === 'completed');
    return Math.round((successfulJobs.length / finishedJobs.length) * 100);
  }
}
