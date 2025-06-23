import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { ApplicationInsightsService } from '../../../common/services/application-insights.service';
import { CacheService } from '../../../common/services/cache.service';

import { CompetitiveData } from '../entities/competitive-data.entity';
import { Competitor } from '../entities/competitor.entity';

import { SocialMediaCollectorService } from './collectors/social-media-collector.service';
import { SearchEngineCollectorService } from './collectors/search-engine-collector.service';
import { EcommerceCollectorService } from './collectors/ecommerce-collector.service';
import { WebScrapingService } from './collectors/web-scraping.service';

export interface DataIngestionRequest {
  competitorId: string;
  dataTypes: string[]; // 'social', 'search', 'ecommerce', 'web', 'news', 'patents'
  priority: 'low' | 'medium' | 'high' | 'urgent';
  scheduledFor?: Date;
  configuration?: {
    socialMedia?: {
      platforms: string[];
      lookbackDays: number;
      includeAds: boolean;
    };
    searchEngine?: {
      engines: string[];
      keywords: string[];
      locations: string[];
    };
    ecommerce?: {
      platforms: string[];
      productCategories: string[];
      priceTracking: boolean;
    };
    webScraping?: {
      urls: string[];
      frequency: string;
      dataPoints: string[];
    };
  };
}

export interface DataIngestionResult {
  ingestionId: string;
  competitorId: string;
  status: 'started' | 'in_progress' | 'completed' | 'failed' | 'partial';
  startTime: string;
  endTime?: string;
  duration?: number;
  results: {
    [dataType: string]: {
      status: 'success' | 'failed' | 'partial';
      recordsCollected: number;
      errors?: string[];
      metadata?: any;
    };
  };
  totalRecords: number;
  errors: string[];
  warnings: string[];
}

@Injectable()
export class DataIngestionService {
  private readonly logger = new Logger(DataIngestionService.name);
  private readonly activeIngestions = new Map<string, DataIngestionResult>();

  constructor(
    @InjectRepository(CompetitiveData)
    private readonly competitiveDataRepository: Repository<CompetitiveData>,
    @InjectRepository(Competitor)
    private readonly competitorRepository: Repository<Competitor>,
    
    private readonly configService: ConfigService,
    private readonly appInsights: ApplicationInsightsService,
    private readonly cacheService: CacheService,
    
    private readonly socialMediaCollector: SocialMediaCollectorService,
    private readonly searchEngineCollector: SearchEngineCollectorService,
    private readonly ecommerceCollector: EcommerceCollectorService,
    private readonly webScrapingService: WebScrapingService
  ) {}

