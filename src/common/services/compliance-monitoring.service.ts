import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApplicationInsightsService } from './application-insights.service';
import { SecurityMonitoringService, ComplianceEvent } from './security-monitoring.service';

export interface GDPREvent {
  eventType: 'data_access' | 'data_export' | 'data_deletion' | 'consent_given' | 'consent_withdrawn';
  userId: string;
  dataSubject?: string;
  dataType: string;
  legalBasis: 'consent' | 'contract' | 'legal_obligation' | 'vital_interests' | 'public_task' | 'legitimate_interests';
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface DataRetentionEvent {
  eventType: 'data_created' | 'data_archived' | 'data_deleted' | 'retention_policy_applied';
  dataType: string;
  dataId: string;
  retentionPeriod: number; // in days
  createdAt: Date;
  scheduledDeletion?: Date;
  actualDeletion?: Date;
  metadata?: Record<string, any>;
}

export interface AccessControlEvent {
  eventType: 'permission_granted' | 'permission_revoked' | 'role_assigned' | 'role_removed';
  userId: string;
  targetUserId?: string;
  permission?: string;
  role?: string;
  resource?: string;
  grantedBy: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

@Injectable()
export class ComplianceMonitoringService {
  private readonly logger = new Logger(ComplianceMonitoringService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly appInsights: ApplicationInsightsService,
    private readonly securityMonitoring: SecurityMonitoringService
  ) {}

  /**
   * Track GDPR compliance events
   */
  trackGDPREvent(event: GDPREvent): void {
    try {
      this.logger.log(`GDPR Event: ${event.eventType}`, {
        userId: event.userId,
        dataSubject: event.dataSubject,
        dataType: event.dataType,
        legalBasis: event.legalBasis,
        timestamp: event.timestamp.toISOString()
      });

      // Track as compliance event
      const complianceEvent: ComplianceEvent = {
        eventType: event.eventType,
        regulation: 'GDPR',
        action: event.eventType,
        dataType: event.dataType,
        userId: event.userId,
        timestamp: event.timestamp,
        metadata: {
          dataSubject: event.dataSubject,
          legalBasis: event.legalBasis,
          ...event.metadata
        }
      };

      this.securityMonitoring.trackComplianceEvent(complianceEvent);

      // Track specific GDPR metrics
      this.appInsights.trackMetric(`GDPR.${event.eventType}`, 1, {
        dataType: event.dataType,
        legalBasis: event.legalBasis,
        timestamp: event.timestamp.toISOString()
      });

      // Check for compliance violations
      this.checkGDPRCompliance(event);

    } catch (error) {
      this.logger.error('Failed to track GDPR event', error.stack);
    }
  }

  /**
   * Track data retention events
   */
  trackDataRetentionEvent(event: DataRetentionEvent): void {
    try {
      this.logger.log(`Data Retention Event: ${event.eventType}`, {
        dataType: event.dataType,
        dataId: event.dataId,
        retentionPeriod: event.retentionPeriod,
        createdAt: event.createdAt.toISOString(),
        scheduledDeletion: event.scheduledDeletion?.toISOString(),
        actualDeletion: event.actualDeletion?.toISOString()
      });

      this.appInsights.trackEvent(`DataRetention.${event.eventType}`, {
        dataType: event.dataType,
        dataId: this.securityMonitoring.hashSensitiveData(event.dataId),
        retentionPeriod: event.retentionPeriod.toString(),
        createdAt: event.createdAt.toISOString(),
        scheduledDeletion: event.scheduledDeletion?.toISOString(),
        actualDeletion: event.actualDeletion?.toISOString(),
        ...event.metadata
      });

      // Check for retention policy violations
      this.checkRetentionCompliance(event);

    } catch (error) {
      this.logger.error('Failed to track data retention event', error.stack);
    }
  }

