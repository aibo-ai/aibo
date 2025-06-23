import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ServiceBusClient, ServiceBusSender, ServiceBusReceiver } from '@azure/service-bus';

export interface QueueMessage {
  jobId: string;
  type: string;
  data: any;
  priority?: 'low' | 'normal' | 'high';
  scheduledEnqueueTime?: Date;
  timeToLive?: number;
  correlationId?: string;
}

export interface QueueConfig {
  queueName: string;
  maxConcurrentCalls?: number;
  autoCompleteMessages?: boolean;
  maxAutoLockRenewalDuration?: number;
}

@Injectable()
export class AzureServiceBusService implements OnModuleDestroy {
  private readonly logger = new Logger(AzureServiceBusService.name);
  private serviceBusClient: ServiceBusClient;
  private senders: Map<string, ServiceBusSender> = new Map();
  private receivers: Map<string, ServiceBusReceiver> = new Map();
  private isInitialized = false;

  constructor(private configService: ConfigService) {
    this.initializeServiceBus();
  }

  private initializeServiceBus(): void {
    try {
      const connectionString = this.configService.get<string>('SERVICE_BUS_CONNECTION_STRING');
      
      if (!connectionString) {
        this.logger.warn('Service Bus connection string not configured');
        return;
      }

      this.serviceBusClient = new ServiceBusClient(connectionString);
      this.isInitialized = true;
      
      this.logger.log('Azure Service Bus initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Azure Service Bus:', error);
    }
  }