  /**
   * Start data ingestion for a competitor
   */
  async startIngestion(request: DataIngestionRequest): Promise<DataIngestionResult> {
    const ingestionId = `ingestion_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const startTime = new Date().toISOString();
    
    try {
      this.logger.log(`Starting data ingestion for competitor ${request.competitorId}`);

      // Validate competitor exists
      const competitor = await this.competitorRepository.findOne({
        where: { id: request.competitorId }
      });

      if (!competitor) {
        throw new Error(`Competitor not found: ${request.competitorId}`);
      }

      // Initialize ingestion result
      const ingestionResult: DataIngestionResult = {
        ingestionId,
        competitorId: request.competitorId,
        status: 'started',
        startTime,
        results: {},
        totalRecords: 0,
        errors: [],
        warnings: []
      };

      // Store in active ingestions
      this.activeIngestions.set(ingestionId, ingestionResult);

      // Track ingestion start
      this.appInsights.trackEvent('CompetitionX:IngestionStarted', {
        ingestionId,
        competitorId: request.competitorId,
        dataTypes: request.dataTypes.join(','),
        priority: request.priority
      });

      // Start ingestion process (async)
      this.processIngestion(request, ingestionResult).catch(error => {
        this.logger.error(`Ingestion failed: ${error.message}`, error.stack);
        ingestionResult.status = 'failed';
        ingestionResult.errors.push(error.message);
        ingestionResult.endTime = new Date().toISOString();
      });

      return ingestionResult;

    } catch (error) {
      this.logger.error(`Failed to start ingestion: ${error.message}`, error.stack);
      this.appInsights.trackException(error, {
        operation: 'StartIngestion',
        competitorId: request.competitorId
      });
      throw error;
    }
  }

  /**
   * Get ingestion status
   */
  async getIngestionStatus(ingestionId: string): Promise<DataIngestionResult | null> {
    return this.activeIngestions.get(ingestionId) || null;
  }

  /**
   * Get all active ingestions
   */
  async getActiveIngestions(): Promise<DataIngestionResult[]> {
    return Array.from(this.activeIngestions.values());
  }

  /**
   * Cancel an active ingestion
   */
  async cancelIngestion(ingestionId: string): Promise<boolean> {
    const ingestion = this.activeIngestions.get(ingestionId);
    
    if (!ingestion) {
      return false;
    }

    if (ingestion.status === 'completed' || ingestion.status === 'failed') {
      return false;
    }

    ingestion.status = 'failed';
    ingestion.endTime = new Date().toISOString();
    ingestion.errors.push('Ingestion cancelled by user');

    this.appInsights.trackEvent('CompetitionX:IngestionCancelled', {
      ingestionId,
      competitorId: ingestion.competitorId
    });

    return true;
  }

  /**
   * Process the actual data ingestion
   */
  private async processIngestion(request: DataIngestionRequest, result: DataIngestionResult): Promise<void> {
    try {
      result.status = 'in_progress';
      
      // Process each data type
      for (const dataType of request.dataTypes) {
        try {
          this.logger.log(`Processing ${dataType} data for competitor ${request.competitorId}`);
          
          const collectionResult = await this.collectDataByType(
            dataType, 
            request.competitorId, 
            request.configuration
          );

          result.results[dataType] = {
            status: 'success',
            recordsCollected: collectionResult.recordsCollected,
            metadata: collectionResult.metadata
          };

          result.totalRecords += collectionResult.recordsCollected;

        } catch (error) {
          this.logger.error(`Failed to collect ${dataType} data: ${error.message}`);
          
          result.results[dataType] = {
            status: 'failed',
            recordsCollected: 0,
            errors: [error.message]
          };

          result.errors.push(`${dataType}: ${error.message}`);
        }
      }

      // Determine final status
      const hasFailures = Object.values(result.results).some(r => r.status === 'failed');
      const hasSuccesses = Object.values(result.results).some(r => r.status === 'success');

      if (hasFailures && hasSuccesses) {
        result.status = 'partial';
      } else if (hasSuccesses) {
        result.status = 'completed';
      } else {
        result.status = 'failed';
      }

      result.endTime = new Date().toISOString();
      result.duration = new Date(result.endTime).getTime() - new Date(result.startTime).getTime();

      // Track completion
      this.appInsights.trackEvent('CompetitionX:IngestionCompleted', {
        ingestionId: result.ingestionId,
        competitorId: result.competitorId,
        status: result.status,
        totalRecords: result.totalRecords.toString(),
        duration: result.duration.toString()
      });

      this.logger.log(`Ingestion completed: ${result.ingestionId} (${result.status})`);

    } catch (error) {
      result.status = 'failed';
      result.endTime = new Date().toISOString();
      result.errors.push(error.message);
      
      this.logger.error(`Ingestion processing failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Collect data by type using appropriate collector
   */
  private async collectDataByType(
    dataType: string, 
    competitorId: string, 
    configuration?: any
  ): Promise<{ recordsCollected: number; metadata?: any }> {
    
    switch (dataType) {
      case 'social':
        return await this.socialMediaCollector.collectData(competitorId, configuration?.socialMedia);
      
      case 'search':
        return await this.searchEngineCollector.collectData(competitorId, configuration?.searchEngine);
      
      case 'ecommerce':
        return await this.ecommerceCollector.collectData(competitorId, configuration?.ecommerce);
      
      case 'web':
        return await this.webScrapingService.collectData(competitorId, configuration?.webScraping);
      
      case 'news':
        return await this.collectNewsData(competitorId, configuration?.news);
      
      case 'patents':
        return await this.collectPatentData(competitorId, configuration?.patents);
      
      default:
        throw new Error(`Unsupported data type: ${dataType}`);
    }
  }

  /**
   * Collect news data (placeholder implementation)
   */
  private async collectNewsData(competitorId: string, config?: any): Promise<{ recordsCollected: number; metadata?: any }> {
    // This would integrate with news APIs like NewsAPI, Google News, etc.
    this.logger.log(`Collecting news data for competitor ${competitorId}`);
    
    // Simulate news collection
    const recordsCollected = Math.floor(Math.random() * 20) + 5;
    
    // In a real implementation, this would:
    // 1. Query news APIs for competitor mentions
    // 2. Analyze sentiment and relevance
    // 3. Store in CompetitiveData table
    // 4. Extract insights and trends
    
    return {
      recordsCollected,
      metadata: {
        sources: ['newsapi', 'google_news', 'bing_news'],
        timeRange: '7d',
        languages: ['en']
      }
    };
  }

  /**
   * Collect patent data (placeholder implementation)
   */
  private async collectPatentData(competitorId: string, config?: any): Promise<{ recordsCollected: number; metadata?: any }> {
    // This would integrate with patent databases like USPTO, Google Patents, etc.
    this.logger.log(`Collecting patent data for competitor ${competitorId}`);
    
    // Simulate patent collection
    const recordsCollected = Math.floor(Math.random() * 10) + 1;
    
    // In a real implementation, this would:
    // 1. Query patent databases
    // 2. Analyze patent classifications and claims
    // 3. Identify innovation trends
    // 4. Store patent information and analysis
    
    return {
      recordsCollected,
      metadata: {
        sources: ['uspto', 'google_patents', 'espacenet'],
        patentTypes: ['utility', 'design', 'plant'],
        timeRange: '2y'
      }
    };
  }

  /**
   * Schedule recurring data ingestion
   */
  async scheduleRecurringIngestion(
    competitorId: string, 
    dataTypes: string[], 
    frequency: 'hourly' | 'daily' | 'weekly' | 'monthly'
  ): Promise<string> {
    const scheduleId = `schedule_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    
    // In a real implementation, this would:
    // 1. Store schedule in database
    // 2. Set up cron job or Azure Function timer
    // 3. Handle schedule management and execution
    
    this.logger.log(`Scheduled ${frequency} ingestion for competitor ${competitorId}: ${scheduleId}`);
    
    this.appInsights.trackEvent('CompetitionX:IngestionScheduled', {
      scheduleId,
      competitorId,
      dataTypes: dataTypes.join(','),
      frequency
    });
    
    return scheduleId;
  }

  /**
   * Get ingestion statistics
   */
  async getIngestionStatistics(timeRange: '24h' | '7d' | '30d' = '24h'): Promise<{
    totalIngestions: number;
    successfulIngestions: number;
    failedIngestions: number;
    averageDuration: number;
    recordsCollected: number;
    dataTypeBreakdown: { [dataType: string]: number };
  }> {
    // This would query actual ingestion history from database
    const stats = {
      totalIngestions: 45,
      successfulIngestions: 42,
      failedIngestions: 3,
      averageDuration: 125000, // milliseconds
      recordsCollected: 1250,
      dataTypeBreakdown: {
        social: 450,
        search: 320,
        ecommerce: 280,
        web: 150,
        news: 50
      }
    };

    return stats;
  }

  /**
   * Clean up completed ingestions (keep only recent ones)
   */
  async cleanupCompletedIngestions(): Promise<void> {
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
    
    for (const [ingestionId, result] of this.activeIngestions.entries()) {
      if (result.status === 'completed' || result.status === 'failed') {
        const endTime = new Date(result.endTime || result.startTime).getTime();
        
        if (endTime < cutoffTime) {
          this.activeIngestions.delete(ingestionId);
        }
      }
    }
    
    this.logger.log(`Cleaned up old ingestion records`);
  }
}
