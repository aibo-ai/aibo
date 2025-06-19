import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as appInsights from 'applicationinsights';

/**
 * Service for integrating Azure Application Insights monitoring and logging
 * Provides centralized telemetry, metrics, and error tracking
 */
@Injectable()
export class ApplicationInsightsService implements OnModuleInit {
  private readonly logger = new Logger(ApplicationInsightsService.name);
  private isInitialized = false;
  private client: appInsights.TelemetryClient | null = null;

  constructor() {
    // Initialization will happen in onModuleInit
  }

  /**
   * Initialize Application Insights when the module starts
   */
  async onModuleInit() {
    const connectionString = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING;
    
    if (!connectionString) {
      this.logger.warn('APPLICATIONINSIGHTS_CONNECTION_STRING is not defined. Application Insights is disabled.');
      return;
    }

    try {
      // Configure and start Application Insights
      appInsights
        .setup(connectionString)
        .setAutoDependencyCorrelation(true)
        .setAutoCollectRequests(true)
        .setAutoCollectPerformance(true)
        .setAutoCollectExceptions(true)
        .setAutoCollectDependencies(true)
        .setAutoCollectConsole(true, true)
        .setUseDiskRetryCaching(true)
        .setSendLiveMetrics(true)
        .setDistributedTracingMode(appInsights.DistributedTracingModes.AI_AND_W3C)
        .start();

      this.client = appInsights.defaultClient;
      this.isInitialized = true;
      
      // Configure custom properties that will be sent with all telemetry
      this.client.commonProperties = {
        environment: process.env.NODE_ENV || 'development',
        service: 'ContentArchitect',
        version: process.env.APP_VERSION || '1.0.0'
      };
      
      this.logger.log('Azure Application Insights initialized successfully');
    } catch (error) {
      this.logger.error(`Failed to initialize Azure Application Insights: ${error.message}`);
    }
  }

  /**
   * Track a custom event
   * @param name Event name
   * @param properties Custom properties for the event
   * @param measurements Custom measurements for the event
   */
  trackEvent(name: string, properties?: Record<string, any>, measurements?: Record<string, number>): void {
    if (!this.isInitialized || !this.client) {
      this.logger.debug(`Application Insights not initialized when tracking event: ${name}`);
      return;
    }
    
    this.client.trackEvent({ name, properties, measurements });
  }

  /**
   * Track a metric value
   * @param name Metric name
   * @param value Metric value
   * @param properties Additional properties
   */
  trackMetric(name: string, value: number, properties?: Record<string, any>): void {
    if (!this.isInitialized || !this.client) {
      this.logger.debug(`Application Insights not initialized when tracking metric: ${name}`);
      return;
    }
    
    this.client.trackMetric({ name, value, properties });
  }

  /**
   * Track an exception
   * @param exception Error or exception object
   * @param properties Additional properties
   */
  trackException(exception: Error, properties?: Record<string, any>): void {
    if (!this.isInitialized || !this.client) {
      this.logger.debug(`Application Insights not initialized when tracking exception: ${exception.message}`);
      return;
    }
    
    this.client.trackException({ exception, properties });
  }

  /**
   * Track dependency call
   * @param data Dependency data including target, name, duration, etc.
   */
  trackDependency(data: {
    target: string;
    name: string;
    dependencyTypeName: string;
    data?: string;
    duration: number;
    resultCode: number;
    success: boolean;
    properties?: Record<string, any>;
  }): void {
    if (!this.isInitialized || !this.client) {
      this.logger.debug(`Application Insights not initialized when tracking dependency: ${data.name}`);
      return;
    }
    
    // Ensure data property is always provided as required by DependencyTelemetry type
    this.client.trackDependency({
      ...data,
      data: data.data || data.name // Provide a fallback value if data is not provided
    });
  }

  /**
   * Track request completion
   * @param request Request data
   */
  trackRequest(request: {
    name: string;
    url: string;
    duration: number;
    resultCode: string | number;
    success: boolean;
    properties?: Record<string, any>;
  }): void {
    if (!this.isInitialized || !this.client) {
      this.logger.debug(`Application Insights not initialized when tracking request: ${request.name}`);
      return;
    }
    
    this.client.trackRequest(request);
  }

  /**
   * Flush all pending telemetry items
   * @returns Promise that resolves when flush is complete
   */
  async flush(): Promise<void> {
    if (!this.isInitialized || !this.client) {
      return;
    }
    
    return new Promise<void>((resolve) => {
      this.client?.flush({
        callback: () => {
          resolve();
        }
      });
    });
  }
  
  /**
   * Check if Application Insights is initialized
   * @returns True if Application Insights client is initialized
   */
  isAppInsightsAvailable(): boolean {
    return this.isInitialized;
  }
  
  /**
   * Get the underlying telemetry client
   * @returns Application Insights telemetry client or null
   */
  getTelemetryClient(): appInsights.TelemetryClient | null {
    return this.client;
  }
}
