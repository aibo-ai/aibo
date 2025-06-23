import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { ApplicationInsightsService } from '../services/application-insights.service';

@Injectable()
export class PerformanceMonitoringInterceptor implements NestInterceptor {
  private readonly logger = new Logger(PerformanceMonitoringInterceptor.name);

  constructor(private readonly appInsights: ApplicationInsightsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = Date.now();
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    
    const method = request.method;
    const url = request.url;
    const userAgent = request.get('User-Agent') || '';
    const contentLength = request.get('Content-Length');
    const userId = (request as any).user?.id || 'anonymous';
    const correlationId = request.get('x-correlation-id') || this.generateCorrelationId();

    // Add correlation ID to response headers
    response.setHeader('x-correlation-id', correlationId);

    return next.handle().pipe(
      tap((data) => {
        const duration = Date.now() - startTime;
        const statusCode = response.statusCode;
        const responseSize = JSON.stringify(data || {}).length;

        // Track API performance
        this.appInsights.trackApiPerformance({
          endpoint: this.sanitizeUrl(url),
          method,
          statusCode,
          duration,
          requestSize: contentLength ? parseInt(contentLength) : undefined,
          responseSize,
          properties: {
            correlationId,
            userId,
            userAgent: this.sanitizeUserAgent(userAgent),
            success: 'true'
          }
        });

        // Track request telemetry
        this.appInsights.trackRequest({
          name: `${method} ${this.sanitizeUrl(url)}`,
          url: this.sanitizeUrl(url),
          duration,
          resultCode: statusCode,
          success: statusCode >= 200 && statusCode < 400,
          properties: {
            correlationId,
            userId,
            method,
            userAgent: this.sanitizeUserAgent(userAgent),
            requestSize: contentLength,
            responseSize: responseSize.toString()
          }
        });

        // Log slow requests
        if (duration > 5000) { // 5 seconds threshold
          this.logger.warn(`Slow request detected: ${method} ${url} took ${duration}ms`, {
            correlationId,
            duration,
            endpoint: url,
            method,
            statusCode,
            userId
          });

          this.appInsights.trackEvent('SlowRequest', {
            correlationId,
            endpoint: this.sanitizeUrl(url),
            method,
            duration: duration.toString(),
            statusCode: statusCode.toString(),
            userId
          });
        }

        // Track performance metrics
        this.trackPerformanceMetrics(method, url, duration, statusCode);
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        const statusCode = response.statusCode || 500;

        // Track failed request
        this.appInsights.trackApiPerformance({
          endpoint: this.sanitizeUrl(url),
          method,
          statusCode,
          duration,
          requestSize: contentLength ? parseInt(contentLength) : undefined,
          properties: {
            correlationId,
            userId,
            userAgent: this.sanitizeUserAgent(userAgent),
            success: 'false',
            error: error.message
          }
        });

        // Track exception
        this.appInsights.trackException(error, {
          correlationId,
          endpoint: this.sanitizeUrl(url),
          method,
          duration: duration.toString(),
          userId,
          operation: 'APIRequest'
        });

        // Track error event
        this.appInsights.trackEvent('APIError', {
          correlationId,
          endpoint: this.sanitizeUrl(url),
          method,
          error: error.message,
          statusCode: statusCode.toString(),
          duration: duration.toString(),
          userId
        });

        throw error;
      })
    );
  }

  private trackPerformanceMetrics(method: string, url: string, duration: number, statusCode: number): void {
    // Track response time by endpoint
    this.appInsights.trackPerformanceMetric({
      name: `ResponseTime.${method}`,
      value: duration,
      unit: 'milliseconds',
      category: 'api',
      properties: {
        endpoint: this.sanitizeUrl(url),
        method,
        statusCode: statusCode.toString()
      }
    });

    // Track request count
    this.appInsights.trackMetric('API.RequestCount', 1, {
      endpoint: this.sanitizeUrl(url),
      method,
      statusCode: statusCode.toString()
    });

    // Track error rate
    if (statusCode >= 400) {
      this.appInsights.trackMetric('API.ErrorCount', 1, {
        endpoint: this.sanitizeUrl(url),
        method,
        statusCode: statusCode.toString()
      });
    }

    // Track throughput metrics
    this.appInsights.trackMetric('API.Throughput', 1, {
      timestamp: new Date().toISOString()
    });
  }

  private sanitizeUrl(url: string): string {
    // Remove query parameters and sensitive data
    const urlParts = url.split('?');
    let cleanUrl = urlParts[0];

    // Replace dynamic segments with placeholders
    cleanUrl = cleanUrl.replace(/\/\d+/g, '/{id}');
    cleanUrl = cleanUrl.replace(/\/[a-f0-9-]{36}/g, '/{uuid}');
    cleanUrl = cleanUrl.replace(/\/[a-f0-9]{24}/g, '/{objectId}');

    return cleanUrl;
  }

  private sanitizeUserAgent(userAgent: string): string {
    // Truncate user agent to prevent excessive data
    return userAgent.length > 200 ? userAgent.substring(0, 200) + '...' : userAgent;
  }

  private generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }
}

/**
 * Decorator to exclude specific endpoints from performance monitoring
 */
export const ExcludeFromMonitoring = () => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata('excludeFromMonitoring', true, descriptor.value);
  };
};

