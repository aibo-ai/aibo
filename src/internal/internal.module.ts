import { Module } from '@nestjs/common';
import { InternalController } from './internal.controller';
import { AzureMonitoringService } from '../common/services/azure-monitoring.service';
import { AzureServiceBusService } from '../common/services/azure-service-bus.service';

@Module({
  controllers: [InternalController],
  providers: [
    AzureMonitoringService,
    AzureServiceBusService
  ],
  exports: [
    AzureMonitoringService,
    AzureServiceBusService
  ]
})
export class InternalModule {}