  /**
   * Send message to queue
   */
  async sendMessage(queueName: string, message: QueueMessage): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Service Bus not initialized');
    }

    try {
      let sender = this.senders.get(queueName);
      
      if (!sender) {
        sender = this.serviceBusClient.createSender(queueName);
        this.senders.set(queueName, sender);
      }

      const serviceBusMessage = {
        body: message,
        messageId: message.jobId,
        correlationId: message.correlationId,
        timeToLive: message.timeToLive,
        scheduledEnqueueTime: message.scheduledEnqueueTime,
        applicationProperties: {
          type: message.type,
          priority: message.priority || 'normal',
          timestamp: new Date().toISOString()
        }
      };

      await sender.sendMessages(serviceBusMessage);
      
      this.logger.log(`Message sent to queue ${queueName}: ${message.jobId}`);
    } catch (error) {
      this.logger.error(`Failed to send message to queue ${queueName}:`, error);
      throw error;
    }
  }

  /**
   * Send batch of messages to queue
   */
  async sendBatchMessages(queueName: string, messages: QueueMessage[]): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Service Bus not initialized');
    }

    try {
      let sender = this.senders.get(queueName);
      
      if (!sender) {
        sender = this.serviceBusClient.createSender(queueName);
        this.senders.set(queueName, sender);
      }

      const serviceBusMessages = messages.map(message => ({
        body: message,
        messageId: message.jobId,
        correlationId: message.correlationId,
        timeToLive: message.timeToLive,
        scheduledEnqueueTime: message.scheduledEnqueueTime,
        applicationProperties: {
          type: message.type,
          priority: message.priority || 'normal',
          timestamp: new Date().toISOString()
        }
      }));

      await sender.sendMessages(serviceBusMessages);
      
      this.logger.log(`Batch of ${messages.length} messages sent to queue ${queueName}`);
    } catch (error) {
      this.logger.error(`Failed to send batch messages to queue ${queueName}:`, error);
      throw error;
    }
  }

  /**
   * Schedule message for future delivery
   */
  async scheduleMessage(
    queueName: string, 
    message: QueueMessage, 
    scheduledTime: Date
  ): Promise<void> {
    message.scheduledEnqueueTime = scheduledTime;
    await this.sendMessage(queueName, message);
  }

  /**
   * Create receiver for queue
   */
  async createReceiver(
    queueName: string, 
    config: QueueConfig,
    messageHandler: (message: any) => Promise<void>
  ): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Service Bus not initialized');
    }

    try {
      const receiver = this.serviceBusClient.createReceiver(queueName, {
        receiveMode: config.autoCompleteMessages ? 'receiveAndDelete' : 'peekLock',
        maxAutoLockRenewalDurationInMs: config.maxAutoLockRenewalDuration || 300000 // 5 minutes
      });

      this.receivers.set(queueName, receiver);

      // Subscribe to messages
      receiver.subscribe({
        processMessage: async (message) => {
          try {
            this.logger.log(`Processing message from queue ${queueName}: ${message.messageId}`);
            
            await messageHandler(message.body);
            
            if (!config.autoCompleteMessages) {
              await receiver.completeMessage(message);
            }
            
            this.logger.log(`Message processed successfully: ${message.messageId}`);
          } catch (error) {
            this.logger.error(`Failed to process message ${message.messageId}:`, error);
            
            if (!config.autoCompleteMessages) {
              await receiver.abandonMessage(message);
            }
          }
        },
        processError: async (error) => {
          this.logger.error(`Error processing messages from queue ${queueName}:`, error);
        }
      }, {
        maxConcurrentCalls: config.maxConcurrentCalls || 1,
        autoCompleteMessages: config.autoCompleteMessages || false
      });

      this.logger.log(`Receiver created for queue ${queueName}`);
    } catch (error) {
      this.logger.error(`Failed to create receiver for queue ${queueName}:`, error);
      throw error;
    }
  }

  /**
   * Send content generation job
   */
  async sendContentGenerationJob(request: any): Promise<string> {
    const jobId = `content-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    
    const message: QueueMessage = {
      jobId,
      type: 'content_generation',
      data: request,
      priority: 'normal',
      correlationId: request.correlationId
    };

    await this.sendMessage('content-generation-queue', message);
    return jobId;
  }

  /**
   * Send competitor monitoring job
   */
  async sendCompetitorMonitoringJob(request: any): Promise<string> {
    const jobId = `monitor-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    
    const message: QueueMessage = {
      jobId,
      type: 'competitor_monitoring',
      data: request,
      priority: request.priority || 'normal',
      correlationId: request.correlationId
    };

    await this.sendMessage('competitor-monitoring-queue', message);
    return jobId;
  }

  /**
   * Send AI analysis job
   */
  async sendAIAnalysisJob(request: any): Promise<string> {
    const jobId = `ai-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    
    const message: QueueMessage = {
      jobId,
      type: 'ai_analysis',
      data: request,
      priority: 'high', // AI analysis gets high priority
      correlationId: request.correlationId
    };

    await this.sendMessage('ai-analysis-queue', message);
    return jobId;
  }

  /**
   * Send citation verification job
   */
  async sendCitationVerificationJob(request: any): Promise<string> {
    const jobId = `citation-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    
    const message: QueueMessage = {
      jobId,
      type: 'citation_verification',
      data: request,
      priority: 'normal',
      correlationId: request.correlationId
    };

    await this.sendMessage('citation-verification-queue', message);
    return jobId;
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(queueName: string): Promise<any> {
    if (!this.isInitialized) {
      throw new Error('Service Bus not initialized');
    }

    try {
      // In a real implementation, you would use Service Bus Management API
      // For now, return mock statistics
      return {
        queueName,
        activeMessageCount: Math.floor(Math.random() * 100),
        deadLetterMessageCount: Math.floor(Math.random() * 10),
        scheduledMessageCount: Math.floor(Math.random() * 20),
        transferMessageCount: 0,
        transferDeadLetterMessageCount: 0
      };
    } catch (error) {
      this.logger.error(`Failed to get queue stats for ${queueName}:`, error);
      throw error;
    }
  }

  /**
   * Purge queue (development/testing only)
   */
  async purgeQueue(queueName: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Service Bus not initialized');
    }

    if (this.configService.get('NODE_ENV') === 'production') {
      throw new Error('Queue purging not allowed in production');
    }

    try {
      const receiver = this.serviceBusClient.createReceiver(queueName, {
        receiveMode: 'receiveAndDelete'
      });

      let messageCount = 0;
      const messages = await receiver.receiveMessages(1000, { maxWaitTimeInMs: 5000 });
      messageCount += messages.length;

      await receiver.close();

      this.logger.log(`Purged ${messageCount} messages from queue ${queueName}`);
    } catch (error) {
      this.logger.error(`Failed to purge queue ${queueName}:`, error);
      throw error;
    }
  }

  /**
   * Close all connections
   */
  async onModuleDestroy(): Promise<void> {
    try {
      // Close all senders
      for (const [queueName, sender] of this.senders) {
        await sender.close();
        this.logger.log(`Closed sender for queue ${queueName}`);
      }

      // Close all receivers
      for (const [queueName, receiver] of this.receivers) {
        await receiver.close();
        this.logger.log(`Closed receiver for queue ${queueName}`);
      }

      // Close Service Bus client
      if (this.serviceBusClient) {
        await this.serviceBusClient.close();
        this.logger.log('Service Bus client closed');
      }
    } catch (error) {
      this.logger.error('Error closing Service Bus connections:', error);
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    if (!this.isInitialized) {
      return false;
    }

    try {
      // Try to create a sender to test connectivity
      const testSender = this.serviceBusClient.createSender('health-check-queue');
      await testSender.close();
      return true;
    } catch (error) {
      this.logger.error('Service Bus health check failed:', error);
      return false;
    }
  }
}
