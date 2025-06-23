import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApplicationInsightsService } from '../../../common/services/application-insights.service';

export interface RealtimeUpdate {
  jobId: string;
  type: 'status_change' | 'progress_update' | 'step_completed' | 'error' | 'result_ready';
  data: any;
  timestamp: string;
  userId?: string;
  projectId?: string;
}

export interface ConnectionInfo {
  connectionId: string;
  userId?: string;
  projectId?: string;
  subscribedJobs: Set<string>;
  connectedAt: string;
  lastActivity: string;
}

@Injectable()
export class RealtimeUpdatesService {
  private readonly logger = new Logger(RealtimeUpdatesService.name);
  private readonly connections = new Map<string, ConnectionInfo>();
  private readonly jobSubscriptions = new Map<string, Set<string>>(); // jobId -> connectionIds
  private readonly userConnections = new Map<string, Set<string>>(); // userId -> connectionIds

  constructor(
    private readonly configService: ConfigService,
    private readonly appInsights: ApplicationInsightsService
  ) {
    this.initializeCleanupScheduler();
  }

  /**
   * Register new connection
   */
  async registerConnection(connectionId: string, userId?: string, projectId?: string): Promise<void> {
    const connectionInfo: ConnectionInfo = {
      connectionId,
      userId,
      projectId,
      subscribedJobs: new Set(),
      connectedAt: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    };

    this.connections.set(connectionId, connectionInfo);

    // Track user connections
    if (userId) {
      if (!this.userConnections.has(userId)) {
        this.userConnections.set(userId, new Set());
      }
      this.userConnections.get(userId)!.add(connectionId);
    }

    this.logger.log(`Connection registered: ${connectionId} (user: ${userId})`);
    
    this.appInsights.trackEvent('RealtimeUpdates:ConnectionRegistered', {
      connectionId,
      userId,
      projectId
    });
  }

  /**
   * Unregister connection
   */
  async unregisterConnection(connectionId: string): Promise<void> {
    const connection = this.connections.get(connectionId);
    
    if (!connection) {
      return;
    }

    // Remove from job subscriptions
    for (const jobId of connection.subscribedJobs) {
      const subscribers = this.jobSubscriptions.get(jobId);
      if (subscribers) {
        subscribers.delete(connectionId);
        if (subscribers.size === 0) {
          this.jobSubscriptions.delete(jobId);
        }
      }
    }

    // Remove from user connections
    if (connection.userId) {
      const userConns = this.userConnections.get(connection.userId);
      if (userConns) {
        userConns.delete(connectionId);
        if (userConns.size === 0) {
          this.userConnections.delete(connection.userId);
        }
      }
    }

    this.connections.delete(connectionId);

    this.logger.log(`Connection unregistered: ${connectionId}`);
    
    this.appInsights.trackEvent('RealtimeUpdates:ConnectionUnregistered', {
      connectionId,
      userId: connection.userId,
      duration: Date.now() - new Date(connection.connectedAt).getTime()
    });
  }

  /**
   * Subscribe connection to job updates
   */
  async subscribeToJob(connectionId: string, jobId: string): Promise<void> {
    const connection = this.connections.get(connectionId);
    
    if (!connection) {
      throw new Error(`Connection not found: ${connectionId}`);
    }

    connection.subscribedJobs.add(jobId);
    connection.lastActivity = new Date().toISOString();

    // Add to job subscriptions
    if (!this.jobSubscriptions.has(jobId)) {
      this.jobSubscriptions.set(jobId, new Set());
    }
    this.jobSubscriptions.get(jobId)!.add(connectionId);

    this.logger.debug(`Connection ${connectionId} subscribed to job ${jobId}`);
    
    this.appInsights.trackEvent('RealtimeUpdates:JobSubscribed', {
      connectionId,
      jobId,
      userId: connection.userId
    });
  }

  /**
   * Unsubscribe connection from job updates
   */
  async unsubscribeFromJob(connectionId: string, jobId: string): Promise<void> {
    const connection = this.connections.get(connectionId);
    
    if (!connection) {
      return;
    }

    connection.subscribedJobs.delete(jobId);
    connection.lastActivity = new Date().toISOString();

    // Remove from job subscriptions
    const subscribers = this.jobSubscriptions.get(jobId);
    if (subscribers) {
      subscribers.delete(connectionId);
      if (subscribers.size === 0) {
        this.jobSubscriptions.delete(jobId);
      }
    }

    this.logger.debug(`Connection ${connectionId} unsubscribed from job ${jobId}`);
    
    this.appInsights.trackEvent('RealtimeUpdates:JobUnsubscribed', {
      connectionId,
      jobId,
      userId: connection.userId
    });
  }

  /**
   * Send job status update
   */
  async sendJobStatusUpdate(jobId: string, status: string, message?: string, data?: any): Promise<void> {
    const update: RealtimeUpdate = {
      jobId,
      type: 'status_change',
      data: {
        status,
        message,
        ...data
      },
      timestamp: new Date().toISOString()
    };

    await this.sendUpdateToJobSubscribers(jobId, update);
  }

  /**
   * Send job progress update
   */
  async sendJobProgressUpdate(jobId: string, progress: any): Promise<void> {
    const update: RealtimeUpdate = {
      jobId,
      type: 'progress_update',
      data: progress,
      timestamp: new Date().toISOString()
    };

    await this.sendUpdateToJobSubscribers(jobId, update);
  }

