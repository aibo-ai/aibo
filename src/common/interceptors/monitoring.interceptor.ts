import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { PerformanceMonitoringService } from '../services/performance-monitoring.service';
import { ApplicationInsightsService } from '../services/application-insights.service';

@Injectable()
export class MonitoringInterceptor implements NestInterceptor {
  private readonly logger = new Logger(MonitoringInterceptor.name);

  constructor(
    private readonly performanceMonitoring: PerformanceMonitoringService,
    private readonly appInsights: ApplicationInsightsService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = Date.now();
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    
    const { method, url, headers, body, query, params } = request;
    const userAgent = headers['user-agent'] || 'unknown';
    const clientIp = this.getClientIp(request);
    const correlationId = this.generateCorrelationId();
    
    // Add correlation ID to request for tracing
    request['correlationId'] = correlationId;
    response.setHeader('X-Correlation-ID', correlationId);

    // Track request start
    this.appInsights.trackRequest({
      name: `${method} ${url}`,
      url: url,
      duration: 0, // Will be updated on completion
      resultCode: 0, // Will be updated on completion
      success: true, // Will be updated on completion
      properties: {
        correlationId,
        userAgent,
        clientIp,
        method,
        query: JSON.stringify(query),
        params: JSON.stringify(params),
      },
    });

    // Log request details
    this.logger.log(
      `Incoming ${method} ${url} - Correlation ID: ${correlationId} - IP: ${clientIp}`,
    );

    return next.handle().pipe(
      tap((data) => {
        const duration = Date.now() - startTime;
        const statusCode = response.statusCode;
        
        // Track successful request
        this.performanceMonitoring.trackHttpRequest(
          method,
          this.sanitizeRoute(url),
          statusCode,
          duration / 1000, // Convert to seconds
        );

        // Track in Application Insights
        this.appInsights.trackRequest({
          name: `${method} ${url}`,
          url: url,
          duration: duration,
          resultCode: statusCode,
          success: statusCode < 400,
          properties: {
            correlationId,
            userAgent,
            clientIp,
            method,
            responseSize: this.getResponseSize(data),
            processingTime: duration,
          },
        });

        // Track custom metrics
        this.trackCustomMetrics(request, response, duration, data);

        // Log successful completion
        this.logger.log(
          `Completed ${method} ${url} - ${statusCode} - ${duration}ms - Correlation ID: ${correlationId}`,
        );
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        const statusCode = error.status || 500;
        
        // Track failed request
        this.performanceMonitoring.trackHttpRequest(
          method,
          this.sanitizeRoute(url),
          statusCode,
          duration / 1000,
        );

        // Track error in Application Insights
        this.appInsights.trackException(error, {
          correlationId,
          userAgent,
          clientIp,
          method,
          url,
          statusCode: statusCode.toString(),
          processingTime: duration,
          requestBody: this.sanitizeRequestBody(body),
        });

        // Track request with error
        this.appInsights.trackRequest({
          name: `${method} ${url}`,
          url: url,
          duration: duration,
          resultCode: statusCode,
          success: false,
          properties: {
            correlationId,
            error: error.message,
            stack: error.stack,
          },
        });

        // Update error rate
        this.performanceMonitoring.updateErrorRate('api', this.calculateErrorRate());

        // Log error
        this.logger.error(
          `Failed ${method} ${url} - ${statusCode} - ${duration}ms - Correlation ID: ${correlationId}`,
          error.stack,
        );

        throw error;
      }),
    );
  }

  private getClientIp(request: Request): string {
    return (
      request.headers['x-forwarded-for'] as string ||
      request.headers['x-real-ip'] as string ||
      request.connection.remoteAddress ||
      request.socket.remoteAddress ||
      'unknown'
    );
  }

  private generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private sanitizeRoute(url: string): string {
    // Remove query parameters and replace dynamic segments with placeholders
    const route = url.split('?')[0];
    
    // Replace UUIDs and numbers with placeholders
    return route
      .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id')
      .replace(/\/\d+/g, '/:id')
      .replace(/\/[a-f0-9]{24}/g, '/:id'); // MongoDB ObjectId
  }

  private getResponseSize(data: any): number {
    if (!data) return 0;
    
    try {
      return JSON.stringify(data).length;
    } catch {
      return 0;
    }
  }

  private sanitizeRequestBody(body: any): string {
    if (!body) return '';
    
    try {
      // Remove sensitive fields
      const sanitized = { ...body };
      const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
      
      sensitiveFields.forEach(field => {
        if (sanitized[field]) {
          sanitized[field] = '[REDACTED]';
        }
      });
      
      return JSON.stringify(sanitized);
    } catch {
      return '[INVALID_JSON]';
    }
  }

  private trackCustomMetrics(
    request: Request,
    response: Response,
    duration: number,
    data: any,
  ): void {
    const route = this.sanitizeRoute(request.url);
    
    // Track API endpoint usage
    this.appInsights.trackEvent('APIEndpointUsage', {
      endpoint: route,
      method: request.method,
      statusCode: response.statusCode.toString(),
      duration: duration.toString(),
      userAgent: request.headers['user-agent'] || 'unknown',
    });

    // Track slow requests
    if (duration > 5000) { // 5 seconds
      this.appInsights.trackEvent('SlowRequest', {
        endpoint: route,
        method: request.method,
        duration: duration.toString(),
        threshold: '5000ms',
      });
    }

    // Track large responses
    const responseSize = this.getResponseSize(data);
    if (responseSize > 1024 * 1024) { // 1MB
      this.appInsights.trackEvent('LargeResponse', {
        endpoint: route,
        method: request.method,
        size: responseSize.toString(),
        threshold: '1MB',
      });
    }

    // Track specific business operations
    this.trackBusinessOperations(request, response, data);
  }

  private trackBusinessOperations(
    request: Request,
    response: Response,
    data: any,
  ): void {
    const route = this.sanitizeRoute(request.url);
    
    // Track content generation
    if (route.includes('/content') && request.method === 'POST') {
      const status = response.statusCode < 400 ? 'success' : 'failure';
      this.performanceMonitoring.trackContentGeneration('article', status);
    }

    // Track citation verification
    if (route.includes('/citations/verify') && request.method === 'POST') {
      const status = response.statusCode < 400 ? 'verified' : 'failed';
      this.performanceMonitoring.trackCitationVerification(status, 'web');
    }

    // Track fact checking
    if (route.includes('/fact-check') && request.method === 'POST') {
      if (response.statusCode < 400 && data?.result) {
        this.performanceMonitoring.trackFactCheck(
          data.result,
          data.confidence || 'medium',
        );
      }
    }

    // Track search operations
    if (route.includes('/search') && request.method === 'GET') {
      this.appInsights.trackEvent('SearchPerformed', {
        query: request.query.q as string || '',
        resultsCount: data?.results?.length?.toString() || '0',
        searchType: request.query.type as string || 'general',
      });
    }

    // Track user authentication
    if (route.includes('/auth') && request.method === 'POST') {
      const operation = route.includes('/login') ? 'login' : 
                      route.includes('/register') ? 'register' : 'auth';
      const success = response.statusCode < 400;
      
      this.appInsights.trackEvent('UserAuthentication', {
        operation,
        success: success.toString(),
        method: request.body?.method || 'email',
      });
    }
  }

  private calculateErrorRate(): number {
    // This is a simplified calculation
    // In a real implementation, you'd track this over a time window
    return 0; // Placeholder
  }
}
