import { Module, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

// Existing services
import { CrossLayerDataFlowService } from './services/cross-layer-data-flow.service';
import { FeedbackLoopService } from './services/feedback-loop.service';
import { PerformanceMonitoringService } from './services/performance-monitoring.service';

// New orchestration services
import { OrchestrationService } from './services/orchestration.service';
import { JobManagementService } from './services/job-management.service';
import { WorkflowEngineService } from './services/workflow-engine.service';
import { RealtimeUpdatesService } from './services/realtime-updates.service';

// Controllers
import { OrchestratorController } from './controllers/orchestrator.controller';
import { ContentArchitectController } from './controllers/content-architect.controller';

// Layer modules
import { BottomLayerModule } from '../bottom-layer/bottom-layer.module';
import { MiddleLayerModule } from '../middle-layer/middle-layer.module';
import { TopLayerModule } from '../top-layer/top-layer.module';

// Common modules
import { CommonModule } from '../../common/common.module';
import { SharedModule } from '../../shared/shared.module';

@Module({
  imports: [
    HttpModule,
    CommonModule,
    SharedModule,

    // Import all layer modules
    BottomLayerModule,
    forwardRef(() => MiddleLayerModule),
    forwardRef(() => TopLayerModule)
  ],
  controllers: [
    OrchestratorController,
    ContentArchitectController
  ],
  providers: [
    // Existing services
    CrossLayerDataFlowService,
    FeedbackLoopService,
    PerformanceMonitoringService,

    // New orchestration services
    OrchestrationService,
    JobManagementService,
    WorkflowEngineService,
    RealtimeUpdatesService
  ],
  exports: [
    // Existing services
    CrossLayerDataFlowService,
    FeedbackLoopService,
    PerformanceMonitoringService,

    // New orchestration services
    OrchestrationService,
    JobManagementService,
    WorkflowEngineService,
    RealtimeUpdatesService
  ],
})
export class OrchestratorModule {}