  /**
   * Track access control events
   */
  trackAccessControlEvent(event: AccessControlEvent): void {
    try {
      this.logger.log(`Access Control Event: ${event.eventType}`, {
        userId: event.userId,
        targetUserId: event.targetUserId,
        permission: event.permission,
        role: event.role,
        resource: event.resource,
        grantedBy: event.grantedBy,
        timestamp: event.timestamp.toISOString()
      });

      this.appInsights.trackEvent(`AccessControl.${event.eventType}`, {
        userId: event.userId,
        targetUserId: event.targetUserId,
        permission: event.permission,
        role: event.role,
        resource: event.resource,
        grantedBy: event.grantedBy,
        timestamp: event.timestamp.toISOString(),
        ...event.metadata
      });

      // Track as audit event
      this.securityMonitoring.trackAuditEvent({
        eventType: 'access_control_change',
        action: event.eventType,
        resource: event.resource || 'system',
        userId: event.grantedBy,
        timestamp: event.timestamp,
        success: true,
        details: {
          targetUserId: event.targetUserId,
          permission: event.permission,
          role: event.role
        }
      });

    } catch (error) {
      this.logger.error('Failed to track access control event', error.stack);
    }
  }

  /**
   * Track data processing consent
   */
  trackConsentEvent(
    userId: string,
    consentType: 'marketing' | 'analytics' | 'functional' | 'necessary',
    action: 'given' | 'withdrawn' | 'updated',
    metadata?: Record<string, any>
  ): void {
    const event: GDPREvent = {
      eventType: action === 'given' ? 'consent_given' : 'consent_withdrawn',
      userId,
      dataType: consentType,
      legalBasis: 'consent',
      timestamp: new Date(),
      metadata
    };

    this.trackGDPREvent(event);
  }

