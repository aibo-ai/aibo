import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { SecurityMonitoringService } from '../services/security-monitoring.service';
import { ComplianceMonitoringService } from '../services/compliance-monitoring.service';

interface SecurityRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
  securityContext?: {
    correlationId: string;
    riskScore: number;
    flags: string[];
  };
}

@Injectable()
export class SecurityMonitoringMiddleware implements NestMiddleware {
  private readonly logger = new Logger(SecurityMonitoringMiddleware.name);

  constructor(
    private readonly securityMonitoring: SecurityMonitoringService,
    private readonly complianceMonitoring: ComplianceMonitoringService
  ) {}

  use(req: SecurityRequest, res: Response, next: NextFunction): void {
    const startTime = Date.now();
    const correlationId = this.generateCorrelationId();
    const that = this;
    
    // Add security context to request
    req.securityContext = {
      correlationId,
      riskScore: 0,
      flags: []
    };

    // Extract security-relevant information
    const ipAddress = this.getClientIpAddress(req);
    const userAgent = req.get('User-Agent') || '';
    const userId = req.user?.id || 'anonymous';
    const method = req.method;
    const endpoint = req.path;

    // Perform initial security checks
    this.performSecurityChecks(req, ipAddress, userAgent);

    // Override res.end to capture response information
    const originalEnd = res.end;
    res.end = function(chunk?: any, encoding?: any): any {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;

      // Track API security event
      that.securityMonitoring.trackApiSecurityEvent(
        endpoint,
        method,
        statusCode,
        userId,
        ipAddress,
        userAgent,
        {
          correlationId,
          duration,
          riskScore: req.securityContext?.riskScore,
          flags: req.securityContext?.flags
        }
      );

      // Track specific security events based on response
      if (statusCode === 401) {
        that.securityMonitoring.trackAuthenticationEvent(
          'login_failure',
          userId,
          ipAddress,
          userAgent,
          { endpoint, method, correlationId }
        );
      }

      if (statusCode === 403) {
        that.securityMonitoring.trackSecurityEvent({
          eventType: 'access_denied',
          severity: 'medium',
          description: `Access denied to ${method} ${endpoint}`,
          userId,
          ipAddress,
          userAgent,
          endpoint,
          method,
          statusCode,
          timestamp: new Date(),
          metadata: { correlationId, duration }
        });
      }

      // Track data access for compliance
      if (statusCode >= 200 && statusCode < 300) {
        that.trackDataAccessForCompliance(req, userId, ipAddress);
      }

      // Call original end method
      return originalEnd.call(this, chunk, encoding);
    };

    next();
  }

  /**
   * Perform initial security checks
   */
  private performSecurityChecks(req: SecurityRequest, ipAddress: string, userAgent: string): void {
    let riskScore = 0;
    const flags: string[] = [];

    // Check for suspicious user agents
    if (this.isSuspiciousUserAgent(userAgent)) {
      riskScore += 30;
      flags.push('suspicious_user_agent');
    }

    // Check for suspicious IP addresses
    if (this.isSuspiciousIpAddress(ipAddress)) {
      riskScore += 50;
      flags.push('suspicious_ip');
    }

    // Check for suspicious endpoints
    if (this.isSuspiciousEndpoint(req.path)) {
      riskScore += 40;
      flags.push('suspicious_endpoint');
    }

    // Check for SQL injection patterns
    if (this.hasSqlInjectionPatterns(req)) {
      riskScore += 80;
      flags.push('sql_injection_attempt');
    }

    // Check for XSS patterns
    if (this.hasXssPatterns(req)) {
      riskScore += 70;
      flags.push('xss_attempt');
    }

    // Check for excessive request size
    if (this.hasExcessiveRequestSize(req)) {
      riskScore += 20;
      flags.push('large_request');
    }

    // Update security context
    if (req.securityContext) {
      req.securityContext.riskScore = riskScore;
      req.securityContext.flags = flags;
    }

    // Log high-risk requests
    if (riskScore > 50) {
      this.logger.warn(`High-risk request detected`, {
        correlationId: req.securityContext?.correlationId,
        riskScore,
        flags,
        endpoint: req.path,
        method: req.method,
        ipAddress,
        userAgent
      });

      this.securityMonitoring.trackSecurityEvent({
        eventType: 'high_risk_request',
        severity: riskScore > 80 ? 'critical' : 'high',
        description: `High-risk request detected with score ${riskScore}`,
        userId: req.user?.id || 'anonymous',
        ipAddress,
        userAgent,
        endpoint: req.path,
        method: req.method,
        timestamp: new Date(),
        metadata: {
          riskScore,
          flags,
          correlationId: req.securityContext?.correlationId
        }
      });
    }
  }

