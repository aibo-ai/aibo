import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApplicationInsightsService } from './application-insights.service';
import * as crypto from 'crypto';

export interface SecurityEvent {
  eventType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ComplianceEvent {
  eventType: string;
  regulation: 'GDPR' | 'CCPA' | 'SOX' | 'HIPAA' | 'PCI-DSS';
  action: string;
  dataType?: string;
  userId?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface AuditEvent {
  eventType: string;
  action: string;
  resource: string;
  userId: string;
  userRole?: string;
  ipAddress?: string;
  timestamp: Date;
  success: boolean;
  details?: Record<string, any>;
}

@Injectable()
export class SecurityMonitoringService {
  private readonly logger = new Logger(SecurityMonitoringService.name);
  private readonly suspiciousActivityThresholds = {
    failedLoginAttempts: 5,
    timeWindowMinutes: 15,
    maxRequestsPerMinute: 100,
    maxDataExportMB: 100
  };

  constructor(
    private readonly configService: ConfigService,
    private readonly appInsights: ApplicationInsightsService
  ) {}

  /**
   * Track security events
   */
  trackSecurityEvent(event: SecurityEvent): void {
    try {
      // Log security event
      this.logger.warn(`Security Event: ${event.eventType}`, {
        severity: event.severity,
        description: event.description,
        userId: event.userId,
        ipAddress: event.ipAddress,
        endpoint: event.endpoint,
        timestamp: event.timestamp.toISOString()
      });

      // Track in Application Insights
      this.appInsights.trackSecurityEvent({
        eventType: event.eventType,
        severity: event.severity,
        description: event.description,
        userId: event.userId,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        properties: {
          endpoint: event.endpoint,
          method: event.method,
          statusCode: event.statusCode?.toString(),
          ...event.metadata
        }
      });

      // Check for patterns that indicate attacks
      this.analyzeSecurityPattern(event);

      // Trigger immediate response for critical events
      if (event.severity === 'critical') {
        this.triggerSecurityIncident(event);
      }

    } catch (error) {
      this.logger.error('Failed to track security event', error.stack);
    }
  }

  /**
   * Track compliance events
   */
  trackComplianceEvent(event: ComplianceEvent): void {
    try {
      this.logger.log(`Compliance Event: ${event.eventType}`, {
        regulation: event.regulation,
        action: event.action,
        dataType: event.dataType,
        userId: event.userId,
        timestamp: event.timestamp.toISOString()
      });

      this.appInsights.trackEvent(`Compliance.${event.regulation}.${event.eventType}`, {
        regulation: event.regulation,
        action: event.action,
        dataType: event.dataType,
        userId: event.userId,
        timestamp: event.timestamp.toISOString(),
        ...event.metadata
      });

    } catch (error) {
      this.logger.error('Failed to track compliance event', error.stack);
    }
  }

  /**
   * Track audit events
   */
  trackAuditEvent(event: AuditEvent): void {
    try {
      this.logger.log(`Audit Event: ${event.eventType}`, {
        action: event.action,
        resource: event.resource,
        userId: event.userId,
        userRole: event.userRole,
        ipAddress: event.ipAddress,
        success: event.success,
        timestamp: event.timestamp.toISOString()
      });

      this.appInsights.trackEvent(`Audit.${event.eventType}`, {
        action: event.action,
        resource: event.resource,
        userId: event.userId,
        userRole: event.userRole,
        ipAddress: event.ipAddress,
        success: event.success.toString(),
        timestamp: event.timestamp.toISOString(),
        ...event.details
      });

    } catch (error) {
      this.logger.error('Failed to track audit event', error.stack);
    }
  }

  /**
   * Track authentication events
   */
  trackAuthenticationEvent(
    eventType: 'login_success' | 'login_failure' | 'logout' | 'password_change' | 'account_locked',
    userId: string,
    ipAddress: string,
    userAgent?: string,
    metadata?: Record<string, any>
  ): void {
    const event: SecurityEvent = {
      eventType: `authentication.${eventType}`,
      severity: eventType === 'login_failure' ? 'medium' : 'low',
      description: `User authentication event: ${eventType}`,
      userId,
      ipAddress,
      userAgent,
      timestamp: new Date(),
      metadata
    };

    this.trackSecurityEvent(event);

    // Track failed login attempts for brute force detection
    if (eventType === 'login_failure') {
      this.trackFailedLoginAttempt(userId, ipAddress);
    }
  }

  /**
   * Track data access events
   */
  trackDataAccessEvent(
    action: 'read' | 'write' | 'delete' | 'export',
    dataType: string,
    userId: string,
    ipAddress: string,
    success: boolean,
    metadata?: Record<string, any>
  ): void {
    // Track as audit event
    const auditEvent: AuditEvent = {
      eventType: 'data_access',
      action,
      resource: dataType,
      userId,
      ipAddress,
      timestamp: new Date(),
      success,
      details: metadata
    };

    this.trackAuditEvent(auditEvent);

    // Track as compliance event for sensitive data
    if (this.isSensitiveData(dataType)) {
      const complianceEvent: ComplianceEvent = {
        eventType: 'sensitive_data_access',
        regulation: 'GDPR',
        action,
        dataType,
        userId,
        timestamp: new Date(),
        metadata
      };

      this.trackComplianceEvent(complianceEvent);
    }
  }

  /**
   * Track API security events
   */
  trackApiSecurityEvent(
    endpoint: string,
    method: string,
    statusCode: number,
    userId: string,
    ipAddress: string,
    userAgent?: string,
    metadata?: Record<string, any>
  ): void {
    let severity: SecurityEvent['severity'] = 'low';
    let eventType = 'api_access';

    // Determine severity based on status code and endpoint
    if (statusCode === 401) {
      severity = 'medium';
      eventType = 'unauthorized_access';
    } else if (statusCode === 403) {
      severity = 'medium';
      eventType = 'forbidden_access';
    } else if (statusCode >= 500) {
      severity = 'high';
      eventType = 'api_error';
    } else if (this.isSensitiveEndpoint(endpoint)) {
      severity = 'medium';
      eventType = 'sensitive_api_access';
    }

    const event: SecurityEvent = {
      eventType,
      severity,
      description: `API ${method} ${endpoint} - ${statusCode}`,
      userId,
      ipAddress,
      userAgent,
      endpoint,
      method,
      statusCode,
      timestamp: new Date(),
      metadata
    };

    this.trackSecurityEvent(event);
  }

  /**
   * Analyze security patterns for potential threats
   */
  private analyzeSecurityPattern(event: SecurityEvent): void {
    // This would typically involve more sophisticated analysis
    // For now, we'll implement basic pattern detection

    if (event.eventType.includes('login_failure') && event.ipAddress) {
      this.checkBruteForcePattern(event.ipAddress);
    }

    if (event.eventType.includes('unauthorized_access')) {
      this.checkUnauthorizedAccessPattern(event.userId, event.ipAddress);
    }

    if (event.endpoint && this.isSuspiciousEndpoint(event.endpoint)) {
      this.trackSuspiciousEndpointAccess(event);
    }
  }

  /**
   * Check for brute force attack patterns
   */
  private checkBruteForcePattern(ipAddress: string): void {
    // In a real implementation, this would check a cache/database
    // for recent failed attempts from this IP
    
    this.appInsights.trackEvent('Security.BruteForceCheck', {
      ipAddress,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Check for unauthorized access patterns
   */
  private checkUnauthorizedAccessPattern(userId?: string, ipAddress?: string): void {
    this.appInsights.trackEvent('Security.UnauthorizedAccessPattern', {
      userId,
      ipAddress,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Track failed login attempts
   */
  private trackFailedLoginAttempt(userId: string, ipAddress: string): void {
    this.appInsights.trackMetric('Security.FailedLoginAttempts', 1, {
      userId,
      ipAddress,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Track suspicious endpoint access
   */
  private trackSuspiciousEndpointAccess(event: SecurityEvent): void {
    this.appInsights.trackEvent('Security.SuspiciousEndpointAccess', {
      endpoint: event.endpoint,
      userId: event.userId,
      ipAddress: event.ipAddress,
      timestamp: event.timestamp.toISOString()
    });
  }

  /**
   * Trigger security incident response
   */
  private triggerSecurityIncident(event: SecurityEvent): void {
    this.logger.error(`SECURITY INCIDENT: ${event.eventType}`, {
      severity: event.severity,
      description: event.description,
      userId: event.userId,
      ipAddress: event.ipAddress,
      timestamp: event.timestamp.toISOString()
    });

    // Track as critical exception in Application Insights
    this.appInsights.trackException(
      new Error(`Security Incident: ${event.description}`),
      {
        eventType: event.eventType,
        severity: event.severity,
        userId: event.userId,
        ipAddress: event.ipAddress,
        incident: 'true'
      }
    );

    // In a real implementation, this would trigger:
    // - Automated incident response
    // - Notifications to security team
    // - Temporary IP blocking if needed
    // - Account suspension if needed
  }

  /**
   * Check if data type is considered sensitive
   */
  private isSensitiveData(dataType: string): boolean {
    const sensitiveDataTypes = [
      'user_personal_data',
      'payment_information',
      'authentication_credentials',
      'api_keys',
      'private_content'
    ];

    return sensitiveDataTypes.some(type => 
      dataType.toLowerCase().includes(type.toLowerCase())
    );
  }

  /**
   * Check if endpoint is considered sensitive
   */
  private isSensitiveEndpoint(endpoint: string): boolean {
    const sensitiveEndpoints = [
      '/admin',
      '/api/users',
      '/api/auth',
      '/api/payments',
      '/api/analytics',
      '/api/export'
    ];

    return sensitiveEndpoints.some(path => 
      endpoint.toLowerCase().includes(path.toLowerCase())
    );
  }

  /**
   * Check if endpoint access is suspicious
   */
  private isSuspiciousEndpoint(endpoint: string): boolean {
    const suspiciousPatterns = [
      '/wp-admin',
      '/phpmyadmin',
      '/.env',
      '/config',
      '/backup',
      '/admin.php',
      '/login.php'
    ];

    return suspiciousPatterns.some(pattern => 
      endpoint.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  /**
   * Generate security report
   */
  async generateSecurityReport(
    startDate: Date,
    endDate: Date
  ): Promise<{
    summary: {
      totalEvents: number;
      criticalEvents: number;
      highSeverityEvents: number;
      mediumSeverityEvents: number;
      lowSeverityEvents: number;
    };
    topThreats: Array<{
      type: string;
      count: number;
      severity: string;
    }>;
    complianceEvents: Array<{
      regulation: string;
      eventCount: number;
    }>;
  }> {
    // In a real implementation, this would query the actual data
    // For now, return a mock report structure
    
    return {
      summary: {
        totalEvents: 0,
        criticalEvents: 0,
        highSeverityEvents: 0,
        mediumSeverityEvents: 0,
        lowSeverityEvents: 0
      },
      topThreats: [],
      complianceEvents: []
    };
  }

  /**
   * Hash sensitive data for logging
   */
  hashSensitiveData(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 8);
  }
}
