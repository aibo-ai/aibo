import { Module } from '@nestjs/common';
import { CrossLayerDataFlowService } from './services/cross-layer-data-flow.service';
import { FeedbackLoopService } from './services/feedback-loop.service';
import { PerformanceMonitoringService } from './services/performance-monitoring.service';
import { OrchestratorController } from './controllers/orchestrator.controller';

@Module({
  imports: [],
  controllers: [OrchestratorController],
  providers: [
    CrossLayerDataFlowService,
    FeedbackLoopService,
    PerformanceMonitoringService,
  ],
  exports: [
    CrossLayerDataFlowService,
    FeedbackLoopService,
    PerformanceMonitoringService,
  ],
})
export class OrchestratorModule {}
