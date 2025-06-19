import { ConfigService } from '@nestjs/config';
export declare class PerformanceMonitoringService {
    private configService;
    constructor(configService: ConfigService);
    initializeMonitoring(contentId: string, contentType: 'b2b' | 'b2c'): Promise<any>;
    getPerformanceStatus(contentId: string): Promise<any>;
    aggregatePerformanceMetrics(contentIds: string[], segmentBy?: string): Promise<any>;
    generatePerformanceReport(contentId: string, timeframe: 'day' | 'week' | 'month'): Promise<any>;
}
