"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ApplicationInsightsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationInsightsService = void 0;
const common_1 = require("@nestjs/common");
const appInsights = require("applicationinsights");
let ApplicationInsightsService = ApplicationInsightsService_1 = class ApplicationInsightsService {
    constructor() {
        this.logger = new common_1.Logger(ApplicationInsightsService_1.name);
        this.isInitialized = false;
        this.client = null;
    }
    async onModuleInit() {
        const connectionString = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING;
        if (!connectionString) {
            this.logger.warn('APPLICATIONINSIGHTS_CONNECTION_STRING is not defined. Application Insights is disabled.');
            return;
        }
        try {
            appInsights
                .setup(connectionString)
                .setAutoDependencyCorrelation(true)
                .setAutoCollectRequests(true)
                .setAutoCollectPerformance(true)
                .setAutoCollectExceptions(true)
                .setAutoCollectDependencies(true)
                .setAutoCollectConsole(true, true)
                .setUseDiskRetryCaching(true)
                .setSendLiveMetrics(true)
                .setDistributedTracingMode(appInsights.DistributedTracingModes.AI_AND_W3C)
                .start();
            this.client = appInsights.defaultClient;
            this.isInitialized = true;
            this.client.commonProperties = {
                environment: process.env.NODE_ENV || 'development',
                service: 'ContentArchitect',
                version: process.env.APP_VERSION || '1.0.0'
            };
            this.logger.log('Azure Application Insights initialized successfully');
        }
        catch (error) {
            this.logger.error(`Failed to initialize Azure Application Insights: ${error.message}`);
        }
    }
    trackEvent(name, properties, measurements) {
        if (!this.isInitialized || !this.client) {
            this.logger.debug(`Application Insights not initialized when tracking event: ${name}`);
            return;
        }
        this.client.trackEvent({ name, properties, measurements });
    }
    trackMetric(name, value, properties) {
        if (!this.isInitialized || !this.client) {
            this.logger.debug(`Application Insights not initialized when tracking metric: ${name}`);
            return;
        }
        this.client.trackMetric({ name, value, properties });
    }
    trackException(exception, properties) {
        if (!this.isInitialized || !this.client) {
            this.logger.debug(`Application Insights not initialized when tracking exception: ${exception.message}`);
            return;
        }
        this.client.trackException({ exception, properties });
    }
    trackDependency(data) {
        if (!this.isInitialized || !this.client) {
            this.logger.debug(`Application Insights not initialized when tracking dependency: ${data.name}`);
            return;
        }
        this.client.trackDependency(Object.assign(Object.assign({}, data), { data: data.data || data.name }));
    }
    trackRequest(request) {
        if (!this.isInitialized || !this.client) {
            this.logger.debug(`Application Insights not initialized when tracking request: ${request.name}`);
            return;
        }
        this.client.trackRequest(request);
    }
    async flush() {
        if (!this.isInitialized || !this.client) {
            return;
        }
        return new Promise((resolve) => {
            var _a;
            (_a = this.client) === null || _a === void 0 ? void 0 : _a.flush({
                callback: () => {
                    resolve();
                }
            });
        });
    }
    isAppInsightsAvailable() {
        return this.isInitialized;
    }
    getTelemetryClient() {
        return this.client;
    }
};
exports.ApplicationInsightsService = ApplicationInsightsService;
exports.ApplicationInsightsService = ApplicationInsightsService = ApplicationInsightsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], ApplicationInsightsService);
//# sourceMappingURL=application-insights.service.js.map