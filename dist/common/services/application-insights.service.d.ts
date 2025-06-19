import { OnModuleInit } from '@nestjs/common';
import * as appInsights from 'applicationinsights';
export declare class ApplicationInsightsService implements OnModuleInit {
    private readonly logger;
    private isInitialized;
    private client;
    constructor();
    onModuleInit(): Promise<void>;
    trackEvent(name: string, properties?: Record<string, any>, measurements?: Record<string, number>): void;
    trackMetric(name: string, value: number, properties?: Record<string, any>): void;
    trackException(exception: Error, properties?: Record<string, any>): void;
    trackDependency(data: {
        target: string;
        name: string;
        dependencyTypeName: string;
        data?: string;
        duration: number;
        resultCode: number;
        success: boolean;
        properties?: Record<string, any>;
    }): void;
    trackRequest(request: {
        name: string;
        url: string;
        duration: number;
        resultCode: string | number;
        success: boolean;
        properties?: Record<string, any>;
    }): void;
    flush(): Promise<void>;
    isAppInsightsAvailable(): boolean;
    getTelemetryClient(): appInsights.TelemetryClient | null;
}