  /**
   * Send step completion update
   */
  async sendStepCompletedUpdate(jobId: string, stepName: string, stepResult?: any): Promise<void> {
    const update: RealtimeUpdate = {
      jobId,
      type: 'step_completed',
      data: {
        stepName,
        stepResult,
        completedAt: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    };

    await this.sendUpdateToJobSubscribers(jobId, update);
  }

  /**
   * Send error update
   */
  async sendErrorUpdate(jobId: string, error: string, stepName?: string): Promise<void> {
    const update: RealtimeUpdate = {
      jobId,
      type: 'error',
      data: {
        error,
        stepName,
        errorAt: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    };

    await this.sendUpdateToJobSubscribers(jobId, update);
  }

  /**
   * Send result ready update
   */
  async sendResultReadyUpdate(jobId: string, result: any): Promise<void> {
    const update: RealtimeUpdate = {
      jobId,
      type: 'result_ready',
      data: {
        result,
        completedAt: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    };

    await this.sendUpdateToJobSubscribers(jobId, update);
  }

  /**
   * Send update to all subscribers of a job
   */
  private async sendUpdateToJobSubscribers(jobId: string, update: RealtimeUpdate): Promise<void> {
    const subscribers = this.jobSubscriptions.get(jobId);
    
    if (!subscribers || subscribers.size === 0) {
      this.logger.debug(`No subscribers for job ${jobId}`);
      return;
    }

    const promises = Array.from(subscribers).map(connectionId => 
      this.sendUpdateToConnection(connectionId, update)
    );

    await Promise.allSettled(promises);

    this.logger.debug(`Sent update to ${subscribers.size} subscribers for job ${jobId}`);
    
    this.appInsights.trackEvent('RealtimeUpdates:UpdateSent', {
      jobId,
      updateType: update.type,
      subscriberCount: subscribers.size
    });
  }

  /**
   * Send update to specific connection
   */
  private async sendUpdateToConnection(connectionId: string, update: RealtimeUpdate): Promise<void> {
    try {
      const connection = this.connections.get(connectionId);
      
      if (!connection) {
        this.logger.warn(`Connection not found: ${connectionId}`);
        return;
      }

      // Update last activity
      connection.lastActivity = new Date().toISOString();

      // In a real implementation, this would use SignalR or WebSocket to send the update
      // For now, we'll simulate the sending
      this.logger.debug(`Sending update to connection ${connectionId}:`, update);

      // Simulate SignalR hub method call
      await this.simulateSignalRSend(connectionId, 'JobUpdate', update);

    } catch (error) {
      this.logger.error(`Failed to send update to connection ${connectionId}:`, error.message);
      
      // Remove failed connection
      await this.unregisterConnection(connectionId);
    }
  }

  /**
   * Simulate SignalR send (in production, this would be actual SignalR)
   */
  private async simulateSignalRSend(connectionId: string, method: string, data: any): Promise<void> {
    // In production, this would be:
    // await this.signalRService.sendToConnection(connectionId, method, data);
    
    this.logger.debug(`[SignalR] ${connectionId} -> ${method}:`, JSON.stringify(data, null, 2));
  }

  /**
   * Get connection statistics
   */
  async getConnectionStatistics(): Promise<any> {
    const totalConnections = this.connections.size;
    const activeJobs = this.jobSubscriptions.size;
    const userCount = this.userConnections.size;

    // Calculate connection distribution
    const connectionsByUser = Array.from(this.userConnections.entries()).map(([userId, connections]) => ({
      userId,
      connectionCount: connections.size
    }));

    // Calculate job subscription distribution
    const jobSubscriptionCounts = Array.from(this.jobSubscriptions.entries()).map(([jobId, subscribers]) => ({
      jobId,
      subscriberCount: subscribers.size
    }));

    return {
      totalConnections,
      activeJobs,
      userCount,
      connectionsByUser,
      jobSubscriptionCounts,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get connections for a specific user
   */
  async getUserConnections(userId: string): Promise<ConnectionInfo[]> {
    const connectionIds = this.userConnections.get(userId);
    
    if (!connectionIds) {
      return [];
    }

    return Array.from(connectionIds)
      .map(id => this.connections.get(id))
      .filter(conn => conn !== undefined) as ConnectionInfo[];
  }

  /**
   * Send update to all connections of a user
   */
  async sendUpdateToUser(userId: string, update: RealtimeUpdate): Promise<void> {
    const connectionIds = this.userConnections.get(userId);
    
    if (!connectionIds || connectionIds.size === 0) {
      return;
    }

    const promises = Array.from(connectionIds).map(connectionId => 
      this.sendUpdateToConnection(connectionId, update)
    );

    await Promise.allSettled(promises);

    this.logger.debug(`Sent update to ${connectionIds.size} connections for user ${userId}`);
  }

  /**
   * Initialize cleanup scheduler
   */
  private initializeCleanupScheduler(): void {
    // Clean up inactive connections every 5 minutes
    setInterval(() => {
      this.cleanupInactiveConnections().catch(error => {
        this.logger.error(`Connection cleanup failed: ${error.message}`, error.stack);
      });
    }, 5 * 60 * 1000);
  }

  /**
   * Clean up inactive connections
   */
  private async cleanupInactiveConnections(): Promise<void> {
    const inactiveThreshold = 30 * 60 * 1000; // 30 minutes
    const now = Date.now();
    let cleanedCount = 0;

    for (const [connectionId, connection] of this.connections.entries()) {
      const lastActivity = new Date(connection.lastActivity).getTime();
      
      if (now - lastActivity > inactiveThreshold) {
        await this.unregisterConnection(connectionId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.log(`Cleaned up ${cleanedCount} inactive connections`);
      
      this.appInsights.trackEvent('RealtimeUpdates:ConnectionsCleanedUp', {
        cleanedCount,
        remainingConnections: this.connections.size
      });
    }
  }
}