  /**
   * Track data access for compliance monitoring
   */
  private trackDataAccessForCompliance(req: SecurityRequest, userId: string, ipAddress: string): void {
    const endpoint = req.path;
    const method = req.method;

    // Determine data type based on endpoint
    let dataType = 'general';
    let isDataAccess = false;

    if (endpoint.includes('/users')) {
      dataType = 'user_data';
      isDataAccess = true;
    } else if (endpoint.includes('/content')) {
      dataType = 'content_data';
      isDataAccess = true;
    } else if (endpoint.includes('/analytics')) {
      dataType = 'analytics_data';
      isDataAccess = true;
    } else if (endpoint.includes('/export')) {
      dataType = 'exported_data';
      isDataAccess = true;
    }

    if (isDataAccess) {
      let action: 'read' | 'write' | 'delete' | 'export' = 'read';
      
      if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
        action = 'write';
      } else if (method === 'DELETE') {
        action = 'delete';
      } else if (endpoint.includes('/export')) {
        action = 'export';
      }

      this.securityMonitoring.trackDataAccessEvent(
        action,
        dataType,
        userId,
        ipAddress,
        true,
        {
          endpoint,
          method,
          correlationId: req.securityContext?.correlationId
        }
      );

      // Track GDPR event for personal data access
      if (dataType === 'user_data' && userId !== 'anonymous') {
        this.complianceMonitoring.trackGDPREvent({
          eventType: 'data_access',
          userId,
          dataType,
          legalBasis: 'legitimate_interests',
          timestamp: new Date(),
          metadata: {
            endpoint,
            method,
            correlationId: req.securityContext?.correlationId
          }
        });
      }
    }
  }

  /**
   * Get client IP address
   */
  private getClientIpAddress(req: Request): string {
    return (
      req.headers['x-forwarded-for'] as string ||
      req.headers['x-real-ip'] as string ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      'unknown'
    );
  }

  /**
   * Generate correlation ID
   */
  private generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Check for suspicious user agents
   */
  private isSuspiciousUserAgent(userAgent: string): boolean {
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scanner/i,
      /sqlmap/i,
      /nikto/i,
      /nmap/i,
      /curl/i,
      /wget/i,
      /python/i
    ];

    return suspiciousPatterns.some(pattern => pattern.test(userAgent));
  }

  /**
   * Check for suspicious IP addresses
   */
  private isSuspiciousIpAddress(ipAddress: string): boolean {
    // In a real implementation, this would check against:
    // - Known malicious IP databases
    // - Tor exit nodes
    // - VPN/proxy services
    // - Geographic restrictions
    
    // For now, just check for localhost and private IPs in production
    const isLocalhost = ipAddress === '127.0.0.1' || ipAddress === '::1';
    const isPrivate = /^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)/.test(ipAddress);
    
    // In production, localhost/private IPs might be suspicious
    return process.env.NODE_ENV === 'production' && (isLocalhost || isPrivate);
  }

  /**
   * Check for suspicious endpoints
   */
  private isSuspiciousEndpoint(endpoint: string): boolean {
    const suspiciousPatterns = [
      '/wp-admin',
      '/phpmyadmin',
      '/.env',
      '/config',
      '/backup',
      '/admin.php',
      '/login.php',
      '/.git',
      '/robots.txt',
      '/sitemap.xml'
    ];

    return suspiciousPatterns.some(pattern => 
      endpoint.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  /**
   * Check for SQL injection patterns
   */
  private hasSqlInjectionPatterns(req: Request): boolean {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
      /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
      /(\'|\"|;|--|\*|\|)/,
      /(\bUNION\b.*\bSELECT\b)/i
    ];

    const checkString = JSON.stringify(req.query) + JSON.stringify(req.body) + req.url;
    return sqlPatterns.some(pattern => pattern.test(checkString));
  }

  /**
   * Check for XSS patterns
   */
  private hasXssPatterns(req: Request): boolean {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe/i,
      /<object/i,
      /<embed/i
    ];

    const checkString = JSON.stringify(req.query) + JSON.stringify(req.body);
    return xssPatterns.some(pattern => pattern.test(checkString));
  }

  /**
   * Check for excessive request size
   */
  private hasExcessiveRequestSize(req: Request): boolean {
    const contentLength = parseInt(req.headers['content-length'] || '0');
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    return contentLength > maxSize;
  }
}
