import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

// Core Services
import { CompetitionXService } from './services/competition-x.service';
import { DataIngestionService } from './services/data-ingestion.service';
import { CompetitorAnalysisService } from './services/competitor-analysis.service';
import { RealTimeMonitoringService } from './services/real-time-monitoring.service';

// Data Collection Services
import { SocialMediaCollectorService } from './services/collectors/social-media-collector.service';
import { SearchEngineCollectorService } from './services/collectors/search-engine-collector.service';
import { EcommerceCollectorService } from './services/collectors/ecommerce-collector.service';
import { WebScrapingService } from './services/collectors/web-scraping.service';

// Analytics Services
import { CompetitiveAnalyticsService } from './services/analytics/competitive-analytics.service';
import { SentimentAnalysisService } from './services/analytics/sentiment-analysis.service';
import { TrendAnalysisService } from './services/analytics/trend-analysis.service';
import { PredictiveAnalyticsService } from './services/analytics/predictive-analytics.service';

// Controllers
import { CompetitionXController } from './controllers/competition-x.controller';
import { CompetitorController } from './controllers/competitor.controller';
import { AnalyticsController } from './controllers/analytics.controller';
import { MonitoringController } from './controllers/monitoring.controller';

// Entities
import { Competitor } from './entities/competitor.entity';
import { CompetitiveData } from './entities/competitive-data.entity';
import { MarketInsight } from './entities/market-insight.entity';
import { MonitoringAlert } from './entities/monitoring-alert.entity';
import { CompetitorProfile } from './entities/competitor-profile.entity';
import { SocialMediaData } from './entities/social-media-data.entity';
import { SearchEngineData } from './entities/search-engine-data.entity';
import { EcommerceData } from './entities/ecommerce-data.entity';

// Common Services
import { ApplicationInsightsService } from '../../common/services/application-insights.service';
import { CacheService } from '../../common/services/cache.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      Competitor,
      CompetitiveData,
      MarketInsight,
      MonitoringAlert,
      CompetitorProfile,
      SocialMediaData,
      SearchEngineData,
      EcommerceData
    ])
  ],
  controllers: [
    CompetitionXController,
    CompetitorController,
    AnalyticsController,
    MonitoringController
  ],
  providers: [
    // Core Services
    CompetitionXService,
    DataIngestionService,
    CompetitorAnalysisService,
    RealTimeMonitoringService,
    
    // Data Collection Services
    SocialMediaCollectorService,
    SearchEngineCollectorService,
    EcommerceCollectorService,
    WebScrapingService,
    
    // Analytics Services
    CompetitiveAnalyticsService,
    SentimentAnalysisService,
    TrendAnalysisService,
    PredictiveAnalyticsService,
    
    // Common Services
    ApplicationInsightsService,
    CacheService
  ],
  exports: [
    CompetitionXService,
    DataIngestionService,
    CompetitorAnalysisService,
    RealTimeMonitoringService,
    CompetitiveAnalyticsService,
    SentimentAnalysisService,
    TrendAnalysisService,
    PredictiveAnalyticsService
  ]
})
export class CompetitionXModule {}