/**
 * Enhanced performance monitoring interceptor with additional features
 */
@Injectable()
export class EnhancedPerformanceMonitoringInterceptor implements NestInterceptor {
  private readonly logger = new Logger(EnhancedPerformanceMonitoringInterceptor.name);
  private readonly performanceThresholds = {
    slow: 1000,      // 1 second
    verySlow: 5000,  // 5 seconds
    critical: 10000  // 10 seconds
  };

  constructor(private readonly appInsights: ApplicationInsightsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // Check if endpoint should be excluded from monitoring
    const handler = context.getHandler();
    const excludeFromMonitoring = Reflect.getMetadata('excludeFromMonitoring', handler);
    
    if (excludeFromMonitoring) {
      return next.handle();
    }

    const startTime = process.hrtime.bigint();
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    
    const method = request.method;
    const url = request.url;
    const correlationId = this.getOrCreateCorrelationId(request, response);
    const operationContext = this.appInsights.getTelemetryClient()?.startOperation(`${method} ${this.sanitizeUrl(url)}`, correlationId);

    return next.handle().pipe(
      tap((data) => {
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
        
        this.trackDetailedPerformance(request, response, duration, data, correlationId);
        
        if (operationContext) {
          this.appInsights.getTelemetryClient()?.completeOperation(operationContext, true);
        }
      }),
      catchError((error) => {
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1000000;
        
        this.trackErrorPerformance(request, response, duration, error, correlationId);
        
        if (operationContext) {
          this.appInsights.getTelemetryClient()?.completeOperation(operationContext, false);
        }
        
        throw error;
      })
    );
  }

  private trackDetailedPerformance(
    request: Request,
    response: Response,
    duration: number,
    data: any,
    correlationId: string
  ): void {
    const method = request.method;
    const url = request.url;
    const statusCode = response.statusCode;
    const userId = (request as any).user?.id;
    const endpoint = this.sanitizeUrl(url);

    // Determine performance category
    let performanceCategory = 'normal';
    if (duration > this.performanceThresholds.critical) {
      performanceCategory = 'critical';
    } else if (duration > this.performanceThresholds.verySlow) {
      performanceCategory = 'very_slow';
    } else if (duration > this.performanceThresholds.slow) {
      performanceCategory = 'slow';
    }

    // Track comprehensive metrics
    const properties = {
      correlationId,
      endpoint,
      method,
      statusCode: statusCode.toString(),
      userId: userId || 'anonymous',
      performanceCategory,
      timestamp: new Date().toISOString()
    };

    // Track response time distribution
    this.appInsights.trackMetric(`API.ResponseTime.${performanceCategory}`, duration, properties);
    
    // Track endpoint-specific metrics
    this.appInsights.trackMetric(`API.${endpoint.replace(/\//g, '.')}.ResponseTime`, duration, properties);
    
    // Track business metrics if available
    if (data && typeof data === 'object') {
      this.trackBusinessMetrics(endpoint, method, data, properties);
    }

    // Log performance warnings
    if (performanceCategory !== 'normal') {
      this.logger.warn(`${performanceCategory.toUpperCase()} performance detected`, {
        ...properties,
        duration: `${duration}ms`
      });
    }
  }

  private trackErrorPerformance(
    request: Request,
    response: Response,
    duration: number,
    error: any,
    correlationId: string
  ): void {
    const method = request.method;
    const url = request.url;
    const statusCode = response.statusCode || 500;
    const userId = (request as any).user?.id;

    this.appInsights.trackEvent('API.Error.Performance', {
      correlationId,
      endpoint: this.sanitizeUrl(url),
      method,
      statusCode: statusCode.toString(),
      duration: duration.toString(),
      userId: userId || 'anonymous',
      errorType: error.constructor.name,
      errorMessage: error.message
    });
  }

  private trackBusinessMetrics(endpoint: string, method: string, data: any, properties: any): void {
    // Track data size metrics
    const dataSize = JSON.stringify(data).length;
    this.appInsights.trackMetric('API.ResponseSize', dataSize, properties);

    // Track specific business metrics based on endpoint
    if (endpoint.includes('/content') && method === 'POST') {
      this.appInsights.trackBusinessMetric({
        name: 'ContentCreated',
        value: 1,
        category: 'content',
        properties
      });
    }

    if (endpoint.includes('/analytics') && data?.insights) {
      this.appInsights.trackBusinessMetric({
        name: 'InsightsGenerated',
        value: Array.isArray(data.insights) ? data.insights.length : 1,
        category: 'analytics',
        properties
      });
    }
  }

  private getOrCreateCorrelationId(request: Request, response: Response): string {
    let correlationId = request.get('x-correlation-id');
    
    if (!correlationId) {
      correlationId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    }
    
    response.setHeader('x-correlation-id', correlationId);
    return correlationId;
  }

  private sanitizeUrl(url: string): string {
    const urlParts = url.split('?');
    let cleanUrl = urlParts[0];

    // Replace dynamic segments with placeholders
    cleanUrl = cleanUrl.replace(/\/\d+/g, '/{id}');
    cleanUrl = cleanUrl.replace(/\/[a-f0-9-]{36}/g, '/{uuid}');
    cleanUrl = cleanUrl.replace(/\/[a-f0-9]{24}/g, '/{objectId}');

    return cleanUrl;
  }
}
