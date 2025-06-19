import { CrossLayerDataFlowService } from '../services/cross-layer-data-flow.service';
import { FeedbackLoopService } from '../services/feedback-loop.service';
import { PerformanceMonitoringService } from '../services/performance-monitoring.service';
export declare class OrchestratorController {
    private readonly crossLayerDataFlowService;
    private readonly feedbackLoopService;
    private readonly performanceMonitoringService;
    constructor(crossLayerDataFlowService: CrossLayerDataFlowService, feedbackLoopService: FeedbackLoopService, performanceMonitoringService: PerformanceMonitoringService);
    startWorkflow(workflowConfig: any): Promise<any>;
    getContentMetrics(contentId: string, clientType: 'b2b' | 'b2c'): Promise<any>;
    generateImprovements(contentId: string, metrics: any): Promise<any>;
    applyImprovements(contentId: string, improvements: string[]): Promise<any>;
    initializeMonitoring(params: {
        contentId: string;
        contentType: 'b2b' | 'b2c';
    }): Promise<any>;
    getPerformanceStatus(contentId: string): Promise<any>;
    aggregatePerformance(params: {
        contentIds: string[];
        segmentBy?: string;
    }): Promise<any>;
    generateReport(contentId: string, timeframe?: 'day' | 'week' | 'month'): Promise<any>;
}
