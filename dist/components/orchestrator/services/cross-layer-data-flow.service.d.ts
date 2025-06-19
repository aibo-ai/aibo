import { ConfigService } from '@nestjs/config';
export declare class CrossLayerDataFlowService {
    private configService;
    constructor(configService: ConfigService);
    transferData(sourceLayer: string, targetLayer: string, data: any): Promise<any>;
    registerDataConsumer(layer: string, componentId: string, callbackUrl: string): string;
    orchestrateWorkflow(workflowConfig: any, initialData: any): Promise<any>;
}