  /**
   * Track data subject rights requests
   */
  trackDataSubjectRightsRequest(
    requestType: 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction' | 'objection',
    userId: string,
    dataSubject: string,
    status: 'received' | 'processing' | 'completed' | 'rejected',
    metadata?: Record<string, any>
  ): void {
    this.logger.log(`Data Subject Rights Request: ${requestType}`, {
      userId,
      dataSubject,
      status,
      timestamp: new Date().toISOString()
    });

    this.appInsights.trackEvent(`GDPR.DataSubjectRights.${requestType}`, {
      userId,
      dataSubject: this.securityMonitoring.hashSensitiveData(dataSubject),
      status,
      requestType,
      timestamp: new Date().toISOString(),
      ...metadata
    });

    // Track compliance metrics
    this.appInsights.trackMetric(`GDPR.DataSubjectRights.${status}`, 1, {
      requestType,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Track data breach events
   */
  trackDataBreachEvent(
    breachType: 'confidentiality' | 'integrity' | 'availability',
    severity: 'low' | 'medium' | 'high' | 'critical',
    affectedRecords: number,
    dataTypes: string[],
    discoveredAt: Date,
    containedAt?: Date,
    metadata?: Record<string, any>
  ): void {
    this.logger.error(`Data Breach Detected: ${breachType}`, {
      severity,
      affectedRecords,
      dataTypes,
      discoveredAt: discoveredAt.toISOString(),
      containedAt: containedAt?.toISOString()
    });

    // Track as critical security event
    this.securityMonitoring.trackSecurityEvent({
      eventType: 'data_breach',
      severity: 'critical',
      description: `Data breach detected: ${breachType}`,
      timestamp: discoveredAt,
      metadata: {
        breachType,
        severity,
        affectedRecords,
        dataTypes: dataTypes.join(','),
        containedAt: containedAt?.toISOString(),
        ...metadata
      }
    });

    // Track GDPR compliance event
    this.trackGDPREvent({
      eventType: 'data_access', // Unauthorized access
      userId: 'system',
      dataType: dataTypes.join(','),
      legalBasis: 'legal_obligation',
      timestamp: discoveredAt,
      metadata: {
        breachType,
        severity,
        affectedRecords,
        containedAt: containedAt?.toISOString()
      }
    });

    // Check if breach notification is required
    this.checkBreachNotificationRequirement(severity, affectedRecords, dataTypes);
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(
    regulation: 'GDPR' | 'CCPA' | 'SOX' | 'HIPAA',
    startDate: Date,
    endDate: Date
  ): Promise<{
    regulation: string;
    period: { start: string; end: string };
    summary: {
      totalEvents: number;
      consentEvents: number;
      dataSubjectRights: number;
      dataBreaches: number;
      retentionEvents: number;
    };
    compliance: {
      score: number;
      violations: number;
      recommendations: string[];
    };
  }> {
    // In a real implementation, this would query actual data
    return {
      regulation,
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      summary: {
        totalEvents: 0,
        consentEvents: 0,
        dataSubjectRights: 0,
        dataBreaches: 0,
        retentionEvents: 0
      },
      compliance: {
        score: 95,
        violations: 0,
        recommendations: []
      }
    };
  }

  /**
   * Check GDPR compliance
   */
  private checkGDPRCompliance(event: GDPREvent): void {
    // Check for potential violations
    if (event.eventType === 'data_access' && event.legalBasis === 'consent') {
      // Verify consent is still valid
      this.verifyConsentValidity(event.userId, event.dataType);
    }

    if (event.eventType === 'data_export') {
      // Check if data export is within allowed limits
      this.checkDataExportLimits(event.userId, event.dataType);
    }
  }

  /**
   * Check retention compliance
   */
  private checkRetentionCompliance(event: DataRetentionEvent): void {
    if (event.eventType === 'data_created') {
      // Schedule deletion based on retention policy
      const deletionDate = new Date(event.createdAt);
      deletionDate.setDate(deletionDate.getDate() + event.retentionPeriod);
      
      this.logger.log(`Data scheduled for deletion`, {
        dataId: this.securityMonitoring.hashSensitiveData(event.dataId),
        scheduledDeletion: deletionDate.toISOString()
      });
    }

    if (event.scheduledDeletion && event.scheduledDeletion < new Date() && !event.actualDeletion) {
      // Data retention violation - data should have been deleted
      this.logger.warn(`Data retention violation detected`, {
        dataId: this.securityMonitoring.hashSensitiveData(event.dataId),
        scheduledDeletion: event.scheduledDeletion.toISOString()
      });

      this.appInsights.trackEvent('Compliance.RetentionViolation', {
        dataType: event.dataType,
        dataId: this.securityMonitoring.hashSensitiveData(event.dataId),
        scheduledDeletion: event.scheduledDeletion.toISOString(),
        violationDetected: new Date().toISOString()
      });
    }
  }

  /**
   * Verify consent validity
   */
  private verifyConsentValidity(userId: string, dataType: string): void {
    // In a real implementation, this would check the consent database
    this.appInsights.trackEvent('GDPR.ConsentVerification', {
      userId,
      dataType,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Check data export limits
   */
  private checkDataExportLimits(userId: string, dataType: string): void {
    // In a real implementation, this would check export frequency and volume
    this.appInsights.trackEvent('GDPR.DataExportCheck', {
      userId,
      dataType,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Check if breach notification is required
   */
  private checkBreachNotificationRequirement(
    severity: string,
    affectedRecords: number,
    dataTypes: string[]
  ): void {
    let notificationRequired = false;

    // GDPR requires notification within 72 hours for high-risk breaches
    if (severity === 'high' || severity === 'critical') {
      notificationRequired = true;
    }

    // Large number of affected records
    if (affectedRecords > 1000) {
      notificationRequired = true;
    }

    // Sensitive data types
    const sensitiveTypes = ['personal_data', 'financial_data', 'health_data'];
    if (dataTypes.some(type => sensitiveTypes.includes(type))) {
      notificationRequired = true;
    }

    if (notificationRequired) {
      this.logger.error('Breach notification required', {
        severity,
        affectedRecords,
        dataTypes,
        deadline: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString() // 72 hours
      });

      this.appInsights.trackEvent('Compliance.BreachNotificationRequired', {
        severity,
        affectedRecords: affectedRecords.toString(),
        dataTypes: dataTypes.join(','),
        deadline: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString()
      });
    }
  }
}
